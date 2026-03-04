from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.utils import timezone
import os

class DocumentTemplate(models.Model):
    """
    Модель для шаблонов документов. Управляется через админку.
    """
    # Категория шаблона (для какой категории дел он предназначен)
    CASE_CATEGORY_CHOICES = [
        ('criminal', 'Уголовные'),
        ('admin_offense', 'Административные правонарушения (КОАП)'),
        ('civil', 'Гражданские'),
        ('kas', 'Административное судопроизводство (КАС)'),
        ('common', 'Общие для всех'),
    ]
    case_category = models.CharField(
        max_length=20,
        choices=CASE_CATEGORY_CHOICES,
        verbose_name="Категория дела",
        help_text="Для какого типа дел предназначен этот шаблон"
    )

    # Тип/название шаблона (например, "Постановление о назначении экспертизы")
    name = models.CharField(
        max_length=255,
        verbose_name="Название шаблона"
    )

    # Краткое описание для чего этот шаблон
    description = models.TextField(
        verbose_name="Описание",
        blank=True,
        help_text="Для чего нужен этот документ"
    )

    # Поле для загрузки файла шаблона (например, .docx)
    template_file = models.FileField(
        upload_to='document_templates/',
        verbose_name="Файл шаблона",
        blank=True,
        null=True,
        help_text="Загрузите файл шаблона (например, в формате .docx)"
    )

    # Флаг активности
    is_active = models.BooleanField(
        verbose_name="Активен",
        default=True,
        help_text="Отображается ли этот шаблон для выбора"
    )

    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Шаблон документа"
        verbose_name_plural = "Шаблоны документов"
        ordering = ['case_category', 'name']

    def __str__(self):
        return f"{self.get_case_category_display()}: {self.name}"


class CaseDocument(models.Model):
    """
    Модель для хранения документов, привязанных к конкретному делу (любого типа).
    Использует GenericForeignKey для связи с делами.
    """

    # --- Связь с делом через GenericForeignKey ---
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'model__in': (
                'criminalproceedings',
                'administrativeproceedings',
                'civilproceedings',
                'kasproceedings'
            )
        },
        verbose_name="Тип дела"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('content_type', 'object_id')

    # --- Связь с шаблоном (какой это тип документа) ---
    template = models.ForeignKey(
        DocumentTemplate,
        on_delete=models.PROTECT,  # Запрещаем удаление шаблона, если есть документы
        related_name='documents',
        verbose_name="Шаблон документа"
    )

    # --- Содержимое документа ---
    title = models.CharField(
        max_length=500,
        verbose_name="Заголовок документа",
        help_text="Например: Постановление о назначении экспертизы по делу №123"
    )
    content = models.TextField(
        verbose_name="Содержимое документа",
        help_text="Текст документа. Здесь можно будет использовать HTML или другой формат."
    )

    # --- Файл (если генерируется из шаблона и сохраняется) ---
    generated_file = models.FileField(
        upload_to='generated_documents/%Y/%m/',
        verbose_name="Сгенерированный файл",
        blank=True, null=True,
        help_text="Файл, сгенерированный из шаблона (например, .docx или .pdf)"
    )

    # --- Статус и метаданные ---
    DOCUMENT_STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('signed', 'Подписан'),
    ]
    status = models.CharField(
        max_length=10,
        choices=DOCUMENT_STATUS_CHOICES,
        default='draft',
        verbose_name="Статус"
    )

    # Информация о подписании
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Подписал",
        related_name='signed_documents'
    )
    signed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Дата и время подписания"
    )
    signature_text = models.TextField(
        verbose_name="Текст подписи",
        blank=True,
        help_text="Сгенерированный текст подписи (например, с датой и ФИО)"
    )

    # Автор документа
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Создал",
        related_name='created_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Документ дела"
        verbose_name_plural = "Документы дел"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def sign(self, user):
        """
        Метод для "подписания" документа.
        Добавляет информацию о подписанте и генерирует текст подписи.
        """
        if self.status == 'signed':
            return False, "Документ уже подписан."

        signature = f"\n\n---\nДокумент подписан: {user.get_full_name() or user.username}\nДата и время: {timezone.now().strftime('%d.%m.%Y %H:%M:%S')}"
        self.signature_text = signature
        self.content += signature
        self.status = 'signed'
        self.signed_by = user
        self.signed_at = timezone.now()
        self.save()
        return True, "Документ успешно подписан."