# admin_registry.py
"""
Регистрация всех моделей в кастомном AdminSite
"""
from admin_config import admin_site
from django.contrib import admin

# ============================================================
# 1. users
# ============================================================
from users.models import User
# User уже зарегистрирован через UserAdmin в admin_config.py

# ============================================================
# 2. business_card
# ============================================================
from business_card.models import (
    SidesCase, Petitions, Category, Decisions, BusinessCard,
    SidesCaseInCase, Lawyer, PetitionsInCase, FamiliarizationCase,
    BusinessMovement, ConsideredCase, Appeal, ExecutionCase
)

class SidesCaseAdmin(admin.ModelAdmin):
    list_display = ('sides_case',)
    search_fields = ('sides_case',)

class PetitionsAdmin(admin.ModelAdmin):
    list_display = ('petitions',)
    search_fields = ('petitions',)

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('title_category', 'description')
    search_fields = ('title_category',)

class DecisionsAdmin(admin.ModelAdmin):
    list_display = ('name_case', 'date_consideration')
    search_fields = ('name_case',)

class BusinessCardAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'author', 'case_category', 'pub_date')
    search_fields = ('original_name',)
    list_filter = ('case_category',)

class SidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'phone', 'email')
    search_fields = ('name', 'inn', 'phone', 'email')
    list_filter = ('status',)

class LawyerAdmin(admin.ModelAdmin):
    list_display = ('law_firm_name', 'law_firm_phone', 'law_firm_email')
    search_fields = ('law_firm_name', 'law_firm_phone', 'law_firm_email')

class PetitionsInCaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'date_application', 'date_decision')
    list_filter = ('date_application',)
    search_fields = ('id', 'notation')

class FamiliarizationCaseAdmin(admin.ModelAdmin):
    list_display = ('business_card', 'start_date', 'end_date', 'number_days')
    search_fields = ('business_card__original_name',)

class BusinessMovementAdmin(admin.ModelAdmin):
    list_display = ('id', 'date_meeting', 'meeting_time')
    search_fields = ('date_meeting',)
    filter_horizontal = ('decision_case',)

class ConsideredCaseAdmin(admin.ModelAdmin):
    list_display = ('business_card', 'date_consideration', 'effective_date')
    search_fields = ('business_card__original_name',)
    filter_horizontal = ('name_case', 'notification_parties')

class AppealAdmin(admin.ModelAdmin):
    list_display = ('decision_appeal',)
    search_fields = ('decision_appeal',)

class ExecutionCaseAdmin(admin.ModelAdmin):
    list_display = ('business_card', 'date_notification', 'executive_lists')
    search_fields = ('business_card__original_name',)

admin_site.register(SidesCase, SidesCaseAdmin)
admin_site.register(Petitions, PetitionsAdmin)
admin_site.register(Category, CategoryAdmin)
admin_site.register(Decisions, DecisionsAdmin)
admin_site.register(BusinessCard, BusinessCardAdmin)
admin_site.register(SidesCaseInCase, SidesCaseInCaseAdmin)
admin_site.register(Lawyer, LawyerAdmin)
admin_site.register(PetitionsInCase, PetitionsInCaseAdmin)
admin_site.register(FamiliarizationCase, FamiliarizationCaseAdmin)
admin_site.register(BusinessMovement, BusinessMovementAdmin)
admin_site.register(ConsideredCase, ConsideredCaseAdmin)
admin_site.register(Appeal, AppealAdmin)
admin_site.register(ExecutionCase, ExecutionCaseAdmin)

# ============================================================
# 3. criminal_proceedings
# ============================================================
from criminal_proceedings.models import (
    CriminalProceedings, Defendant, CriminalDecision,
    CriminalRuling, CriminalCaseMovement, ReferringAuthority,
    LawyerCriminal, CriminalSidesCaseInCase, PetitionCriminal,
    CriminalExecution, CriminalDecisions, CriminalCivilClaim,
    CriminalExpertiseType
)
from criminal_proceedings.models_appeal_cassation import (
    CriminalAppealInstance, CriminalCassationInstance,
    CriminalAppealApplicantStatus, CriminalCassationResult, CriminalSupervisoryResult
)
from criminal_proceedings.models_person_card import (
    CriminalPersonCard, PreviousConviction, CrimeComposition, SentencedPunishment
)

class CriminalProceedingsAdmin(admin.ModelAdmin):
    list_display = ('case_number_criminal', 'incoming_date', 'presiding_judge', 'status')
    list_filter = ('status', 'created_at')
    search_fields = ('case_number_criminal', 'incoming_from')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ()

class DefendantAdmin(admin.ModelAdmin):
    list_display = ('full_name_criminal', 'criminal_proceedings', 'birth_date', 'sex')
    search_fields = ('full_name_criminal', 'address')
    list_filter = ('sex', 'citizenship')

class CriminalDecisionAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'name_case', 'appeal_date')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class CriminalRulingAdmin(admin.ModelAdmin):
    list_display = ('title', 'criminal_proceedings', 'ruling_type', 'is_draft')
    list_filter = ('ruling_type', 'is_draft')
    search_fields = ('title', 'criminal_proceedings__case_number_criminal')

class CriminalCaseMovementAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'business_movement')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class ReferringAuthorityAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

class LawyerCriminalAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'lawyer', 'sides_case_role')
    search_fields = ('criminal_proceedings__case_number_criminal', 'lawyer__law_firm_name')

class CriminalSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'sides_case_criminal', 'criminal_side_case')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class PetitionCriminalAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'date_application', 'petitioner_type')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class CriminalExecutionAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'sentence_execution_date', 'execution_sent_to')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class CriminalDecisionsAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

class CriminalCivilClaimAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'plaintiff_name', 'claim_amount', 'result')
    search_fields = ('plaintiff_name', 'criminal_proceedings__case_number_criminal')
    list_filter = ('result',)

class CriminalExpertiseTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

class CriminalAppealInstanceAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'appeal_date', 'appeal_result')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class CriminalCassationInstanceAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceedings', 'cassation_date', 'cassation_result')
    search_fields = ('criminal_proceedings__case_number_criminal',)

class CriminalAppealApplicantStatusAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

class CriminalCassationResultAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

class CriminalSupervisoryResultAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

class CriminalPersonCardAdmin(admin.ModelAdmin):
    list_display = ('defendant', 'criminal_proceedings', 'is_completed')
    search_fields = ('defendant__full_name_criminal', 'criminal_proceedings__case_number_criminal')
    list_filter = ('is_completed',)

class PreviousConvictionAdmin(admin.ModelAdmin):
    list_display = ('person_card', 'sentence_date', 'article', 'punishment_type')
    search_fields = ('person_card__defendant__full_name_criminal', 'article')

class CrimeCompositionAdmin(admin.ModelAdmin):
    list_display = ('person_card', 'instance', 'article', 'crime_stage')
    list_filter = ('instance', 'article_type', 'crime_stage')

class SentencedPunishmentAdmin(admin.ModelAdmin):
    list_display = ('person_card', 'instance', 'punishment_category', 'punishment_type')
    list_filter = ('instance', 'punishment_category')

admin_site.register(CriminalProceedings, CriminalProceedingsAdmin)
admin_site.register(Defendant, DefendantAdmin)
admin_site.register(CriminalDecision, CriminalDecisionAdmin)
admin_site.register(CriminalRuling, CriminalRulingAdmin)
admin_site.register(CriminalCaseMovement, CriminalCaseMovementAdmin)
admin_site.register(ReferringAuthority, ReferringAuthorityAdmin)
admin_site.register(LawyerCriminal, LawyerCriminalAdmin)
admin_site.register(CriminalSidesCaseInCase, CriminalSidesCaseInCaseAdmin)
admin_site.register(PetitionCriminal, PetitionCriminalAdmin)
admin_site.register(CriminalExecution, CriminalExecutionAdmin)
admin_site.register(CriminalDecisions, CriminalDecisionsAdmin)
admin_site.register(CriminalCivilClaim, CriminalCivilClaimAdmin)
admin_site.register(CriminalExpertiseType, CriminalExpertiseTypeAdmin)
admin_site.register(CriminalAppealInstance, CriminalAppealInstanceAdmin)
admin_site.register(CriminalCassationInstance, CriminalCassationInstanceAdmin)
admin_site.register(CriminalAppealApplicantStatus, CriminalAppealApplicantStatusAdmin)
admin_site.register(CriminalCassationResult, CriminalCassationResultAdmin)
admin_site.register(CriminalSupervisoryResult, CriminalSupervisoryResultAdmin)
admin_site.register(CriminalPersonCard, CriminalPersonCardAdmin)
admin_site.register(PreviousConviction, PreviousConvictionAdmin)
admin_site.register(CrimeComposition, CrimeCompositionAdmin)
admin_site.register(SentencedPunishment, SentencedPunishmentAdmin)

# ============================================================
# 4. civil_proceedings
# ============================================================
from civil_proceedings.models import (
    CivilProceedings, CivilDecision, CivilExecution,
    CivilSidesCaseInCase, CivilLawyer,
    CivilCaseMovement, CivilPetition, ReferringAuthorityCivil,
    CivilProceedingsType
)

class CivilProceedingsTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class ReferringAuthorityCivilAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

class CivilProceedingsAdmin(admin.ModelAdmin):
    list_display = ('case_number_civil', 'incoming_date', 'presiding_judge', 'status')
    list_filter = ('status', 'incoming_date')
    search_fields = ('case_number_civil', 'incoming_from')
    readonly_fields = ('created_at', 'updated_at')

class CivilDecisionAdmin(admin.ModelAdmin):
    list_display = ('civil_proceedings', 'decision_date', 'outcome')
    search_fields = ('civil_proceedings__case_number_civil',)
    list_filter = ('outcome',)

