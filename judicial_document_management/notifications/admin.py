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

@admin.register(CaseActivity)
class CaseActivityAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_case_number', 'activity_type', 'title', 'is_read_by_judge', 'created_at']
    list_filter = ['activity_type', 'is_read_by_judge', 'created_at']
    search_fields = ['title', 'description', 'case_object_id']
    readonly_fields = ['created_at']
    
    def get_case_number(self, obj):
        if obj.case:
            if hasattr(obj.case, 'case_number_admin'):
                return obj.case.case_number_admin
            elif hasattr(obj.case, 'case_number_criminal'):
                return obj.case.case_number_criminal
            elif hasattr(obj.case, 'case_number_civil'):
                return obj.case.case_number_civil
            elif hasattr(obj.case, 'case_number_kas'):
                return obj.case.case_number_kas
            return f"Дело #{obj.case.id}"
        return "Нет дела"
    get_case_number.short_description = "Дело"


@admin.register(CaseNotificationSummary)
class CaseNotificationSummaryAdmin(admin.ModelAdmin):
    list_display = ['get_case_number', 'judge', 'total_unread', 'unread_petitions', 'unread_party_documents', 'updated_at']
    list_filter = ['judge', 'updated_at']
    search_fields = ['case_object_id', 'judge__username', 'judge__first_name', 'judge__last_name']
    readonly_fields = ['updated_at']
    
    def get_case_number(self, obj):
        case = obj.case
        if case:
            if hasattr(case, 'case_number_admin'):
                return case.case_number_admin
            elif hasattr(case, 'case_number_criminal'):
                return case.case_number_criminal
            elif hasattr(case, 'case_number_civil'):
                return case.case_number_civil
            elif hasattr(case, 'case_number_kas'):
                return case.case_number_kas
            return f"Дело #{case.id}"
        return "Нет дела"
    get_case_number.short_description = "Дело"