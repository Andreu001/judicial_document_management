from django.contrib import admin
from .models import (
    CriminalProceedings, Defendant, CriminalDecision,
    CriminalRuling, CriminalCaseMovement, ReferringAuthority,
    LawyerCriminal, CriminalSidesCaseInCase, PetitionCriminal,
    CriminalExecution, CriminalDecisions, CriminalAppeal,
    CriminalCivilClaim, CriminalExpertiseType
)
from .models_appeal_cassation import (
    CriminalAppealInstance, CriminalCassationInstance,
    CriminalAppealApplicantStatus, CriminalCassationResult, CriminalSupervisoryResult
)
from .models_person_card import (
    CriminalPersonCard, PreviousConviction, CrimeComposition, SentencedPunishment
)


# ==================== INLINES ====================

class PreviousConvictionInline(admin.TabularInline):
    model = PreviousConviction
    extra = 0
    fields = ['sentence_date', 'article', 'article_part', 'punishment_type', 'punishment_served']


class CrimeCompositionInline(admin.TabularInline):
    model = CrimeComposition
    extra = 0
    fields = ['instance', 'article', 'article_part', 'article_type', 'crime_stage', 'recidivism']


class SentencedPunishmentInline(admin.TabularInline):
    model = SentencedPunishment
    extra = 0
    fields = ['instance', 'punishment_category', 'punishment_type', 'amount', 'assignment_features']


class DefendantInline(admin.TabularInline):
    """Inline для отображения обвиняемых прямо в карточке дела"""
    model = Defendant
    extra = 0
    fields = ['full_name_criminal', 'sides_case_defendant', 'birth_date', 'sex', 'restraint_measure']
    readonly_fields = ['id']


class CriminalDecisionInline(admin.TabularInline):
    """Inline для решений по делу"""
    model = CriminalDecision
    extra = 0
    fields = ['name_case', 'appeal_date', 'appeal_consideration_result', 'sentence_effective_date']
    readonly_fields = ['id']


class CriminalCaseMovementInline(admin.TabularInline):
    """Inline для движения дела"""
    model = CriminalCaseMovement
    extra = 0
    fields = ['first_hearing_date', 'preliminary_hearing_result', 'hearing_postponed_reason', 'suspension_reason']


class CriminalExecutionInline(admin.TabularInline):
    """Inline для исполнения приговора"""
    model = CriminalExecution
    extra = 0
    fields = ['sentence_execution_date', 'execution_sent_date', 'execution_sent_to', 'execution_result']


class CriminalAppealInstanceInline(admin.TabularInline):
    """Inline для апелляционного рассмотрения"""
    model = CriminalAppealInstance
    extra = 0
    fields = ['appeal_date', 'appeal_type', 'appeal_result', 'court_consideration_date']
    readonly_fields = ['id']


class CriminalCassationInstanceInline(admin.TabularInline):
    """Inline для кассационного рассмотрения"""
    model = CriminalCassationInstance
    extra = 0
    fields = ['instance_type', 'cassation_date', 'cassation_result', 'consideration_date']
    readonly_fields = ['id']


class CriminalCivilClaimInline(admin.TabularInline):
    """Inline для гражданских исков"""
    model = CriminalCivilClaim
    extra = 0
    fields = ['plaintiff_name', 'claim_amount', 'result', 'awarded_amount', 'decision_date']


# ==================== ADMINS ====================