class CivilExecutionAdmin(admin.ModelAdmin):
    list_display = ('civil_proceedings', 'execution_date', 'execution_amount')
    search_fields = ('civil_proceedings__case_number_civil',)

class CivilSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('civil_proceedings', 'sides_case_incase', 'sides_case_role')
    search_fields = ('civil_proceedings__case_number_civil',)

class CivilLawyerAdmin(admin.ModelAdmin):
    list_display = ('civil_proceedings', 'lawyer', 'sides_case_role')
    search_fields = ('civil_proceedings__case_number_civil',)

class CivilCaseMovementAdmin(admin.ModelAdmin):
    list_display = ('civil_proceedings', 'business_movement')
    search_fields = ('civil_proceedings__case_number_civil',)

class CivilPetitionAdmin(admin.ModelAdmin):
    list_display = ('civil_proceedings', 'petitions_incase', 'petitioner_type')
    search_fields = ('civil_proceedings__case_number_civil',)

admin_site.register(CivilProceedingsType, CivilProceedingsTypeAdmin)
admin_site.register(ReferringAuthorityCivil, ReferringAuthorityCivilAdmin)
admin_site.register(CivilProceedings, CivilProceedingsAdmin)
admin_site.register(CivilDecision, CivilDecisionAdmin)
admin_site.register(CivilExecution, CivilExecutionAdmin)
admin_site.register(CivilSidesCaseInCase, CivilSidesCaseInCaseAdmin)
admin_site.register(CivilLawyer, CivilLawyerAdmin)
admin_site.register(CivilCaseMovement, CivilCaseMovementAdmin)
admin_site.register(CivilPetition, CivilPetitionAdmin)

# ============================================================
# 5. administrative_proceedings (КАС)
# ============================================================
from administrative_proceedings.models import (
    KasProceedings, KasDecision, KasExecution,
    KasSidesCaseInCase, KasLawyer, KasCaseMovement,
    KasPetition, ReferringAuthorityKas,
    AdmissionOrder, PostponementReason, SuspensionReason,
    PreliminaryProtection, ExpertiseType, AppealResult,
    CassationResult, TermCompliance, Outcome
)

class AdmissionOrderAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class PostponementReasonAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class SuspensionReasonAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class PreliminaryProtectionAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class ExpertiseTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class AppealResultAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class CassationResultAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class TermComplianceAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class OutcomeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('code', 'label')

class ReferringAuthorityKasAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

class KasProceedingsAdmin(admin.ModelAdmin):
    list_display = ('case_number_kas', 'incoming_date', 'presiding_judge', 'status')
    list_filter = ('status', 'incoming_date')
    search_fields = ('case_number_kas',)
    readonly_fields = ('created_at', 'updated_at')

class KasDecisionAdmin(admin.ModelAdmin):
    list_display = ('kas_proceedings', 'decision_date', 'outcome')
    search_fields = ('kas_proceedings__case_number_kas',)

class KasExecutionAdmin(admin.ModelAdmin):
    list_display = ('kas_proceedings', 'execution_date', 'execution_amount')
    search_fields = ('kas_proceedings__case_number_kas',)

class KasSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('kas_proceedings', 'sides_case_incase', 'sides_case_role')
    search_fields = ('kas_proceedings__case_number_kas',)

class KasLawyerAdmin(admin.ModelAdmin):
    list_display = ('kas_proceedings', 'lawyer', 'sides_case_role')
    search_fields = ('kas_proceedings__case_number_kas',)

class KasCaseMovementAdmin(admin.ModelAdmin):
    list_display = ('kas_proceedings', 'business_movement')
    search_fields = ('kas_proceedings__case_number_kas',)

class KasPetitionAdmin(admin.ModelAdmin):
    list_display = ('kas_proceedings', 'petitions_incase')
    search_fields = ('kas_proceedings__case_number_kas',)

admin_site.register(AdmissionOrder, AdmissionOrderAdmin)
admin_site.register(PostponementReason, PostponementReasonAdmin)
admin_site.register(SuspensionReason, SuspensionReasonAdmin)
admin_site.register(PreliminaryProtection, PreliminaryProtectionAdmin)
admin_site.register(ExpertiseType, ExpertiseTypeAdmin)
admin_site.register(AppealResult, AppealResultAdmin)
admin_site.register(CassationResult, CassationResultAdmin)
admin_site.register(TermCompliance, TermComplianceAdmin)
admin_site.register(Outcome, OutcomeAdmin)
admin_site.register(ReferringAuthorityKas, ReferringAuthorityKasAdmin)
admin_site.register(KasProceedings, KasProceedingsAdmin)
admin_site.register(KasDecision, KasDecisionAdmin)
admin_site.register(KasExecution, KasExecutionAdmin)
admin_site.register(KasSidesCaseInCase, KasSidesCaseInCaseAdmin)
admin_site.register(KasLawyer, KasLawyerAdmin)
admin_site.register(KasCaseMovement, KasCaseMovementAdmin)
admin_site.register(KasPetition, KasPetitionAdmin)

