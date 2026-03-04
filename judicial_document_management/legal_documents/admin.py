from django.contrib import admin
from django.utils.html import format_html
from .models import LegalDocument

@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'document_type', 'category', 'document_number',
        'document_date', 'is_active', 'uploaded_at', 'file_links'
    ]
    list_filter = ['document_type', 'category', 'is_active', 'uploaded_at']
    search_fields = ['title', 'description', 'articles', 'keywords', 'document_number']
    date_hierarchy = 'document_date'
    readonly_fields = ['uploaded_at', 'updated_at', 'file_word_size', 'file_pdf_size']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'document_type', 'category', 'description')
        }),
        ('Файлы', {
            'fields': ('file_word', 'file_word_size', 'file_pdf', 'file_pdf_size')
        }),
        ('Метаданные', {
            'fields': ('document_number', 'document_date', 'source', 'is_active')
        }),
        ('Для поиска', {
            'fields': ('articles', 'keywords'),
            'classes': ('wide',),
            'description': 'Статьи и ключевые слова для улучшения поиска'
        }),
        ('Информация о загрузке', {
            'fields': ('uploaded_by', 'uploaded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def file_links(self, obj):
        links = []
        if obj.file_word:
            links.append(format_html('<a href="{}" target="_blank">Word</a>', obj.file_word.url))
        if obj.file_pdf:
            links.append(format_html('<a href="{}" target="_blank">PDF</a>', obj.file_pdf.url))
        return format_html(' | '.join(links)) if links else '-'
    file_links.short_description = 'Файлы'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Если создается новый объект
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
