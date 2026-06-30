"""
Модели коммуникационной платформы (мессенджер для судов).

Архитектура (Telegram-like):
- Chat: личные чаты, групповые чаты, служебные каналы, межсудебные чаты
- Message: сообщения с вложениями, статусами прочтения, историей изменений
- Broadcast: рассылки по ролям/отделам
- Task: контроль поручений
- DocumentExchange: межсудебный обмен документами
"""
import uuid
from django.db import models, transaction
from django.db.models import Q, Count
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


# =============================================================================
# Типы чатов
# =============================================================================

class ChatType(models.TextChoices):
    DIRECT = 'direct', 'Личные сообщения'
    GROUP = 'group', 'Групповой чат'
    DEPARTMENT = 'department', 'Чат отдела'
    COURT_CHANNEL = 'court_channel', 'Канал суда'
    INTERCOURT = 'intercourt', 'Межсудебный чат'
    INTERREGIONAL = 'interregional', 'Межрегиональный чат'
    HIGHER_INSTANCE = 'higher_instance', 'Чат с вышестоящей инстанцией'


# =============================================================================
# Chat
# =============================================================================

class Chat(models.Model):
    """
    Основная модель чата. Поддерживает все типы: личные, групповые,
    каналы, межсудебные.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )
    chat_type = models.CharField(
        max_length=20, choices=ChatType.choices, verbose_name="Тип чата"
    )
    title = models.CharField(max_length=255, blank=True, null=True, verbose_name="Название")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    avatar = models.ImageField(
        upload_to='chat_avatars/', blank=True, null=True, verbose_name="Аватар"
    )

    # Связи с судебной структурой
    court = models.ForeignKey(
        'court_registry.Court',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chats',
        verbose_name="Суд (владелец)"
    )
    department = models.ForeignKey(
        'court_registry.CourtDepartment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chats',
        verbose_name="Отдел"
    )

    # Для межсудебных чатов
    target_court = models.ForeignKey(
        'court_registry.CourtDirectory',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='intercourt_chats',
        verbose_name="Суд-корреспондент"
    )
    target_region = models.ForeignKey(
        'court_registry.Region',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chats',
        verbose_name="Регион (для межрегиональных)"
    )

    # Для каналов
    is_announcement_channel = models.BooleanField(
        default=False, verbose_name="Канал для оповещений"
    )
    only_admins_can_post = models.BooleanField(
        default=False, verbose_name="Писать могут только админы"
    )

    # Метаданные
    last_message = models.ForeignKey(
        'Message', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+', verbose_name="Последнее сообщение"
    )
    last_message_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Время последнего сообщения"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_chats', verbose_name="Создатель"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создан")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлён")
    is_active = models.BooleanField(default=True, verbose_name="Активен")

    class Meta:
        verbose_name = "Чат"
        verbose_name_plural = "Чаты"
        ordering = ['-last_message_at', '-created_at']
        indexes = [
            models.Index(fields=['chat_type']),
            models.Index(fields=['court', 'chat_type']),
            models.Index(fields=['department']),
            models.Index(fields=['is_active']),
            models.Index(fields=['last_message_at']),
        ]

    def __str__(self):
        if self.chat_type == ChatType.DIRECT:
            members = self.members.select_related('user').exclude(
                user=self.created_by
            )[:2]
            names = [m.user.get_full_name() or m.user.username for m in members]
            return ', '.join(names) if names else f"Чат #{self.id}"
        return self.title or f"{self.get_chat_type_display()} #{self.id}"

    def clean(self):
        if self.chat_type == ChatType.DIRECT and self.members.count() > 2:
            raise ValidationError("Личный чат не может иметь более 2 участников")

    def get_member_count(self):
        return self.members.filter(is_active=True).count()

    def update_last_message(self, message=None):
        if message:
            self.last_message = message
            self.last_message_at = message.created_at
        else:
            last = self.messages.filter(is_deleted=False).order_by('-created_at').first()
            self.last_message = last
            self.last_message_at = last.created_at if last else None
        self.save(update_fields=['last_message', 'last_message_at', 'updated_at'])

    def is_member(self, user):
        return self.members.filter(user=user, is_active=True).exists()

    def is_admin(self, user):
        return self.members.filter(
            user=user, is_active=True, role__in=[MemberRole.OWNER, MemberRole.ADMIN]
        ).exists()

    def can_post(self, user):
        if not self.is_member(user):
            return False
        if not self.only_admins_can_post:
            return True
        return self.is_admin(user)
    
    def get_target_court_display_name(self):
        """Получить отображаемое название целевого суда"""
        if self.target_court:
            return self.target_court.name_short or self.target_court.name
        return None

    @classmethod
    def get_or_create_direct(cls, user1, user2):
        """Получить или создать личный чат между двумя пользователями."""
        existing = cls.objects.filter(
            chat_type=ChatType.DIRECT,
            members__user=user1, members__is_active=True
        ).filter(
            members__user=user2, members__is_active=True
        ).distinct().first()

        if existing:
            return existing, False

        chat = cls.objects.create(chat_type=ChatType.DIRECT)
        ChatMember.objects.create(chat=chat, user=user1, role=MemberRole.MEMBER)
        ChatMember.objects.create(chat=chat, user=user2, role=MemberRole.MEMBER)
        return chat, True

    @classmethod
    def get_or_create_department_chat(cls, department):
        """Получить или создать чат отдела."""
        chat, created = cls.objects.get_or_create(
            chat_type=ChatType.DEPARTMENT,
            department=department,
            court=department.court,
            defaults={'title': f"{department.name}",
                      'description': f"Служебный чат отдела: {department.name}"}
        )
        if created:
            # Автоматически добавляем всех активных сотрудников отдела
            employees = department.employees.filter(is_active=True).select_related('employee')
            for emp in employees:
                role = MemberRole.ADMIN if emp.is_head_of_department else MemberRole.MEMBER
                ChatMember.objects.get_or_create(
                    chat=chat, user=emp.employee,
                    defaults={'role': role}
                )
        return chat, created


# =============================================================================
# Роли участников
# =============================================================================

class MemberRole(models.TextChoices):
    OWNER = 'owner', 'Владелец'
    ADMIN = 'admin', 'Администратор'
    MEMBER = 'member', 'Участник'
    READONLY = 'readonly', 'Только чтение'


class ChatMember(models.Model):
    """Участник чата."""
    chat = models.ForeignKey(
        Chat, on_delete=models.CASCADE, related_name='members', verbose_name="Чат"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='chat_memberships',
        verbose_name="Пользователь"
    )
    role = models.CharField(
        max_length=20, choices=MemberRole.choices, default=MemberRole.MEMBER,
        verbose_name="Роль"
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name="Присоединился")
    last_read_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Последнее прочтение"
    )
    is_pinned = models.BooleanField(default=False, verbose_name="Закреплён")
    pinned_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата закрепления")
    is_muted = models.BooleanField(default=False, verbose_name="Уведомления выключены")
    muted_until = models.DateTimeField(null=True, blank=True, verbose_name="Отключены до")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    left_at = models.DateTimeField(null=True, blank=True, verbose_name="Вышел")

    # Кастомные настройки
    custom_title = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Кастомное название чата"
    )
    notifications_enabled = models.BooleanField(
        default=True, verbose_name="Уведомления включены"
    )

    class Meta:
        verbose_name = "Участник чата"
        verbose_name_plural = "Участники чатов"
        unique_together = ['chat', 'user']
        ordering = ['chat', 'joined_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'is_pinned']),
        ]

    def __str__(self):
        return f"{self.user} в {self.chat}"

    def get_unread_count(self):
        """Количество непрочитанных сообщений."""
        if not self.last_read_at:
            return self.chat.messages.filter(
                is_deleted=False, created_at__gt=self.joined_at
            ).count()
        return self.chat.messages.filter(
            is_deleted=False, created_at__gt=self.last_read_at
        ).count()

    def mark_read(self):
        """Отметить все сообщения как прочитанные."""
        self.last_read_at = timezone.now()
        self.save(update_fields=['last_read_at'])


# =============================================================================
# Сообщения
# =============================================================================

class MessageType(models.TextChoices):
    TEXT = 'text', 'Текст'
    DOCUMENT = 'document', 'Документ'
    IMAGE = 'image', 'Изображение'
    FILE = 'file', 'Файл'
    TASK = 'task', 'Поручение'
    SYSTEM = 'system', 'Системное сообщение'
    FORWARD = 'forward', 'Пересланное'
    NOTIFICATION = 'notification', 'Уведомление'


class Message(models.Model):
    """
    Сообщение в чате. Поддерживает вложения, редактирование,
    пересылку, поручения.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )
    chat = models.ForeignKey(
        Chat, on_delete=models.CASCADE, related_name='messages', verbose_name="Чат"
    )
    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sent_messages', verbose_name="Отправитель"
    )
    reply_to = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='replies', verbose_name="Ответ на"
    )
    forward_from = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='forwarded_to', verbose_name="Переслано из"
    )

    message_type = models.CharField(
        max_length=20, choices=MessageType.choices, default=MessageType.TEXT,
        verbose_name="Тип сообщения"
    )
    text = models.TextField(blank=True, default='', verbose_name="Текст")
    html_text = models.TextField(blank=True, default='', verbose_name="HTML-текст")

    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Отправлено")
    edited_at = models.DateTimeField(null=True, blank=True, verbose_name="Изменено")
    is_edited = models.BooleanField(default=False, verbose_name="Изменено")
    edit_history = models.JSONField(
        default=list, blank=True, verbose_name="История изменений"
    )
    is_deleted = models.BooleanField(default=False, verbose_name="Удалено")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата удаления")
    deleted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='deleted_messages', verbose_name="Удалил"
    )
    is_pinned = models.BooleanField(default=False, verbose_name="Закреплено в чате")
    pinned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pinned_messages', verbose_name="Закрепил"
    )
    pinned_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата закрепления")

    # Для поручений
    task = models.OneToOneField(
        'Task', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='message', verbose_name="Поручение"
    )

    class Meta:
        verbose_name = "Сообщение"
        verbose_name_plural = "Сообщения"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
            models.Index(fields=['chat', 'is_deleted', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['message_type']),
            models.Index(fields=['is_pinned']),
        ]

    def __str__(self):
        preview = self.text[:50] if self.text else f"[{self.get_message_type_display()}]"
        return f"{self.sender}: {preview}"

    def edit(self, new_text, user):
        """Редактировать сообщение."""
        if self.sender != user:
            raise ValidationError("Только отправитель может редактировать сообщение")
        old_text = self.text
        self.edit_history.append({
            'text': old_text,
            'edited_at': timezone.now().isoformat(),
        })
        self.text = new_text
        self.is_edited = True
        self.edited_at = timezone.now()
        self.save(update_fields=['text', 'is_edited', 'edited_at', 'edit_history'])

    def soft_delete(self, user):
        """Мягкое удаление сообщения."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def pin(self, user):
        """Закрепить сообщение в чате."""
        if not self.chat.is_admin(user):
            raise ValidationError("Только администратор может закреплять сообщения")
        self.is_pinned = True
        self.pinned_by = user
        self.pinned_at = timezone.now()
        self.save(update_fields=['is_pinned', 'pinned_by', 'pinned_at'])

    def unpin(self, user):
        """Открепить сообщение."""
        if not self.chat.is_admin(user):
            raise ValidationError("Только администратор может откреплять сообщения")
        self.is_pinned = False
        self.pinned_by = None
        self.pinned_at = None
        self.save(update_fields=['is_pinned', 'pinned_by', 'pinned_at'])


# =============================================================================
# Статусы прочтения
# =============================================================================

class MessageRead(models.Model):
    """Отметка о прочтении сообщения конкретным пользователем."""
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name='read_by', verbose_name="Сообщение"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='read_messages',
        verbose_name="Пользователь"
    )
    read_at = models.DateTimeField(auto_now_add=True, verbose_name="Прочитано")

    class Meta:
        verbose_name = "Отметка о прочтении"
        verbose_name_plural = "Отметки о прочтении"
        unique_together = ['message', 'user']
        ordering = ['-read_at']
        indexes = [
            models.Index(fields=['user', 'read_at']),
        ]

    def __str__(self):
        return f"{self.user} прочитал {self.message} в {self.read_at}"


# =============================================================================
# Вложения
# =============================================================================

class MessageAttachment(models.Model):
    """Вложение к сообщению."""
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name='attachments',
        verbose_name="Сообщение",
        null=True, blank=True
    )
    file = models.FileField(
        upload_to='message_attachments/%Y/%m/', verbose_name="Файл"
    )
    original_filename = models.CharField(max_length=500, verbose_name="Имя файла")
    file_size = models.PositiveIntegerField(verbose_name="Размер (байт)")
    mime_type = models.CharField(max_length=100, blank=True, verbose_name="MIME-тип")
    file_type = models.CharField(
        max_length=20, choices=[
            ('image', 'Изображение'),
            ('document', 'Документ'),
            ('video', 'Видео'),
            ('audio', 'Аудио'),
            ('archive', 'Архив'),
            ('other', 'Другое'),
        ],
        default='document', verbose_name="Тип файла"
    )
    thumbnail = models.ImageField(
        upload_to='message_thumbnails/%Y/%m/', blank=True, null=True,
        verbose_name="Миниатюра"
    )
    width = models.PositiveIntegerField(null=True, blank=True, verbose_name="Ширина")
    height = models.PositiveIntegerField(null=True, blank=True, verbose_name="Высота")
    duration = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Длительность (сек)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Загружено")

    class Meta:
        verbose_name = "Вложение"
        verbose_name_plural = "Вложения"
        ordering = ['created_at']

    def __str__(self):
        return self.original_filename


# =============================================================================
# Рассылки
# =============================================================================

class BroadcastStatus(models.TextChoices):
    DRAFT = 'draft', 'Черновик'
    SENDING = 'sending', 'Отправляется'
    SENT = 'sent', 'Отправлено'
    CANCELLED = 'cancelled', 'Отменено'


class Broadcast(models.Model):
    """
    Рассылка сообщений по ролям, отделам, судам.
    Используется для оповещений от руководства.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )
    title = models.CharField(max_length=500, verbose_name="Заголовок рассылки")
    text = models.TextField(verbose_name="Текст рассылки")
    html_text = models.TextField(blank=True, default='', verbose_name="HTML-текст")

    # Отправитель
    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='broadcasts', verbose_name="Отправитель"
    )
    court = models.ForeignKey(
        'court_registry.Court', on_delete=models.PROTECT,
        related_name='broadcasts', verbose_name="Суд"
    )

    # Параметры рассылки
    broadcast_type = models.CharField(
        max_length=30, choices=[
            ('by_role', 'По ролям'),
            ('by_department', 'По отделам'),
            ('by_court', 'По судам (межсудебная)'),
            ('all_staff', 'Всему штату'),
            ('custom', 'Выбранные получатели'),
        ],
        default='all_staff', verbose_name="Тип рассылки"
    )

    # Фильтры получателей (JSON)
    target_roles = models.JSONField(
        default=list, blank=True, verbose_name="Роли получателей"
    )
    target_departments = models.JSONField(
        default=list, blank=True, verbose_name="ID отделов"
    )
    target_courts = models.JSONField(
        default=list, blank=True, verbose_name="ID судов (для межсудебной)"
    )

    # Вложения
    importance = models.CharField(
        max_length=20, choices=[
            ('normal', 'Обычная'),
            ('important', 'Важная'),
            ('urgent', 'Срочная'),
        ],
        default='normal', verbose_name="Важность"
    )
    requires_confirmation = models.BooleanField(
        default=False, verbose_name="Требует подтверждения прочтения"
    )
    deadline = models.DateTimeField(
        null=True, blank=True, verbose_name="Срок исполнения (для поручений)"
    )

    # Статус
    status = models.CharField(
        max_length=20, choices=BroadcastStatus.choices,
        default=BroadcastStatus.DRAFT, verbose_name="Статус"
    )

    # Статистика
    total_recipients = models.PositiveIntegerField(default=0, verbose_name="Всего получателей")
    sent_count = models.PositiveIntegerField(default=0, verbose_name="Отправлено")
    read_count = models.PositiveIntegerField(default=0, verbose_name="Прочитано")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создана")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Отправлена")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлена")

    class Meta:
        verbose_name = "Рассылка"
        verbose_name_plural = "Рассылки"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['court', 'status']),
            models.Index(fields=['broadcast_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def send(self):
        """Отправить рассылку."""
        from communication.utils import resolve_broadcast_recipients
        recipients = resolve_broadcast_recipients(self)
        self.total_recipients = len(recipients)
        self.status = BroadcastStatus.SENDING
        self.sent_at = timezone.now()
        self.save()

        count = 0
        for user in recipients:
            try:
                BroadcastRecipient.objects.create(broadcast=self, user=user)
                count += 1
            except Exception as e:
                logger.error(f"Broadcast to {user}: {e}")

        self.sent_count = count
        self.status = BroadcastStatus.SENT
        self.save(update_fields=['sent_count', 'status', 'updated_at'])
        return count


class BroadcastRecipient(models.Model):
    """Получатель рассылки."""
    broadcast = models.ForeignKey(
        Broadcast, on_delete=models.CASCADE, related_name='recipients',
        verbose_name="Рассылка"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='broadcast_receipts',
        verbose_name="Получатель"
    )
    is_read = models.BooleanField(default=False, verbose_name="Прочитано")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата прочтения")
    is_confirmed = models.BooleanField(
        default=False, verbose_name="Подтверждено (для поручений)"
    )
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата подтверждения")
    delivered_at = models.DateTimeField(auto_now_add=True, verbose_name="Доставлено")

    class Meta:
        verbose_name = "Получатель рассылки"
        verbose_name_plural = "Получатели рассылок"
        unique_together = ['broadcast', 'user']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['broadcast', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user} ← {self.broadcast.title}"

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            Broadcast.objects.filter(pk=self.broadcast_id).update(
                read_count=models.F('read_count') + 1
            )


# =============================================================================
# Поручения
# =============================================================================

class TaskPriority(models.TextChoices):
    LOW = 'low', 'Низкий'
    NORMAL = 'normal', 'Обычный'
    HIGH = 'high', 'Высокий'
    URGENT = 'urgent', 'Срочный'


class TaskStatus(models.TextChoices):
    NEW = 'new', 'Новое'
    ACCEPTED = 'accepted', 'Принято'
    IN_PROGRESS = 'in_progress', 'В работе'
    NEEDS_REVIEW = 'needs_review', 'На проверке'
    COMPLETED = 'completed', 'Выполнено'
    REJECTED = 'rejected', 'Отклонено'
    OVERDUE = 'overdue', 'Просрочено'
    CANCELLED = 'cancelled', 'Отменено'


class Task(models.Model):
    """
    Поручение/задача. Создаётся через сообщение в чате или напрямую.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )
    title = models.CharField(max_length=500, verbose_name="Заголовок")
    description = models.TextField(blank=True, default='', verbose_name="Описание")

    # Инициатор и исполнитель
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_tasks', verbose_name="Постановщик"
    )
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_tasks', verbose_name="Исполнитель"
    )
    department = models.ForeignKey(
        'court_registry.CourtDepartment', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tasks', verbose_name="Отдел-исполнитель"
    )
    court = models.ForeignKey(
        'court_registry.Court', on_delete=models.PROTECT,
        related_name='tasks', verbose_name="Суд"
    )

    # Чат, в котором создано поручение
    chat = models.ForeignKey(
        Chat, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tasks', verbose_name="Чат"
    )

    # Статус и приоритет
    status = models.CharField(
        max_length=20, choices=TaskStatus.choices,
        default=TaskStatus.NEW, verbose_name="Статус"
    )
    priority = models.CharField(
        max_length=20, choices=TaskPriority.choices,
        default=TaskPriority.NORMAL, verbose_name="Приоритет"
    )

    # Сроки
    deadline = models.DateTimeField(null=True, blank=True, verbose_name="Срок исполнения")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Выполнено")
    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name="Принято в работу")

    # Вложения
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")

    class Meta:
        verbose_name = "Поручение"
        verbose_name_plural = "Поручения"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['department', 'status']),
            models.Index(fields=['court', 'status']),
            models.Index(fields=['status', 'deadline']),
        ]

    def __str__(self):
        return f"Поручение: {self.title} [{self.get_status_display()}]"

    def accept(self, user):
        if self.assigned_to != user:
            raise ValidationError("Только назначенный исполнитель может принять поручение")
        self.status = TaskStatus.ACCEPTED
        self.accepted_at = timezone.now()
        self.save(update_fields=['status', 'accepted_at', 'updated_at'])

    def start(self, user):
        if self.assigned_to != user:
            raise ValidationError("Только исполнитель может начать работу")
        self.status = TaskStatus.IN_PROGRESS
        self.save(update_fields=['status', 'updated_at'])

    def complete(self, user):
        if self.assigned_to != user:
            raise ValidationError("Только исполнитель может отметить выполнение")
        self.status = TaskStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])

    def reject(self, user, reason=''):
        if self.assigned_to != user:
            raise ValidationError("Только исполнитель может отклонить поручение")
        self.status = TaskStatus.REJECTED
        self.save(update_fields=['status', 'updated_at'])

    def is_overdue(self):
        if self.deadline and self.status not in [
            TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.REJECTED
        ]:
            return timezone.now() > self.deadline
        return False


class TaskComment(models.Model):
    """Комментарий к поручению."""
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='comments', verbose_name="Поручение"
    )
    author = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='task_comments',
        verbose_name="Автор"
    )
    text = models.TextField(verbose_name="Текст")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создан")

    class Meta:
        verbose_name = "Комментарий к поручению"
        verbose_name_plural = "Комментарии к поручениям"
        ordering = ['created_at']

    def __str__(self):
        return f"Комментарий от {self.author} к {self.task}"


class TaskAttachment(models.Model):
    """Вложение к поручению."""
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='attachments', verbose_name="Поручение"
    )
    file = models.FileField(
        upload_to='task_attachments/%Y/%m/', verbose_name="Файл"
    )
    original_filename = models.CharField(max_length=500, verbose_name="Имя файла")
    file_size = models.PositiveIntegerField(verbose_name="Размер (байт)")
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='task_uploads',
        verbose_name="Загрузил"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Загружено")

    class Meta:
        verbose_name = "Вложение поручения"
        verbose_name_plural = "Вложения поручений"
        ordering = ['created_at']

    def __str__(self):
        return self.original_filename


# =============================================================================
# Межсудебный обмен документами
# =============================================================================

class DocumentExchangeStatus(models.TextChoices):
    DRAFT = 'draft', 'Черновик'
    SENT = 'sent', 'Отправлен'
    RECEIVED = 'received', 'Получен'
    ACCEPTED = 'accepted', 'Принят'
    REJECTED = 'rejected', 'Отклонён'
    PROCESSED = 'processed', 'Обработан'


class DocumentExchange(models.Model):
    """
    Межсудебный обмен документами.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )

    # Отправитель
    source_court = models.ForeignKey(
        'court_registry.Court', on_delete=models.PROTECT,
        related_name='sent_documents', verbose_name="Суд-отправитель"
    )
    source_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sent_exchange_docs', verbose_name="Отправитель"
    )

    # Получатель
    target_court = models.ForeignKey(
        'court_registry.CourtDirectory', on_delete=models.PROTECT,
        related_name='received_documents', verbose_name="Суд-получатель"
    )
    target_department = models.CharField(
        max_length=500, blank=True, verbose_name="Отдел-получатель"
    )

    # Информация о документе
    title = models.CharField(max_length=500, verbose_name="Заголовок")
    description = models.TextField(blank=True, verbose_name="Описание")
    document_type = models.CharField(
        max_length=50, choices=[
            ('ruling', 'Определение/постановление'),
            ('request', 'Запрос'),
            ('response', 'Ответ на запрос'),
            ('notification', 'Уведомление'),
            ('court_order', 'Судебное поручение'),
            ('case_materials', 'Материалы дела'),
            ('stat_report', 'Статистический отчёт'),
            ('official_letter', 'Служебное письмо'),
            ('vks_request', 'Запрос ВКС'),
            ('other', 'Иное'),
        ],
        default='official_letter', verbose_name="Тип документа"
    )
    reference_number = models.CharField(
        max_length=100, blank=True, verbose_name="Исходящий номер"
    )
    case_number = models.CharField(
        max_length=100, blank=True, verbose_name="Номер дела (если применимо)"
    )

    # Статус
    status = models.CharField(
        max_length=20, choices=DocumentExchangeStatus.choices,
        default=DocumentExchangeStatus.DRAFT, verbose_name="Статус"
    )
    is_urgent = models.BooleanField(default=False, verbose_name="Срочно")
    requires_response = models.BooleanField(
        default=False, verbose_name="Требует ответа"
    )
    response_deadline = models.DateTimeField(
        null=True, blank=True, verbose_name="Срок ответа"
    )

    # Связанная передача дела (из court_registry)
    transfer = models.ForeignKey(
        'court_registry.CaseTransfer', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='exchange_documents',
        verbose_name="Связанная передача дела"
    )

    # Даты
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создан")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Отправлен")
    received_at = models.DateTimeField(null=True, blank=True, verbose_name="Получен")
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name="Обработан")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлён")

    # Примечания
    rejection_reason = models.TextField(blank=True, verbose_name="Причина отклонения")
    internal_notes = models.TextField(blank=True, verbose_name="Внутренние заметки")
    processed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='processed_exchange_docs', verbose_name="Обработал"
    )

    class Meta:
        verbose_name = "Межсудебный обмен документом"
        verbose_name_plural = "Межсудебный обмен документами"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source_court', 'status']),
            models.Index(fields=['target_court', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['document_type']),
            models.Index(fields=['reference_number']),
        ]

    def __str__(self):
        return f"{self.title} ({self.source_court.code} → {self.target_court.code})"

    def send(self):
        self.status = DocumentExchangeStatus.SENT
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at', 'updated_at'])

    def accept(self, user):
        self.status = DocumentExchangeStatus.ACCEPTED
        self.processed_by = user
        self.processed_at = timezone.now()
        self.save(update_fields=['status', 'processed_by', 'processed_at', 'updated_at'])

    def reject(self, user, reason):
        self.status = DocumentExchangeStatus.REJECTED
        self.rejection_reason = reason
        self.processed_by = user
        self.processed_at = timezone.now()
        self.save(update_fields=[
            'status', 'rejection_reason', 'processed_by', 'processed_at', 'updated_at'
        ])


