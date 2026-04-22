from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import (
    OtherMaterial, OtherMaterialType,
    OtherMaterialSidesCaseInCase, OtherMaterialLawyer,
    OtherMaterialDecision
)


@admin.register(OtherMaterialType)
class OtherMaterialTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')
    list_editable = ('is_active', 'order')
    fieldsets = (
        (None, {
            'fields': ('code', 'name', 'is_active', 'order')
        }),
    )


@admin.register(OtherMaterial)
class OtherMaterialAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'registration_date', 'material_type', 
                    'related_case_link', 'outcome', 'responsible_person', 'status')
    list_filter = ('material_type', 'outcome', 'status', 'registration_date')
    search_fields = ('registration_number', 'title', 'incoming_number', 'sender', 'related_case_number')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('responsible_person', 'content_type')
    
    fieldsets = (
        ('Регистрационные сведения', {
            'fields': ('registration_number', 'registration_date', 'material_type', 'title', 'description')
        }),
        ('Сведения о поступлении', {
            'fields': ('incoming_number', 'incoming_date', 'sender')
        }),
        ('Связь с основным делом', {
            'fields': ('content_type', 'object_id', 'related_case_number', 'registered_case'),
            'classes': ('collapse',),
            'description': 'Связь с основным делом (гражданским, уголовным, КАС, КоАП)'
        }),
        ('Сведения о рассмотрении', {
            'fields': ('responsible_person', 'consideration_date', 'outcome', 'outcome_details')
        }),
        ('Статус и архив', {
            'fields': ('status', 'archived_date', 'archive_notes', 'special_notes')
        }),
        ('Технические поля', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def related_case_link(self, obj):
        if obj.related_case_number:
            return format_html('<span style="color: #666;">{}</span>', obj.related_case_number)
        return '-'
    related_case_link.short_description = 'Связанное дело'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('material_type', 'responsible_person')


@admin.register(OtherMaterialSidesCaseInCase)
class OtherMaterialSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'sides_case_incase', 'sides_case_role')
    list_filter = ('sides_case_role',)
    search_fields = ('other_material__registration_number', 'sides_case_incase__name')
    raw_id_fields = ('other_material', 'sides_case_incase', 'sides_case_role')


@admin.register(OtherMaterialLawyer)
class OtherMaterialLawyerAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'lawyer', 'sides_case_role')
    list_filter = ('sides_case_role',)
    search_fields = ('other_material__registration_number', 'lawyer__law_firm_name')
    raw_id_fields = ('other_material', 'lawyer', 'sides_case_role')


@admin.register(OtherMaterialDecision)
class OtherMaterialDecisionAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'decision_date', 'outcome', 'complaint_filed')
    list_filter = ('outcome', 'complaint_filed')
    search_fields = ('other_material__registration_number',)
    raw_id_fields = ('other_material',)
    fieldsets = (
        (None, {
            'fields': ('other_material', 'outcome', 'decision_date', 'decision_effective_date')
        }),
        ('Обжалование', {
            'fields': ('complaint_filed', 'complaint_result'),
            'classes': ('collapse',)
        }),
    )