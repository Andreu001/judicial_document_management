from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.urls import reverse
from django.utils.html import format_html
from .models import DocumentTemplate, CaseDocument, PartyDocument, PartyDocumentHistory


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


class CaseDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'case_link', 'template', 'status', 'created_by', 'created_at', 'signed_at']
    list_filter = ['status', 'template', 'content_type']
    search_fields = ['title', 'content']
    readonly_fields = ['created_by', 'created_at', 'updated_at', 'signed_by', 'signed_at', 'signature_text', 'case_link_display']

    def case_link(self, obj):
        if obj.case:
            return str(obj.case)
        return "-"
    case_link.short_description = "Дело"

    def case_link_display(self, obj):
        return self.case_link(obj)
    case_link_display.short_description = "Связанное дело"

    def save_model(self, request, obj, form, change):
        if not change:
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


class PartyDocumentHistoryInline(admin.TabularInline):
    model = PartyDocumentHistory
    extra = 0
    readonly_fields = ['previous_status', 'new_status', 'changed_by', 'comment', 'created_at']
    can_delete = False
    max_num = 0


@admin.register(PartyDocument)
class PartyDocumentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'document_type_tag', 'case_link', 'submitter_name',
        'review_status_tag', 'registration_number', 'submission_date', 'created_at'
    ]
    list_filter = ['document_type', 'review_status', 'submission_method', 'content_type']
    search_fields = ['title', 'submitter_name', 'registration_number', 'description']
    readonly_fields = [
        'created_at', 'updated_at', 'file_size', 'file_link_display',
        'document_history_link'
    ]
    raw_id_fields = ['external_user', 'submitted_by', 'reviewed_by', 'appealed_document']
    inlines = [PartyDocumentHistoryInline]
    
    fieldsets = (
        ('Связь с делом', {
            'fields': ('content_type', 'object_id', 'case_link_display')
        }),
        ('Информация о документе', {
            'fields': ('document_type', 'title', 'description', 'document_file', 'file_link_display')
        }),
        ('Податель документа', {
            'fields': ('external_user', 'submitted_by', 'submitter_name', 'submitter_role', 'submission_method', 'submission_date')
        }),
        ('Регистрация в суде', {
            'fields': ('registration_number', 'registration_date', 'review_status')
        }),
        ('Решение судьи', {
            'fields': ('reviewed_by', 'judge_decision', 'judge_decision_date')
        }),
        ('Связи', {
            'fields': ('appealed_document',)
        }),
        ('Внутренние заметки', {
            'fields': ('internal_notes',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at', 'file_size', 'document_history_link')
        }),
    )
    
    def document_type_tag(self, obj):
        colors = {
            'statement_of_claim': '#28a745',
            'appeal': '#fd7e14',
            'cassation': '#6f42c1',
            'petition': '#007bff',
            'objection': '#dc3545',
        }
        color = colors.get(obj.document_type, '#6c757d')
        return format_html('<span style="color: {};">{}</span>', color, obj.get_document_type_display())
    document_type_tag.short_description = "Тип документа"
    
    def review_status_tag(self, obj):
        colors = {
            'pending': '#ffc107',
            'registered': '#17a2b8',
            'under_review': '#007bff',
            'accepted': '#28a745',
            'rejected': '#dc3545',
            'returned': '#fd7e14',
            'attached_to_case': '#20c997',
        }
        color = colors.get(obj.review_status, '#6c757d')
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.get_review_status_display())
    review_status_tag.short_description = "Статус"
    
    def case_link(self, obj):
        if obj.case:
            return str(obj.case)
        return "-"
    case_link.short_description = "Дело"
    
    def case_link_display(self, obj):
        if obj.case:
            return str(obj.case)
        return "-"
    case_link_display.short_description = "Связанное дело"
    
    def file_link_display(self, obj):
        if obj.document_file:
            return format_html('<a href="{}" target="_blank">Скачать файл</a>', obj.document_file.url)
        return "Файл не загружен"
    file_link_display.short_description = "Ссылка на файл"
    
    def document_history_link(self, obj):
        url = reverse('admin:case_documents_partydocumenthistory_changelist') + f'?document__id={obj.id}'
        return format_html('<a href="{}">Посмотреть историю ({})</a>', url, obj.history_entries.count())
    document_history_link.short_description = "История изменений"
    
    actions = ['accept_documents', 'reject_documents', 'register_documents']
    
    def accept_documents(self, request, queryset):
        from django.utils import timezone
        count = 0
        for doc in queryset:
            if doc.review_status in ['pending', 'registered', 'under_review']:
                doc.accept_to_case(request.user)
                count += 1
        self.message_user(request, f"Приобщено {count} документов к материалам дел.")
    accept_documents.short_description = "Приобщить выбранные документы к делам"
    
    def reject_documents(self, request, queryset):
        count = 0
        for doc in queryset:
            if doc.review_status in ['pending', 'registered', 'under_review']:
                doc.reject_attachment(request.user, "Отказ по решению суда")
                count += 1
        self.message_user(request, f"Отказано в приобщении {count} документов.")
    reject_documents.short_description = "Отказать в приобщении выбранных документов"

    def register_documents(self, request, queryset):
        from django.utils import timezone
        from case_registry.models import CorrespondenceCounter
        from case_registry.models import Correspondence
        
        count = 0
        current_year = timezone.now().year
        
        # Получаем или создаем счетчик
        counter, created = CorrespondenceCounter.objects.get_or_create(
            year=current_year,
            defaults={'incoming_counter': 0, 'outgoing_counter': 0}
        )
        
        for doc in queryset:
            if doc.review_status == 'pending':
                # Увеличиваем счетчик
                counter.incoming_counter += 1
                counter.save()
                registration_number = f"Вх-{counter.incoming_counter}/{current_year}"
                
                doc.register_document(registration_number, request.user)
                
                # Создаем запись в корреспонденции
                sender_name = doc.submitter_name
                if doc.submitter_role:
                    sender_name = f"{doc.submitter_name} ({doc.submitter_role})"
                
                Correspondence.objects.create(
                    correspondence_type='incoming',
                    registration_number=registration_number,
                    registration_date=doc.registration_date.date(),
                    document_type=doc.get_document_type_display(),
                    summary=f"[Документ стороны] {doc.title}",
                    sender=sender_name,
                    recipient="Суд",
                    pages_count=1,
                    status='registered',
                    notes=f"Зарегистрирован через админ-панель. ID документа стороны: {doc.id}"
                )
                
                count += 1
        
        self.message_user(request, f"Зарегистрировано {count} документов. Входящие номера: Вх-.../{current_year}")
    register_documents.short_description = "Зарегистрировать выбранные документы"
    
    def save_model(self, request, obj, form, change):
        # Сохраняем историю при изменении статуса
        if change and 'review_status' in form.changed_data:
            old_obj = PartyDocument.objects.get(pk=obj.pk)
            PartyDocumentHistory.objects.create(
                document=obj,
                previous_status=old_obj.review_status,
                new_status=obj.review_status,
                changed_by=request.user.get_full_name() or request.user.username,
                comment=request.POST.get('judge_decision', '')
            )
        super().save_model(request, obj, form, change)


@admin.register(PartyDocumentHistory)
class PartyDocumentHistoryAdmin(admin.ModelAdmin):
    list_display = ['document', 'previous_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['previous_status', 'new_status']
    search_fields = ['document__title', 'changed_by']
    readonly_fields = ['document', 'previous_status', 'new_status', 'changed_by', 'comment', 'created_at']


# Регистрация оригинальных админ-классов
admin.site.register(DocumentTemplate, DocumentTemplateAdmin)
admin.site.register(CaseDocument, CaseDocumentAdmin)