# ============================================================
# 6. administrative_code (КоАП)
# ============================================================
from administrative_code.models import (
    AdministrativeProceedings, AdministrativeDecision, AdministrativeExecution,
    AdministrativeSidesCaseInCase, AdministrativeLawyer,
    AdministrativeCaseMovement, AdministrativePetition, ReferringAuthorityAdmin as RefAuthorityAdmin,
    PostponementReasonAdmin as PostpReasonAdmin,
    SuspensionReasonAdmin as SuspReasonAdmin,
    AdministrativeAppeal, AdministrativeCassation, AdministrativeSubject,
    AdministrativeSecurityMeasure
)

class RefAuthorityAdminAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')

class PostpReasonAdminAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('label',)

class SuspReasonAdminAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')
    search_fields = ('label',)

class AdministrativeProceedingsAdmin(admin.ModelAdmin):
    list_display = ('case_number_admin', 'incoming_date', 'presiding_judge', 'status')
    list_filter = ('status', 'incoming_date')
    search_fields = ('case_number_admin', 'protocol_number')
    readonly_fields = ('created_at', 'updated_at')

class AdministrativeDecisionAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'decision_date', 'outcome', 'fine_amount')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeExecutionAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'execution_date', 'fine_paid')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'sides_case_incase', 'sides_case_role')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeLawyerAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'lawyer', 'sides_case_role')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeCaseMovementAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'business_movement')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativePetitionAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'petitions_incase', 'petitioner_type')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeAppealAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'complaint_filed', 'review_date')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeCassationAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'cassation_filed', 'cassation_review_date')
    search_fields = ('administrative_proceedings__case_number_admin',)

class AdministrativeSubjectAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'subject_type', 'sides_case_incase')
    list_filter = ('subject_type',)

class AdministrativeSecurityMeasureAdmin(admin.ModelAdmin):
    list_display = ('administrative_proceedings', 'measure_type', 'applied_date')
    list_filter = ('measure_type',)

admin_site.register(RefAuthorityAdmin, RefAuthorityAdminAdmin)
admin_site.register(PostpReasonAdmin, PostpReasonAdminAdmin)
admin_site.register(SuspReasonAdmin, SuspReasonAdminAdmin)
admin_site.register(AdministrativeProceedings, AdministrativeProceedingsAdmin)
admin_site.register(AdministrativeDecision, AdministrativeDecisionAdmin)
admin_site.register(AdministrativeExecution, AdministrativeExecutionAdmin)
admin_site.register(AdministrativeSidesCaseInCase, AdministrativeSidesCaseInCaseAdmin)
admin_site.register(AdministrativeLawyer, AdministrativeLawyerAdmin)
admin_site.register(AdministrativeCaseMovement, AdministrativeCaseMovementAdmin)
admin_site.register(AdministrativePetition, AdministrativePetitionAdmin)
admin_site.register(AdministrativeAppeal, AdministrativeAppealAdmin)
admin_site.register(AdministrativeCassation, AdministrativeCassationAdmin)
admin_site.register(AdministrativeSubject, AdministrativeSubjectAdmin)
admin_site.register(AdministrativeSecurityMeasure, AdministrativeSecurityMeasureAdmin)

# ============================================================
# 7. case_registry
# ============================================================
from case_registry.models import RegistryIndex, RegistryCounter, RegisteredCase, NumberAdjustment, Correspondence

class RegistryIndexAdmin(admin.ModelAdmin):
    list_display = ('index', 'name', 'created_at')
    search_fields = ('index', 'name')

class RegistryCounterAdmin(admin.ModelAdmin):
    list_display = ('index', 'current_number', 'total_registered', 'last_used')
    readonly_fields = ('last_used', 'total_registered')

class RegisteredCaseAdmin(admin.ModelAdmin):
    list_display = ('full_number', 'index', 'registration_date', 'status')
    list_filter = ('index', 'status', 'registration_date')
    search_fields = ('full_number', 'description')
    readonly_fields = ('full_number', 'created_at', 'updated_at')

class NumberAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('index', 'old_number', 'new_number', 'adjusted_by', 'adjusted_at')
    list_filter = ('index', 'adjusted_at')

class CorrespondenceAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'correspondence_type', 'sender', 'recipient', 'status')
    list_filter = ('correspondence_type', 'status', 'registration_date')
    search_fields = ('registration_number', 'sender', 'recipient')

admin_site.register(RegistryIndex, RegistryIndexAdmin)
admin_site.register(RegistryCounter, RegistryCounterAdmin)
admin_site.register(RegisteredCase, RegisteredCaseAdmin)
admin_site.register(NumberAdjustment, NumberAdjustmentAdmin)
admin_site.register(Correspondence, CorrespondenceAdmin)

