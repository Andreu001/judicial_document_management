from django.contrib import admin
from .models import JudgeNote, SupremeCourtDocumentRef


@admin.register(JudgeNote)
class JudgeNoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'criminal_proceedings', 'note_type', 'importance', 'is_completed', 'created_at']
    list_filter = ['note_type', 'importance', 'is_completed']
    search_fields = ['title', 'content', 'criminal_proceedings__case_number_criminal']
    readonly_fields = ['created_at', 'updated_at', 'created_by']

    fieldsets = (
        ('Основная информация', {
            'fields': ('criminal_proceedings', 'note_type', 'title', 'content')
        }),
        ('Важность и статус', {
            'fields': ('importance', 'is_completed')
        }),
        ('Ссылки', {
            'fields': ('external_links',)
        }),
        ('Метаданные', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(SupremeCourtDocumentRef)
class SupremeCourtDocumentRefAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'applicable_stages', 'date', 'is_active']
    list_filter = ['document_type', 'applicable_stages', 'is_active']
    search_fields = ['title', 'keywords', 'number']
    list_editable = ['is_active']

    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'document_type', 'number', 'date', 'url')
        }),
        ('Применимость', {
            'fields': ('applicable_stages', 'keywords', 'description')
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
    )
