from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
import os

class AudioTranscription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает обработки'),
        ('processing', 'Распознается...'),
        ('completed', 'Готово'),
        ('error', 'Ошибка'),
        ('cancelled', 'Отменено'),
    ]

    # Привязка к любому делу
    case_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, verbose_name="Тип дела")
    case_object_id = models.PositiveIntegerField(verbose_name="ID дела")
    case = GenericForeignKey('case_content_type', 'case_object_id')

    # Файлы
    audio_file = models.FileField(upload_to='audio_uploads/%Y/%m/%d/', verbose_name="Аудиофайл")
    result_docx = models.FileField(upload_to='protocols_drafts/%Y/%m/%d/', null=True, blank=True, verbose_name="Черновик (DOCX)")
    result_json = models.JSONField(default=dict, blank=True, verbose_name="Структурированные данные")

    # Данные
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")
    raw_text = models.TextField(blank=True, verbose_name="Распознанный текст")
    error_message = models.TextField(blank=True, verbose_name="Ошибка")
    duration_seconds = models.PositiveIntegerField(null=True, blank=True, verbose_name="Длительность (сек)")
    progress_percent = models.PositiveIntegerField(default=0, verbose_name="Прогресс %")
    processing_started_at = models.DateTimeField(null=True, blank=True, verbose_name="Начало обработки")
    speaker_count = models.PositiveIntegerField(default=0, verbose_name="Количество говорящих")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Расшифровка аудио"
        verbose_name_plural = "Расшифровки аудио"
        ordering = ['-created_at']

    def __str__(self):
        return f"Аудио #{self.id} для дела ID {self.case_object_id} ({self.get_status_display()})"
    
    def get_docx_filename(self):
        """Возвращает имя файла для скачивания"""
        case_type = self.case_content_type.model if self.case_content_type else 'unknown'
        return f"protocol_draft_{case_type}_{self.id}_{self.created_at.strftime('%Y%m%d')}.docx"