# ============================================================
# 8. case_documents
# ============================================================
from case_documents.models import DocumentTemplate, CaseDocument, PartyDocument, PartyDocumentHistory

class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'case_category', 'is_active', 'created_at')
    list_filter = ('case_category', 'is_active')
    search_fields = ('name', 'description')

class CaseDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'template', 'status', 'created_at')
    list_filter = ('status', 'template')
    search_fields = ('title', 'content')
    readonly_fields = ('created_by', 'created_at', 'updated_at')

class PartyDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'document_type', 'review_status', 'submitter_name', 'created_at')
    list_filter = ('document_type', 'review_status')
    search_fields = ('title', 'submitter_name', 'registration_number')
    readonly_fields = ('created_at', 'updated_at')

class PartyDocumentHistoryAdmin(admin.ModelAdmin):
    list_display = ('document', 'previous_status', 'new_status', 'changed_by', 'created_at')
    list_filter = ('previous_status', 'new_status')
    search_fields = ('document__title', 'changed_by')

admin_site.register(DocumentTemplate, DocumentTemplateAdmin)
admin_site.register(CaseDocument, CaseDocumentAdmin)
admin_site.register(PartyDocument, PartyDocumentAdmin)
admin_site.register(PartyDocumentHistory, PartyDocumentHistoryAdmin)

# ============================================================
# 9. notifications
# ============================================================
from notifications.models import (
    Notification, JurisdictionCheck, DeadlineWarning, NotificationRule,
    LegalReference, CaseActivity, CaseNotificationSummary
)

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'priority', 'is_read', 'created_at')
    list_filter = ('priority', 'is_read', 'created_at')
    search_fields = ('title', 'message')

class JurisdictionCheckAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceeding', 'user', 'is_correct', 'checked_at')
    list_filter = ('is_correct',)

class DeadlineWarningAdmin(admin.ModelAdmin):
    list_display = ('criminal_proceeding', 'warning_type', 'deadline_date', 'days_remaining')
    list_filter = ('warning_type', 'is_active')

class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'rule_type', 'active')
    list_filter = ('rule_type', 'active')

class LegalReferenceAdmin(admin.ModelAdmin):
    list_display = ('title', 'ref_type', 'created_at')
    list_filter = ('ref_type',)

class CaseActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'title', 'is_read_by_judge', 'created_at')
    list_filter = ('activity_type', 'is_read_by_judge')

class CaseNotificationSummaryAdmin(admin.ModelAdmin):
    list_display = ('judge', 'total_unread', 'updated_at')
    list_filter = ('judge',)

admin_site.register(Notification, NotificationAdmin)
admin_site.register(JurisdictionCheck, JurisdictionCheckAdmin)
admin_site.register(DeadlineWarning, DeadlineWarningAdmin)
admin_site.register(NotificationRule, NotificationRuleAdmin)
admin_site.register(LegalReference, LegalReferenceAdmin)
admin_site.register(CaseActivity, CaseActivityAdmin)
admin_site.register(CaseNotificationSummary, CaseNotificationSummaryAdmin)

# ============================================================
# 10. other_materials
# ============================================================
from other_materials.models import (
    OtherMaterial, OtherMaterialType,
    OtherMaterialSidesCaseInCase, OtherMaterialLawyer,
    OtherMaterialDecision
)

class OtherMaterialTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')

class OtherMaterialAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'registration_date', 'material_type', 'status')
    list_filter = ('material_type', 'status')
    search_fields = ('registration_number', 'title', 'sender')

class OtherMaterialSidesCaseInCaseAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'sides_case_incase', 'sides_case_role')
    list_filter = ('sides_case_role',)

class OtherMaterialLawyerAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'lawyer', 'sides_case_role')
    list_filter = ('sides_case_role',)

class OtherMaterialDecisionAdmin(admin.ModelAdmin):
    list_display = ('other_material', 'decision_date', 'outcome')
    list_filter = ('outcome',)

admin_site.register(OtherMaterialType, OtherMaterialTypeAdmin)
admin_site.register(OtherMaterial, OtherMaterialAdmin)
admin_site.register(OtherMaterialSidesCaseInCase, OtherMaterialSidesCaseInCaseAdmin)
admin_site.register(OtherMaterialLawyer, OtherMaterialLawyerAdmin)
admin_site.register(OtherMaterialDecision, OtherMaterialDecisionAdmin)

# ============================================================
# 11. case_management
# ============================================================
from case_management.models import (
    ProgressActionType, CaseProgressEntry,
    NotificationChannel, NotificationStatus,
    NotificationTemplate, Notification as CaseNotification,
    CaseDeadlineSettings, DeadlineViolation
)

class ProgressActionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'case_category', 'is_active')
    list_filter = ('case_category', 'is_active')
    search_fields = ('name', 'code')

