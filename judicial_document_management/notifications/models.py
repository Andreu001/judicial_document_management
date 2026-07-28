# notifications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

User = get_user_model()


RULE_TYPES = [
    ('jurisdiction_check', 'Проверка подсудности'),
    ('deadline_warning', 'Предупреждение о сроке'),
    ('required_action', 'Обязательное действие'),
    ('status_change', 'Изменение статуса'),
    ('incoming_correspondence', 'Входящая корреспонденция'),
    ('outgoing_correspondence', 'Исходящая корреспонденция')
]
    

class NotificationRule(models.Model):
    """Правила для автоматического создания уведомлений"""
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
    
    # NEW: Связь с гражданским делом
    civil_proceeding = models.ForeignKey(
        'civil_proceedings.CivilProceedings',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Гражданское дело"
    )
    
    # NEW: Связь с административным делом (КоАП)
    admin_proceeding = models.ForeignKey(
        'administrative_code.AdministrativeProceedings',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Административное дело (КоАП)"
    )
    
    # NEW: Связь с делом по КАС
    kas_proceeding = models.ForeignKey(
        'administrative_proceedings.KASProceedings',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Дело по КАС"
    )
    
    # NEW: Связь с корреспонденцией
    correspondence = models.ForeignKey(
        'case_registry.Correspondence',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Связанная корреспонденция"
    )
    
    # generic relation для других типов дел
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")
    
    # NEW: Тип уведомления для фильтрации
    notification_type = models.CharField(
        max_length=50,
        choices=RULE_TYPES,
        default='status_change',
        verbose_name="Тип уведомления"
    )
    
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


class CaseActivity(models.Model):
    """
    Отслеживание активности по делу (новые документы, ходатайства и т.д.)
    Универсальная модель для всех типов дел.
    """
    ACTIVITY_TYPES = (
        ('new_party_document', 'Новый документ от стороны'),
        ('new_petition', 'Новое ходатайство'),
        ('new_correspondence', 'Новая корреспонденция'),
        ('document_status_changed', 'Изменение статуса документа'),
        ('petition_resolved', 'Ходатайство рассмотрено'),
    )
    
    # Связь с делом (универсальная)
    case_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'model__in': (
                'criminalproceedings',
                'administrativeproceedings',  # КоАП
                'civilproceedings',
                'kasproceedings'
            )
        },
        verbose_name="Тип дела"
    )
    case_object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    # Тип активности
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES, verbose_name="Тип активности")
    
    # Связанный объект (документ, ходатайство, корреспонденция)
    related_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='+'
    )
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('related_content_type', 'related_object_id')
    
    # Дополнительная информация
    title = models.CharField(max_length=500, verbose_name="Заголовок")
    description = models.TextField(verbose_name="Описание", blank=True)
    
    # Ссылка для перехода
    link = models.CharField(max_length=500, verbose_name="Ссылка", blank=True)
    
    # Статус для судьи (прочитано/не прочитано)
    is_read_by_judge = models.BooleanField(default=False, verbose_name="Прочитано судьей")
    
    # Время создания
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Активность по делу"
        verbose_name_plural = "Активности по делам"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case_content_type', 'case_object_id', '-created_at']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['is_read_by_judge']),
        ]
    
    def __str__(self):
        return f"[{self.get_activity_type_display()}] {self.title[:50]}"
    
    def mark_as_read(self):
        """Отметить активность как прочитанную судьей"""
        if not self.is_read_by_judge:
            self.is_read_by_judge = True
            self.save(update_fields=['is_read_by_judge'])
            return True
        return False


class CaseNotificationSummary(models.Model):
    """
    Сводка по уведомлениям для карточки дела.
    Кеширует количество непрочитанных активностей.
    """
    case_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name="Тип дела"
    )
    case_object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    # Для кого (судья)
    judge = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        verbose_name="Судья"
    )
    
    # Количество непрочитанных активностей по типам
    unread_party_documents = models.PositiveIntegerField(default=0, verbose_name="Непрочитанных документов сторон")
    unread_petitions = models.PositiveIntegerField(default=0, verbose_name="Непрочитанных ходатайств")
    unread_correspondence = models.PositiveIntegerField(default=0, verbose_name="Непрочитанной корреспонденции")
    
    # Общее количество
    total_unread = models.PositiveIntegerField(default=0, verbose_name="Всего непрочитанных")
    
    # Время последнего обновления
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Сводка уведомлений по делу"
        verbose_name_plural = "Сводки уведомлений по делам"
        unique_together = ['case_content_type', 'case_object_id', 'judge']
        indexes = [
            models.Index(fields=['case_content_type', 'case_object_id']),
            models.Index(fields=['judge', 'total_unread']),
        ]
    
    def __str__(self):
        case_number = self._get_case_number()
        return f"Уведомления по делу {case_number} для {self.judge.get_full_name()}: {self.total_unread}"
    
    def _get_case_number(self):
        """Получение номера дела для отображения"""
        case = self.case
        if not case:
            return "Неизвестно"
        
        # Определяем тип дела и номер
        case_number = None
        if hasattr(case, 'case_number_admin'):
            case_number = case.case_number_admin
        elif hasattr(case, 'case_number_criminal'):
            case_number = case.case_number_criminal
        elif hasattr(case, 'case_number_civil'):
            case_number = case.case_number_civil
        elif hasattr(case, 'case_number_kas'):
            case_number = case.case_number_kas

        return case_number or f"Дело #{case.id}"

    def update_summary(self):
        """Обновить сводку из активностей"""
        from django.contrib.contenttypes.models import ContentType

        # Получаем все непрочитанные активности по этому делу для этого судьи
        # Примечание: нужно знать, какие активности относятся к судье
        # Пока просто считаем все непрочитанные по делу

        unread_activities = CaseActivity.objects.filter(
            case_content_type=self.case_content_type,
            case_object_id=self.case_object_id,
            is_read_by_judge=False
        )

        self.unread_party_documents = unread_activities.filter(
            activity_type='new_party_document'
        ).count()

        self.unread_petitions = unread_activities.filter(
            activity_type='new_petition'
        ).count()

        self.unread_correspondence = unread_activities.filter(
            activity_type='new_correspondence'
        ).count()

        self.total_unread = unread_activities.count()
        self.save()

        return self.total_unread
