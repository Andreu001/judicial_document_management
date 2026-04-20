# case_management/admin.py - добавление новых моделей

from django.contrib import admin
from .models import (
    ProgressActionType, CaseProgressEntry,
    NotificationChannel, NotificationStatus,
    NotificationTemplate, Notification,
    CaseDeadlineSettings, DeadlineViolation
)


@admin.register(ProgressActionType)
class ProgressActionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'case_category', 'order', 'is_active')
    list_filter = ('case_category', 'is_active')
    search_fields = ('name', 'code')
    list_editable = ('order', 'is_active')
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'case_category', 'is_active')
        }),
        ('Дополнительно', {
            'fields': ('order',)
        }),
    )


@admin.register(CaseDeadlineSettings)
class CaseDeadlineSettingsAdmin(admin.ModelAdmin):
    list_display = ('category', 'enable_deadline_tracking', 'enable_violation_alerts')
    list_filter = ('category', 'enable_deadline_tracking', 'enable_violation_alerts')
    fieldsets = (
        ('Общие настройки', {
            'fields': ('category', 'enable_deadline_tracking', 'enable_violation_alerts')
        }),
        ('Уголовные дела', {
            'fields': ('appointment_deadline_simple', 'appointment_deadline_complex', 'trial_start_deadline'),
            'classes': ('collapse',)
        }),
        ('Гражданские дела', {
            'fields': ('civil_preparation_deadline', 'civil_consideration_deadline'),
            'classes': ('collapse',)
        }),
        ('КАС дела', {
            'fields': ('kas_consideration_deadline', 'kas_appeal_deadline'),
            'classes': ('collapse',)
        }),
        ('КоАП дела', {
            'fields': ('coap_consideration_deadline', 'coap_appeal_deadline'),
            'classes': ('collapse',)
        }),
        ('Иные материалы', {
            'fields': ('other_consideration_deadline',),
            'classes': ('collapse',)
        }),
    )


@admin.register(DeadlineViolation)
class DeadlineViolationAdmin(admin.ModelAdmin):
    list_display = ('deadline_type', 'case', 'deadline_days', 'actual_days', 'violation_date', 'resolved')
    list_filter = ('deadline_type', 'resolved', 'violation_date')
    search_fields = ('case_object_id', 'notes')
    list_editable = ('resolved',)
    readonly_fields = ('violation_date',)
    
    def case(self, obj):
        if obj.case:
            return str(obj.case)
        return f"Дело #{obj.case_object_id}"
    case.short_description = "Дело"