class CaseProgressEntryAdmin(admin.ModelAdmin):
    list_display = ('case', 'action_type', 'action_date', 'author')
    list_filter = ('action_type', 'action_date')
    search_fields = ('case_object_id',)

class NotificationChannelAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    list_filter = ('is_active',)

class NotificationStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_final')
    list_filter = ('is_final',)

class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'case_category', 'participant_type', 'is_active')
    list_filter = ('case_category', 'participant_type', 'is_active')

class CaseNotificationAdmin(admin.ModelAdmin):
    list_display = ('participant_name', 'hearing_date', 'status', 'created_at')
    list_filter = ('status', 'channel')
    search_fields = ('participant_name',)

class CaseDeadlineSettingsAdmin(admin.ModelAdmin):
    list_display = ('category', 'enable_deadline_tracking')
    list_filter = ('category',)

class DeadlineViolationAdmin(admin.ModelAdmin):
    list_display = ('deadline_type', 'deadline_days', 'actual_days', 'resolved')
    list_filter = ('deadline_type', 'resolved')

admin_site.register(ProgressActionType, ProgressActionTypeAdmin)
admin_site.register(CaseProgressEntry, CaseProgressEntryAdmin)
admin_site.register(NotificationChannel, NotificationChannelAdmin)
admin_site.register(NotificationStatus, NotificationStatusAdmin)
admin_site.register(NotificationTemplate, NotificationTemplateAdmin)
admin_site.register(CaseNotification, CaseNotificationAdmin)
admin_site.register(CaseDeadlineSettings, CaseDeadlineSettingsAdmin)
admin_site.register(DeadlineViolation, DeadlineViolationAdmin)

# ============================================================
# 12. court_registry
# ============================================================
from court_registry.models import (
    Region, CourtLevel, Court, CourtDirectory,
    CourtPhone, CourtEmail, CourtWorkingHours,
    CourtDepartment, CourtEmployee,
    CaseTransferType, CaseTransferStatus,
    CaseTransfer, CaseTransferItem, CaseTransferDocument, CaseTransferSide,
    IncomingCaseNotification, PendingTransferCase,
    VCSRequest, CourtMessengerRegistration, CourtInteractionAuditLog
)

class RegionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')

class CourtLevelAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'hierarchy_level')
    ordering = ('hierarchy_level',)

class CourtAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_short', 'region', 'level', 'is_active')
    list_filter = ('is_active', 'region', 'level')
    search_fields = ('name', 'code')

class CourtDirectoryAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'region', 'level', 'is_active')
    list_filter = ('is_active', 'region', 'level')
    search_fields = ('name', 'code')

class CourtPhoneAdmin(admin.ModelAdmin):
    list_display = ('court', 'phone', 'phone_type', 'is_active')
    list_filter = ('phone_type', 'is_active')

class CourtEmailAdmin(admin.ModelAdmin):
    list_display = ('court', 'email', 'email_type', 'is_active')
    list_filter = ('email_type', 'is_active')

class CourtWorkingHoursAdmin(admin.ModelAdmin):
    list_display = ('court', 'day_of_week', 'is_working_day')
    list_filter = ('day_of_week', 'is_working_day')

class CourtDepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)

class CourtEmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee', 'department', 'position', 'is_active')
    list_filter = ('is_active', 'department')
    search_fields = ('employee__first_name', 'employee__last_name', 'position')

class CaseTransferTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')

class CaseTransferStatusAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_terminal')

class CaseTransferAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'source_court', 'destination_court', 'status', 'created_at')
    list_filter = ('status', 'transfer_type')
    search_fields = ('uuid',)

class CaseTransferItemAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'case_category', 'transfer', 'is_accepted')
    list_filter = ('case_category', 'is_accepted')

class CaseTransferDocumentAdmin(admin.ModelAdmin):
    list_display = ('transfer_item', 'original_filename', 'file_type')
    list_filter = ('file_type',)

class CaseTransferSideAdmin(admin.ModelAdmin):
    list_display = ('transfer_item', 'role', 'name', 'status')
    list_filter = ('status',)

class IncomingCaseNotificationAdmin(admin.ModelAdmin):
    list_display = ('court', 'total_count', 'status', 'created_at')
    list_filter = ('status', 'court')

class PendingTransferCaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'case_category', 'transfer_reason', 'status')
    list_filter = ('case_category', 'transfer_reason', 'status')

class VCSRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'initiator_court', 'scheduled_at', 'status')
    list_filter = ('status', 'initiator_court')

class CourtMessengerRegistrationAdmin(admin.ModelAdmin):
    list_display = ('court', 'is_registered', 'is_online', 'last_ping')
    list_filter = ('is_registered', 'is_online')

class CourtInteractionAuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'court', 'user')
    list_filter = ('action', 'court')

