# case_management/admin.py

from django.contrib import admin
from .models import (
    ProgressActionType, CaseProgressEntry,
    NotificationChannel, NotificationStatus,
    NotificationTemplate, Notification
)


@admin.register(ProgressActionType)
class ProgressActionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')


@admin.register(CaseProgressEntry)
class CaseProgressEntryAdmin(admin.ModelAdmin):
    list_display = ('action_date', 'action_type', 'case', 'author', 'created_date')
    list_filter = ('action_type', 'action_date', 'author')
    search_fields = ('description', 'case_object_id')
    raw_id_fields = ('author',)
    date_hierarchy = 'action_date'


@admin.register(NotificationChannel)
class NotificationChannelAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'requires_confirmation')
    list_filter = ('is_active', 'requires_confirmation')
    search_fields = ('name', 'code')


@admin.register(NotificationStatus)
class NotificationStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_final', 'is_success')
    list_filter = ('is_final', 'is_success')


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'case_category', 'participant_type', 'form_number', 'is_active')
    list_filter = ('case_category', 'participant_type', 'is_active')
    search_fields = ('name', 'content')
    ordering = ('case_category', 'participant_type', 'order')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'participant_name', 'case', 'hearing_date', 'channel', 'status', 'sent_date')
    list_filter = ('channel', 'status', 'hearing_date', 'sent_date')
    search_fields = ('participant_name', 'participant_role', 'message_text')
    raw_id_fields = ('created_by', 'template', 'progress_entry')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Дело и участник', {
            'fields': ('case_content_type', 'case_object_id', 'participant_content_type', 
                      'participant_object_id', 'participant_name', 'participant_role')
        }),
        ('Контактные данные', {
            'fields': ('contact_phone', 'contact_email', 'contact_address')
        }),
        ('Судебное заседание', {
            'fields': ('hearing_date', 'hearing_time', 'hearing_room')
        }),
        ('Уведомление', {
            'fields': ('channel', 'template', 'message_text', 'status')
        }),
        ('Статусы и даты', {
            'fields': ('sent_date', 'delivery_date', 'return_reason', 'return_date')
        }),
        ('Системное', {
            'fields': ('created_by', 'created_at', 'updated_at', 'progress_entry'),
            'classes': ('collapse',)
        }),
    )