class DocumentExchangeAttachment(models.Model):
    """Вложение к межсудебному обмену."""
    exchange = models.ForeignKey(
        DocumentExchange, on_delete=models.CASCADE,
        related_name='attachments', verbose_name="Обмен"
    )
    file = models.FileField(
        upload_to='document_exchange/%Y/%m/', verbose_name="Файл"
    )
    original_filename = models.CharField(max_length=500, verbose_name="Имя файла")
    file_size = models.PositiveIntegerField(verbose_name="Размер (байт)")
    mime_type = models.CharField(max_length=100, blank=True, verbose_name="MIME-тип")
    page_count = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Количество страниц"
    )
    is_signed = models.BooleanField(default=False, verbose_name="Подписан ЭП")
    signature_info = models.JSONField(
        default=dict, blank=True, verbose_name="Информация о подписи"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Загружено")

    class Meta:
        verbose_name = "Вложение обмена"
        verbose_name_plural = "Вложения обмена"
        ordering = ['created_at']

    def __str__(self):
        return self.original_filename


# =============================================================================
# Межсудебная маршрутизация
# =============================================================================

class IntercourtRoute(models.Model):
    """
    Правила маршрутизации для межсудебного взаимодействия.
    Определяет, какие суды могут общаться напрямую.
    """
    DIRECTION_CHOICES = [
        ('upward', 'В вышестоящую инстанцию'),
        ('downward', 'В нижестоящую инстанцию'),
        ('horizontal', 'Горизонтальная (один уровень)'),
        ('any', 'Любое направление'),
    ]

    source_level = models.ForeignKey(
        'court_registry.CourtLevel', on_delete=models.PROTECT,
        related_name='route_sources', verbose_name="Уровень суда-отправителя"
    )
    target_level = models.ForeignKey(
        'court_registry.CourtLevel', on_delete=models.PROTECT,
        related_name='route_targets', verbose_name="Уровень суда-получателя"
    )
    direction = models.CharField(
        max_length=20, choices=DIRECTION_CHOICES, default='any',
        verbose_name="Направление"
    )
    allow_documents = models.BooleanField(default=True, verbose_name="Разрешён обмен документами")
    allow_chats = models.BooleanField(default=True, verbose_name="Разрешены чаты")
    allow_vks = models.BooleanField(default=True, verbose_name="Разрешены запросы ВКС")
    allow_case_transfer = models.BooleanField(default=True, verbose_name="Разрешена передача дел")
    require_confirmation = models.BooleanField(
        default=False, verbose_name="Требуется подтверждение"
    )
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        verbose_name = "Правило маршрутизации"
        verbose_name_plural = "Правила маршрутизации"
        unique_together = ['source_level', 'target_level']
        ordering = ['source_level__hierarchy_level', 'target_level__hierarchy_level']
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.source_level} → {self.target_level} ({self.get_direction_display()})"


