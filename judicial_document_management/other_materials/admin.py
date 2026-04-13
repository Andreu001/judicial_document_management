from django.contrib import admin
from .models import (
    OtherMaterial, OtherMaterialSidesCaseInCase,
    OtherMaterialLawyer, OtherMaterialMovement, OtherMaterialPetition
)


@admin.register(OtherMaterial)
class OtherMaterialAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'title', 'registration_date', 'status', 'responsible_person')
    list_filter = ('status', 'registration_date')
    search_fields = ('registration_number', 'title', 'incoming_number', 'sender')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Общие сведения', {
            'fields': ('registration_number', 'registration_date', 'title', 'description')
        }),
        ('Сведения о поступлении', {
            'fields': ('incoming_number', 'incoming_date', 'sender')
        }),
        ('Сведения о рассмотрении', {
            'fields': ('responsible_person', 'consideration_date', 'consideration_result')
        }),
        ('Связи', {
            'fields': ('registered_case',)
        }),
        ('Статус и архив', {
            'fields': ('status', 'archived_date', 'archive_notes', 'special_notes')
        }),
        ('Технические поля', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OtherMaterialSidesCaseInCase)
class OtherMaterialSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'sides_case_incase', 'sides_case_role')
    list_filter = ('sides_case_role',)
    search_fields = ('other_material__registration_number', 'sides_case_incase__name')


@admin.register(OtherMaterialLawyer)
class OtherMaterialLawyerAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'lawyer', 'sides_case_role')
    list_filter = ('sides_case_role',)
    search_fields = ('other_material__registration_number', 'lawyer__law_firm_name')


@admin.register(OtherMaterialMovement)
class OtherMaterialMovementAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'business_movement')
    search_fields = ('other_material__registration_number',)


@admin.register(OtherMaterialPetition)
class OtherMaterialPetitionAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'petitions_incase', 'petitioner_type')
    list_filter = ('petitioner_type',)
    search_fields = ('other_material__registration_number',)
