# ai_assistant/models.py
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.utils import timezone
import uuid


class AIConfiguration(models.Model):
    """Глобальные настройки AI-ассистента"""
    
    MODEL_CHOICES = [
        ('saiga', 'Saiga LLM'),
        ('llama', 'Llama 2'),
        ('mistral', 'Mistral'),
    ]
    
    # Основные настройки
    is_enabled = models.BooleanField(default=True, verbose_name="AI ассистент включен")
    model_type = models.CharField(max_length=20, choices=MODEL_CHOICES, default='saiga', verbose_name="Модель")
    model_path = models.CharField(max_length=500, default='./models/saiga-7b', verbose_name="Путь к модели")
    max_tokens = models.IntegerField(default=2048, verbose_name="Максимум токенов в ответе")
    temperature = models.FloatField(default=0.7, verbose_name="Температура (креативность)")
    top_p = models.FloatField(default=0.95, verbose_name="Top-p sampling")
    
    # Доступ для граждан
    citizen_access_enabled = models.BooleanField(default=True, verbose_name="Доступ для граждан")
    citizen_restricted_fields = models.JSONField(
        default=list,
        verbose_name="Ограниченные поля для граждан",
        help_text="Поля, которые нельзя показывать гражданам"
    )
    
    # Категории дел для анализа
    analyze_criminal = models.BooleanField(default=True, verbose_name="Анализировать уголовные дела")
    analyze_civil = models.BooleanField(default=True, verbose_name="Анализировать гражданские дела")
    analyze_coap = models.BooleanField(default=True, verbose_name="Анализировать дела КоАП")
    analyze_kas = models.BooleanField(default=True, verbose_name="Анализировать дела КАС")
    
    # Автоматический анализ
    auto_analyze_on_create = models.BooleanField(default=False, verbose_name="Анализировать при создании")
    auto_analyze_on_update = models.BooleanField(default=True, verbose_name="Анализировать при обновлении")
    
    # Статистика
    total_queries = models.PositiveIntegerField(default=0, verbose_name="Всего запросов")
    queries_today = models.PositiveIntegerField(default=0, verbose_name="Запросов сегодня")
    last_query_date = models.DateField(null=True, blank=True, verbose_name="Дата последнего запроса")
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Настройки AI ассистента"
        verbose_name_plural = "Настройки AI ассистента"
    
    def __str__(self):
        return f"AI ассистент ({'включен' if self.is_enabled else 'выключен'})"
    
    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(id=1)
        return config


class AISession(models.Model):
    """Сессия диалога с AI ассистентом"""
    
    SESSION_TYPES = [
        ('case_analysis', 'Анализ дела'),
        ('statistics', 'Статистика'),
        ('recommendation', 'Рекомендации'),
        ('document_review', 'Проверка документа'),
        ('citizen_help', 'Помощь гражданину'),
        ('general', 'Общий'),
    ]
    
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    external_user = models.ForeignKey('side_case_access.ExternalUser', on_delete=models.CASCADE, null=True, blank=True)
    
    session_type = models.CharField(max_length=30, choices=SESSION_TYPES, default='general')
    title = models.CharField(max_length=500, blank=True)
    context = models.JSONField(default=dict, blank=True, verbose_name="Контекст сессии")
    
    # Связь с делом (если сессия по конкретному делу)
    case_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    case_object_id = models.PositiveIntegerField(null=True, blank=True)
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Сессия AI ассистента"
        verbose_name_plural = "Сессии AI ассистента"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Сессия {self.session_id} - {self.get_session_type_display()}"
    
    def get_messages(self):
        return self.messages.all().order_by('created_at')
    
    def add_message(self, role, content, metadata=None):
        return AIMessage.objects.create(
            session=self,
            role=role,
            content=content,
            metadata=metadata or {}
        )


class AIMessage(models.Model):
    """Сообщение в диалоге с AI"""
    
    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('assistant', 'Ассистент'),
        ('system', 'Системное'),
        ('tool', 'Инструмент'),
    ]
    
    session = models.ForeignKey(AISession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"[{self.role}] {self.content[:100]}"


class AICaseAnalysis(models.Model):
    """Результаты AI-анализа конкретного дела"""
    
    ANALYSIS_TYPES = [
        ('full', 'Полный анализ'),
        ('decision_check', 'Проверка решения'),
        ('stage_recommendation', 'Рекомендации по этапу'),
        ('deadline_check', 'Проверка сроков'),
        ('statistics', 'Статистический анализ'),
    ]
    
    case_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    case_object_id = models.PositiveIntegerField()
    case = GenericForeignKey('case_content_type', 'case_object_id')
    
    analysis_type = models.CharField(max_length=30, choices=ANALYSIS_TYPES, default='full')
    data = models.JSONField(default=dict, verbose_name="Данные анализа")
    recommendations = models.JSONField(default=list, verbose_name="Рекомендации")
    violations = models.JSONField(default=list, verbose_name="Нарушения/ошибки")
    statistics = models.JSONField(default=dict, verbose_name="Статистика")
    
    # Связанные документы
    analyzed_documents = models.JSONField(default=list, verbose_name="Проанализированные документы")
    
    # Оценки
    compliance_score = models.FloatField(null=True, blank=True, verbose_name="Оценка соответствия")
    quality_score = models.FloatField(null=True, blank=True, verbose_name="Оценка качества")
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "AI анализ дела"
        verbose_name_plural = "AI анализы дел"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case_content_type', 'case_object_id']),
            models.Index(fields=['analysis_type']),
        ]
    
    def __str__(self):
        return f"Анализ дела #{self.case_object_id} - {self.get_analysis_type_display()}"


