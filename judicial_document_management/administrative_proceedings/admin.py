# administrative_code/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    KasProceedings, KasDecision, KasExecution,
    KasSidesCaseInCase, KasLawyer, KasCaseMovement,
    KasPetition, ReferringAuthorityKas,
    # Справочные модели
    AdmissionOrder, PostponementReason, SuspensionReason,
    PreliminaryProtection, ExpertiseType, AppealResult,
    CassationResult, TermCompliance, Outcome
)
# Импортируем модели из business_card для регистрации их админок
from business_card.models import SidesCaseInCase, Lawyer, PetitionsInCase


# ========== РЕГИСТРАЦИЯ МОДЕЛЕЙ ДЛЯ AUTHCOMPLETE_FIELDS ==========
@admin.register(SidesCaseInCase)
class SidesCaseInCaseAdmin(admin.ModelAdmin):
    """Админка для сторон (нужна для автокомплита)"""
    list_display = ('id', 'name', 'status', 'phone', 'email')
    search_fields = ('name', 'inn', 'phone', 'email', 'document_number')
    list_filter = ('status',)


@admin.register(Lawyer)
class LawyerAdmin(admin.ModelAdmin):
    """Админка для представителей (нужна для автокомплита)"""
    list_display = ('id', 'law_firm_name', 'law_firm_phone', 'law_firm_email')
    search_fields = ('law_firm_name', 'law_firm_phone', 'law_firm_email', 'lawyer_certificate_number')


@admin.register(PetitionsInCase)
class PetitionsInCaseAdmin(admin.ModelAdmin):
    """Админка для ходатайств в деле (нужна для автокомплита)"""
    list_display = ('id', 'date_application', 'date_decision')
    list_filter = ('date_application',)
    search_fields = ('id', 'notation')
    raw_id_fields = ('decision_rendered',)


# ========== РЕГИСТРАЦИЯ СПРАВОЧНЫХ МОДЕЛЕЙ ==========
@admin.register(AdmissionOrder)
class AdmissionOrderAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(PostponementReason)
class PostponementReasonAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(SuspensionReason)
class SuspensionReasonAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(PreliminaryProtection)
class PreliminaryProtectionAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(ExpertiseType)
class ExpertiseTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(AppealResult)
class AppealResultAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(CassationResult)
class CassationResultAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(TermCompliance)
class TermComplianceAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


@admin.register(Outcome)
class OutcomeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')


# ========== INLINE КЛАССЫ ДЛЯ KASPROCEEDINGS ==========
class KasSidesCaseInCaseInline(admin.TabularInline):
    """Инлайн для сторон дела в админке"""
    model = KasSidesCaseInCase
    extra = 1
    autocomplete_fields = ['sides_case_incase', 'sides_case_role']
    verbose_name = "Сторона"
    verbose_name_plural = "Стороны"
    fields = ('sides_case_incase', 'sides_case_role')
    raw_id_fields = ('sides_case_incase',)


class KasLawyerInline(admin.TabularInline):
    """Инлайн для представителей в админке"""
    model = KasLawyer
    extra = 1
    autocomplete_fields = ['lawyer', 'sides_case_role']
    verbose_name = "Представитель"
    verbose_name_plural = "Представители"
    fields = ('lawyer', 'sides_case_role')
    raw_id_fields = ('lawyer',)


class KasCaseMovementInline(admin.TabularInline):
    """Инлайн для движения дела в админке"""
    model = KasCaseMovement
    extra = 1
    autocomplete_fields = ['business_movement']
    verbose_name = "Движение дела"
    verbose_name_plural = "Движение дела"
    fields = ('business_movement',)


class KasPetitionInline(admin.TabularInline):
    """Инлайн для ходатайств в админке"""
    model = KasPetition
    extra = 1
    autocomplete_fields = ['petitions_incase']
    verbose_name = "Ходатайство"
    verbose_name_plural = "Ходатайства"
    fields = ('petitions_incase',)
    raw_id_fields = ('petitions_incase',)


class KasDecisionInline(admin.TabularInline):
    """Инлайн для решений в админке"""
    model = KasDecision
    extra = 1
    verbose_name = "Решение"
    verbose_name_plural = "Решения"
    fields = ('decision_date', 'outcome', 'awarded_amount_main')
    readonly_fields = ('decision_date',)


class KasExecutionInline(admin.TabularInline):
    """Инлайн для исполнения в админке"""
    model = KasExecution
    extra = 1
    verbose_name = "Исполнение"
    verbose_name_plural = "Исполнения"
    fields = ('decision_effective_date', 'execution_date', 'execution_amount')


