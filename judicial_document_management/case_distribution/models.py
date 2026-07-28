# case_distribution/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid
import json
import logging

from users.models import User

logger = logging.getLogger(__name__)


class DistributionSettings(models.Model):
    """
    Глобальные настройки распределения дел.
    """
    # Базовые настройки
    auto_distribution_enabled = models.BooleanField(
        default=True,
        verbose_name="Автоматическое распределение включено"
    )
    balance_period_months = models.PositiveIntegerField(
        default=12,
        verbose_name="Период выравнивания нагрузки (месяцев)",
        help_text="За какой период выравнивать нагрузку судей"
    )
    default_complexity = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Сложность дела по умолчанию"
    )
    
    # Настройки для разных категорий дел
    criminal_complexity_multiplier = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Множитель сложности для уголовных дел"
    )
    civil_complexity_multiplier = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Множитель сложности для гражданских дел"
    )
    coap_complexity_multiplier = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Множитель сложности для дел об АП"
    )
    kas_complexity_multiplier = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Множитель сложности для дел КАС"
    )
    
    # Настройки отпусков/отсутствий
    vacation_block_days_before = models.PositiveIntegerField(
        default=14,
        verbose_name="Дней до отпуска не распределять дела"
    )
    vacation_block_days_after = models.PositiveIntegerField(
        default=0,
        verbose_name="Дней после отпуска не распределять дела"
    )
    sick_block_days_after = models.PositiveIntegerField(
        default=7,
        verbose_name="Дней после больничного не распределять дела"
    )
    
    # Настройки нагрузки
    max_cases_per_judge_per_month = models.PositiveIntegerField(
        default=100,
        verbose_name="Максимум дел на судью в месяц (100% нагрузки)"
    )
    base_load_percentage = models.PositiveIntegerField(
        default=100,
        verbose_name="Базовая нагрузка в %"
    )
    
    # Настройки коллегий
    use_department_specialization = models.BooleanField(
        default=True,
        verbose_name="Использовать специализацию отделов"
    )
    
    # Настройки санкций
    sanction_judges_enabled = models.BooleanField(
        default=True,
        verbose_name="Выделенные судьи для санкций"
    )
    sanction_judges_balance_period = models.PositiveIntegerField(
        default=6,
        verbose_name="Период балансировки для санкционных судей (месяцев)"
    )
    
    # Системные поля
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Обновил"
    )
    
    class Meta:
        verbose_name = "Настройки распределения"
        verbose_name_plural = "Настройки распределения"
    
    def __str__(self):
        return "Настройки распределения дел"
    
    def save(self, *args, **kwargs):
        # Обеспечиваем синглтон
        if not self.pk and DistributionSettings.objects.exists():
            raise ValidationError("Может существовать только один экземпляр настроек")
        super().save(*args, **kwargs)


class JudgeSpecialization(models.Model):
    """
    Специализация судьи по категориям дел.
    """
    SPECIALIZATION_TYPES = [
        ('criminal', 'Уголовные дела'),
        ('civil', 'Гражданские дела'),
        ('coap', 'Дела об административных правонарушениях'),
        ('kas', 'Дела КАС РФ'),
        ('sanction', 'Санкции (арест, продление)'),
        ('minor', 'Дела с несовершеннолетними'),
        ('jury', 'Дела с участием присяжных'),
        ('mixed', 'Смешанная специализация'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='specializations',
        limit_choices_to={'role': 'judge'},
        verbose_name="Судья"
    )
    specialization = models.CharField(
        max_length=20,
        choices=SPECIALIZATION_TYPES,
        verbose_name="Специализация"
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name="Основная специализация"
    )
    load_percentage = models.PositiveIntegerField(
        default=100,
        verbose_name="Процент нагрузки (от базового)",
        help_text="Например, 80% для председателя суда"
    )
    max_cases_per_month = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Максимум дел в месяц (переопределяет глобальный)",
        help_text="Оставьте пустым для использования глобальной настройки"
    )
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name="Приоритет",
        help_text="Чем меньше число, тем выше приоритет"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно"
    )
    
    class Meta:
        verbose_name = "Специализация судьи"
        verbose_name_plural = "Специализации судей"
        unique_together = ['user', 'specialization']
        ordering = ['priority', 'user__last_name']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_specialization_display()}"
    
    def get_effective_max_cases(self):
        """Получить эффективный максимум дел с учетом процента нагрузки"""
        if self.max_cases_per_month:
            base_max = self.max_cases_per_month
        else:
            try:
                settings_obj = DistributionSettings.objects.first()
                base_max = settings_obj.max_cases_per_judge_per_month if settings_obj else 100
            except:
                base_max = 100
        
        return int(base_max * self.load_percentage / 100)


