from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class RegistryIndex(models.Model):
    """
    Модель для хранения индексов регистрации дел
    """
    index = models.CharField(max_length=10, unique=True, verbose_name="Индекс")
    name = models.CharField(max_length=500, verbose_name="Наименование индекса")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Индекс регистрации"
        verbose_name_plural = "Индексы регистрации"
        ordering = ['index']

    def __str__(self):
        return f"{self.index} - {self.name}"


class RegistryCounter(models.Model):
    """
    Модель для хранения счетчиков по каждому индексу
    """
    index = models.OneToOneField(
        RegistryIndex,
        on_delete=models.CASCADE,
        related_name='counter',
        verbose_name="Индекс"
    )
    current_number = models.PositiveIntegerField(default=0, verbose_name="Текущий номер")
    last_used = models.DateTimeField(auto_now=True, verbose_name="Последнее использование")
    total_registered = models.PositiveIntegerField(default=0, verbose_name="Всего зарегистрировано")

    class Meta:
        verbose_name = "Счетчик регистрации"
        verbose_name_plural = "Счетчики регистрации"

    def __str__(self):
        return f"Счетчик {self.index.index}: {self.current_number}"


class RegisteredCase(models.Model):
    """
    Модель зарегистрированного дела
    """
    STATUS_CHOICES = [
        ('active', 'Активно'),
        ('completed', 'Завершено'),
        ('archived', 'В архиве'),
        ('deleted', 'Удалено'),
    ]

    index = models.ForeignKey(
        RegistryIndex,
        on_delete=models.PROTECT,
        related_name='cases',
        verbose_name="Индекс"
    )
    case_number = models.PositiveIntegerField(verbose_name="Номер дела")
    full_number = models.CharField(max_length=100, unique=True, verbose_name="Полный номер дела")
    registration_date = models.DateField(default=timezone.now, verbose_name="Дата регистрации")
    description = models.TextField(blank=True, null=True, verbose_name="Описание дела")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name="Статус"
    )
    business_card = models.OneToOneField(
        'business_card.BusinessCard',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='registered_case',
        verbose_name="Базовая карточка"
    )
    criminal_proceedings = models.OneToOneField(
        'criminal_proceedings.CriminalProceedings',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='registered_case',
        verbose_name="Уголовное производство"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата удаления")

    class Meta:
        verbose_name = "Зарегистрированное дело"
        verbose_name_plural = "Зарегистрированные дела"
        ordering = ['-registration_date', '-case_number']
        indexes = [
            models.Index(fields=['index', 'case_number']),
            models.Index(fields=['full_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.full_number} - {self.description or 'Без описания'}"

    def clean(self):
        if self.case_number <= 0:
            raise ValidationError("Номер дела должен быть положительным числом")

    def save(self, *args, **kwargs):
        if not self.full_number:
            # Получаем текущий год
            current_year = timezone.now().year
            # Формируем полный номер: индекс-номер/год
            self.full_number = f"{self.index.index}-{self.case_number}/{current_year}"
        
        if self.status == 'deleted' and not self.deleted_at:
            self.deleted_at = timezone.now()
        
        super().save(*args, **kwargs)


class NumberAdjustment(models.Model):
    """
    Модель для отслеживания корректировок нумерации
    """
    index = models.ForeignKey(
        RegistryIndex,
        on_delete=models.CASCADE,
        related_name='adjustments',
        verbose_name="Индекс"
    )
    old_number = models.PositiveIntegerField(verbose_name="Старый номер")
    new_number = models.PositiveIntegerField(verbose_name="Новый номер")
    reason = models.TextField(verbose_name="Причина корректировки")
    adjusted_by = models.CharField(max_length=255, verbose_name="Кто выполнил корректировку")
    adjusted_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата корректировки")
    case_affected = models.ForeignKey(
        RegisteredCase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Затронутое дело"
    )

    class Meta:
        verbose_name = "Корректировка нумерации"
        verbose_name_plural = "Корректировки нумерации"
        ordering = ['-adjusted_at']

    def __str__(self):
        return f"Корректировка {self.index.index}: {self.old_number} -> {self.new_number}"


class Correspondence(models.Model):
    """Базовая модель для корреспонденции"""
    
    TYPE_CHOICES = [
        ('incoming', 'Входящая'),
        ('outgoing', 'Исходящая'),
    ]
    
    STATUS_CHOICES = [
        ('received', 'Получено'),
        ('registered', 'Зарегистрировано'),
        ('processed', 'Обработано'),
        ('sent', 'Отправлено'),
        ('archived', 'В архиве'),
    ]
    
    correspondence_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        verbose_name="Тип корреспонденции"
    )
    registration_number = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Регистрационный номер"
    )
    registration_date = models.DateField(
        default=timezone.now,
        verbose_name="Дата регистрации"
    )
    sender = models.CharField(
        max_length=500,
        verbose_name="Отправитель"
    )
    recipient = models.CharField(
        max_length=500,
        verbose_name="Получатель"
    )
    document_type = models.CharField(
        max_length=200,
        verbose_name="Тип документа"
    )
    summary = models.TextField(
        verbose_name="Краткое содержание"
    )
    pages_count = models.PositiveIntegerField(
        default=1,
        verbose_name="Количество листов"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='received',
        verbose_name="Статус"
    )
    business_card = models.ForeignKey(
        'business_card.BusinessCard',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='correspondence',
        verbose_name="Связанная карточка дела"
    )
    attached_files = models.FileField(
        upload_to='correspondence/',
        null=True,
        blank=True,
        verbose_name="Прикрепленные файлы"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Примечания"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Корреспонденция"
        verbose_name_plural = "Корреспонденция"
        ordering = ['-registration_date', '-created_at']
        indexes = [
            models.Index(fields=['correspondence_type', 'registration_date']),
            models.Index(fields=['registration_number']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.registration_number} - {self.sender} → {self.recipient}"

class CorrespondenceCounter(models.Model):
    """Счетчик для регистрационных номеров корреспонденции"""
    
    year = models.IntegerField(verbose_name="Год")
    incoming_counter = models.PositiveIntegerField(
        default=0,
        verbose_name="Счетчик входящей"
    )
    outgoing_counter = models.PositiveIntegerField(
        default=0,
        verbose_name="Счетчик исходящей"
    )
    
    class Meta:
        verbose_name = "Счетчик корреспонденции"
        verbose_name_plural = "Счетчики корреспонденции"
        unique_together = ['year']
    
    def __str__(self):
        return f"Счетчик {self.year}: Вх.={self.incoming_counter}, Исх.={self.outgoing_counter}"
