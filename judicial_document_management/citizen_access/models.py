
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class CitizenCaseAccess(models.Model):
    """
    Связь между гражданином и делом, к которому у него есть доступ
    """
    ACCESS_TYPES = (
        ('view', 'Только просмотр'),
        ('petition', 'Подача ходатайств'),
        ('documents', 'Досылка документов'),
        ('full', 'Полный доступ (просмотр + ходатайства + документы)'),
    )
    
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='case_accesses',
        verbose_name='Гражданин'
    )
    
    # GenericForeignKey для связи с разными типами дел
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'app_label__in': ['criminal_proceedings', 'civil_proceedings', 
                             'administrative_proceedings', 'administrative_code'],
            'model__in': ['criminalproceedings', 'civilproceedings', 
                         'administrativeproceedings', 'kasproceedings']
        },
        verbose_name='Тип дела'
    )
    object_id = models.PositiveIntegerField(verbose_name='ID дела')
    case = GenericForeignKey('content_type', 'object_id')
    
    access_type = models.CharField(
        max_length=20,
        choices=ACCESS_TYPES,
        default='view',
        verbose_name='Тип доступа'
    )
    
    # Роль в деле (истец, ответчик, потерпевший и т.д.)
    role_in_case = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Роль в деле'
    )
    
    granted_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата предоставления доступа')
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='granted_accesses',
        verbose_name='Кто предоставил доступ'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='Доступ активен')
    
    class Meta:
        verbose_name = 'Доступ гражданина к делу'
        verbose_name_plural = 'Доступы граждан к делам'
        unique_together = ['citizen', 'content_type', 'object_id']
    
    def __str__(self):
        return f'{self.citizen.get_full_name()} -> {self.case} ({self.get_access_type_display()})'


class CitizenPetition(models.Model):
    """
    Ходатайство, поданное гражданином через внешний портал
    """
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('submitted', 'Подано'),
        ('accepted', 'Принято к рассмотрению'),
        ('rejected', 'Отклонено'),
        ('resolved', 'Рассмотрено'),
    )
    
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='citizen_petitions',
        verbose_name='Гражданин'
    )
    
    case_access = models.ForeignKey(
        CitizenCaseAccess,
        on_delete=models.CASCADE,
        related_name='petitions',
        verbose_name='Доступ к делу'
    )
    
    title = models.CharField(max_length=500, verbose_name='Заголовок ходатайства')
    content = models.TextField(verbose_name='Текст ходатайства')
    
    # Прикрепленные файлы
    attachments = models.JSONField(default=list, blank=True, verbose_name='Прикрепленные файлы')
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='Статус'
    )
    
    # Ответ суда
    court_response = models.TextField(blank=True, verbose_name='Ответ суда')
    court_response_date = models.DateTimeField(null=True, blank=True, verbose_name='Дата ответа')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата подачи')
    
    class Meta:
        verbose_name = 'Ходатайство гражданина'
        verbose_name_plural = 'Ходатайства граждан'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} - {self.citizen.get_full_name()}'


class CitizenDocumentUpload(models.Model):
    """
    Документы, досланные гражданином по делу
    """
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='citizen_documents',
        verbose_name='Гражданин'
    )
    
    case_access = models.ForeignKey(
        CitizenCaseAccess,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Доступ к делу'
    )
    
    title = models.CharField(max_length=500, verbose_name='Название документа')
    description = models.TextField(blank=True, verbose_name='Описание')
    
    file = models.FileField(
        upload_to='citizen_documents/%Y/%m/',
        verbose_name='Файл документа'
    )
    file_name = models.CharField(max_length=500, blank=True, verbose_name='Исходное имя файла')
    file_size = models.PositiveIntegerField(default=0, verbose_name='Размер файла (байт)')
    
    status = models.CharField(
        max_length=20,
        choices=(
            ('pending', 'На рассмотрении'),
            ('accepted', 'Принят'),
            ('rejected', 'Отклонен'),
        ),
        default='pending',
        verbose_name='Статус'
    )
    
    court_comment = models.TextField(blank=True, verbose_name='Комментарий суда')
    
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')
    
    class Meta:
        verbose_name = 'Документ гражданина'
        verbose_name_plural = 'Документы граждан'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f'{self.title} - {self.citizen.get_full_name()}'