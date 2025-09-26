# notifications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from django.core.exceptions import ValidationError

User = get_user_model()

class NotificationRule(models.Model):
    """Правила для автоматического создания уведомлений"""
    RULE_TYPES = [
        ('jurisdiction_check', 'Проверка подсудности'),
        ('deadline_warning', 'Предупреждение о сроке'),
        ('required_action', 'Обязательное действие'),
        ('status_change', 'Изменение статуса'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Название правила")
    rule_type = models.CharField(max_length=50, choices=RULE_TYPES)
    target_model = models.CharField(max_length=100, verbose_name="Целевая модель")
    condition = models.JSONField(verbose_name="Условие срабатывания", help_text="JSON с условиями")
    days_before = models.IntegerField(default=0, verbose_name="Дней до события")
    title_template = models.CharField(max_length=500, verbose_name="Шаблон заголовка")
    message_template = models.TextField(verbose_name="Шаблон сообщения")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class JurisdictionCheck(models.Model):
    """Результаты проверки подсудности"""
    CASE_TYPES = (
        ('magistrate', 'Мировой судья (до 3 лет)'),
        ('district', 'Районный суд (свыше 3 лет)'),
        ('subject', 'Суд субъекта'),
    )
    
    criminal_proceeding = models.ForeignKey(
        'criminal_proceedings.CriminalProceedings',
        on_delete=models.CASCADE,
        verbose_name="Уголовное дело"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Проверивший судья")
    case_type_actual = models.CharField(max_length=20, choices=CASE_TYPES, verbose_name="Фактический тип дела")
    case_type_required = models.CharField(max_length=20, choices=CASE_TYPES, verbose_name="Требуемый тип дела")
    is_correct = models.BooleanField(default=False, verbose_name="Подсудность верна")
    checked_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, verbose_name="Примечания")
    
    class Meta:
        verbose_name = "Проверка подсудности"
        verbose_name_plural = "Проверки подсудности"
    
    def __str__(self):
        return f"Проверка подсудности дела {self.criminal_proceeding}"

class DeadlineWarning(models.Model):
    """Предупреждения о приближающихся сроках"""
    WARNING_TYPES = [
        ('pre_trial_preparation', 'Подготовка к судебному заседанию (30 дней)'),
        ('trial_start', 'Начало судебного разбирательства'),
        ('decision_making', 'Вынесение решения'),
    ]
    
    criminal_proceeding = models.ForeignKey(
        'criminal_proceedings.CriminalProceedings',
        on_delete=models.CASCADE,
        verbose_name="Уголовное дело"
    )
    warning_type = models.CharField(max_length=50, choices=WARNING_TYPES)
    deadline_date = models.DateField(verbose_name="Крайний срок")
    days_remaining = models.IntegerField(verbose_name="Осталось дней")
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Предупреждение о сроке"
        verbose_name_plural = "Предупреждения о сроках"
    
    def __str__(self):
        return f"{self.get_warning_type_display()} - {self.criminal_proceeding}"

class LegalReference(models.Model):
    """Справочник: Постановления Пленума / решения ВС / выдержки и т.п."""
    TYPE_CHOICES = (
        ('plenum', 'Постановление Пленума'),
        ('vs_decision', 'Решение ВС РФ'),
        ('excerpt', 'Выдержка практики'),
        ('other', 'Другое'),
    )

    ref_type = models.CharField(max_length=32, choices=TYPE_CHOICES, default='other')
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='legal_references/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_ref_type_display()} — {self.title}"

class Notification(models.Model):
    """Основная модель уведомления"""
    PRIORITY_CHOICES = [
        ('low', 'Низкий'),
        ('medium', 'Средний'),
        ('high', 'Высокий'),
        ('critical', 'Критический'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    
    # Связь с уголовным делом
    criminal_proceeding = models.ForeignKey(
        'criminal_proceedings.CriminalProceedings',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Уголовное дело"
    )
    
    # generic relation для других типов дел
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")
    
    title = models.CharField(max_length=512, verbose_name="Заголовок")
    message = models.TextField(verbose_name="Сообщение")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False, verbose_name="Прочитано")
    is_completed = models.BooleanField(default=False, verbose_name="Выполнено")
    deadline = models.DateTimeField(null=True, blank=True, verbose_name="Срок выполнения")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Связь с проверкой подсудности
    jurisdiction_check = models.ForeignKey(
        JurisdictionCheck, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Проверка подсудности"
    )
    
    legal_references = models.ManyToManyField(LegalReference, blank=True, verbose_name="Правовые ссылки")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"

    def mark_read(self):
        self.is_read = True
        self.save(update_fields=["is_read"])

    def mark_completed(self):
        self.is_completed = True
        self.save(update_fields=["is_completed"])

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"
