from django.contrib import admin
from .models import CitizenCaseAccess, CitizenPetition, CitizenDocumentUpload


@admin.register(CitizenCaseAccess)
class CitizenCaseAccessAdmin(admin.ModelAdmin):
    list_display = ['citizen', 'case_link', 'access_type', 'role_in_case', 'is_active', 'granted_at']
    list_filter = ['access_type', 'is_active', 'content_type']
    search_fields = ['citizen__first_name', 'citizen__last_name', 'citizen__username']
    
    def case_link(self, obj):
        if obj.case:
            return str(obj.case)
        return '-'
    case_link.short_description = 'Дело'
    
    actions = ['grant_full_access', 'revoke_access']
    
    def grant_full_access(self, request, queryset):
        queryset.update(access_type='full', is_active=True)
        self.message_user(request, f'Полный доступ предоставлен {queryset.count()} пользователям')
    grant_full_access.short_description = 'Предоставить полный доступ'
    
    def revoke_access(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'Доступ отозван у {queryset.count()} пользователей')
    revoke_access.short_description = 'Отозвать доступ'


@admin.register(CitizenPetition)
class CitizenPetitionAdmin(admin.ModelAdmin):
    list_display = ['title', 'citizen', 'status', 'created_at', 'submitted_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'citizen__first_name', 'citizen__last_name', 'content']
    
    actions = ['mark_accepted', 'mark_resolved', 'mark_rejected']
    
    def mark_accepted(self, request, queryset):
        queryset.update(status='accepted')
        self.message_user(request, f'{queryset.count()} ходатайств принято')
    mark_accepted.short_description = 'Принять к рассмотрению'
    
    def mark_resolved(self, request, queryset):
        queryset.update(status='resolved')
        self.message_user(request, f'{queryset.count()} ходатайств рассмотрено')
    mark_resolved.short_description = 'Отметить как рассмотренные'
    
    def mark_rejected(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f'{queryset.count()} ходатайств отклонено')
    mark_rejected.short_description = 'Отклонить'


@admin.register(CitizenDocumentUpload)
class CitizenDocumentUploadAdmin(admin.ModelAdmin):
    list_display = ['title', 'citizen', 'file_name', 'file_size', 'status', 'uploaded_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['title', 'citizen__first_name', 'citizen__last_name']