class DepartmentDistribution(models.Model):
    """
    Распределение судей по коллегиям/отделам.
    """
    DEPARTMENT_TYPES = [
        ('criminal', 'Уголовная коллегия'),
        ('civil', 'Гражданская коллегия'),
        ('coap', 'Коллегия по КоАП'),
        ('kas', 'Коллегия по КАС'),
        ('mixed', 'Смешанная коллегия'),
        ('sanction', 'Коллегия по санкциям'),
        ('minor', 'Коллегия по делам несовершеннолетних'),
    ]
    
    name = models.CharField(
        max_length=255,
        verbose_name="Название коллегии"
    )
    department_type = models.CharField(
        max_length=20,
        choices=DEPARTMENT_TYPES,
        verbose_name="Тип коллегии"
    )
    judges = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='departments',
        limit_choices_to={'role': 'judge'},
        verbose_name="Судьи"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно"
    )
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name="Приоритет"
    )
    
    class Meta:
        verbose_name = "Коллегия судей"
        verbose_name_plural = "Коллегии судей"
        ordering = ['priority', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_department_type_display()})"
    
    def get_active_judges(self):
        """Получить активных судей в коллегии с учетом отсутствий"""
        from personnel.models import AbsenceRecord
        today = timezone.now().date()
        
        active_judges = []
        for judge in self.judges.filter(is_active=True):
            # Проверяем отсутствия
            is_absent = AbsenceRecord.objects.filter(
                user=judge,
                block_start_date__lte=today,
                block_end_date__gte=today
            ).exists()
            
            if not is_absent:
                active_judges.append(judge)
        
        return active_judges


class ComplexitySetting(models.Model):
    """
    Настройки сложности дел для разных категорий.
    """
    CATEGORY_TYPES = [
        ('criminal', 'Уголовные дела'),
        ('civil', 'Гражданские дела'),
        ('coap', 'Дела об АП'),
        ('kas', 'Дела КАС'),
    ]
    
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_TYPES,
        verbose_name="Категория дел"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Название настройки"
    )
    condition = models.JSONField(
        default=dict,
        verbose_name="Условие (JSON)",
        help_text="Например: {'volumes__gte': 10, 'has_jury': True}"
    )
    complexity_value = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Значение сложности"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно"
    )
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name="Приоритет применения",
        help_text="Чем меньше число, тем выше приоритет"
    )
    
    class Meta:
        verbose_name = "Настройка сложности"
        verbose_name_plural = "Настройки сложности"
        ordering = ['category', 'priority']
        unique_together = ['category', 'name']
    
    def __str__(self):
        return f"{self.get_category_display()}: {self.name} = {self.complexity_value}"


