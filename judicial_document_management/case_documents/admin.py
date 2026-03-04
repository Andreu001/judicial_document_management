# case_documents/admin.py
from django.contrib import admin
from .models import DocumentTemplate, CaseDocument

@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'case_category', 'is_active', 'created_at']
    list_filter = ['case_category', 'is_active']
    search_fields = ['name', 'description']
    list_editable = ['is_active']
    fieldsets = (
        ('Основная информация', {
            'fields': ('case_category', 'name', 'description')
        }),
        ('Файл шаблона', {
            'fields': ('template_file',)
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
    )


@admin.register(CaseDocument)
class CaseDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'case_link', 'template', 'status', 'created_by', 'created_at', 'signed_at']
    list_filter = ['status', 'template', 'content_type']
    search_fields = ['title', 'content']
    readonly_fields = ['created_by', 'created_at', 'updated_at', 'signed_by', 'signed_at', 'signature_text', 'case_link_display']

    def case_link(self, obj):
        """Возвращает строковое представление связанного дела."""
        if obj.case:
            return str(obj.case)
        return "-"
    case_link.short_description = "Дело"

    def case_link_display(self, obj):
        """Для отображения в деталях."""
        return self.case_link(obj)
    case_link_display.short_description = "Связанное дело"

    def save_model(self, request, obj, form, change):
        if not change:  # Если объект создается
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    fieldsets = (
        ('Связь с делом', {
            'fields': ('content_type', 'object_id', 'case_link_display')
        }),
        ('Основное', {
            'fields': ('template', 'title', 'content', 'generated_file')
        }),
        ('Статус и подпись', {
            'fields': ('status', 'signed_by', 'signed_at', 'signature_text')
        }),
        ('Метаданные', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