# =============================================================================
# Автоматические уведомления
# =============================================================================

class AutoNotificationRule(models.Model):
    """
    Правило для автоматических уведомлений.
    Например: при поступлении нового дела → уведомить отдел.
    """
    TRIGGER_CHOICES = [
        ('case_registered', 'Зарегистрировано новое дело'),
        ('case_transfer_incoming', 'Поступила передача дела'),
        ('deadline_approaching', 'Приближается срок'),
        ('deadline_violated', 'Нарушен срок'),
        ('document_received', 'Получен документ'),
        ('ruling_issued', 'Вынесено постановление'),
        ('appeal_filed', 'Подана апелляция/кассация'),
        ('task_created', 'Создано поручение'),
        ('task_overdue', 'Поручение просрочено'),
        ('broadcast_sent', 'Отправлена рассылка'),
    ]

    name = models.CharField(max_length=255, verbose_name="Название правила")
    trigger = models.CharField(
        max_length=30, choices=TRIGGER_CHOICES, verbose_name="Триггер"
    )
    court = models.ForeignKey(
        'court_registry.Court', on_delete=models.CASCADE,
        related_name='auto_notification_rules', verbose_name="Суд"
    )
    is_active = models.BooleanField(default=True, verbose_name="Активно")

    # Параметры фильтрации (JSON)
    filter_params = models.JSONField(
        default=dict, blank=True, verbose_name="Параметры фильтрации"
    )

    # Куда отправлять
    notify_departments = models.ManyToManyField(
        'court_registry.CourtDepartment', blank=True,
        related_name='auto_notification_rules', verbose_name="Уведомлять отделы"
    )
    notify_roles = models.JSONField(
        default=list, blank=True, verbose_name="Уведомлять роли"
    )
    notify_chairman = models.BooleanField(
        default=False, verbose_name="Уведомлять председателя"
    )
    notify_vice_chairmen = models.BooleanField(
        default=False, verbose_name="Уведомлять зампредов"
    )

    # Шаблон сообщения
    message_template = models.TextField(
        verbose_name="Шаблон сообщения",
        help_text="Используйте {переменные} для подстановки данных"
    )
    create_chat_message = models.BooleanField(
        default=True, verbose_name="Создавать сообщение в чате"
    )
    target_chat = models.ForeignKey(
        Chat, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='auto_notification_rules', verbose_name="Целевой чат"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")
    last_triggered_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Последнее срабатывание"
    )

    class Meta:
        verbose_name = "Правило автоуведомлений"
        verbose_name_plural = "Правила автоуведомлений"
        ordering = ['trigger', 'name']
        indexes = [
            models.Index(fields=['court', 'trigger', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_trigger_display()})"


# =============================================================================
# Статистика и аналитика
# =============================================================================

class MessageAnalytics(models.Model):
    """Ежедневная аналитика по сообщениям (агрегируется celery-задачей)."""
    court = models.ForeignKey(
        'court_registry.Court', on_delete=models.CASCADE,
        related_name='message_analytics', verbose_name="Суд"
    )
    date = models.DateField(verbose_name="Дата")

    # Общая статистика
    total_messages = models.PositiveIntegerField(default=0, verbose_name="Всего сообщений")
    direct_messages = models.PositiveIntegerField(default=0, verbose_name="Личных сообщений")
    group_messages = models.PositiveIntegerField(default=0, verbose_name="Групповых сообщений")
    channel_messages = models.PositiveIntegerField(default=0, verbose_name="Сообщений в каналах")
    intercourt_messages = models.PositiveIntegerField(default=0, verbose_name="Межсудебных сообщений")

    # Поручения
    tasks_created = models.PositiveIntegerField(default=0, verbose_name="Создано поручений")
    tasks_completed = models.PositiveIntegerField(default=0, verbose_name="Выполнено поручений")
    tasks_overdue = models.PositiveIntegerField(default=0, verbose_name="Просрочено поручений")

    # Рассылки
    broadcasts_sent = models.PositiveIntegerField(default=0, verbose_name="Отправлено рассылок")
    broadcast_read_rate = models.FloatField(default=0, verbose_name="% прочтения рассылок")

    # Межсудебный обмен
    documents_sent = models.PositiveIntegerField(default=0, verbose_name="Отправлено документов")
    documents_received = models.PositiveIntegerField(default=0, verbose_name="Получено документов")

    # Активность
    active_users = models.PositiveIntegerField(default=0, verbose_name="Активных пользователей")
    new_chats = models.PositiveIntegerField(default=0, verbose_name="Новых чатов")
    attachments_count = models.PositiveIntegerField(default=0, verbose_name="Вложений")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Аналитика сообщений"
        verbose_name_plural = "Аналитика сообщений"
        unique_together = ['court', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['court', 'date']),
        ]

    def __str__(self):
        return f"Аналитика {self.court.code} за {self.date}"


