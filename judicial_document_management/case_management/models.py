from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings
from users.models import User

from business_card.models import SidesCaseInCase, Lawyer
from criminal_proceedings.models import Defendant
from administrative_proceedings.models import KasProceedings
from civil_proceedings.models import CivilProceedings
from administrative_code.models import AdministrativeProceedings


class ProgressActionType(models.Model):
    """Справочник действий для справочного листа"""
    name = models.CharField(max_length=200, verbose_name="Название действия")
    code = models.CharField(max_length=50, unique=True, verbose_name="Код")
    
    class Meta:
        verbose_name = "Тип действия"
        verbose_name_plural = "Типы действий"
    
    def __str__(self):
        return self.name


class CaseProgressEntry(models.Model):
    """Модель для записей в справочном листе"""
    
    case_content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE, 
        related_name='case_management_progress_entries'
    )
    case_object_id = models.PositiveIntegerField()
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    action_type = models.ForeignKey(ProgressActionType, on_delete=models.PROTECT, verbose_name="Действие")
    description = models.TextField(verbose_name="Описание действия", null=True, blank=True, default='')
    
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания записи")
    action_date = models.DateField(verbose_name="Дата действия")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        verbose_name="Кто выполнил",
        related_name='case_management_progress_entries'
    )
    
   
    class Meta:
        verbose_name = "Запись справочного листа"
        verbose_name_plural = "Записи справочного листа"
        ordering = ['-action_date', '-created_date']
        db_table = 'case_management_progress_entries'
    
    def __str__(self):
        return f"{self.action_date}: {self.action_type.name} по делу {self.case}"


class NotificationChannel(models.Model):
    """Каналы уведомлений (почта, СМС, телефонограмма и т.д.)"""
    name = models.CharField(max_length=100, verbose_name="Название канала")
    code = models.CharField(max_length=50, unique=True, verbose_name="Код")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    requires_confirmation = models.BooleanField(
        default=False, 
        verbose_name="Требует подтверждения вручения"
    )
    
    class Meta:
        verbose_name = "Канал уведомления"
        verbose_name_plural = "Каналы уведомлений"
    
    def __str__(self):
        return self.name


class NotificationStatus(models.Model):
    """Статус уведомления (отправлено, вручено, не вручено и т.д.)"""
    name = models.CharField(max_length=100, verbose_name="Название статуса")
    code = models.CharField(max_length=50, unique=True, verbose_name="Код")
    is_final = models.BooleanField(default=False, verbose_name="Финальный статус")
    is_success = models.BooleanField(default=False, verbose_name="Успешное завершение")
    
    class Meta:
        verbose_name = "Статус уведомления"
        verbose_name_plural = "Статусы уведомлений"
    
    def __str__(self):
        return self.name


