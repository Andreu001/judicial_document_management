from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models import ExternalUser, CaseAccessGrant, SyncLog, SideCaseLink


class CaseAccessGrantInline(admin.TabularInline):
    model = CaseAccessGrant
    extra = 0
    fields = ['case', 'side_type', 'side_name', 'access_level', 'is_active']
    readonly_fields = ['granted_at', 'last_synced_at']


class SyncLogInline(admin.TabularInline):
    model = SyncLog
    extra = 0
    readonly_fields = ['synced_at', 'cases_found', 'cases_added', 'cases_removed', 'triggered_by', 'notes']


@admin.register(ExternalUser)
class ExternalUserAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'social_provider', 'social_id', 'is_active', 'last_login']
    list_filter = ['social_provider', 'is_active']
    search_fields = ['full_name', 'email', 'social_id', 'passport_series', 'passport_number']
    readonly_fields = ['created_at', 'last_login']
    inlines = [CaseAccessGrantInline, SyncLogInline]
    
    actions = ['sync_user_access']
    
    def sync_user_access(self, request, queryset):
        from .services import CaseAccessSyncService
        for user in queryset:
            CaseAccessSyncService.sync_user_access(user, triggered_by='admin')
        self.message_user(request, f"Синхронизировано {queryset.count()} пользователей")
    sync_user_access.short_description = "Синхронизировать доступы для выбранных пользователей"


@admin.register(CaseAccessGrant)
class CaseAccessGrantAdmin(admin.ModelAdmin):
    list_display = ['external_user', 'get_case_info', 'side_type', 'access_level', 'is_active', 'granted_at']
    list_filter = ['access_level', 'is_active', 'content_type']
    search_fields = ['external_user__full_name', 'external_user__email', 'side_name']
    raw_id_fields = ['external_user']
    readonly_fields = ['granted_at', 'last_synced_at']
    
    def get_case_info(self, obj):
        case_info = obj.get_case_display()
        return f"{case_info['type_display']}: {case_info['number']}"
    get_case_info.short_description = "Дело"


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ['external_user', 'synced_at', 'cases_found', 'cases_added', 'cases_removed', 'triggered_by']
    list_filter = ['triggered_by']
    readonly_fields = ['external_user', 'synced_at', 'cases_found', 'cases_added', 'cases_removed', 'triggered_by', 'notes']


@admin.register(SideCaseLink)
class SideCaseLinkAdmin(admin.ModelAdmin):
    list_display = ['side_type', 'side_id', 'case', 'created_at']
    list_filter = ['side_type']
    search_fields = ['side_id']