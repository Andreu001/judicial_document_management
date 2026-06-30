"""
Сигналы для автоматизации коммуникационной платформы.

- Авто-создание чатов отделов и канала суда при регистрации суда
- Авто-добавление сотрудников в чаты отделов
- Авто-обновление поискового индекса
- Авто-уведомления при событиях
- Авто-создание поручений из сообщений
"""
import json
import logging
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model

from communication.models import (
    Chat, ChatMember, Message, MessageRead, MessageAttachment,
    Broadcast, Task, MessageSearchIndex, MessageType,
    AutoNotificationRule, ChatType, MemberRole,
)
from court_registry.models import (
    Court, CourtDepartment, CourtEmployee, CourtMessengerRegistration,
)

User = get_user_model()
logger = logging.getLogger(__name__)


# =============================================================================
# Авто-создание чатов при регистрации суда в сети
# =============================================================================

@receiver(post_save, sender=CourtMessengerRegistration)
def auto_create_court_chats(sender, instance, created, **kwargs):
    """
    При первой регистрации мессенджера суда:
    - Создать чаты для всех отделов
    - Создать служебный канал суда
    - Добавить всех сотрудников в соответствующие чаты
    """
    if not instance.is_registered:
        return

    court = instance.court
    if not court:
        return

    from communication.utils import auto_create_department_chats, auto_create_court_channel

    dep_count = auto_create_department_chats(court)
    channel, channel_created = auto_create_court_channel(court)

    instance.synced_departments_count = dep_count
    instance.synced_employees_count = CourtEmployee.objects.filter(
        department__court=court, is_active=True
    ).count()
    instance.last_sync_at = timezone.now()
    instance.save(update_fields=[
        'synced_departments_count', 'synced_employees_count', 'last_sync_at', 'updated_at'
    ])

    logger.info(f"Авто-созданы чаты для суда {court.code}: "
                f"{dep_count} отделов, канал: {channel_created}")


# =============================================================================
# Авто-добавление сотрудника в чаты отдела
# =============================================================================

@receiver(post_save, sender=CourtEmployee)
def auto_add_employee_to_department_chats(sender, instance, created, **kwargs):
    """При добавлении сотрудника в отдел — авто-добавление в чаты."""
    if not instance.is_active or not instance.department:
        return

    # Чат отдела
    dept_chat = Chat.objects.filter(
        chat_type=ChatType.DEPARTMENT,
        department=instance.department,
        is_active=True,
    ).first()

    if dept_chat:
        ChatMember.objects.get_or_create(
            chat=dept_chat, user=instance.employee,
            defaults={'role': MemberRole.ADMIN if instance.is_head_of_department else MemberRole.MEMBER}
        )

    # Канал суда
    court_channel = Chat.objects.filter(
        chat_type=ChatType.COURT_CHANNEL,
        court=instance.department.court,
        is_active=True,
    ).first()

    if court_channel:
        ChatMember.objects.get_or_create(
            chat=court_channel, user=instance.employee,
            defaults={'role': MemberRole.READONLY}
        )


# =============================================================================
# Авто-синхронизация сотрудников при создании пользователя
# =============================================================================

@receiver(post_save, sender=User)
def auto_sync_user_to_court_employee(sender, instance, created, **kwargs):
    """
    При создании или обновлении пользователя синхронизируем с CourtEmployee.
    Это дублирует сигнал из court_registry для надежности.
    """
    if not instance.is_active:
        return
    
    STAFF_ROLES = ['admin', 'judge', 'secretary', 'assistant_referee', 'hr']
    
    if instance.role not in STAFF_ROLES:
        return
    
    court = Court.objects.first()
    if not court:
        return
    
    department = CourtDepartment.objects.filter(
        court=court,
        is_active=True
    ).first()
    
    if not department:
        department = CourtDepartment.objects.create(
            court=court,
            name="Общий отдел",
            is_active=True,
            sort_order=0
        )
    
    role_position_map = {
        'admin': 'Администратор',
        'judge': 'Судья',
        'secretary': 'Секретарь',
        'assistant_referee': 'Помощник судьи',
        'hr': 'Сотрудник кадров',
    }
    
    position = role_position_map.get(instance.role, instance.role)
    
    emp, created = CourtEmployee.objects.get_or_create(
        employee=instance,
        department=department,
        defaults={
            'position': position,
            'is_active': True,
        }
    )
    
    if created:
        logger.info(f"[Communication] Авто-привязка: {instance.username} → {court.code}")