class DistributionRule(models.Model):
    """
    Правила распределения дел.
    """
    RULE_TYPES = [
        ('auto', 'Автоматическое'),
        ('manual', 'Ручное'),
        ('specialized', 'По специализации'),
        ('department', 'По коллегии'),
        ('sanction', 'Для санкций'),
        ('minor', 'Для дел с несовершеннолетними'),
    ]
    
    name = models.CharField(
        max_length=255,
        verbose_name="Название правила"
    )
    rule_type = models.CharField(
        max_length=20,
        choices=RULE_TYPES,
        default='auto',
        verbose_name="Тип правила"
    )
    
    # Условия применения
    category = models.CharField(
        max_length=20,
        choices=ComplexitySetting.CATEGORY_TYPES,
        blank=True,
        null=True,
        verbose_name="Категория дел"
    )
    condition = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Условие применения (JSON)",
        help_text="Например: {'case_type': 'criminal', 'has_minor': True}"
    )
    
    # Целевые судьи или коллегии
    target_judges = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='distribution_rules',
        limit_choices_to={'role': 'judge'},
        verbose_name="Целевые судьи"
    )
    target_departments = models.ManyToManyField(
        DepartmentDistribution,
        blank=True,
        related_name='distribution_rules',
        verbose_name="Целевые коллегии"
    )
    
    # Приоритет
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name="Приоритет",
        help_text="Чем меньше число, тем выше приоритет"
    )
    
    # Дополнительные настройки
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_distribution_rules',
        verbose_name="Создал"
    )
    
    class Meta:
        verbose_name = "Правило распределения"
        verbose_name_plural = "Правила распределения"
        ordering = ['priority', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_rule_type_display()})"


class JudgeLoad(models.Model):
    """
    Нагрузка судьи для распределения дел.
    """
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='judge_loads',
        limit_choices_to={'role': 'judge'},
        verbose_name="Судья"
    )
    
    # Период нагрузки
    year = models.PositiveIntegerField(verbose_name="Год")
    month = models.PositiveIntegerField(verbose_name="Месяц")
    
    # Количественные показатели
    total_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Всего дел"
    )
    total_complexity = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        verbose_name="Общая сложность дел"
    )
    completed_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Рассмотренных дел"
    )
    pending_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Дел в производстве"
    )
    
    # Дела по категориям
    criminal_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Уголовных дел"
    )
    civil_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Гражданских дел"
    )
    coap_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Дел об АП"
    )
    kas_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Дел КАС"
    )
    
    # Временные метки
    last_updated = models.DateTimeField(auto_now=True, verbose_name="Последнее обновление")
    
    class Meta:
        verbose_name = "Нагрузка судьи"
        verbose_name_plural = "Нагрузка судей"
        unique_together = ['judge', 'year', 'month']
        ordering = ['-year', '-month', 'judge__last_name']
        indexes = [
            models.Index(fields=['judge', 'year', 'month']),
            models.Index(fields=['-total_complexity']),
        ]
    
    def __str__(self):
        return f"{self.judge.get_full_name()} - {self.month}/{self.year}: {self.total_cases} дел"
    
    @classmethod
    def get_or_create_for_period(cls, judge, year, month):
        """Получить или создать запись нагрузки для периода"""
        load, created = cls.objects.get_or_create(
            judge=judge,
            year=year,
            month=month,
            defaults={
                'total_cases': 0,
                'total_complexity': 0,
                'completed_cases': 0,
                'pending_cases': 0,
                'criminal_cases': 0,
                'civil_cases': 0,
                'coap_cases': 0,
                'kas_cases': 0,
            }
        )
        return load
    
    def add_case(self, case, complexity=1.0):
        """Добавить дело в нагрузку судьи"""
        self.total_cases += 1
        self.total_complexity += complexity
        self.pending_cases += 1
        
        # Определяем категорию дела
        case_type = self._get_case_type(case)
        if case_type == 'criminal':
            self.criminal_cases += 1
        elif case_type == 'civil':
            self.civil_cases += 1
        elif case_type == 'coap':
            self.coap_cases += 1
        elif case_type == 'kas':
            self.kas_cases += 1
        
        self.save()
    
    def remove_case(self, case, complexity=1.0):
        """Удалить дело из нагрузки судьи"""
        self.total_cases = max(0, self.total_cases - 1)
        self.total_complexity = max(0, self.total_complexity - complexity)
        self.pending_cases = max(0, self.pending_cases - 1)
        
        case_type = self._get_case_type(case)
        if case_type == 'criminal':
            self.criminal_cases = max(0, self.criminal_cases - 1)
        elif case_type == 'civil':
            self.civil_cases = max(0, self.civil_cases - 1)
        elif case_type == 'coap':
            self.coap_cases = max(0, self.coap_cases - 1)
        elif case_type == 'kas':
            self.kas_cases = max(0, self.kas_cases - 1)
        
        self.save()
    
    def complete_case(self):
        """Отметить дело как рассмотренное"""
        self.pending_cases = max(0, self.pending_cases - 1)
        self.completed_cases += 1
        self.save()
    
    def _get_case_type(self, case):
        """Определить тип дела"""
        from django.contrib.contenttypes.models import ContentType
        
        ct = ContentType.objects.get_for_model(case)
        app_label = ct.app_label
        model_name = ct.model.lower()
        
        if 'criminal' in app_label or 'criminal' in model_name:
            return 'criminal'
        elif 'civil' in app_label or 'civil' in model_name:
            return 'civil'
        elif 'administrative_code' in app_label or 'coap' in model_name:
            return 'coap'
        elif 'administrative_proceedings' in app_label or 'kas' in model_name:
            return 'kas'
        return 'unknown'