admin_site.register(Region, RegionAdmin)
admin_site.register(CourtLevel, CourtLevelAdmin)
admin_site.register(Court, CourtAdmin)
admin_site.register(CourtDirectory, CourtDirectoryAdmin)
admin_site.register(CourtPhone, CourtPhoneAdmin)
admin_site.register(CourtEmail, CourtEmailAdmin)
admin_site.register(CourtWorkingHours, CourtWorkingHoursAdmin)
admin_site.register(CourtDepartment, CourtDepartmentAdmin)
admin_site.register(CourtEmployee, CourtEmployeeAdmin)
admin_site.register(CaseTransferType, CaseTransferTypeAdmin)
admin_site.register(CaseTransferStatus, CaseTransferStatusAdmin)
admin_site.register(CaseTransfer, CaseTransferAdmin)
admin_site.register(CaseTransferItem, CaseTransferItemAdmin)
admin_site.register(CaseTransferDocument, CaseTransferDocumentAdmin)
admin_site.register(CaseTransferSide, CaseTransferSideAdmin)
admin_site.register(IncomingCaseNotification, IncomingCaseNotificationAdmin)
admin_site.register(PendingTransferCase, PendingTransferCaseAdmin)
admin_site.register(VCSRequest, VCSRequestAdmin)
admin_site.register(CourtMessengerRegistration, CourtMessengerRegistrationAdmin)
admin_site.register(CourtInteractionAuditLog, CourtInteractionAuditLogAdmin)

# ============================================================
# 13. communication
# ============================================================
from communication.models import (
    Chat, ChatMember, Message, MessageRead, MessageAttachment,
    Broadcast, BroadcastRecipient, Task, TaskComment, TaskAttachment,
    DocumentExchange, DocumentExchangeAttachment,
    IntercourtRoute, AutoNotificationRule,
    MessageAnalytics, MessageSearchIndex, VideoConference
)

class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat_type', 'title', 'court', 'is_active')
    list_filter = ('chat_type', 'is_active')
    search_fields = ('title', 'description')

class ChatMemberAdmin(admin.ModelAdmin):
    list_display = ('chat', 'user', 'role', 'is_active')
    list_filter = ('role', 'is_active')

class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat', 'sender', 'message_type', 'created_at')
    list_filter = ('message_type', 'is_deleted')
    search_fields = ('text',)

class MessageReadAdmin(admin.ModelAdmin):
    list_display = ('message', 'user', 'read_at')
    list_filter = ('read_at',)

class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'file_type', 'file_size', 'created_at')
    list_filter = ('file_type',)

class BroadcastAdmin(admin.ModelAdmin):
    list_display = ('title', 'sender', 'status', 'created_at')
    list_filter = ('status', 'broadcast_type')
    search_fields = ('title',)

class BroadcastRecipientAdmin(admin.ModelAdmin):
    list_display = ('broadcast', 'user', 'is_read', 'delivered_at')
    list_filter = ('is_read',)

class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'assigned_to', 'status', 'priority', 'deadline')
    list_filter = ('status', 'priority')

class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author', 'created_at')
    list_filter = ('created_at',)

class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ('task', 'original_filename', 'file_size', 'created_at')

class DocumentExchangeAdmin(admin.ModelAdmin):
    list_display = ('title', 'source_court', 'target_court', 'status', 'created_at')
    list_filter = ('status', 'document_type')
    search_fields = ('title', 'reference_number')

class DocumentExchangeAttachmentAdmin(admin.ModelAdmin):
    list_display = ('exchange', 'original_filename', 'file_size', 'created_at')

class IntercourtRouteAdmin(admin.ModelAdmin):
    list_display = ('source_level', 'target_level', 'direction', 'is_active')
    list_filter = ('is_active', 'source_level', 'target_level')

class AutoNotificationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'trigger', 'is_active')
    list_filter = ('trigger', 'is_active')

class MessageAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('court', 'date', 'total_messages', 'active_users')
    list_filter = ('court', 'date')

class MessageSearchIndexAdmin(admin.ModelAdmin):
    list_display = ('message', 'sender_name', 'created_at')
    search_fields = ('text_content', 'sender_name', 'chat_title')

class VideoConferenceAdmin(admin.ModelAdmin):
    list_display = ('title', 'chat', 'scheduled_at', 'status')
    list_filter = ('status',)

admin_site.register(Chat, ChatAdmin)
admin_site.register(ChatMember, ChatMemberAdmin)
admin_site.register(Message, MessageAdmin)
admin_site.register(MessageRead, MessageReadAdmin)
admin_site.register(MessageAttachment, MessageAttachmentAdmin)
admin_site.register(Broadcast, BroadcastAdmin)
admin_site.register(BroadcastRecipient, BroadcastRecipientAdmin)
admin_site.register(Task, TaskAdmin)
admin_site.register(TaskComment, TaskCommentAdmin)
admin_site.register(TaskAttachment, TaskAttachmentAdmin)
admin_site.register(DocumentExchange, DocumentExchangeAdmin)
admin_site.register(DocumentExchangeAttachment, DocumentExchangeAttachmentAdmin)
admin_site.register(IntercourtRoute, IntercourtRouteAdmin)
admin_site.register(AutoNotificationRule, AutoNotificationRuleAdmin)
admin_site.register(MessageAnalytics, MessageAnalyticsAdmin)
admin_site.register(MessageSearchIndex, MessageSearchIndexAdmin)
admin_site.register(VideoConference, VideoConferenceAdmin)

