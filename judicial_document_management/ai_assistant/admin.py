# ai_assistant/admin.py
from django.contrib import admin
from .models import AIConfiguration, AISession, AIMessage, AICaseAnalysis


@admin.register(AIConfiguration)
class AIConfigurationAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Основные настройки', {
            'fields': ('is_enabled', 'model_type', 'model_path')
        }),
        ('Параметры модели', {
            'fields': ('max_tokens', 'temperature', 'top_p')
        }),
        ('Доступ для граждан', {
            'fields': ('citizen_access_enabled', 'citizen_restricted_fields')
        }),
        ('Категории дел', {
            'fields': ('analyze_criminal', 'analyze_civil', 'analyze_coap', 'analyze_kas')
        }),
        ('Автоматический анализ', {
            'fields': ('auto_analyze_on_create', 'auto_analyze_on_update')
        }),
        ('Статистика', {
            'fields': ('total_queries', 'queries_today', 'last_query_date'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('total_queries', 'queries_today', 'last_query_date')


@admin.register(AISession)
class AISessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'session_type', 'user', 'created_at', 'is_active']
    list_filter = ['session_type', 'is_active', 'created_at']
    search_fields = ['session_id', 'title', 'user__username']


@admin.register(AICaseAnalysis)
class AICaseAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'analysis_type', 'case_object_id', 'created_at', 'compliance_score']
    list_filter = ['analysis_type', 'created_at']
    search_fields = ['case_object_id']