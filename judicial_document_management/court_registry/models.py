"""
Модели приложения court_registry.
Реестр судов и межсудебное взаимодействие.
"""
import uuid
from django.db import models, transaction
from django.db.models import Q
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import logging

from users.models import User

logger = logging.getLogger(__name__)


# =============================================================================
# Справочники
# =============================================================================

class Region(models.Model):
    """Справочник субъектов РФ"""
    code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Код региона"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Наименование региона"
    )
    name_short = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Краткое наименование"
    )
    okato_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Код ОКАТО"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )

    class Meta:
        verbose_name = "Регион"
        verbose_name_plural = "Регионы"
        ordering = ['name']

    def __str__(self):
        return self.name


class CourtLevel(models.Model):
    """Уровни судов"""
    LEVEL_CHOICES = [
        ('magistrate', 'Мировой суд'),
        ('city_district', 'Районный/городской суд'),
        ('subject_level', 'Суд уровня субъекта РФ'),
        ('appeal', 'Апелляционный суд'),
        ('cassation', 'Кассационный суд'),
        ('supreme', 'Верховный Суд РФ'),
    ]

    code = models.CharField(
        max_length=20,
        unique=True,
        choices=LEVEL_CHOICES,
        verbose_name="Код уровня"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Наименование уровня"
    )
    hierarchy_level = models.PositiveIntegerField(
        default=0,
        verbose_name="Уровень иерархии (0-низший, 5-высший)"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание"
    )

    class Meta:
        verbose_name = "Уровень суда"
        verbose_name_plural = "Уровни судов"
        ordering = ['hierarchy_level']

    def __str__(self):
        return self.name


# =============================================================================
# Основные модели суда
# =============================================================================

class Court(models.Model):
    """
    ТЕКУЩИЙ СУД — модель для хранения данных о суде, в котором запущено приложение.
    В системе может существовать только один экземпляр этой модели (синглтон).
    """
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name="UUID"
    )
    name = models.CharField(
        max_length=500,
        verbose_name="Полное наименование суда"
    )
    name_short = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Краткое наименование"
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Код суда"
    )
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        related_name='courts',
        verbose_name="Регион"
    )
    level = models.ForeignKey(
        CourtLevel,
        on_delete=models.PROTECT,
        related_name='courts',
        verbose_name="Уровень суда"
    )
    address = models.TextField(
        verbose_name="Почтовый адрес"
    )
    address_juridical = models.TextField(
        blank=True,
        null=True,
        verbose_name="Юридический адрес"
    )
    postal_code = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name="Почтовый индекс"
    )

    # Контактные данные (основные)
    email_main = models.EmailField(
        verbose_name="Основная электронная почта"
    )
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name="Сайт суда"
    )

    # Руководство
    chairman = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chaired_court',
        limit_choices_to={'role': 'judge'},
        verbose_name="Председатель суда"
    )
    vice_chairmen = models.ManyToManyField(
        User,
        blank=True,
        related_name='vice_chaired_courts',
        limit_choices_to={'role': 'judge'},
        verbose_name="Заместители председателя"
    )

    # Статус и метаданные
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )
    is_registered_in_network = models.BooleanField(
        default=False,
        verbose_name="Зарегистрирован в сети судов"
    )
    network_registration_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата регистрации в сети"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_courts',
        verbose_name="Создал"
    )

    class Meta:
        verbose_name = "Текущий суд"
        verbose_name_plural = "Текущий суд"
        ordering = ['region', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['region', 'level']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        if self.level and self.level.code == 'supreme':
            if self.region:
                raise ValidationError(
                    "Верховный Суд РФ не привязан к региону"
                )

    def save(self, *args, **kwargs):
        # Обеспечиваем синглтон — не даём создать более одной записи
        if not self.pk and Court.objects.exists():
            raise ValidationError("Может существовать только один текущий суд. Используйте редактирование существующего.")
        super().save(*args, **kwargs)

    @property
    def full_address(self):
        parts = []
        if self.postal_code:
            parts.append(self.postal_code)
        if self.region:
            parts.append(self.region.name)
        parts.append(self.address)
        return ', '.join(parts)

    @property
    def phones_list(self):
        return list(self.phones.filter(is_active=True).values_list('phone', flat=True))

    @property
    def emails_list(self):
        emails = [self.email_main] if self.email_main else []
        emails.extend(
            self.emails.filter(is_active=True).values_list('email', flat=True)
        )
        return emails

    @property
    def employees_count(self):
        return CourtEmployee.objects.filter(
            department__court=self,
            is_active=True
        ).count()

    @property
    def judges_count(self):
        return CourtEmployee.objects.filter(
            department__court=self,
            is_active=True,
            employee__role='judge'
        ).count()

    def get_appeal_court(self):
        """Получить апелляционный суд для данного суда из справочника"""
        if self.level.code in ['magistrate', 'city_district']:
            return CourtDirectory.objects.filter(
                region=self.region,
                level__code='subject_level',
                is_active=True
            ).first()
        return None

    def get_cassation_court(self):
        """Получить кассационный суд для данного суда из справочника"""
        if self.level.code in ['magistrate', 'city_district', 'subject_level']:
            return CourtDirectory.objects.filter(
                level__code='cassation',
                is_active=True
            ).first()
        return None


# =============================================================================
# Справочник судов РФ
# =============================================================================

class CourtDirectory(models.Model):
    """
    Справочник всех судов РФ.
    """
    DATA_SOURCE_CHOICES = [
        ('csv', 'CSV загрузка'),
        ('network', 'Сеть судов'),
        ('manual', 'Ручной ввод'),
    ]

    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name="UUID"
    )
    name = models.CharField(
        max_length=500,
        verbose_name="Полное наименование суда"
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Код суда"
    )
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        related_name='directory_courts',
        verbose_name="Регион"
    )
    level = models.ForeignKey(
        CourtLevel,
        on_delete=models.PROTECT,
        related_name='directory_courts',
        verbose_name="Уровень суда"
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Почтовый адрес"
    )
    postal_code = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name="Почтовый индекс"
    )

    # Контактные данные (основные)
    email_main = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Основная электронная почта"
    )
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name="Сайт суда"
    )

    # Дополнительные контакты (будут заполняться при обмене)
    phones = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Телефоны"
    )
    emails = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Email адреса"
    )
    # Данные о руководстве (будут заполняться при обмене)
    chairman_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Председатель"
    )
    vice_chairmen_names = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Заместители председателя"
    )

    # Статус
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )

    # Источник данных и синхронизация
    data_source = models.CharField(
        max_length=20,
        choices=DATA_SOURCE_CHOICES,
        default='csv',
        verbose_name="Источник данных"
    )
    external_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Внешний ID"
    )
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата последней синхронизации"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    api_base_url = models.URLField(
        blank=True,
        null=True,
        verbose_name="Базовый URL API суда"
    )
    api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="API ключ для аутентификации"
    )
    api_key_public = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Публичный ключ (для проверки)"
    )
    last_health_check = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Последняя проверка доступности"
    )
    is_online = models.BooleanField(
        default=False,
        verbose_name="Суд онлайн"
    )
    api_version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name="Версия API"
    )

    class Meta:
        verbose_name = "Справочник судов РФ"
        verbose_name_plural = "Справочник судов РФ"
        ordering = ['region', 'level', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['region', 'level']),
            models.Index(fields=['is_active']),
            models.Index(fields=['data_source']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def full_address(self):
        parts = []
        if self.postal_code:
            parts.append(self.postal_code)
        if self.region:
            parts.append(self.region.name)
        if self.address:
            parts.append(self.address)
        return ', '.join(parts) if parts else "—"


class CourtPhone(models.Model):
    """Телефоны текущего суда"""
    court = models.ForeignKey(
        Court,
        on_delete=models.CASCADE,
        related_name='phones',
        verbose_name="Суд"
    )
    phone = models.CharField(
        max_length=50,
        verbose_name="Номер телефона"
    )
    phone_type = models.CharField(
        max_length=50,
        choices=[
            ('main', 'Основной'),
            ('fax', 'Факс'),
            ('department', 'Отдел'),
            ('vks', 'ВКС'),
            ('other', 'Другой'),
        ],
        default='main',
        verbose_name="Тип телефона"
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )

    class Meta:
        verbose_name = "Телефон суда"
        verbose_name_plural = "Телефоны суда"
        unique_together = ['court', 'phone', 'phone_type']

    def __str__(self):
        return f"{self.phone} ({self.get_phone_type_display()})"


class CourtEmail(models.Model):
    """Дополнительные email текущего суда"""
    court = models.ForeignKey(
        Court,
        on_delete=models.CASCADE,
        related_name='emails',
        verbose_name="Суд"
    )
    email = models.EmailField(
        verbose_name="Электронная почта"
    )
    email_type = models.CharField(
        max_length=50,
        choices=[
            ('general', 'Общий'),
            ('department', 'Отдел'),
            ('vks', 'ВКС'),
            ('reception', 'Приемная'),
            ('other', 'Другой'),
        ],
        default='general',
        verbose_name="Тип email"
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )

    class Meta:
        verbose_name = "Email суда"
        verbose_name_plural = "Email суда"
        unique_together = ['court', 'email']

    def __str__(self):
        return f"{self.email} ({self.get_email_type_display()})"


class CourtWorkingHours(models.Model):
    """Режим работы текущего суда"""
    court = models.ForeignKey(
        Court,
        on_delete=models.CASCADE,
        related_name='working_hours',
        verbose_name="Суд"
    )
    day_of_week = models.CharField(
        max_length=20,
        choices=[
            ('monday', 'Понедельник'),
            ('tuesday', 'Вторник'),
            ('wednesday', 'Среда'),
            ('thursday', 'Четверг'),
            ('friday', 'Пятница'),
            ('saturday', 'Суббота'),
            ('sunday', 'Воскресенье'),
        ],
        verbose_name="День недели"
    )
    work_start = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Начало работы"
    )
    work_end = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Конец работы"
    )
    break_start = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Начало перерыва"
    )
    break_end = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Конец перерыва"
    )
    is_working_day = models.BooleanField(
        default=True,
        verbose_name="Рабочий день"
    )
    reception_start = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Начало приема"
    )
    reception_end = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Конец приема"
    )

    class Meta:
        verbose_name = "Режим работы"
        verbose_name_plural = "Режим работы"
        unique_together = ['court', 'day_of_week']
        ordering = ['court', 'day_of_week']

    def __str__(self):
        if self.is_working_day and self.work_start and self.work_end:
            return f"{self.get_day_of_week_display()}: {self.work_start} - {self.work_end}"
        return f"{self.get_day_of_week_display()}: выходной"


