from django.db import models
from django.conf import settings


class JudgeNote(models.Model):
    """
    Заметки судьи по делу.
    Универсальная модель для всех типов дел.
    """
    
    CASE_TYPE_CHOICES = [
        ('criminal', 'Уголовное дело'),
        ('civil', 'Гражданское дело'),
        ('kas', 'Административное дело (КАС)'),
        ('coap', 'Дело об административном правонарушении'),
    ]

    NOTE_TYPE_CHOICES = [
        ('general', 'Общая заметка'),
        ('reminder', 'Напоминание'),
        ('strategy', 'Стратегия рассмотрения'),
        ('link', 'Ссылка на практику/статью'),
    ]

    # Поля для связи с разными типами дел
    case_type = models.CharField(
        max_length=20,
        choices=CASE_TYPE_CHOICES,
        default='criminal',
        verbose_name='Тип дела'
    )
    case_id = models.PositiveIntegerField(
        verbose_name='ID дела'
    )

    # Связь с уголовным делом
    criminal_proceedings = models.ForeignKey(
        'criminal_proceedings.CriminalProceedings',
        on_delete=models.CASCADE,
        related_name='judge_notes',
        verbose_name='Уголовное дело',
        null=True,
        blank=True
    )
    

    note_type = models.CharField(
        max_length=20,
        choices=NOTE_TYPE_CHOICES,
        default='general',
        verbose_name='Тип заметки'
    )

    title = models.CharField(
        max_length=255,
        verbose_name='Заголовок'
    )

    content = models.TextField(
        verbose_name='Содержание заметки'
    )

    # Ссылки на внешние ресурсы (обзоры практики, ПП ВС РФ)
    external_links = models.TextField(
        blank=True,
        verbose_name='Ссылки (по одной на строку)',
        help_text='Добавьте ссылки на Пленумы ВС РФ, обзоры практики'
    )

    # Важность (для подсветки)
    importance = models.PositiveSmallIntegerField(
        default=1,
        choices=[(1, 'Низкая'), (2, 'Средняя'), (3, 'Высокая')],
        verbose_name='Важность'
    )

    # Автор и дата
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='judge_notes',
        verbose_name='Кто создал'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    # Флаг "выполнено" (для напоминаний)
    is_completed = models.BooleanField(default=False, verbose_name='Выполнено')

    class Meta:
        verbose_name = 'Заметка судьи'
        verbose_name_plural = 'Заметки судьи'
        ordering = ['-importance', '-created_at']
        indexes = [
            models.Index(fields=['case_type', 'case_id']),
        ]

    def __str__(self):
        return f'{self.get_note_type_display()}: {self.title}'


class CaseAdviceCache(models.Model):
    """
    Кэш результатов анализа дела (для ускорения работы).
    Обновляется при изменении данных по делу или по требованию.
    """
    
    CASE_TYPE_CHOICES = [
        ('criminal', 'Уголовное дело'),
        ('civil', 'Гражданское дело'),
        ('kas', 'Административное дело (КАС)'),
        ('administrative', 'Дело об административном правонарушении'),
    ]

    case_type = models.CharField(
        max_length=20,
        choices=CASE_TYPE_CHOICES,
        default='criminal',
        verbose_name='Тип дела'
    )
    case_id = models.PositiveIntegerField(
        verbose_name='ID дела'
    )
    criminal_proceedings = models.OneToOneField(
        'criminal_proceedings.CriminalProceedings',
        on_delete=models.CASCADE,
        related_name='advice_cache',
        verbose_name='Уголовное дело'
    )

    # Текущий этап по УПК (код)
    current_stage = models.CharField(max_length=50, verbose_name='Текущий этап', db_index=True)

    # Данные для быстрого доступа (JSON)
    stage_data = models.JSONField(default=dict, verbose_name='Данные этапа')
    violations = models.JSONField(default=list, verbose_name='Нарушения сроков')
    recommendations = models.JSONField(default=list, verbose_name='Рекомендации')
    useful_links = models.JSONField(default=list, verbose_name='Полезные ссылки')

    # Статистика
    total_days_in_progress = models.PositiveIntegerField(
        default=0, verbose_name='Всего дней в производстве'
    )
    is_deadline_violated = models.BooleanField(
        default=False, verbose_name='Есть нарушения сроков'
    )
    pending_petitions_count = models.PositiveIntegerField(
        default=0, verbose_name='Нерассмотренных ходатайств'
    )

    # Даты обновления
    last_updated = models.DateTimeField(auto_now=True, verbose_name='Последнее обновление')
    data_version = models.PositiveIntegerField(default=1, verbose_name='Версия данных')

    class Meta:
        verbose_name = 'Кэш советов по делу'
        verbose_name_plural = 'Кэши советов по делам'
        unique_together = ['case_type', 'case_id']

    def __str__(self):
        return f'Советы по делу {self.criminal_proceedings.case_number_criminal}'


class SupremeCourtDocumentRef(models.Model):
    """
    Справочник документов ВС РФ (Пленумы, Обзоры) для автоматических подсказок.
    Заполняется через админку.
    """
    DOCUMENT_TYPE_CHOICES = [
        ('plenum', 'Постановление Пленума ВС РФ'),
        ('review', 'Обзор судебной практики ВС РФ'),
        ('presidium', 'Постановление Президиума ВС РФ'),
        ('definition', 'Определение ВС РФ'),
    ]

    STAGE_CHOICES = [
        ('appointment', 'Назначение дела к слушанию'),
        ('preliminary_hearing', 'Предварительное слушание'),
        ('trial_general', 'Общий порядок'),
        ('trial_special', 'Особый порядок (Глава 40)'),
        ('trial_agreement', 'Особый порядок (Глава 40.1)'),
        ('trial_jury', 'Суд с участием присяжных'),
        ('minor', 'Несовершеннолетний (Глава 50)'),
        ('medical', 'Принудительные меры (Глава 51)'),
        ('termination', 'Прекращение дела (Глава 51.1)'),
        ('verdict', 'Постановление приговора (Глава 39)'),
        ('appeal', 'Апелляция (Глава 45.1)'),
        ('cassation', 'Кассация (Глава 47.1)'),
        ('execution', 'Исполнение приговора (Глава 46)'),
        ('archive', 'Архив'),
    ]

    title = models.CharField(
        max_length=500, verbose_name='Название документа'
    )
    document_type = models.CharField(
        max_length=20, choices=DOCUMENT_TYPE_CHOICES, verbose_name='Тип документа'
    )
    number = models.CharField(
        max_length=100, blank=True, verbose_name='Номер документа'
    )
    date = models.DateField(
        blank=True, null=True, verbose_name='Дата документа'
    )
    url = models.URLField(verbose_name='Ссылка на документ', blank=True)
    applicable_stages = models.CharField(
        max_length=200,
        choices=STAGE_CHOICES,
        verbose_name='Применим для этапа',
        help_text='На каком этапе рекомендуется этот документ'
    )
    keywords = models.CharField(
        max_length=500, blank=True, verbose_name='Ключевые слова (через запятую)'
    )
    description = models.TextField(blank=True, verbose_name='Краткое описание')
    is_active = models.BooleanField(default=True, verbose_name='Активен')

    class Meta:
        verbose_name = 'Документ ВС РФ (Пленум/Обзор)'
        verbose_name_plural = 'Документы ВС РФ (Пленумы/Обзоры)'
        ordering = ['applicable_stages', 'document_type', '-date']

    def __str__(self):
        return f'{self.get_document_type_display()}: {self.title}'