# ============================================================
# 14. side_case_access
# ============================================================
from side_case_access.models import ExternalUser, CaseAccessGrant, SyncLog, SideCaseLink

class ExternalUserAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'social_provider', 'is_active')
    list_filter = ('social_provider', 'is_active')
    search_fields = ('full_name', 'email', 'social_id')

class CaseAccessGrantAdmin(admin.ModelAdmin):
    list_display = ('external_user', 'case', 'access_level', 'is_active')
    list_filter = ('access_level', 'is_active')
    search_fields = ('external_user__full_name',)

class SyncLogAdmin(admin.ModelAdmin):
    list_display = ('external_user', 'synced_at', 'cases_added', 'triggered_by')
    list_filter = ('triggered_by',)

class SideCaseLinkAdmin(admin.ModelAdmin):
    list_display = ('side_type', 'side_id', 'case', 'created_at')
    list_filter = ('side_type',)

admin_site.register(ExternalUser, ExternalUserAdmin)
admin_site.register(CaseAccessGrant, CaseAccessGrantAdmin)
admin_site.register(SyncLog, SyncLogAdmin)
admin_site.register(SideCaseLink, SideCaseLinkAdmin)

# ============================================================
# 15. legal_codes
# ============================================================
from legal_codes.models import (
    CriminalCodeArticle, CivilCodeArticle,
    AdministrativeCodeArticle, KASCodeArticle
)

class CriminalCodeArticleAdmin(admin.ModelAdmin):
    list_display = ('full_number', 'title_short', 'chapter')
    list_filter = ('chapter', 'is_active')
    search_fields = ('full_number', 'title', 'full_text')
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'

class CivilCodeArticleAdmin(admin.ModelAdmin):
    list_display = ('full_number', 'title_short', 'part', 'chapter')
    list_filter = ('part', 'chapter', 'is_active')
    search_fields = ('full_number', 'title', 'full_text')
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'

class AdministrativeCodeArticleAdmin(admin.ModelAdmin):
    list_display = ('full_number', 'title_short', 'section', 'chapter')
    list_filter = ('section', 'chapter', 'is_active')
    search_fields = ('full_number', 'title', 'full_text')
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'

class KASCodeArticleAdmin(admin.ModelAdmin):
    list_display = ('full_number', 'title_short', 'section', 'chapter')
    list_filter = ('section', 'chapter', 'is_active')
    search_fields = ('full_number', 'title', 'full_text')
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'

admin_site.register(CriminalCodeArticle, CriminalCodeArticleAdmin)
admin_site.register(CivilCodeArticle, CivilCodeArticleAdmin)
admin_site.register(AdministrativeCodeArticle, AdministrativeCodeArticleAdmin)
admin_site.register(KASCodeArticle, KASCodeArticleAdmin)

# ============================================================
# 16. legal_documents
# ============================================================
from legal_documents.models import LegalDocument

class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'document_type', 'category', 'is_active', 'uploaded_at')
    list_filter = ('document_type', 'category', 'is_active')
    search_fields = ('title', 'description', 'keywords')
    readonly_fields = ('uploaded_at', 'updated_at')

admin_site.register(LegalDocument, LegalDocumentAdmin)

# ============================================================
# 17. personnel
# ============================================================
from personnel.models import AbsenceType, AbsenceRecord

class AbsenceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    list_filter = ('is_active',)

class AbsenceRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'absence_type', 'block_start_date', 'block_end_date')
    list_filter = ('absence_type',)

admin_site.register(AbsenceType, AbsenceTypeAdmin)
admin_site.register(AbsenceRecord, AbsenceRecordAdmin)

# ============================================================
# 18. judge_assistant
# ============================================================
from judge_assistant.models import JudgeNote, SupremeCourtDocumentRef

class JudgeNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'criminal_proceedings', 'note_type', 'is_completed')
    list_filter = ('note_type', 'importance', 'is_completed')
    search_fields = ('title', 'content')

class SupremeCourtDocumentRefAdmin(admin.ModelAdmin):
    list_display = ('title', 'document_type', 'is_active')
    list_filter = ('document_type', 'applicable_stages', 'is_active')
    search_fields = ('title', 'keywords', 'number')

admin_site.register(JudgeNote, JudgeNoteAdmin)
admin_site.register(SupremeCourtDocumentRef, SupremeCourtDocumentRefAdmin)

# ============================================================
# 19. statistics_app
# ============================================================
# Если есть модели в statistics_app, добавьте их здесь

print(f"✅ Все модели зарегистрированы в CustomAdminSite")