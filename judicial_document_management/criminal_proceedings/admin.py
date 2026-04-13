from django.contrib import admin
from .models import (
    CriminalProceedings, Defendant, CriminalDecision,
    CriminalRuling, CriminalCaseMovement, ReferringAuthority,
    LawyerCriminal, CriminalSidesCaseInCase, PetitionCriminal,
    CriminalExecution, CriminalDecisions, CriminalAppeal
)
from .models_person_card import (
    CriminalPersonCard, PreviousConviction, CrimeComposition, SentencedPunishment
)


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


@admin.register(CriminalPersonCard)
class CriminalPersonCardAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_defendant_name', 'get_case_number', 'is_completed', 'created_at']
    list_filter = ['is_completed', 'sex', 'education', 'court_result']
    search_fields = ['defendant__full_name_criminal', 'criminal_proceedings__case_number_criminal']
    readonly_fields = ['created_at', 'updated_at']
    
    inlines = [PreviousConvictionInline, CrimeCompositionInline, SentencedPunishmentInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('defendant', 'criminal_proceedings', 'is_completed')
        }),
        ('Раздел 1. Сведения о подсудимом', {
            'fields': (
                'birth_date', 'age_at_crime', 'sex', 'family_status', 'dependents',
                'citizenship', 'residence', 'education', 'occupation', 'profession_profile',
                'position', 'official', 'prior_convictions_count'
            )
        }),
        ('Раздел 5. Сведения о приговоре', {
            'fields': (
                'first_instance_date', 'effective_date', 'court_result', 'requalification',
                'hearing_features', 'correctional_institution', 'treatment_assigned',
                'sentence_suspension', 'fine_type', 'court_fine_amount'
            )
        }),
        ('Наказание', {
            'fields': (
                'probation_sentence', 'probation_period_years', 'probation_period_months',
                'mitigating_circumstances', 'aggravating_circumstances'
            )
        }),
        ('Апелляция', {
            'fields': ('appeal_date', 'appeal_result')
        }),
        ('Для военнослужащих', {
            'fields': ('military_rank', 'service_years', 'service_months', 'had_weapon'),
            'classes': ('collapse',)
        }),
        ('Дополнительные сведения', {
            'fields': ('notes', 'detention_days_total', 'detention_days_before_court'),
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
    list_filter = ['punishment_type', 'punishment_served']
    search_fields = ['person_card__defendant__full_name_criminal', 'article']


@admin.register(CrimeComposition)
class CrimeCompositionAdmin(admin.ModelAdmin):
    list_display = ['id', 'person_card', 'instance', 'article', 'article_part', 'article_type', 'crime_stage']
    list_filter = ['instance', 'article_type', 'crime_stage', 'recidivism']
    search_fields = ['person_card__defendant__full_name_criminal', 'article']


@admin.register(SentencedPunishment)
class SentencedPunishmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'person_card', 'instance', 'punishment_category', 'punishment_type', 'amount']
    list_filter = ['instance', 'punishment_category', 'punishment_type']