# =============================================================================
# Отделы суда (упрощенные)
# =============================================================================

class CourtDepartment(models.Model):
    """Отделы суда"""
    court = models.ForeignKey(
        'Court',
        on_delete=models.CASCADE,
        related_name='departments',
        verbose_name="Суд",
        null=True,
        blank=True
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Наименование отдела"
    )
    phone_internal = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Внутренний телефон"
    )
    room = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Кабинет/помещение"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name="Порядок сортировки"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Отдел суда"
        verbose_name_plural = "Отделы суда"
        ordering = [ 'sort_order', 'name']
        unique_together = [ 'name']

    def __str__(self):
        return f"{self.name} — {self.name}"

    @property
    def employees_count(self):
        return self.employees.filter(is_active=True).count()


class CourtEmployee(models.Model):
    """
    Сотрудник текущего суда в составе отдела.
    Связывает User с отделом суда, добавляет должность и т.д.
    """
    department = models.ForeignKey(
        CourtDepartment,
        on_delete=models.CASCADE,
        related_name='employees',
        verbose_name="Отдел"
    )
    employee = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='court_employments',
        verbose_name="Пользователь"
    )
    position = models.CharField(
        max_length=255,
        verbose_name="Должность"
    )
    is_head_of_department = models.BooleanField(
        default=False,
        verbose_name="Руководитель отдела"
    )
    phone_internal = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Внутренний телефон"
    )
    phone_mobile = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Мобильный телефон"
    )
    room = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Кабинет"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )
    date_started = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата начала работы"
    )
    date_ended = models.DateField(
        null=True,
        blank=True,
        verbose_name="Дата окончания работы"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_employments',
        verbose_name="Создал"
    )

    class Meta:
        verbose_name = "Сотрудник суда"
        verbose_name_plural = "Сотрудники суда"
        ordering = ['department', 'position', 'employee__last_name']
        unique_together = ['department', 'employee']
        indexes = [
            models.Index(fields=['department', 'is_active']),
            models.Index(fields=['employee', 'is_active']),
        ]

    def __str__(self):
        return f"{self.employee.get_full_name()} — {self.position} ({self.department.name})"

    @property
    def court(self):
        return self.department.court


