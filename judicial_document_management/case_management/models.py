# case_management/models.py

from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings
from users.models import User

class NotificationType(models.Model):
    """Справочник типов уведомлений (повестка, СМС и т.д.)"""
    name = models.CharField(max_length=100, verbose_name="Название")
    code = models.CharField(max_length=50, unique=True, verbose_name="Код")
    
    class Meta:
        verbose_name = "Тип уведомления"
        verbose_name_plural = "Типы уведомлений"
    
    def __str__(self):
        return self.name


class NotificationTemplate(models.Model):
    """Шаблон повестки для разных категорий дел и типов участников"""
    
    CASE_CATEGORY_CHOICES = [
        ('criminal', 'Уголовное дело'),
        ('civil', 'Гражданское дело'),
        ('administrative', 'Административное дело (КАС)'),
        ('coap', 'Дело об административном правонарушении (КоАП)'),
    ]
    
    # Типы участников согласно формам повесток
    PARTICIPANT_TYPE_CHOICES = [
        ('defendant', 'Подсудимый / Ответчик'),
        ('side', 'Истец / Свидетель'),
        ('victim', 'Потерпевший'),
        ('witness', 'Свидетель'),
        ('expert', 'Эксперт / Специалист / Переводчик'),
        ('representative', 'Представитель / Адвокат'),
        ('inmate', 'Подсудимый под стражей (требование о доставке)'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Название шаблона")
    case_category = models.CharField(max_length=20, choices=CASE_CATEGORY_CHOICES, verbose_name="Категория дела")
    participant_type = models.CharField(max_length=20, choices=PARTICIPANT_TYPE_CHOICES, verbose_name="Тип участника")
    
    # HTML-шаблон с переменными
    content = models.TextField(verbose_name="Содержимое шаблона")
    
    # Номер формы согласно инструкции
    form_number = models.CharField(max_length=10, blank=True, null=True, verbose_name="Номер формы")
    
    variables_description = models.TextField(blank=True, null=True, verbose_name="Описание переменных")
    
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок сортировки")
    
    class Meta:
        verbose_name = "Шаблон повестки"
        verbose_name_plural = "Шаблоны повесток"
        ordering = ['case_category', 'participant_type', 'order']
        unique_together = ['case_category', 'participant_type']
    
    def __str__(self):
        return f"{self.get_case_category_display()} - {self.get_participant_type_display()}"


class Notification(models.Model):
    """Модель для учета извещений участников процесса."""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает отправки'),
        ('sent', 'Отправлено'),
        ('delivered', 'Вручено/Доставлено'),
        ('failed', 'Ошибка доставки'),
    ]
    
    DELIVERY_METHODS = [
        ('post', 'Почта России (заказное письмо)'),
        ('email', 'Электронная почта'),
        ('sms', 'СМС-сообщение'),
        ('phone_call', 'Телефонограмма'),
        ('telegram', 'Телеграмма'),
        ('fax', 'Факсимильная связь'),
        ('in_person', 'Вручено лично под расписку'),
        ('via_representative', 'Через представителя (администрация/семья)'),
        ('electronic_summon', 'Электронная повестка (ГАС Правосудие)'),
        ('vks', 'Видео-конференц-связь'),
        ('detention_facility', 'Требование в СИЗО (форма №33/№37)'),
    ]
    
    # Связь с участником
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        related_name='case_management_notifications'
    )
    object_id = models.PositiveIntegerField()
    participant = GenericForeignKey('content_type', 'object_id')
    
    notification_type = models.ForeignKey(NotificationType, on_delete=models.PROTECT, verbose_name="Тип уведомления")
    delivery_method = models.CharField(max_length=30, choices=DELIVERY_METHODS, verbose_name="Способ доставки")
    
    notification_template = models.ForeignKey(
        NotificationTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Шаблон повестки"
    )
    
    # Связь с делом
    case_content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE, 
        related_name='case_management_case_notifications'
    )
    case_object_id = models.PositiveIntegerField()
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    # Текст повестки (с подставленными данными)
    notification_text = models.TextField(blank=True, null=True, verbose_name="Текст уведомления")
    
    # Данные отправки
    sent_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время отправки")
    delivery_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата и время вручения")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent', verbose_name="Статус")
    
    # Информация о получателе
    recipient_address = models.TextField(blank=True, null=True, verbose_name="Адрес получателя (для почты)")
    recipient_phone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Номер телефона (для СМС/звонка)")
    recipient_email = models.EmailField(blank=True, null=True, verbose_name="Email")
    
    # Согласие на уведомление
    consent_sms = models.BooleanField(default=False, verbose_name="Согласие на СМС-уведомление")
    consent_email = models.BooleanField(default=False, verbose_name="Согласие на Email-уведомление")
    
    notes = models.TextField(blank=True, null=True, verbose_name="Примечания")
    
    # Информация о заседании
    hearing_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата и время заседания")
    hearing_room = models.CharField(max_length=100, blank=True, null=True, verbose_name="Зал суда")
    
    # Кто создал
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        verbose_name="Кто создал",
        related_name='case_management_created_notifications'
    )
    
    class Meta:
        verbose_name = "Извещение"
        verbose_name_plural = "Извещения"
        ordering = ['-sent_date']
        db_table = 'case_management_notifications'
    
    def __str__(self):
        return f"{self.get_status_display()} {self.notification_type.name} для {self.participant} от {self.sent_date}"


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
    
    related_notification = models.ForeignKey(
        Notification, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name="Связанное извещение",
        related_name='progress_entries'
    )
    
    class Meta:
        verbose_name = "Запись справочного листа"
        verbose_name_plural = "Записи справочного листа"
        ordering = ['-action_date', '-created_date']
        db_table = 'case_management_progress_entries'
    
    def __str__(self):
        return f"{self.action_date}: {self.action_type.name} по делу {self.case}"