@admin.register(CriminalProceedings)
class CriminalProceedingsAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'case_number_criminal', 'incoming_date', 'presiding_judge_short',
        'status', 'created_at'
    ]
    list_filter = ['status', 'case_category_criminal', 'composition_court', 'created_at']
    search_fields = ['case_number_criminal', 'incoming_from', 'special_notes']
    readonly_fields = ['created_at', 'updated_at', 'registered_case']
    
    inlines = [
        DefendantInline,
        CriminalDecisionInline,
        CriminalCaseMovementInline,
        CriminalExecutionInline,
        CriminalAppealInstanceInline,
        CriminalCassationInstanceInline,
        CriminalCivilClaimInline
    ]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('case_number_criminal', 'status', 'registered_case', 'created_at', 'updated_at')
        }),
        ('Раздел А. Сведения по делу', {
            'fields': (
                'incoming_date', 'incoming_from', 'referring_authority',
                'case_order', 'separated_case_number', 'separated_case_date',
                'repeat_case', 'repeat_case_date', 'number_of_persons',
                'volume_count', 'evidence_present', 'evidence_reg_number'
            )
        }),
        ('Судья и состав суда', {
            'fields': (
                'presiding_judge', 'judge_code', 'judge_acceptance_date',
                'composition_court', 'consideration_date'
            )
        }),
        ('Движение дела', {
            'fields': (
                'preliminary_hearing_result', 'first_hearing_date',
                'hearing_compliance', 'postponement_reason_code',
                'postponement_reason_text', 'postponement_count',
                'suspension_reason_code', 'suspension_reason_text',
                'suspension_duration_days'
            ),
            'classes': ('collapse',)
        }),
        ('Результаты рассмотрения', {
            'fields': (
                'case_result', 'case_result_detailed', 'total_duration_days',
                'case_duration_category', 'consideration_duration_days',
                'consideration_duration_category'
            ),
            'classes': ('collapse',)
        }),
        ('Участники процесса', {
            'fields': (
                'participation_prosecutor', 'participation_translator',
                'participation_expert', 'participation_specialist',
                'absence_defendant', 'absence_lawyer', 'absence_pmmh_person',
                'closed_hearing', 'vks_technology', 'audio_recording', 'video_recording'
            ),
            'classes': ('collapse',)
        }),
        ('Особый порядок', {
            'fields': ('special_procedure_consent', 'special_procedure_agreement'),
            'classes': ('collapse',)
        }),
        ('Приговор и исполнение', {
            'fields': (
                'sentence_date', 'sentence_result', 'sentence_effective_date',
                'sentence_execution_date', 'execution_sent_date', 'execution_sent_to'
            ),
            'classes': ('collapse',)
        }),
        ('Дополнительные сведения', {
            'fields': (
                'joined_with_case', 'separated_to_case', 'expertise_type',
                'expertise_sent_date', 'expertise_received_date', 'expertise_institution',
                'confiscation_applied', 'confiscation_article', 'court_fine_applied',
                'court_fine_amount', 'court_fine_article', 'procedural_coercion',
                'procedural_coercion_date', 'procedural_costs', 'private_rulings_count',
                'case_to_office_date'
            ),
            'classes': ('collapse',)
        }),
        ('Особые отметки и архив', {
            'fields': ('special_notes', 'other_notes', 'archived_date', 'archive_notes'),
            'classes': ('collapse',)
        }),
    )
    
    def presiding_judge_short(self, obj):
        if obj.presiding_judge:
            parts = []
            if obj.presiding_judge.last_name:
                parts.append(obj.presiding_judge.last_name)
            if obj.presiding_judge.first_name:
                parts.append(obj.presiding_judge.first_name[:1] + '.')
            if obj.presiding_judge.middle_name:
                parts.append(obj.presiding_judge.middle_name[:1] + '.')
            return ' '.join(parts) if parts else str(obj.presiding_judge)
        return '-'
    presiding_judge_short.short_description = 'Судья'
    
    actions = ['mark_archived', 'mark_active']
    
    def mark_archived(self, request, queryset):
        queryset.update(status='archived')
    mark_archived.short_description = 'Переместить выбранные дела в архив'
    
    def mark_active(self, request, queryset):
        queryset.update(status='active')
    mark_active.short_description = 'Вернуть выбранные дела из архива'


@admin.register(Defendant)
class DefendantAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'full_name_criminal', 'criminal_proceedings_link',
        'birth_date', 'sex', 'restraint_measure', 'trial_result'
    ]
    list_filter = ['sex', 'restraint_measure', 'citizenship', 'is_minor', 'has_disability']
    search_fields = ['full_name_criminal', 'address', 'criminal_proceedings__case_number_criminal']
    readonly_fields = ['criminal_proceedings']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('criminal_proceedings', 'full_name_criminal', 'sides_case_defendant')
        }),
        ('Личные данные', {
            'fields': ('birth_date', 'age_at_crime', 'sex', 'citizenship', 'address', 'postal_code')
        }),
        ('Место работы/учебы', {
            'fields': ('place_of_work', 'work_position', 'character_reference'),
            'classes': ('collapse',)
        }),
        ('Состояние здоровья', {
            'fields': ('registered_with_psychiatrist', 'registered_with_narcologist', 
                       'has_disability', 'disability_group', 'is_pregnant', 'has_child_under_3'),
            'classes': ('collapse',)
        }),
        ('Мера пресечения', {
            'fields': ('restraint_measure', 'restraint_date', 'restraint_application',
                       'restraint_change', 'restraint_change_date', 'restraint_change_to'),
            'classes': ('collapse',)
        }),
        ('Результаты рассмотрения', {
            'fields': ('trial_result', 'conviction_article', 'punishment_type',
                       'punishment_term', 'additional_punishment', 'parole_info',
                       'recidivism_type', 'correctional_institution'),
            'classes': ('collapse',)
        }),
        ('Ущерб и исполнение', {
            'fields': ('property_damage', 'moral_damage', 'detention_institution',
                       'detention_address', 'detention_days_total', 'detention_days_before_court',
                       'detention_days_during_trial'),
            'classes': ('collapse',)
        }),
        ('Примечания', {
            'fields': ('special_notes',),
            'classes': ('collapse',)
        }),
    )
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalDecision)
class CriminalDecisionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'criminal_proceedings_link', 'name_case', 'appeal_date',
        'appeal_consideration_result', 'sentence_effective_date'
    ]
    list_filter = ['appeal_consideration_result', 'civil_claim_result']
    search_fields = ['criminal_proceedings__case_number_criminal']
    readonly_fields = ['criminal_proceedings']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalCaseMovement)
class CriminalCaseMovementAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'criminal_proceedings_link', 'first_hearing_date',
        'preliminary_hearing_result', 'hearing_postponed_reason'
    ]
    list_filter = ['preliminary_hearing_result', 'hearing_compliance']
    search_fields = ['criminal_proceedings__case_number_criminal']
    readonly_fields = ['criminal_proceedings']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalExecution)
class CriminalExecutionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'criminal_proceedings_link', 'sentence_execution_date',
        'execution_sent_date', 'execution_sent_to'
    ]
    list_filter = ['execution_sent_document']
    search_fields = ['criminal_proceedings__case_number_criminal']
    readonly_fields = ['criminal_proceedings']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalAppealInstance)
class CriminalAppealInstanceAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'criminal_proceedings_link', 'appeal_date', 'appeal_type',
        'appeal_result', 'court_consideration_date'
    ]
    list_filter = ['appeal_type', 'appeal_result', 'court_composition']
    search_fields = ['criminal_proceedings__case_number_criminal', 'appeal_applicant']
    readonly_fields = ['criminal_proceedings']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalCassationInstance)
class CriminalCassationInstanceAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'criminal_proceedings_link', 'instance_type', 'cassation_date',
        'cassation_result', 'consideration_date'
    ]
    list_filter = ['instance_type', 'cassation_type', 'cassation_result']
    search_fields = ['criminal_proceedings__case_number_criminal', 'cassation_applicant']
    readonly_fields = ['criminal_proceedings']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalCivilClaim)
class CriminalCivilClaimAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'criminal_proceedings_link', 'plaintiff_name', 'claim_amount',
        'result', 'awarded_amount', 'decision_date'
    ]
    list_filter = ['result']
    search_fields = ['criminal_proceedings__case_number_criminal', 'plaintiff_name', 'defendant_name']
    readonly_fields = ['criminal_proceedings']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalPersonCard)
class CriminalPersonCardAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_defendant_name', 'get_case_number', 'is_completed', 'created_at']
    list_filter = ['is_completed', 'education', 'court_result']
    search_fields = ['defendant__full_name_criminal', 'criminal_proceedings__case_number_criminal']
    readonly_fields = ['created_at', 'updated_at']
    
    inlines = [PreviousConvictionInline, CrimeCompositionInline, SentencedPunishmentInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('defendant', 'criminal_proceedings', 'is_completed')
        }),
        ('Раздел 1. Сведения о подсудимом', {
            'fields': (
                'sex_in_card', 'age_at_crime', 'family_status', 'dependents',
                'citizenship_detailed', 'residence', 'education', 'occupation',
                'employment_status', 'profession_profile', 'position', 'official',
                'prior_convictions_count'
            )
        }),
        ('Раздел 3. Мера пресечения', {
            'fields': (
                'restraint_measure_in_card', 'restraint_measure_date',
                'restraint_measure_applied', 'restraint_measure_changed',
                'restraint_measure_changed_date', 'restraint_measure_changed_to'
            ),
            'classes': ('collapse',)
        }),
        ('Раздел 5. Сведения о приговоре', {
            'fields': (
                'first_instance_date', 'effective_date', 'court_result', 'requalification',
                'prosecutor_refusal', 'shortened_inquiry', 'reconsidered',
                'hearing_features', 'correctional_institution', 'treatment_assigned',
                'sentence_suspension', 'other_measures', 'fine_type', 'court_fine_amount',
                'disability', 'pregnant', 'has_child_under_3'
            ),
            'classes': ('collapse',)
        }),
        ('Раздел 6-7. Наказание', {
            'fields': (
                'main_punishment_type', 'main_punishment_amount', 'main_punishment_unit',
                'main_fine_type', 'fine_multiplier', 'main_punishment_features',
                'main_punishment_release_basis', 'additional_punishment_type',
                'additional_punishment_amount', 'additional_punishment_unit',
                'additional_fine_type', 'additional_punishment_features',
                'additional_punishment_release_basis', 'probation_sentence',
                'probation_period_years', 'probation_period_months'
            ),
            'classes': ('collapse',)
        }),
        ('Смягчающие и отягчающие обстоятельства', {
            'fields': (
                'mitigating_circumstances', 'mitigating_circumstances_detailed',
                'aggravating_circumstances', 'aggravating_circumstances_detailed'
            ),
            'classes': ('collapse',)
        }),
        ('Раздел 8. Апелляция', {
            'fields': ('appeal_date', 'appeal_result'),
            'classes': ('collapse',)
        }),
        ('Раздел 9. Для военнослужащих', {
            'fields': (
                'military_rank', 'service_years', 'service_months', 'fitness_for_service',
                'crime_time_military', 'had_weapon', 'military_status', 'military_at_sentence',
                'military_property_form', 'military_crime_nature'
            ),
            'classes': ('collapse',)
        }),
        ('Раздел 10. Дополнительные сведения', {
            'fields': (
                'notes', 'card_notes', 'case_receipt_date', 'detention_days_total',
                'detention_days_before_court', 'detention_days_during_trial',
                'detention_days_until_effective', 'detention_days_after_sentence',
                'detention_period_category', 'release_from_custody_date',
                'release_from_custody_reason', 'special_procedure_applied',
                'pretrial_agreement_applied'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def get_defendant_name(self, obj):
        return obj.defendant.full_name_criminal if obj.defendant else '-'
    get_defendant_name.short_description = 'Подсудимый'
    
    def get_case_number(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    get_case_number.short_description = 'Номер дела'


@admin.register(PreviousConviction)
class PreviousConvictionAdmin(admin.ModelAdmin):
    list_display = ['id', 'person_card', 'sentence_date', 'article', 'punishment_type', 'punishment_served']
    list_filter = ['punishment_type', 'punishment_served', 'crime_stage']
    search_fields = ['person_card__defendant__full_name_criminal', 'article']


@admin.register(CrimeComposition)
class CrimeCompositionAdmin(admin.ModelAdmin):
    list_display = ['id', 'person_card', 'instance', 'article', 'article_part', 'article_type', 'crime_stage']
    list_filter = ['instance', 'article_type', 'crime_stage', 'recidivism', 'accomplice_type']
    search_fields = ['person_card__defendant__full_name_criminal', 'article']


@admin.register(SentencedPunishment)
class SentencedPunishmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'person_card', 'instance', 'punishment_category', 'punishment_type', 'amount']
    list_filter = ['instance', 'punishment_category', 'punishment_type', 'assignment_features']


# ==================== СПРАВОЧНИКИ ====================

@admin.register(ReferringAuthority)
class ReferringAuthorityAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code']
    search_fields = ['name', 'code']


@admin.register(CriminalDecisions)
class CriminalDecisionsAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code']
    search_fields = ['name', 'code']


@admin.register(CriminalAppeal)
class CriminalAppealAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code']
    search_fields = ['name', 'code']


@admin.register(CriminalExpertiseType)
class CriminalExpertiseTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'code', 'name']
    search_fields = ['code', 'name']


@admin.register(CriminalAppealApplicantStatus)
class CriminalAppealApplicantStatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'code', 'name']
    search_fields = ['code', 'name']


@admin.register(CriminalCassationResult)
class CriminalCassationResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'code', 'name']
    search_fields = ['code', 'name']


@admin.register(CriminalSupervisoryResult)
class CriminalSupervisoryResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'code', 'name']
    search_fields = ['code', 'name']


@admin.register(LawyerCriminal)
class LawyerCriminalAdmin(admin.ModelAdmin):
    list_display = ['id', 'criminal_proceedings_link', 'lawyer_link', 'sides_case_role']
    search_fields = ['criminal_proceedings__case_number_criminal', 'lawyer__law_firm_name']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'
    
    def lawyer_link(self, obj):
        return obj.lawyer.law_firm_name if obj.lawyer else '-'
    lawyer_link.short_description = 'Адвокат'


@admin.register(CriminalSidesCaseInCase)
class CriminalSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'criminal_proceedings_link', 'sides_case_criminal', 'criminal_side_case']
    search_fields = ['criminal_proceedings__case_number_criminal']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(PetitionCriminal)
class PetitionCriminalAdmin(admin.ModelAdmin):
    list_display = ['id', 'criminal_proceedings_link', 'date_application', 'petitioner_type']
    search_fields = ['criminal_proceedings__case_number_criminal']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'


@admin.register(CriminalRuling)
class CriminalRulingAdmin(admin.ModelAdmin):
    list_display = ['id', 'criminal_proceedings_link', 'title', 'ruling_type', 'is_draft', 'created_at']
    list_filter = ['ruling_type', 'is_draft']
    search_fields = ['criminal_proceedings__case_number_criminal', 'title']
    
    def criminal_proceedings_link(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else '-'
    criminal_proceedings_link.short_description = 'Номер дела'