class NotificationTemplate(models.Model):
    """Шаблоны уведомлений/повесток"""
    CASE_CATEGORIES = [
        ('criminal', 'Уголовное дело'),
        ('civil', 'Гражданское дело'),
        ('coap', 'Дело об АП (КоАП)'),
        ('kas', 'Административное дело (КАС)'),
    ]
    
    PARTICIPANT_TYPES = [
        ('defendant', 'Подсудимый/Обвиняемый'),
        ('side', 'Сторона'),
        ('lawyer', 'Адвокат/Представитель'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Название шаблона")
    case_category = models.CharField(
        max_length=20, 
        choices=CASE_CATEGORIES,
        verbose_name="Категория дела"
    )
    participant_type = models.CharField(
        max_length=20,
        choices=PARTICIPANT_TYPES,
        verbose_name="Тип участника"
    )
    form_number = models.CharField(
        max_length=20, 
        blank=True, 
        verbose_name="Номер формы (по инструкции)"
    )
    content = models.TextField(verbose_name="Содержание шаблона")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок")
    
    class Meta:
        verbose_name = "Шаблон уведомления"
        verbose_name_plural = "Шаблоны уведомлений"
        ordering = ['case_category', 'participant_type', 'order']
    
    def __str__(self):
        return f"{self.name} ({self.get_case_category_display()})"


class Notification(models.Model):
    """
    Уведомление/извещение участника процесса.
    Привязывается к конкретному делу, участнику и судебному заседанию.
    """
    # Связь с делом через ContentType (универсально для всех категорий дел)
    case_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'app_label__in': [
                'criminal_proceedings', 'civil_proceedings', 
                'administrative_proceedings', 'kas_proceedings'
            ]
        },
        verbose_name="Тип дела",
        related_name='case_management_case_notifications'  # Добавлен unique related_name
    )
    case_object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('case_content_type', 'case_object_id')

    participant_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='case_management_participant_notifications',
        limit_choices_to={
            'model__in': ['sidescaseincase', 'lawyer', 'defendant']
        },
        verbose_name="Тип участника",
        null=True,  # Временно разрешаем null
        blank=True
    )
    participant_object_id = models.PositiveIntegerField(
        verbose_name="ID участника",
        null=True,  # Временно разрешаем null
        blank=True
    )
    participant = GenericForeignKey('participant_content_type', 'participant_object_id')
    
    # Дополнительная информация об участнике (для отображения)
    participant_name = models.CharField(
        max_length=255, 
        verbose_name="ФИО/Наименование участника",
        null=True,
        blank=True
    )
    participant_role = models.CharField(
        max_length=200, 
        blank=True, 
        verbose_name="Роль в деле"
    )
    
    # Данные для связи (телефон, email, адрес)
    contact_phone = models.CharField(max_length=50, blank=True, verbose_name="Телефон")
    contact_email = models.EmailField(blank=True, verbose_name="Email")
    contact_address = models.TextField(blank=True, verbose_name="Почтовый адрес")
    
    # Информация о судебном заседании
    hearing_date = models.DateField(verbose_name="Дата заседания")
    hearing_time = models.TimeField(verbose_name="Время заседания")
    hearing_room = models.CharField(
        max_length=50, 
        blank=True, 
        verbose_name="Номер зала"
    )
    
    # Канал и способ уведомления
    channel = models.ForeignKey(
        NotificationChannel,
        on_delete=models.PROTECT,
        verbose_name="Канал уведомления",
        null=True,
        blank=True
    )
    
    # Шаблон и сформированный текст
    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Использованный шаблон"
    )
    message_text = models.TextField(verbose_name="Текст уведомления")
    
    # Статусы и даты
    status = models.ForeignKey(
        NotificationStatus,
        on_delete=models.PROTECT,
        verbose_name="Статус",
        null=True,
        blank=True,
    )
    sent_date = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Дата отправки"
    )
    delivery_date = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Дата вручения"
    )
    
    # Информация о возврате/неудаче
    return_reason = models.TextField(
        blank=True, 
        verbose_name="Причина возврата/не вручения"
    )
    return_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Дата возврата"
    )
    
    # Кто создал уведомление
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_notifications',
        verbose_name="Создал"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    # Связь с записью в справочном листе
    progress_entry = models.OneToOneField(
        'CaseProgressEntry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notification',
        verbose_name="Запись в справочном листе"
    )
    
    class Meta:
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case_content_type', 'case_object_id']),
            models.Index(fields=['participant_content_type', 'participant_object_id']),
            models.Index(fields=['status', 'sent_date']),
        ]
    
    def __str__(self):
        return f"Уведомление для {self.participant_name} от {self.created_at.date()}"
    
    def mark_as_sent(self, user=None):
        """Отметить уведомление как отправленное"""
        from django.utils import timezone
        self.status = NotificationStatus.objects.get(code='sent')
        self.sent_date = timezone.now()
        self.save()
        
        # Обновляем запись в справочном листе, если есть
        if self.progress_entry:
            self.progress_entry.description = f"Направлено уведомление {self.participant_name} (канал: {self.channel.name})"
            self.progress_entry.save()
    
    def mark_as_delivered(self, delivery_date=None):
        """Отметить уведомление как врученное"""
        from django.utils import timezone
        self.status = NotificationStatus.objects.get(code='delivered')
        self.delivery_date = delivery_date or timezone.now()
        self.save()
        
        if self.progress_entry:
            self.progress_entry.description = f"Уведомление вручено {self.participant_name} {self.delivery_date.date()}"
            self.progress_entry.save()
    
    def mark_as_undelivered(self, reason):
        """Отметить уведомление как не врученное"""
        from django.utils import timezone
        self.status = NotificationStatus.objects.get(code='undelivered')
        self.return_reason = reason
        self.return_date = timezone.now().date()
        self.save()
        
        if self.progress_entry:
            self.progress_entry.description = f"Уведомление не вручено {self.participant_name}: {reason}"
            self.progress_entry.save()
