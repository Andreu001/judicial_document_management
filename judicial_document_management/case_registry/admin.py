# case_registry/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import RegistryIndex, RegistryCounter, RegisteredCase, NumberAdjustment
from .managers import case_registry


@admin.register(RegistryIndex)
class RegistryIndexAdmin(admin.ModelAdmin):
    list_display = ['index', 'name', 'created_at', 'cases_count']
    list_filter = ['created_at']
    search_fields = ['index', 'name']
    readonly_fields = ['created_at', 'updated_at']
    
    def cases_count(self, obj):
        return obj.cases.count()
    cases_count.short_description = 'Количество дел'


@admin.register(RegistryCounter)
class RegistryCounterAdmin(admin.ModelAdmin):
    list_display = ['index', 'current_number', 'total_registered', 'last_used']
    readonly_fields = ['last_used', 'total_registered']
    search_fields = ['index__index', 'index__name']


@admin.register(RegisteredCase)
class RegisteredCaseAdmin(admin.ModelAdmin):
    list_display = ['full_number', 'index', 'registration_date', 'status', 'created_at']
    list_filter = ['index', 'status', 'registration_date']
    search_fields = ['full_number', 'description']
    readonly_fields = ['full_number', 'created_at', 'updated_at', 'deleted_at']
    actions = ['mark_as_deleted']
    
    
    def mark_as_deleted(self, request, queryset):
        for case in queryset:
            if case.status != 'deleted':
                case_registry.delete_case(case.id, reason="Удалено через админ-панель")
        self.message_user(request, f"{queryset.count()} дел помечено как удаленные")
    mark_as_deleted.short_description = "Пометить как удаленные"


@admin.register(NumberAdjustment)
class NumberAdjustmentAdmin(admin.ModelAdmin):
    list_display = ['index', 'old_number', 'new_number', 'adjusted_by', 'adjusted_at']
    list_filter = ['index', 'adjusted_at']
    search_fields = ['index__index', 'reason', 'adjusted_by']
    readonly_fields = ['adjusted_at']


# Действие для корректировки нумерации
def adjust_numbering_action(modeladmin, request, queryset):
    from django.contrib import messages
    from django.shortcuts import redirect
    from django.urls import reverse
    
    if queryset.count() != 1:
        messages.error(request, "Выберите только один счетчик для корректировки")
        return
    
    counter = queryset.first()
    return redirect(reverse('admin:case_registry_numberadjustment_add') + f'?index={counter.index.id}')
adjust_numbering_action.short_description = "Скорректировать нумерацию"

RegistryCounterAdmin.actions = [adjust_numbering_action]