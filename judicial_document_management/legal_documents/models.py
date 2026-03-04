from django.db import models
from django.core.validators import FileExtensionValidator
import os
from datetime import datetime

def document_upload_path(instance, filename):
    """Путь для загрузки файлов: documents/category/год/месяц/filename"""
    # Используем текущую дату, если uploaded_at еще не установлен
    if instance.uploaded_at:
        year = instance.uploaded_at.year
        month = instance.uploaded_at.month
    else:
        now = datetime.now()
        year = now.year
        month = now.month
    
    return f'documents/{instance.category}/{year}/{month}/{filename}'

class LegalDocument(models.Model):
    DOCUMENT_TYPES = [
        ('plenum', 'Постановление Пленума ВС РФ'),
        ('review', 'Обзор практики ВС РФ'),
        ('reference', 'Справочные материалы'),
    ]
    
    CATEGORY_CHOICES = [
        ('criminal', 'Уголовные'),
        ('civil', 'Гражданские'),
        ('administrative', 'Административные (КАС)'),
        ('arbitration', 'Арбитражные'),
        ('coap', 'КОАП'),
        ('military', 'Военные'),
        ('general', 'Общие вопросы'),
    ]
    
    title = models.CharField('Название документа', max_length=500)
    document_type = models.CharField('Тип документа', max_length=20, choices=DOCUMENT_TYPES)
    category = models.CharField('Категория', max_length=20, choices=CATEGORY_CHOICES)
    
    # Файлы
    file_word = models.FileField(
        'Файл Word', 
        upload_to=document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['doc', 'docx'])],
        blank=True, null=True
    )
    file_pdf = models.FileField(
        'Файл PDF',
        upload_to=document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
        blank=True, null=True
    )
    
    # Метаданные
    document_number = models.CharField('Номер документа', max_length=50, blank=True)
    document_date = models.DateField('Дата документа', null=True, blank=True)
    description = models.TextField('Описание', blank=True)
    
    # Для поиска по статьям
    articles = models.TextField(
        'Статьи', 
        help_text='Статьи через запятую (например: УК 105, ГК 309, КОАП 12.8)',
        blank=True
    )
    
    # Ключевые слова для поиска
    keywords = models.TextField(
        'Ключевые слова',
        help_text='Ключевые слова через запятую',
        blank=True
    )
    
    # Дополнительная информация
    source = models.CharField('Источник', max_length=200, blank=True)
    is_active = models.BooleanField('Действующий', default=True)
    
    # Автоматические поля
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    uploaded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,  # Добавляем blank=True для возможности создания без пользователя
        verbose_name='Загрузил пользователь'
    )
    
    class Meta:
        verbose_name = 'Правовой документ'
        verbose_name_plural = 'Правовые документы'
        ordering = ['-document_date', '-uploaded_at']
        indexes = [
            models.Index(fields=['document_type', 'category']),
            models.Index(fields=['document_date']),
        ]
    
    def __str__(self):
        return f"{self.get_document_type_display()}: {self.title}"
    
    def get_file_size(self, file_field):
        """Получить размер файла в человекочитаемом формате"""
        if file_field and hasattr(file_field, 'size') and file_field.size:
            size = file_field.size
            for unit in ['Б', 'КБ', 'МБ', 'ГБ']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
        return "0 Б"
    
    def file_word_size(self):
        return self.get_file_size(self.file_word)
    file_word_size.short_description = 'Размер Word файла'
    
    def file_pdf_size(self):
        return self.get_file_size(self.file_pdf)
    file_pdf_size.short_description = 'Размер PDF файла'