# =============================================================================
# Обновление поискового индекса
# =============================================================================

@receiver(post_save, sender=Message)
def update_search_index(sender, instance, created, **kwargs):
    """Обновить поисковый индекс при создании/изменении сообщения."""
    if instance.is_deleted:
        MessageSearchIndex.objects.filter(message=instance).delete()
        return

    chat_title = instance.chat.title or ''
    if instance.chat.chat_type == ChatType.DIRECT:
        members = instance.chat.members.filter(is_active=True).values_list(
            'user__first_name', 'user__last_name'
        )
        chat_title = ', '.join([f"{f} {l}" for f, l in members if f or l])

    sender_name = ''
    if instance.sender:
        sender_name = instance.sender.get_full_name() or instance.sender.username

    attachment_names = ''
    if instance.attachments.exists():
        attachment_names = ' '.join(
            a.original_filename for a in instance.attachments.all()
        )

    court_id = instance.chat.court_id

    MessageSearchIndex.objects.update_or_create(
        message=instance,
        defaults={
            'chat_id': instance.chat_id,
            'chat_title': chat_title,
            'sender_id': instance.sender_id or 0,
            'sender_name': sender_name,
            'court_id': court_id,
            'text_content': instance.text or '',
            'attachment_names': attachment_names,
            'created_at': instance.created_at,
            'message_type': instance.message_type,
        }
    )


@receiver(post_delete, sender=Message)
def remove_search_index(sender, instance, **kwargs):
    MessageSearchIndex.objects.filter(message=instance).delete()


# =============================================================================
# Авто-создание поручения из сообщения
# =============================================================================

@receiver(post_save, sender=Message)
def auto_create_task_from_message(sender, instance, created, **kwargs):
    """Если сообщение имеет тип 'task' — авто-создание поручения."""
    if not created or instance.message_type != MessageType.TASK:
        return

    # Поручение уже создано (связь в обе стороны)
    if instance.task:
        return

    from communication.models import Task, TaskStatus, TaskPriority

    task = Task.objects.create(
        title=instance.text[:500] or f"Поручение из чата #{instance.chat_id}",
        description=instance.text,
        created_by=instance.sender,
        assigned_to=instance.sender,  # Будет изменено получателем
        chat=instance.chat,
        court=instance.chat.court,
        status=TaskStatus.NEW,
        priority=TaskPriority.NORMAL,
    )

    instance.task = task
    instance.save(update_fields=['task'])


# =============================================================================
# Авто-уведомления при событиях
# =============================================================================

def trigger_auto_notification(court, trigger_type, context=None):
    """
    Вызвать авто-уведомления по заданному триггеру.
    context: dict с переменными для подстановки в шаблон.
    """
    rules = AutoNotificationRule.objects.filter(
        court=court, trigger=trigger_type, is_active=True
    ).prefetch_related('notify_departments')

    if not rules.exists():
        return

    context = context or {}

    for rule in rules:
        try:
            # Формируем текст из шаблона
            text = rule.message_template
            for key, value in context.items():
                text = text.replace(f'{{{key}}}', str(value))

            # Создаём сообщение в целевом чате
            if rule.create_chat_message and rule.target_chat:
                Message.objects.create(
                    chat=rule.target_chat,
                    message_type=MessageType.NOTIFICATION,
                    text=text,
                )
                rule.target_chat.update_last_message()

            rule.last_triggered_at = timezone.now()
            rule.save(update_fields=['last_triggered_at'])

        except Exception as e:
            logger.error(f"Auto-notification rule {rule.id} failed: {e}")