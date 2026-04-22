from django.contrib import admin
from .models import (
    AdministrativeProceedings, AdministrativeDecision, AdministrativeExecution,
    AdministrativeSidesCaseInCase, AdministrativeLawyer,
    AdministrativeCaseMovement, AdministrativePetition, ReferringAuthorityAdmin,
    PostponementReasonAdmin, SuspensionReasonAdmin,
    AdministrativeAppeal, AdministrativeCassation, AdministrativeSubject
)

@admin.register(ReferringAuthorityAdmin)
class ReferringAuthorityAdminAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

@admin.register(PostponementReasonAdmin)
class PostponementReasonAdminAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('label',)

@admin.register(SuspensionReasonAdmin)
class SuspensionReasonAdminAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('label',)

class AdministrativeDecisionInline(admin.TabularInline):
    model = AdministrativeDecision
    extra = 0
    fields = ('outcome', 'punishment_type', 'fine_amount', 'decision_date', 'decision_effective_date')

class AdministrativeExecutionInline(admin.TabularInline):
    model = AdministrativeExecution
    extra = 0
    fields = ('execution_result', 'fine_paid', 'execution_date')

class AdministrativeAppealInline(admin.StackedInline):
    model = AdministrativeAppeal
    can_delete = False
    verbose_name_plural = "Апелляционное обжалование"
    fieldsets = (
        ('Поступление жалобы', {
            'fields': ('complaint_filed', 'complaint_type', 'complaint_filed_by', 'complaint_filed_date', 'complaint_received_date')
        }),
        ('Направление в вышестоящий суд', {
            'fields': ('case_sent_to_higher_court_date', 'higher_court_case_number')
        }),
        ('Результат рассмотрения', {
            'fields': ('review_date', 'review_result', 'result_description', 'decision_date', 'decision_effective_date')
        }),
    )

class AdministrativeCassationInline(admin.StackedInline):
    model = AdministrativeCassation
    can_delete = False
    verbose_name_plural = "Кассационное обжалование"
    fieldsets = (
        ('Поступление жалобы', {
            'fields': ('cassation_filed', 'cassation_type', 'cassation_filed_by', 'cassation_filed_date', 'cassation_received_date')
        }),
        ('Результат рассмотрения', {
            'fields': ('cassation_review_date', 'cassation_result', 'cassation_result_description', 'cassation_decision_date')
        }),
    )

class AdministrativeSidesInline(admin.TabularInline):
    model = AdministrativeSidesCaseInCase
    extra = 0
    fields = ('sides_case_incase', 'sides_case_role')
    autocomplete_fields = ('sides_case_incase', 'sides_case_role')

class AdministrativeLawyerInline(admin.TabularInline):
    model = AdministrativeLawyer
    extra = 0
    fields = ('lawyer', 'sides_case_role')
    autocomplete_fields = ('lawyer', 'sides_case_role')

class AdministrativeCaseMovementInline(admin.TabularInline):
    model = AdministrativeCaseMovement
    extra = 0
    fields = ('business_movement',)
    autocomplete_fields = ('business_movement',)

class AdministrativePetitionInline(admin.TabularInline):
    model = AdministrativePetition
    extra = 0
    fields = ('petitions_incase', 'petitioner_type', 'petitioner_id')
    readonly_fields = ('petitioner_info',)


class AdministrativeSubjectInline(admin.TabularInline):
    model = AdministrativeSubject
    extra = 1
    fields = ('subject_type', 'sides_case_incase')
    autocomplete_fields = ('sides_case_incase',)
    verbose_name = "Субъект правонарушения"
    verbose_name_plural = "Субъекты правонарушения"


@admin.register(AdministrativeProceedings)
class AdministrativeProceedingsAdmin(admin.ModelAdmin):
    list_display = ('case_number_admin', 'incoming_date', 'presiding_judge', 'status')
    list_filter = ('status', 'incoming_date', 'presiding_judge')
    search_fields = ('case_number_admin', 'protocol_number')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [
        AdministrativeDecisionInline, AdministrativeExecutionInline,
        AdministrativeAppealInline, AdministrativeCassationInline,
        AdministrativeSidesInline, AdministrativeLawyerInline,
        AdministrativeCaseMovementInline, AdministrativePetitionInline,
        AdministrativeSubjectInline
    ]
    fieldsets = (
        ('Раздел 1. Общие сведения', {
            'fields': (
                'case_number_admin', 'incoming_date', 'incoming_from', 'referring_authority',
                'protocol_number', 'protocol_date', 'judge_acceptance_date',
                'presiding_judge', 'judge_code', 'article_number', 'article_part',
                'offense_description', 'offense_date', 'offense_time', 'offense_place'
            )
        }),
        ('Раздел 2. Рассмотрение дела', {
            'fields': (
                'consideration_type', 'hearing_date', 'hearing_time',
                'hearing_postponed', 'postponement_reason', 'postponement_reason_text', 'postponement_count',
                'case_suspended', 'suspension_reason', 'suspension_reason_text', 'suspension_date', 'resumption_date',
                'term_compliance'
            )
        }),
        ('Раздел 7. Особые отметки и архив', {
            'fields': ('special_notes', 'status', 'archived_date', 'archive_notes', 'registered_case')
        }),
        ('Технические поля', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )