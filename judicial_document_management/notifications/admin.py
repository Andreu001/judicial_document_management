# notifications/admin.py
from django.contrib import admin
from .models import *

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'priority', 'is_read', 'is_completed', 'created_at')
    list_filter = ('priority', 'is_read', 'is_completed', 'created_at')
    search_fields = ('title', 'message')

@admin.register(JurisdictionCheck)
class JurisdictionCheckAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceeding', 'user', 'case_type_actual', 'case_type_required', 'is_correct', 'checked_at')
    list_filter = ('is_correct', 'case_type_actual', 'case_type_required')

@admin.register(DeadlineWarning)
class DeadlineWarningAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceeding', 'warning_type', 'deadline_date', 'days_remaining', 'is_active')
    list_filter = ('warning_type', 'is_active')

@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'rule_type', 'target_model', 'active')
    list_filter = ('rule_type', 'active')

admin.site.register(LegalReference)