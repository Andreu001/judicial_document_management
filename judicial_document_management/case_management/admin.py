# case_management/admin.py

from django.contrib import admin
from .models import (
    NotificationType, NotificationTemplate, Notification,
    ProgressActionType, CaseProgressEntry
)


@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'case_category', 'participant_type', 'form_number', 'is_active', 'order']
    list_filter = ['case_category', 'participant_type', 'is_active']
    search_fields = ['name', 'form_number']
    list_editable = ['order', 'is_active']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'case_category', 'participant_type', 'form_number', 'is_active', 'order')
        }),
        ('Шаблон повестки', {
            'fields': ('content',),
            'description': '''Доступные переменные:
{{ case_number }} - Номер дела
{{ full_name }} - ФИО участника
{{ court_name }} - Наименование суда
{{ hearing_date }} - Дата заседания (ДД.ММ.ГГГГ)
{{ hearing_time }} - Время заседания (ЧЧ:ММ)
{{ hearing_room }} - Номер зала
{{ address }} - Адрес суда
{{ judge_name }} - ФИО судьи
{{ article }} - Статья (для уголовных дел)
{{ participant_status }} - Статус участника (подсудимый/потерпевший и т.д.)
{{ delivery_method }} - Способ доставки
{{ case_category }} - Категория дела
{{ court_phone }} - Телефон суда
{{ court_email }} - Email суда'''
        }),
        ('Описание переменных', {
            'fields': ('variables_description',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification_type', 'participant_name', 'status', 'sent_date', 'delivery_method']
    list_filter = ['status', 'delivery_method', 'notification_type']
    search_fields = ['object_id', 'recipient_address', 'recipient_phone']
    readonly_fields = ['sent_date', 'notification_text']
    raw_id_fields = ['notification_template']
    
    fieldsets = (
        ('Участник и дело', {
            'fields': ('participant', 'case', 'notification_type', 'notification_template')
        }),
        ('Способ доставки', {
            'fields': ('delivery_method', 'recipient_address', 'recipient_phone', 'recipient_email', 
                      'consent_sms', 'consent_email')
        }),
        ('Информация о заседании', {
            'fields': ('hearing_date', 'hearing_room')
        }),
        ('Статус и текст', {
            'fields': ('status', 'sent_date', 'delivery_date', 'notification_text', 'notes')
        }),
    )
    
    def participant_name(self, obj):
        if obj.participant:
            return str(obj.participant)
        return "Участник удален"
    participant_name.short_description = "Участник"


@admin.register(ProgressActionType)
class ProgressActionTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']


@admin.register(CaseProgressEntry)
class CaseProgressEntryAdmin(admin.ModelAdmin):
    list_display = ['action_date', 'action_type', 'author', 'case_object_id']
    list_filter = ['action_type', 'author', 'action_date']
    search_fields = ['case_object_id', 'description']