# ========== ОСНОВНЫЕ АДМИНКИ ==========
@admin.register(KasProceedings)
class KasProceedingsAdmin(admin.ModelAdmin):
    """Админка для дел КАС"""
    list_display = (
        'case_number_kas', 'incoming_date', 'presiding_judge', 
        'status', 'get_status_color', 'is_appealed', 'appeal_result_display_admin',
        'is_cassation_filed', 'cassation_result_display_admin'
    )
    list_filter = ('status', 'incoming_date', 'is_appealed', 'is_cassation_filed', 'case_category')
    search_fields = ('case_number_kas', 'presiding_judge__last_name', 'presiding_judge__first_name')
    readonly_fields = ('created_at', 'updated_at', 'get_documents_count')
    raw_id_fields = ('presiding_judge', 'registered_case')
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'case_number_kas', 'registered_case', 'status', 'special_notes',
                ('incoming_date', 'incoming_from'), ('acceptance_date', 'transfer_date')
            )
        }),
        ('Судья и состав', {
            'fields': (
                'presiding_judge', 'judge_code', 
                ('ruling_preparation', 'ruling_preparation_date'),
                ('is_simplified_procedure', 'control_date')
            )
        }),
        ('Истцы и госпошлина', {
            'fields': (
                'is_collective_claim', 'number_of_plaintiffs',
                ('state_duty_amount', 'state_duty_payer')
            )
        }),
        ('Порядок поступления', {
            'fields': (
                'admission_order', 'related_case_number', 'previous_court_code'
            )
        }),
        ('Предварительные заседания и меры', {
            'fields': (
                'ruling_preliminary_hearing', 'preliminary_hearing_date',
                'ruling_closed_hearing',
                ('preliminary_protection', 'preliminary_protection_date'),
                ('ruling_expertise', 'expertise_sent_date', 'expertise_received_date'),
                'expertise_institution', 'expertise_type'
            )
        }),
        ('Судебное разбирательство', {
            'fields': (
                'hearing_date', 'is_vcs_used', 'is_audio_recorded', 'is_video_recorded',
                'hearing_postponed', 'postponement_count', 'postponement_reason', 'postponement_reason_text',
                'case_suspended', 'suspension_date', 'suspension_reason', 'suspension_reason_text',
                'suspension_clause', 'suspension_article', 'resumption_date', 
                'suspension_duration_days', 'reconciliation_deadline_date'
            )
        }),
        ('Категория дела', {
            'fields': (
                'case_category', 'legal_relationship_sphere',
                'is_state_secret', 'is_election_period', 'election_case_deadline_days'
            )
        }),
        ('Апелляционное обжалование', {
            'classes': ('collapse',),
            'fields': (
                'is_appealed', 'appealed_by', 'appeal_date', 'appeal_type',
                'appeal_deadline_for_corrections', 'appeal_scheduled_date', 
                'appeal_scheduled_date_repeated', 'appeal_sent_to_higher_court_date',
                'appeal_sent_to_higher_court_repeated', 'appeal_returned_without_review_date',
                'appeal_return_reason', 'appeal_review_date', 'appeal_result'
            )
        }),
        ('Кассационное обжалование', {
            'classes': ('collapse',),
            'fields': (
                'is_cassation_filed', 'cassation_filed_by', 'cassation_date', 'cassation_type',
                'cassation_deadline_for_corrections', 'cassation_scheduled_date',
                'cassation_sent_to_higher_court_date', 'cassation_returned_without_review_date',
                'cassation_return_reason', 'cassation_review_date', 'cassation_result'
            )
        }),
        ('Архив', {
            'classes': ('collapse',),
            'fields': ('archived_date', 'archive_notes')
        }),
        ('Технические поля', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at', 'get_documents_count')
        }),
    )
    
    inlines = [
        KasSidesCaseInCaseInline, KasLawyerInline, 
        KasCaseMovementInline, KasPetitionInline,
        KasDecisionInline, KasExecutionInline
    ]
    
    def get_status_color(self, obj):
        """Цветовая индикация статуса"""
        colors = {
            'active': 'green',
            'completed': 'blue',
            'execution': 'orange',
            'archived': 'gray'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    get_status_color.short_description = 'Статус'
    
    def appeal_result_display_admin(self, obj):
        """Отображение результата апелляции"""
        return obj.get_appeal_result_display() if obj.appeal_result else '-'
    appeal_result_display_admin.short_description = 'Результат апелляции'
    
    def cassation_result_display_admin(self, obj):
        """Отображение результата кассации"""
        return obj.get_cassation_result_display() if obj.cassation_result else '-'
    cassation_result_display_admin.short_description = 'Результат кассации'
    
    def get_documents_count(self, obj):
        """Количество документов по делу"""
        from django.contrib.contenttypes.models import ContentType
        from case_documents.models import CaseDocument
        ct = ContentType.objects.get_for_model(obj)
        count = CaseDocument.objects.filter(content_type=ct, object_id=obj.id).count()
        return format_html('<a href="/admin/case_documents/casedocument/?content_type__id={}&object_id={}">{} документов</a>', ct.id, obj.id, count)
    get_documents_count.short_description = 'Документы'
    
    actions = ['archive_selected', 'unarchive_selected']
    
    def archive_selected(self, request, queryset):
        """Массовый архив дел"""
        from django.utils import timezone
        updated = queryset.update(status='archived', archived_date=timezone.now().date())
        self.message_user(request, f'{updated} дел отправлено в архив.')
    archive_selected.short_description = "Отправить в архив"
    
    def unarchive_selected(self, request, queryset):
        """Массовое извлечение из архива"""
        updated = queryset.update(status='active', archived_date=None)
        self.message_user(request, f'{updated} дел возвращено из архива.')
    unarchive_selected.short_description = "Вернуть из архива"


@admin.register(KasDecision)
class KasDecisionAdmin(admin.ModelAdmin):
    """Админка для решений КАС"""
    list_display = (
        'kas_proceedings', 'decision_date', 'outcome_display_admin',
        'decision_is_appealed', 'decision_appeal_result_display_admin',
        'decision_is_cassation_filed', 'decision_cassation_result_display_admin'
    )
    list_filter = ('decision_date', 'outcome', 'decision_is_appealed', 'decision_is_cassation_filed')
    search_fields = ('kas_proceedings__case_number_kas',)
    raw_id_fields = ('kas_proceedings',)
    
    fieldsets = (
        ('Решение', {
            'fields': (
                'kas_proceedings', 'decision_date', 'motivated_decision_date',
                'is_simplified_procedure', 'is_default_judgment', 'outcome',
                'outcome_clause', 'outcome_article', 'transferred_to_court'
            )
        }),
        ('Суммы и издержки', {
            'fields': (
                'awarded_amount_main', 'awarded_amount_additional',
                'state_duty_to_state', 'legal_costs'
            )
        }),
        ('Примирительные процедуры', {
            'fields': (
                'conciliation_procedure', 'conciliation_type', 'conciliation_result',
                'ruling_refusal_of_claim', 'ruling_refusal_of_recognition', 'ruling_refusal_of_settlement'
            )
        }),
        ('Состав суда и участники', {
            'fields': (
                'court_composition', 'judges_list',
                'participant_prosecutor_state', 'participant_prosecutor_plaintiff',
                'participant_gov_agency', 'participant_public_org', 'participant_mass_media',
                'participant_expert', 'participant_specialist', 'participant_translator', 'participant_minor'
            )
        }),
        ('Сроки и частные определения', {
            'fields': (
                'consideration_duration_months', 'consideration_duration_days',
                'total_duration_months', 'total_duration_days', 'term_compliance',
                'deadline_start_date', 'is_complex_case', 'special_rulings_count',
                'special_rulings_reports_received'
            )
        }),
        ('Апелляционное обжалование решения', {
            'classes': ('collapse',),
            'fields': (
                'decision_is_appealed', 'decision_appeal_date',
                'decision_appeal_review_date', 'decision_appeal_result'
            )
        }),
        ('Кассационное обжалование решения', {
            'classes': ('collapse',),
            'fields': (
                'decision_is_cassation_filed', 'decision_cassation_date',
                'decision_cassation_review_date', 'decision_cassation_result'
            )
        }),
        ('Другие постановления', {
            'classes': ('collapse',),
            'fields': (
                'additional_decision_date', 'clarification_ruling_date',
                'execution_order_change_date', 'other_execution_ruling_date',
                'court_fines_imposed', 'court_fines_details',
                'procedural_costs_details', 'review_ruling_date'
            )
        }),
    )
    
    def outcome_display_admin(self, obj):
        """Отображение результата"""
        return obj.get_outcome_display() if obj.outcome else '-'
    outcome_display_admin.short_description = 'Результат'
    
    def decision_appeal_result_display_admin(self, obj):
        """Отображение результата апелляции решения"""
        return obj.get_decision_appeal_result_display() if obj.decision_appeal_result else '-'
    decision_appeal_result_display_admin.short_description = 'Результат апелляции решения'
    
    def decision_cassation_result_display_admin(self, obj):
        """Отображение результата кассации решения"""
        return obj.get_decision_cassation_result_display() if obj.decision_cassation_result else '-'
    decision_cassation_result_display_admin.short_description = 'Результат кассации решения'


@admin.register(KasExecution)
class KasExecutionAdmin(admin.ModelAdmin):
    """Админка для исполнения КАС"""
    list_display = ('kas_proceedings', 'decision_effective_date', 'execution_date', 'execution_amount')
    list_filter = ('decision_effective_date', 'execution_date')
    search_fields = ('kas_proceedings__case_number_kas',)
    raw_id_fields = ('kas_proceedings',)


@admin.register(ReferringAuthorityKas)
class ReferringAuthorityKasAdmin(admin.ModelAdmin):
    """Админка для органов КАС"""
    list_display = ('name', 'code')
    search_fields = ('name', 'code')