# =============================================================================
# Межсудебное взаимодействие — Передача дел
# =============================================================================

class CaseTransferType(models.Model):
    """Типы передачи дел"""
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Код"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Наименование"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    external_uuid = models.UUIDField(
        null=True,
        blank=True,
        verbose_name="Внешний UUID (на стороне получателя)"
    )

    class Meta:
        verbose_name = "Тип передачи дела"
        verbose_name_plural = "Типы передачи дел"
        ordering = ['name']

    def __str__(self):
        return self.name


class CaseTransferStatus(models.Model):
    """Статусы передачи дела"""
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Код"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Наименование"
    )
    is_terminal = models.BooleanField(
        default=False,
        verbose_name="Заключительный статус"
    )

    class Meta:
        verbose_name = "Статус передачи дела"
        verbose_name_plural = "Статусы передачи дел"
        ordering = ['name']

    def __str__(self):
        return self.name


class CaseTransfer(models.Model):
    """
    Передача дела между судами.
    Основная модель для межсудебного обмена карточками дел.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name="UUID передачи"
    )
    
    # Отправитель (всегда текущий суд)
    source_court = models.ForeignKey(
        Court,
        on_delete=models.PROTECT,
        related_name='outgoing_transfers',
        verbose_name="Суд-отправитель"
    )
    source_department = models.ForeignKey(
        CourtDepartment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='outgoing_transfers',
        verbose_name="Отдел-отправитель"
    )
    source_employee = models.ForeignKey(
        CourtEmployee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_transfers',
        verbose_name="Сотрудник-отправитель"
    )

    # Получатель (из справочника судов)
    destination_court = models.ForeignKey(
        CourtDirectory,
        on_delete=models.PROTECT,
        related_name='incoming_transfers',
        verbose_name="Суд-получатель"
    )
    destination_department = models.ForeignKey(
        CourtDepartment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incoming_transfers',
        verbose_name="Отдел-получатель"
    )

    # Тип и статус
    transfer_type = models.ForeignKey(
        CaseTransferType,
        on_delete=models.PROTECT,
        related_name='transfers',
        verbose_name="Тип передачи"
    )
    status = models.ForeignKey(
        CaseTransferStatus,
        on_delete=models.PROTECT,
        related_name='transfers',
        verbose_name="Статус"
    )

    # Даты
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата отправки"
    )
    received_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата получения"
    )
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата принятия"
    )
    returned_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата возврата"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата завершения"
    )

    # Основание передачи
    basis = models.TextField(
        verbose_name="Основание передачи"
    )
    basis_document = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Документ-основание (номер, дата)"
    )
    basis_judge = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfer_basis',
        limit_choices_to={'role': 'judge'},
        verbose_name="Судья, вынесший решение"
    )

    # Примечания
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Примечания"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Причина возврата/отклонения"
    )

    # Для групповой передачи
    is_batch = models.BooleanField(
        default=False,
        verbose_name="Групповая передача"
    )
    batch_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name="ID группы"
    )

    class Meta:
        verbose_name = "Передача дела"
        verbose_name_plural = "Передачи дел"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source_court', 'status']),
            models.Index(fields=['destination_court', 'status']),
            models.Index(fields=['transfer_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['batch_id']),
        ]

    def __str__(self):
        return f"Передача {self.uuid} ({self.get_transfer_type_name()})"

    def get_transfer_type_name(self):
        return self.transfer_type.name if self.transfer_type else "—"

    def get_status_name(self):
        return self.status.name if self.status else "—"


class CaseTransferItem(models.Model):
    """
    Элемент передачи — конкретное дело в рамках передачи.
    Содержит ссылку на карточку дела через GenericForeignKey.
    """
    transfer = models.ForeignKey(
        CaseTransfer,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Передача"
    )
    
    # Generic relation к делу (уголовное, гражданское, КоАП, КАС)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.PROTECT,
        verbose_name="Тип дела",
        null=True,
        blank=True 
    )
    object_id = models.PositiveIntegerField(
        verbose_name="ID дела",
        null=True,
        blank=True 
    )
    case = GenericForeignKey("content_type", "object_id")

    # Информация о деле для отображения
    case_number = models.CharField(
        max_length=100,
        verbose_name="Номер дела"
    )
    case_category = models.CharField(
        max_length=50,
        choices=[
            ('criminal', 'Уголовное'),
            ('civil', 'Гражданское'),
            ('admin_code', 'КоАП'),
            ('kas', 'КАС РФ'),
        ],
        verbose_name="Категория дела"
    )
    case_description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Краткое описание дела"
    )

    # Статус элемента
    is_accepted = models.BooleanField(
        default=False,
        verbose_name="Принято"
    )
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата принятия"
    )
    new_case_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Новый номер дела (у получателя)"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Причина отклонения"
    )

    # Для возврата из апелляции/кассации
    is_returned = models.BooleanField(
        default=False,
        verbose_name="Возвращено"
    )
    returned_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата возврата"
    )
    return_result = models.TextField(
        blank=True,
        null=True,
        verbose_name="Результат рассмотрения"
    )
    return_decision_document = models.FileField(
        upload_to='case_transfers/decisions/',
        null=True,
        blank=True,
        verbose_name="Документ решения (постановление/определение)"
    )
    appeal_court_case_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Номер дела в апелляционной/кассационной инстанции"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Дело в передаче"
        verbose_name_plural = "Дела в передаче"
        ordering = ['case_category', 'case_number']
        unique_together = ['transfer', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['case_category']),
        ]

    def __str__(self):
        return f"{self.get_case_category_display()} дело №{self.case_number}"

    @property
    def case_type_display(self):
        return dict(self.CASE_CATEGORY_CHOICES).get(self.case_category, self.case_category)


class CaseTransferDocument(models.Model):
    """Документы, прикрепленные к передаче дела"""
    transfer_item = models.ForeignKey(
        CaseTransferItem,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name="Элемент передачи"
    )
    file = models.FileField(
        upload_to='case_transfers/documents/%Y/%m/',
        verbose_name="Файл"
    )
    original_filename = models.CharField(
        max_length=255,
        verbose_name="Оригинальное имя файла"
    )
    file_type = models.CharField(
        max_length=50,
        choices=[
            ('decision', 'Решение/постановление'),
            ('appeal', 'Апелляционная/кассационная жалоба'),
            ('protocol', 'Протокол'),
            ('evidence', 'Вещественное доказательство (опись)'),
            ('other', 'Иной документ'),
        ],
        verbose_name="Тип документа"
    )
    description = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата загрузки"
    )

    class Meta:
        verbose_name = "Документ передачи"
        verbose_name_plural = "Документы передачи"
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_filename}"


class CaseTransferSide(models.Model):
    """Стороны по делу при передаче (копия данных для получателя)"""
    transfer_item = models.ForeignKey(
        CaseTransferItem,
        on_delete=models.CASCADE,
        related_name='sides',
        verbose_name="Элемент передачи"
    )
    role = models.CharField(
        max_length=100,
        verbose_name="Процессуальное положение"
    )
    name = models.CharField(
        max_length=255,
        verbose_name="ФИО/Наименование"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('individual', 'Физическое лицо'),
            ('legal', 'Юридическое лицо'),
            ('government', 'Орган власти'),
        ],
        verbose_name="Статус"
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Адрес"
    )
    phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Телефон"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email"
    )
    inn = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="ИНН"
    )
    additional_info = models.TextField(
        blank=True,
        null=True,
        verbose_name="Доп. информация"
    )

    class Meta:
        verbose_name = "Сторона дела (передача)"
        verbose_name_plural = "Стороны дела (передача)"
        ordering = ['role', 'name']

    def __str__(self):
        return f"{self.role}: {self.name}"


# =============================================================================
# Уведомления о поступлении дел
# =============================================================================

class IncomingCaseNotification(models.Model):
    """
    Уведомление о поступлении дел в суд.
    Формируется автоматически при отправке дел другим судом.
    """
    STATUS_CHOICES = [
        ('pending', 'Ожидает рассмотрения'),
        ('accepted', 'Принято'),
        ('rejected', 'Отклонено'),
        ('partial', 'Принято частично'),
    ]

    court = models.ForeignKey(
        Court,
        on_delete=models.PROTECT,
        related_name='incoming_notifications',
        verbose_name="Суд-получатель"
    )
    transfer = models.ForeignKey(
        CaseTransfer,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="Передача"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Статус"
    )
    
    # Сводная информация
    criminal_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Уголовных дел"
    )
    civil_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Гражданских дел"
    )
    admin_code_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Дел об АП (КоАП)"
    )
    kas_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Дел КАС РФ"
    )
    total_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Всего дел"
    )

    # Обработано
    processed_by = models.ForeignKey(
        CourtEmployee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_notifications',
        verbose_name="Обработал"
    )
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата обработки"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Примечания"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Уведомление о поступлении дел"
        verbose_name_plural = "Уведомления о поступлении дел"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['court', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Поступило {self.total_count} дел от {self.transfer.source_court.name_short or self.transfer.source_court.code}"

    def update_counts(self):
        """Обновить счетчики на основе элементов передачи"""
        counts = self.transfer.items.aggregate(
            criminal=models.Count('id', filter=Q(case_category='criminal')),
            civil=models.Count('id', filter=Q(case_category='civil')),
            admin_code=models.Count('id', filter=Q(case_category='admin_code')),
            kas=models.Count('id', filter=Q(case_category='kas')),
            total=models.Count('id'),
        )
        self.criminal_count = counts['criminal'] or 0
        self.civil_count = counts['civil'] or 0
        self.admin_code_count = counts['admin_code'] or 0
        self.kas_count = counts['kas'] or 0
        self.total_count = counts['total'] or 0
        self.save(update_fields=[
            'criminal_count', 'civil_count', 'admin_code_count',
            'kas_count', 'total_count', 'updated_at'
        ])


# =============================================================================
# Дела, ожидающие передачи (мониторинг)
# =============================================================================

class PendingTransferCase(models.Model):
    """
    Дела, ожидающие передачи (апелляция, кассация, подсудность).
    Заполняется автоматически на основе данных карточек дел.
    """
    TRANSFER_REASON_CHOICES = [
        ('jurisdiction', 'Передача по подсудности'),
        ('appeal', 'Направление в апелляцию'),
        ('cassation', 'Направление в кассацию'),
        ('return_appeal', 'Возврат из апелляции'),
        ('return_cassation', 'Возврат из кассации'),
    ]

    STATUS_CHOICES = [
        ('detected', 'Обнаружено'),
        ('ready', 'Готово к отправке'),
        ('sent', 'Отправлено'),
        ('completed', 'Завершено'),
        ('cancelled', 'Отменено'),
    ]

    court = models.ForeignKey(
        Court,
        on_delete=models.PROTECT,
        related_name='pending_transfers',
        verbose_name="Суд"
    )
    
    # Ссылка на дело
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.PROTECT,
        verbose_name="Тип дела"
    )
    object_id = models.PositiveIntegerField(
        verbose_name="ID дела"
    )
    case = GenericForeignKey("content_type", "object_id")

    case_number = models.CharField(
        max_length=100,
        verbose_name="Номер дела"
    )
    case_category = models.CharField(
        max_length=50,
        choices=[
            ('criminal', 'Уголовное'),
            ('civil', 'Гражданское'),
            ('admin_code', 'КоАП'),
            ('kas', 'КАС РФ'),
        ],
        verbose_name="Категория дела"
    )
    transfer_reason = models.CharField(
        max_length=30,
        choices=TRANSFER_REASON_CHOICES,
        verbose_name="Причина передачи"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='detected',
        verbose_name="Статус"
    )

    # Дата, когда обнаружено основание для передачи
    detected_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата обнаружения"
    )
    # Дата, указанная в карточке (апелляции/кассации)
    relevant_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Соответствующая дата (жалобы и т.д.)"
    )

    # Куда направлять (из справочника судов)
    target_court = models.ForeignKey(
        CourtDirectory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='targeted_pending',
        verbose_name="Целевой суд"
    )

    # Связанная передача (когда отправлено)
    transfer = models.ForeignKey(
        CaseTransfer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pending_cases',
        verbose_name="Связанная передача"
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Примечания"
    )

    class Meta:
        verbose_name = "Дело, ожидающее передачи"
        verbose_name_plural = "Дела, ожидающие передачи"
        ordering = ['status', 'detected_at']
        unique_together = ['content_type', 'object_id', 'transfer_reason']
        indexes = [
            models.Index(fields=['court', 'status']),
            models.Index(fields=['transfer_reason']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.get_case_category_display()} №{self.case_number} — {self.get_transfer_reason_display()}"

    @property
    def is_overdue(self):
        """Проверка просрочки (апелляция — 15 дней, кассация — varies)"""
        if not self.relevant_date:
            return False
        from datetime import timedelta
        if self.transfer_reason == 'appeal':
            deadline = self.relevant_date + timedelta(days=15)
        elif self.transfer_reason == 'cassation':
            deadline = self.relevant_date + timedelta(days=45)
        else:
            return False
        return timezone.now().date() > deadline


# =============================================================================
# Запросы ВКС
# =============================================================================

class VCSRequest(models.Model):
    """
    Запрос на проведение ВКС между судами.
    """
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('sent', 'Отправлен'),
        ('confirmed', 'Подтвержден'),
        ('rejected', 'Отклонен'),
        ('completed', 'Проведен'),
        ('cancelled', 'Отменен'),
    ]

    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name="UUID"
    )

    # Инициатор (текущий суд)
    initiator_court = models.ForeignKey(
        Court,
        on_delete=models.PROTECT,
        related_name='initiated_vcs',
        verbose_name="Суд-инициатор"
    )
    initiator_department = models.ForeignKey(
        CourtDepartment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='initiated_vcs',
        verbose_name="Отдел-инициатор"
    )
    initiator_employee = models.ForeignKey(
        CourtEmployee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='initiated_vcs',
        verbose_name="Сотрудник-инициатор"
    )

    # Участники (из справочника судов)
    participant_courts = models.ManyToManyField(
        CourtDirectory,
        blank=True,
        related_name='vcs_participations',
        verbose_name="Участники-суды"
    )
    participant_departments = models.ManyToManyField(
        CourtDepartment,
        blank=True,
        related_name='vcs_participations',
        verbose_name="Участники-отделы"
    )

    # Детали ВКС
    title = models.CharField(
        max_length=500,
        verbose_name="Тема ВКС"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание/повестка"
    )
    scheduled_at = models.DateTimeField(
        verbose_name="Запланированное время"
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        default=60,
        verbose_name="Продолжительность (минут)"
    )

    # Связь с делом
    related_case_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Номер связанного дела"
    )
    related_case_type = models.CharField(
        max_length=50,
        choices=[
            ('criminal', 'Уголовное'),
            ('civil', 'Гражданское'),
            ('admin_code', 'КоАП'),
            ('kas', 'КАС РФ'),
        ],
        blank=True,
        null=True,
        verbose_name="Тип связанного дела"
    )

    # Технические детали
    external_system = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Внешняя система ВКС"
    )
    external_meeting_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ID встречи во внешней системе"
    )
    external_link = models.URLField(
        blank=True,
        null=True,
        verbose_name="Ссылка на ВКС"
    )

    # Статус
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name="Статус"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Причина отклонения"
    )

    # Связь с communication.VideoConference
    video_conference = models.ForeignKey(
        'communication.VideoConference',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vcs_requests',
        verbose_name="Видеоконференция в мессенджере"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Запрос ВКС"
        verbose_name_plural = "Запросы ВКС"
        ordering = ['-scheduled_at', '-created_at']
        indexes = [
            models.Index(fields=['initiator_court', 'status']),
            models.Index(fields=['scheduled_at']),
        ]

    def __str__(self):
        return f"ВКС: {self.title} ({self.scheduled_at})"


# =============================================================================
# Регистрация мессенджера в суде
# =============================================================================

class CourtMessengerRegistration(models.Model):
    """
    Регистрация мессенджера в суде.
    Фиксирует, что мессенджер этого суда подключен к сети.
    """
    court = models.OneToOneField(
        Court,
        on_delete=models.CASCADE,
        related_name='messenger_registration',
        verbose_name="Суд"
    )
    is_registered = models.BooleanField(
        default=False,
        verbose_name="Зарегистрирован"
    )
    registered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата регистрации"
    )
    last_ping = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Последний ping"
    )
    is_online = models.BooleanField(
        default=False,
        verbose_name="Онлайн"
    )

    # Данные для чатов
    court_name_in_messenger = models.CharField(
        max_length=255,
        verbose_name="Название в мессенджере"
    )
    court_code_in_messenger = models.CharField(
        max_length=50,
        verbose_name="Код в мессенджере"
    )
    default_department_for_chats = models.ForeignKey(
        CourtDepartment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='messenger_defaults',
        verbose_name="Отдел по умолчанию для чатов"
    )

    # Настройки чатов
    allow_intercourt_chats = models.BooleanField(
        default=True,
        verbose_name="Разрешить межсудебные чаты"
    )
    allow_interregional_chats = models.BooleanField(
        default=True,
        verbose_name="Разрешить межрегиональные чаты"
    )
    allow_higher_instance_chats = models.BooleanField(
        default=True,
        verbose_name="Разрешить чаты с вышестоящими инстанциями"
    )

    # Синхронизированные данные
    synced_departments_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Синхронизировано отделов"
    )
    synced_employees_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Синхронизировано сотрудников"
    )
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата последней синхронизации"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Регистрация мессенджера"
        verbose_name_plural = "Регистрации мессенджеров"

    def __str__(self):
        status = "онлайн" if self.is_online else "офлайн"
        return f"{self.court.name_short or self.court.code} ({status})"

    def update_sync_counts(self):
        """Обновить счетчики синхронизации"""
        self.synced_departments_count = self.court.departments.filter(
            is_active=True
        ).count()
        self.synced_employees_count = CourtEmployee.objects.filter(
            department__court=self.court,
            is_active=True
        ).count()
        self.last_sync_at = timezone.now()
        self.save(update_fields=[
            'synced_departments_count', 'synced_employees_count',
            'last_sync_at', 'updated_at'
        ])


# =============================================================================
# Журнал аудита межсудебного взаимодействия
# =============================================================================

class CourtInteractionAuditLog(models.Model):
    """Журнал аудита всех действий в межсудебном взаимодействии"""
    ACTION_TYPES = [
        ('transfer_created', 'Создана передача дела'),
        ('transfer_sent', 'Передача отправлена'),
        ('transfer_received', 'Передача получена'),
        ('transfer_accepted', 'Дела приняты'),
        ('transfer_rejected', 'Дела отклонены'),
        ('transfer_returned', 'Дело возвращено'),
        ('case_registered', 'Дело зарегистрировано по приему'),
        ('notification_created', 'Создано уведомление'),
        ('notification_processed', 'Уведомление обработано'),
        ('vcs_created', 'Создан запрос ВКС'),
        ('vcs_confirmed', 'ВКС подтверждена'),
        ('vcs_completed', 'ВКС проведена'),
        ('messenger_registered', 'Мессенджер зарегистрирован'),
        ('messenger_ping', 'Ping мессенджера'),
        ('court_created', 'Суд создан'),
        ('court_updated', 'Суд обновлен'),
        ('department_created', 'Отдел создан'),
        ('employee_added', 'Сотрудник добавлен'),
        ('employee_removed', 'Сотрудник удален'),
    ]

    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        verbose_name="UUID"
    )
    action = models.CharField(
        max_length=50,
        choices=ACTION_TYPES,
        verbose_name="Действие"
    )
    court = models.ForeignKey(
        Court,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name="Суд"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Пользователь"
    )
    employee = models.ForeignKey(
        CourtEmployee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Сотрудник суда"
    )
    object_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Тип объекта"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="ID объекта"
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Детали"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="IP-адрес"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    class Meta:
        verbose_name = "Запись аудита"
        verbose_name_plural = "Журнал аудита"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['court', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"{self.get_action_display()} — {self.court}"