# =============================================================================
# Поисковый индекс сообщений (денормализованный)
# =============================================================================

class MessageSearchIndex(models.Model):
    """
    Денормализованный индекс для полнотекстового поиска сообщений.
    Обновляется через сигналы.
    """
    message = models.OneToOneField(
        Message, on_delete=models.CASCADE, related_name='search_index',
        verbose_name="Сообщение"
    )
    chat_id = models.PositiveIntegerField(verbose_name="ID чата")
    chat_title = models.CharField(max_length=500, blank=True, verbose_name="Название чата")
    sender_id = models.PositiveIntegerField(verbose_name="ID отправителя")
    sender_name = models.CharField(max_length=500, verbose_name="Имя отправителя")
    court_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="ID суда")
    text_content = models.TextField(verbose_name="Текстовое содержимое")
    attachment_names = models.TextField(blank=True, verbose_name="Имена вложений")
    created_at = models.DateTimeField(verbose_name="Дата сообщения")
    message_type = models.CharField(max_length=20, verbose_name="Тип сообщения")

    class Meta:
        verbose_name = "Поисковый индекс"
        verbose_name_plural = "Поисковые индексы"
        indexes = [
            models.Index(fields=['chat_id', 'created_at']),
            models.Index(fields=['sender_id', 'created_at']),
            models.Index(fields=['court_id', 'created_at']),
        ]

    def __str__(self):
        return f"Индекс для {self.message}"


# =============================================================================
# Видеоконференции (заглушка, будет расширена)
# =============================================================================

class VideoConference(models.Model):
    """Заглушка для видеоконференций (ссылается из court_registry.VCSRequest)."""
    uuid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name="UUID"
    )
    title = models.CharField(max_length=500, verbose_name="Тема")
    chat = models.ForeignKey(
        Chat, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='video_conferences', verbose_name="Связанный чат"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='created_vcs',
        verbose_name="Создал"
    )
    scheduled_at = models.DateTimeField(verbose_name="Запланировано")
    duration_minutes = models.PositiveIntegerField(default=60, verbose_name="Длительность (мин)")
    status = models.CharField(
        max_length=20, choices=[
            ('scheduled', 'Запланирована'),
            ('active', 'Активна'),
            ('completed', 'Завершена'),
            ('cancelled', 'Отменена'),
        ],
        default='scheduled', verbose_name="Статус"
    )
    external_link = models.URLField(blank=True, null=True, verbose_name="Внешняя ссылка")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Видеоконференция"
        verbose_name_plural = "Видеоконференции"
        ordering = ['-scheduled_at']

    def __str__(self):
        return f"ВКС: {self.title}"
