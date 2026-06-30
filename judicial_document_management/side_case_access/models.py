from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.conf import settings

class ExternalUser(models.Model):
    """
    Внешний пользователь (участник процесса), вошедший через соцсети.
    """
    social_id = models.CharField(max_length=255, unique=True, verbose_name="ID в соцсети")
    social_provider = models.CharField(max_length=50, verbose_name="Провайдер (yandex/vk)")
    email = models.EmailField(verbose_name="Email", null=True, blank=True)
    full_name = models.CharField(max_length=255, verbose_name="ФИО")
    first_name = models.CharField(max_length=100, verbose_name="Имя", blank=True)
    last_name = models.CharField(max_length=100, verbose_name="Фамилия", blank=True)
    birth_date = models.DateField(verbose_name="Дата рождения", null=True, blank=True)
    phone = models.CharField(max_length=50, verbose_name="Телефон", blank=True)
    
    # Данные для сверки при привязке
    passport_series = models.CharField(max_length=10, verbose_name="Серия паспорта", blank=True)
    passport_number = models.CharField(max_length=10, verbose_name="Номер паспорта", blank=True)
    auth_token = models.CharField(max_length=255, unique=True, null=True, blank=True, verbose_name="Токен аутентификации")
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Внешний пользователь"
        verbose_name_plural = "Внешние пользователи"
        indexes = [
            models.Index(fields=['social_id', 'social_provider']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.full_name} ({self.social_provider})"
    
    def generate_auth_token(self):
        """Генерирует уникальный токен для пользователя"""
        import hashlib
        import time
        token_string = f"{self.social_id}:{self.social_provider}:{time.time()}"
        self.auth_token = hashlib.md5(token_string.encode()).hexdigest()
        self.save(update_fields=['auth_token'])
        return self.auth_token

    @property
    def is_authenticated(self):
        """Необходимо для совместимости с DRF"""
        return True
    
    @property
    def is_anonymous(self):
        return False


class CaseAccessGrant(models.Model):
    """
    Предоставление доступа внешнему пользователю к конкретному делу.
    Дело может быть любого типа (уголовное, гражданское, КАС, КоАП).
    """
    ACCESS_LEVEL_CHOICES = [
        ('view', 'Только просмотр'),
        ('petition', 'Подача ходатайств'),
        ('document', 'Досылка документов'),
        ('full', 'Полный доступ (все действия)'),
    ]
    
    external_user = models.ForeignKey(
        ExternalUser,
        on_delete=models.CASCADE,
        related_name='access_grants',
        verbose_name="Внешний пользователь"
    )
    
    # GenericForeignKey для связи с любым типом дела
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'app_label__in': [
                'criminal_proceedings', 'civil_proceedings',
                'administrative_proceedings', 'administrative_code'
            ],
            'model__in': [
                'criminalproceedings', 'civilproceedings',
                'kasproceedings', 'administrativeproceedings'
            ]
        },
        verbose_name="Тип дела"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('content_type', 'object_id')
    
    # Какой тип стороны в деле (для информации)
    side_type = models.CharField(max_length=100, verbose_name="Тип стороны", blank=True)
    side_name = models.CharField(max_length=255, verbose_name="Название стороны", blank=True)

    
    access_level = models.CharField(
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='full',
        verbose_name="Уровень доступа"
    )
    
    # Привязка через модель стороны (чтобы при удалении стороны удалить доступ)
    side_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='+',
        verbose_name="Тип стороны"
    )
    side_object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="ID стороны")
    side = GenericForeignKey('side_content_type', 'side_object_id')
    
    granted_by = models.CharField(max_length=255, verbose_name="Кем предоставлен доступ", blank=True)
    granted_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, verbose_name="Доступ активен")
    
    # Для ручной синхронизации
    last_synced_at = models.DateTimeField(null=True, blank=True, verbose_name="Последняя синхронизация")
    
    class Meta:
        verbose_name = "Доступ к делу"
        verbose_name_plural = "Доступы к делам"
        unique_together = ['external_user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['external_user', 'is_active']),
            models.Index(fields=['side_content_type', 'side_object_id']),
        ]
    
    def __str__(self):
        return f"{self.external_user} → {self.case}"
    
    def get_case_display(self):
        """Возвращает информацию о деле для отображения"""
        if not self.case:
            return "Дело удалено"
        
        # Определяем тип дела и номер
        case_type = self.content_type.model
        case_number = None
        
        if case_type == 'criminalproceedings' and hasattr(self.case, 'case_number_criminal'):
            case_number = self.case.case_number_criminal
        elif case_type == 'civilproceedings' and hasattr(self.case, 'case_number_civil'):
            case_number = self.case.case_number_civil
        elif case_type == 'kasproceedings' and hasattr(self.case, 'case_number_kas'):
            case_number = self.case.case_number_kas
        elif case_type == 'administrativeproceedings' and hasattr(self.case, 'case_number_admin'):
            case_number = self.case.case_number_admin
        
        return {
            'id': self.case.id,
            'type': case_type,
            'type_display': self.get_case_type_display(),
            'number': case_number,
            'status': getattr(self.case, 'status', 'unknown'),
        }
    
    def get_case_type_display(self):
        types = {
            'criminalproceedings': 'Уголовное дело',
            'civilproceedings': 'Гражданское дело',
            'kasproceedings': 'Административное дело (КАС)',
            'administrativeproceedings': 'Дело об АП (КоАП)',
        }
        return types.get(self.content_type.model, str(self.content_type))


class SyncLog(models.Model):
    """Лог синхронизации доступа"""
    external_user = models.ForeignKey(ExternalUser, on_delete=models.CASCADE, related_name='sync_logs')
    synced_at = models.DateTimeField(auto_now_add=True)
    cases_found = models.PositiveIntegerField(default=0)
    cases_added = models.PositiveIntegerField(default=0)
    cases_removed = models.PositiveIntegerField(default=0)
    triggered_by = models.CharField(max_length=50, choices=[('user', 'Пользователь'), ('admin', 'Администратор')])
    notes = models.TextField(blank=True)


class SideCaseLink(models.Model):
    """
    Вспомогательная модель для хранения связи между стороной и делом.
    Используется для быстрой синхронизации.
    """
    side_type = models.CharField(max_length=100)  # 'criminal_defendant', 'civil_side', etc.
    side_id = models.PositiveIntegerField()
    case_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    case_object_id = models.PositiveIntegerField()
    case = GenericForeignKey('case_content_type', 'case_object_id')
    side_info = models.JSONField(default=dict, verbose_name="Информация о стороне")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['side_type', 'side_id']),
            models.Index(fields=['case_content_type', 'case_object_id']),
        ]
