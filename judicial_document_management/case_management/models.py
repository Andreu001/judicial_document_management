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

class Notification(models.Model):
    """
    Модель для учета извещений участников процесса.
    Связана с конкретным участником (сторона или адвокат) через GenericForeignKey.
    """
    STATUS_CHOICES = [
        ('pending', 'Ожидает отправки'),
        ('sent', 'Отправлено'),
        ('delivered', 'Вручено/Доставлено'),
        ('failed', 'Ошибка доставки'),
    ]
    
    DELIVERY_METHODS = [
        ('post', 'Почта России'),
        ('email', 'Электронная почта'),
        ('sms', 'СМС-сообщение'),
        ('phone_call', 'Телефонограмма'),
        ('telegram', 'Телеграмма'),
        ('in_person', 'Вручено лично'),
        ('via_representative', 'Через дознавателя/следователя'),
    ]
    
    # Связь с участником (сторона или адвокат)
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        related_name='case_management_notifications'
    )
    object_id = models.PositiveIntegerField()
    participant = GenericForeignKey('content_type', 'object_id')
    
    # Тип уведомления (повестка, СМС, телефонограмма и т.д.)
    notification_type = models.ForeignKey(NotificationType, on_delete=models.PROTECT, verbose_name="Тип уведомления")
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS, verbose_name="Способ доставки")
    
    # Связь с делом (для удобства и быстрых выборок)
    case_content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE, 
        related_name='case_management_case_notifications'
    )
    case_object_id = models.PositiveIntegerField()
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    # Данные отправки
    sent_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время отправки")
    delivery_date = models.DateTimeField(null=True, blank=True, verbose_name="Дата и время вручения")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent', verbose_name="Статус")
    
    # Дополнительная информация
    recipient_address = models.TextField(blank=True, null=True, verbose_name="Адрес получателя (для почты)")
    recipient_phone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Номер телефона (для СМС/звонка)")
    recipient_email = models.EmailField(blank=True, null=True, verbose_name="Email")
    notes = models.TextField(blank=True, null=True, verbose_name="Примечания")
    
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
    """Справочник действий для справочного листа (направление повесток, истребование документов и т.д.)"""
    name = models.CharField(max_length=200, verbose_name="Название действия")
    code = models.CharField(max_length=50, unique=True, verbose_name="Код")
    
    class Meta:
        verbose_name = "Тип действия"
        verbose_name_plural = "Типы действий"
    
    def __str__(self):
        return self.name

class CaseProgressEntry(models.Model):
    """
    Модель для записей в справочном листе (ход дела).
    """
    # Связь с делом
    case_content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE, 
        related_name='case_management_progress_entries'
    )
    case_object_id = models.PositiveIntegerField()
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    # Действие
    action_type = models.ForeignKey(ProgressActionType, on_delete=models.PROTECT, verbose_name="Действие")
    description = models.TextField(
        verbose_name="Описание действия",
        null=True, 
        blank=True,
    )
    
    # Дата и информация
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания записи")
    action_date = models.DateField(verbose_name="Дата действия")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        verbose_name="Кто выполнил",
        related_name='case_management_progress_entries'
    )
    
    # Связь с конкретным уведомлением, если запись о нем
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