class CaseDistribution(models.Model):
    """
    Связь дела с распределением и судьей.
    """

    CASE_CATEGORY = [
        ('criminal', 'Уголовное'),
        ('civil', 'Гражданское'),
        ('coap', 'КоАП'),
        ('kas', 'КАС РФ'),
        ('other', 'Иное'),
    ]

    DISTRIBUTION_STATUS = [
        ('pending', 'Ожидает распределения'),
        ('distributed', 'Распределено'),
        ('reassigned', 'Перераспределено'),
        ('rejected', 'Отклонено'),
    ]
    
    DISTRIBUTION_SOURCE = [
        ('auto', 'Автоматическое'),
        ('manual', 'Ручное'),
        ('reassignment', 'Перераспределение'),
        ('sanction', 'Санкционное'),
    ]
    
    # Связь с делом через GenericForeignKey
    case_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'model__in': [
                'criminalproceedings', 'civilproceedings',
                'administrativeproceedings', 'kasproceedings',
                'othermaterial'
            ]
        },
        verbose_name="Тип дела"
    )
    case_object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    # Номер дела для быстрого поиска
    case_number = models.CharField(
        max_length=100,
        verbose_name="Номер дела"
    )
    case_category = models.CharField(
        max_length=50,
        choices=[
            ('criminal', 'Уголовное'),
            ('civil', 'Гражданское'),
            ('coap', 'КоАП'),
            ('kas', 'КАС РФ'),
            ('other', 'Иное'),
        ],
        verbose_name="Категория дела"
    )
    
    # Назначенный судья
    assigned_judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_cases',
        limit_choices_to={'role': 'judge'},
        verbose_name="Назначенный судья"
    )
    
    # Предыдущий судья (для перераспределения)
    previous_judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='previous_cases',
        limit_choices_to={'role': 'judge'},
        verbose_name="Предыдущий судья"
    )
    
    # Сложность дела
    complexity = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1.0,
        verbose_name="Сложность дела"
    )
    
    # Статус распределения
    status = models.CharField(
        max_length=20,
        choices=DISTRIBUTION_STATUS,
        default='pending',
        verbose_name="Статус"
    )
    
    # Источник распределения
    source = models.CharField(
        max_length=20,
        choices=DISTRIBUTION_SOURCE,
        default='auto',
        verbose_name="Источник"
    )
    
    # Причина перераспределения
    reassign_reason = models.TextField(
        blank=True,
        verbose_name="Причина перераспределения"
    )
    
    # Кто распределил
    distributed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='distributed_cases',
        verbose_name="Кто распределил"
    )
    
    # Даты
    distributed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Дата распределения"
    )
    reassigned_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Дата перераспределения"
    )
    
    # Для санкций
    is_sanction = models.BooleanField(
        default=False,
        verbose_name="Санкционное дело"
    )
    
    # Связь с журналом
    distribution_log = models.ForeignKey(
        'DistributionLog',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='case_distributions',
        verbose_name="Журнал распределения"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Распределение дела"
        verbose_name_plural = "Распределения дел"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case_content_type', 'case_object_id']),
            models.Index(fields=['case_number']),
            models.Index(fields=['assigned_judge', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['-distributed_at']),
        ]
        unique_together = ['case_content_type', 'case_object_id']
    
    def __str__(self):
        return f"Дело {self.case_number} - {self.get_status_display()}"


    def assign_judge(self, judge, user, source='auto', log_entry=None):
        """
        Назначить судью на дело.
        """
        old_judge = self.assigned_judge
        
        self.assigned_judge = judge
        self.previous_judge = old_judge
        
        # ===== КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ =====
        # Статус ТОЛЬКО если есть судья
        if judge:
            self.status = 'distributed'
            self.distributed_at = timezone.now()
        else:
            self.status = 'pending'
            self.distributed_at = None
        
        self.source = source
        self.distributed_by = user if judge else None
        
        if source == 'reassignment':
            self.reassigned_at = timezone.now()
        
        if log_entry:
            self.distribution_log = log_entry
        
        self.save()
        
        # Обновляем нагрузку судьи
        if judge:
            self._update_judge_load(judge, source)
        
        if old_judge and source == 'reassignment':
            self._remove_from_judge_load(old_judge)
        
        return self

    def save(self, *args, **kwargs):
        # Автоматически обновляем статус при сохранении
        if self.assigned_judge:
            self.status = 'distributed'
            if not self.distributed_at:
                self.distributed_at = timezone.now()
        else:
            self.status = 'pending'
            self.distributed_at = None
        super().save(*args, **kwargs)

    def set_complexity(self, complexity, user=None):
        """Установить сложность дела"""
        # Убеждаемся, что complexity - это Decimal
        if not isinstance(complexity, Decimal):
            complexity = Decimal(str(complexity))
        
        old_complexity = self.complexity
        self.complexity = complexity
        self.save()
        
        # Обновляем нагрузку судьи при изменении сложности
        if self.assigned_judge:
            self._update_load_complexity(self.assigned_judge, old_complexity, complexity)
        
        return self
    
    def _update_judge_load(self, judge, source):
        """Обновить нагрузку судьи"""
        now = timezone.now()
        load = JudgeLoad.get_or_create_for_period(judge, now.year, now.month)
        load.add_case(self.case, self.complexity)
    
    def _remove_from_judge_load(self, judge):
        """Удалить дело из нагрузки судьи"""
        now = timezone.now()
        load = JudgeLoad.objects.filter(
            judge=judge,
            year=now.year,
            month=now.month
        ).first()
        if load:
            load.remove_case(self.case, self.complexity)
    
    def _update_load_complexity(self, judge, old_complexity, new_complexity):
        """Обновить сложность в нагрузке судьи"""
        now = timezone.now()
        load = JudgeLoad.objects.filter(
            judge=judge,
            year=now.year,
            month=now.month
        ).first()
        if load:
            # Убеждаемся, что оба значения - Decimal
            if not isinstance(new_complexity, Decimal):
                new_complexity = Decimal(str(new_complexity))
            if not isinstance(old_complexity, Decimal):
                old_complexity = Decimal(str(old_complexity))
            
            diff = new_complexity - old_complexity
            load.total_complexity += diff
            load.save()

    @property
    def real_status(self):
        """
        Реальный статус на основе наличия судьи.
        """
        if self.assigned_judge:
            return 'distributed'
        return 'pending'
    
    @property
    def has_judge(self):
        """Проверка наличия судьи."""
        return self.assigned_judge is not None
    
    def save(self, *args, **kwargs):
        # Автоматически обновляем статус при сохранении
        if self.assigned_judge and self.status == 'pending':
            self.status = 'distributed'
            self.distributed_at = self.distributed_at or timezone.now()
        elif not self.assigned_judge and self.status != 'pending':
            self.status = 'pending'
            self.distributed_at = None
        super().save(*args, **kwargs)


class DistributionLog(models.Model):
    """
    Журнал/протокол распределения дел.
    """
    LOG_STATUS = [
        ('pending', 'В процессе'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    ]
    
    # Уникальный идентификатор для протокола
    protocol_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Номер протокола"
    )
    
    # Кто выполнил распределение
    executed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='distribution_logs',
        verbose_name="Кто выполнил"
    )
    
    # Статус
    status = models.CharField(
        max_length=20,
        choices=LOG_STATUS,
        default='pending',
        verbose_name="Статус"
    )
    
    # Статистика
    total_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Всего дел"
    )
    distributed_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Распределено дел"
    )
    failed_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Не удалось распределить"
    )
    reassigned_cases = models.PositiveIntegerField(
        default=0,
        verbose_name="Перераспределено дел"
    )
    
    # Информация о судьях
    judges_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Информация о судьях",
        help_text="Содержит данные о нагрузке судей на момент распределения"
    )
    
    # Причины отказов
    failure_reasons = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Причины отказов"
    )
    
    # Детали распределения
    distribution_details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Детали распределения"
    )
    
    # Тип распределения
    distribution_type = models.CharField(
        max_length=20,
        choices=CaseDistribution.DISTRIBUTION_SOURCE,
        default='auto',
        verbose_name="Тип распределения"
    )
    
    # Временные метки
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Начато"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Завершено"
    )
    
    # Дополнительная информация
    notes = models.TextField(
        blank=True,
        verbose_name="Примечания"
    )
    
    class Meta:
        verbose_name = "Журнал распределения"
        verbose_name_plural = "Журналы распределения"
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Протокол {self.protocol_number} от {self.started_at.strftime('%d.%m.%Y %H:%M')}"
    
    def save(self, *args, **kwargs):
        if not self.protocol_number:
            self.protocol_number = self.generate_protocol_number()
        super().save(*args, **kwargs)
    
    def generate_protocol_number(self):
        """Сгенерировать номер протокола"""
        from datetime import datetime
        import random
        
        date_str = datetime.now().strftime('%Y%m%d')
        random_suffix = random.randint(100, 999)
        
        # Находим последний протокол за сегодня
        last_protocol = DistributionLog.objects.filter(
            protocol_number__startswith=f'ПР-{date_str}'
        ).order_by('-protocol_number').first()
        
        if last_protocol:
            try:
                parts = last_protocol.protocol_number.split('-')
                if len(parts) >= 3:
                    last_num = int(parts[-1])
                    new_num = last_num + 1
                else:
                    new_num = 1
            except:
                new_num = 1
        else:
            new_num = 1
        
        return f"ПР-{date_str}-{new_num:04d}"
    
    def mark_completed(self):
        """Отметить протокол как завершенный"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def get_summary(self):
        """Получить краткую сводку протокола"""
        return {
            'protocol_number': self.protocol_number,
            'executed_by': self.executed_by.get_full_name() if self.executed_by else None,
            'total_cases': self.total_cases,
            'distributed_cases': self.distributed_cases,
            'failed_cases': self.failed_cases,
            'reassigned_cases': self.reassigned_cases,
            'started_at': self.started_at.strftime('%d.%m.%Y %H:%M:%S'),
            'completed_at': self.completed_at.strftime('%d.%m.%Y %H:%M:%S') if self.completed_at else None,
            'distribution_type': self.get_distribution_type_display(),
        }


class JudgeExclusion(models.Model):
    """
    Исключение судьи из распределения (на определенный период или бессрочно).
    """
    EXCLUSION_TYPES = [
        ('vacation', 'Отпуск'),
        ('sick_leave', 'Больничный'),
        ('business_trip', 'Командировка'),
        ('training', 'Обучение'),
        ('temporary_disability', 'Временная нетрудоспособность'),
        ('other', 'Другое'),
    ]
    
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exclusions',
        limit_choices_to={'role': 'judge'},
        verbose_name="Судья"
    )
    
    exclusion_type = models.CharField(
        max_length=30,
        choices=EXCLUSION_TYPES,
        verbose_name="Тип исключения"
    )
    
    # Период исключения
    start_date = models.DateField(verbose_name="Дата начала")
    end_date = models.DateField(verbose_name="Дата окончания")
    is_permanent = models.BooleanField(
        default=False,
        verbose_name="Бессрочно"
    )
    
    # Причина
    reason = models.TextField(
        verbose_name="Причина исключения"
    )
    
    # Учет в распределении
    block_distribution = models.BooleanField(
        default=True,
        verbose_name="Блокировать распределение"
    )
    
    # Кто создал
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_exclusions',
        verbose_name="Кто создал"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Исключение судьи"
        verbose_name_plural = "Исключения судей"
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['judge', 'start_date', 'end_date']),
            models.Index(fields=['is_permanent']),
        ]
    
    def __str__(self):
        return f"{self.judge.get_full_name()} - {self.get_exclusion_type_display()}"
    
    def is_active_today(self):
        """Активно ли исключение сегодня"""
        today = timezone.now().date()
        if self.is_permanent:
            return True
        return self.start_date <= today <= self.end_date
    
    def is_active_on_date(self, date):
        """Активно ли исключение в указанную дату"""
        if self.is_permanent:
            return True
        return self.start_date <= date <= self.end_date


class SanctionJudge(models.Model):
    """
    Судья, уполномоченный рассматривать санкции (арест, продление и т.д.).
    """
    SANCTION_TYPES = [
        ('arrest', 'Арест'),
        ('extension_arrest', 'Продление ареста'),
        ('detention', 'Содержание под стражей'),
        ('house_arrest', 'Домашний арест'),
        ('bail', 'Залог'),
        ('other', 'Иное'),
    ]
    
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sanction_judges',
        limit_choices_to={'role': 'judge'},
        verbose_name="Судья"
    )
    
    sanction_type = models.CharField(
        max_length=30,
        choices=SANCTION_TYPES,
        verbose_name="Тип санкции"
    )
    
    # Дополнительные настройки
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name="Приоритет"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно"
    )
    max_cases_per_week = models.PositiveIntegerField(
        default=10,
        verbose_name="Максимум санкций в неделю"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Судья по санкциям"
        verbose_name_plural = "Судьи по санкциям"
        unique_together = ['judge', 'sanction_type']
        ordering = ['priority', 'judge__last_name']
    
    def __str__(self):
        return f"{self.judge.get_full_name()} - {self.get_sanction_type_display()}"


class ReassignmentLog(models.Model):
    """
    Журнал перераспределений дел.
    """
    case_distribution = models.ForeignKey(
        CaseDistribution,
        on_delete=models.CASCADE,
        related_name='reassignments',
        verbose_name="Распределение дела"
    )
    
    # Судьи
    from_judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reassignments_from',
        limit_choices_to={'role': 'judge'},
        verbose_name="От кого"
    )
    to_judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reassignments_to',
        limit_choices_to={'role': 'judge'},
        verbose_name="Кому"
    )
    
    # Причина
    reason = models.TextField(
        verbose_name="Причина перераспределения"
    )
    reason_type = models.CharField(
        max_length=50,
        choices=[
            ('vacation', 'Отпуск судьи'),
            ('sick_leave', 'Больничный'),
            ('workload', 'Перегрузка'),
            ('specialization', 'Специализация'),
            ('conflict', 'Конфликт интересов'),
            ('reassignment', 'Перераспределение'),
            ('other', 'Другое'),
        ],
        default='other',
        verbose_name="Тип причины"
    )
    
    # Кто выполнил
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='performed_reassignments',
        verbose_name="Кто выполнил"
    )
    
    # Дополнительная информация
    notes = models.TextField(
        blank=True,
        verbose_name="Примечания"
    )
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Журнал перераспределения"
        verbose_name_plural = "Журналы перераспределений"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Перераспределение {self.case_distribution.case_number} от {self.from_judge} к {self.to_judge}"