class AIContextCache(models.Model):
    """Кэш контекстных данных для AI (для ускорения работы)"""
    
    cache_key = models.CharField(max_length=500, unique=True)
    data = models.JSONField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Кэш контекста AI"
        verbose_name_plural = "Кэши контекста AI"
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['expires_at']),
        ]
    
    @classmethod
    def get_or_cache(cls, key, data_func, ttl_seconds=3600):
        try:
            cached = cls.objects.get(cache_key=key, expires_at__gt=timezone.now())
            return cached.data
        except cls.DoesNotExist:
            data = data_func()
            cls.objects.create(
                cache_key=key,
                data=data,
                expires_at=timezone.now() + timezone.timedelta(seconds=ttl_seconds)
            )
            return data


class ChatSession(models.Model):
    """Сессия чата с AI - общая, не привязанная к конкретному делу"""
    
    SESSION_TYPES = [
        ('general', 'Общий чат'),
        ('legal_consultation', 'Юридическая консультация'),
        ('case_review', 'Обзор дела'),
        ('document_analysis', 'Анализ документа'),
        ('court_procedure', 'Судопроизводство'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    external_user = models.ForeignKey('side_case_access.ExternalUser', on_delete=models.CASCADE, null=True, blank=True)
    
    title = models.CharField(max_length=200, default='Новый диалог')
    session_type = models.CharField(max_length=30, choices=SESSION_TYPES, default='general')
    
    # Контекст сессии (может содержать информацию о деле)
    context = models.JSONField(default=dict, blank=True)
    
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    
    # Статистика
    message_count = models.PositiveIntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Чат-сессия'
        verbose_name_plural = 'Чат-сессии'
    
    def __str__(self):
        return f"{self.title} ({self.get_session_type_display()})"
    
    def get_messages(self):
        return self.messages.all().order_by('created_at')
    
    def add_message(self, role, content, metadata=None):
        msg = ChatMessage.objects.create(
            session=self,
            role=role,
            content=content,
            metadata=metadata or {}
        )
        self.message_count += 1
        self.last_message_at = timezone.now()
        self.save(update_fields=['message_count', 'last_message_at', 'updated_at'])
        return msg
    
    def get_context_string(self):
        """Формирует контекст для AI"""
        context_parts = []
        if self.context.get('case_id'):
            context_parts.append(f"Дело №{self.context.get('case_number', 'неизвестно')}")
        if self.context.get('case_type'):
            context_parts.append(f"Тип дела: {self.context.get('case_type')}")
        if self.context.get('documents'):
            context_parts.append(f"Загружено документов: {len(self.context.get('documents', []))}")
        return ", ".join(context_parts) if context_parts else "Общий юридический диалог"


class ChatMessage(models.Model):
    """Сообщение в чате"""
    
    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('assistant', 'Ассистент'),
        ('system', 'Системное'),
        ('tool', 'Инструмент'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Для загруженных файлов
    attached_files = models.JSONField(default=list, blank=True, verbose_name="Прикрепленные файлы")
    
    # Метаданные
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"[{self.role}] {self.content[:50]}..."


class UploadedFile(models.Model):
    """Загруженный файл для AI"""
    
    FILE_TYPES = [
        ('pdf', 'PDF'),
        ('docx', 'Word'),
        ('txt', 'Text'),
        ('image', 'Image'),
        ('other', 'Другое'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='uploaded_files', null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    
    file = models.FileField(upload_to='ai_uploads/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    file_size = models.PositiveIntegerField(verbose_name="Размер в байтах")
    
    # Извлеченный текст
    extracted_text = models.TextField(blank=True, verbose_name="Извлеченный текст")
    
    # Метаданные
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.file_name
    
    def get_file_extension(self):
        return self.file_name.split('.')[-1].lower() if '.' in self.file_name else ''
