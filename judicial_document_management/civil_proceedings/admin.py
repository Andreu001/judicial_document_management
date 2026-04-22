from django.contrib import admin
from django.db import models as db_models
from django.utils.html import format_html
from .models import (
    CivilProceedings, CivilDecision, CivilExecution,
    CivilSidesCaseInCase, CivilLawyer,
    CivilCaseMovement, CivilPetition, ReferringAuthorityCivil,
    CivilProceedingsType
)


@admin.register(CivilProceedingsType)
class CivilProceedingsTypeAdmin(admin.ModelAdmin):
    """Админка для справочника видов производств (исковое, приказное, особое, упрощенное)"""
    list_display = ('code', 'label')
    list_display_links = ('code', 'label')
    search_fields = ('code', 'label')
    ordering = ('code',)


@admin.register(ReferringAuthorityCivil)
class ReferringAuthorityCivilAdmin(admin.ModelAdmin):
    """Админка для органов, направивших материалы"""
    list_display = ('name', 'code')
    list_display_links = ('name',)
    search_fields = ('name', 'code')
    ordering = ('name',)


class CivilDecisionInline(admin.TabularInline):
    """Решения по делу (прямо в карточке дела)"""
    model = CivilDecision
    extra = 0
    fields = ('decision_date', 'outcome', 'appeal_result', 'cassation_result')
    readonly_fields = ('decision_date',)
    can_delete = True
    show_change_link = True


class CivilExecutionInline(admin.TabularInline):
    """Исполнения по делу"""
    model = CivilExecution
    extra = 0
    fields = ('decision_effective_date', 'execution_date', 'execution_amount', 'execution_result')
    readonly_fields = ('decision_effective_date',)
    can_delete = True
    show_change_link = True


class CivilSidesCaseInCaseInline(admin.TabularInline):
    """Стороны по делу"""
    model = CivilSidesCaseInCase
    extra = 0
    fields = ('sides_case_incase', 'sides_case_role')
    raw_id_fields = ('sides_case_incase', 'sides_case_role')  # Вместо autocomplete_fields
    can_delete = True


class CivilLawyerInline(admin.TabularInline):
    """Адвокаты по делу"""
    model = CivilLawyer
    extra = 0
    fields = ('lawyer', 'sides_case_role')
    raw_id_fields = ('lawyer', 'sides_case_role')  # Вместо autocomplete_fields
    can_delete = True


class CivilCaseMovementInline(admin.TabularInline):
    """Движение дела"""
    model = CivilCaseMovement
    extra = 0
    fields = ('business_movement',)
    raw_id_fields = ('business_movement',)  # Вместо autocomplete_fields
    can_delete = True


class CivilPetitionInline(admin.TabularInline):
    """Ходатайства по делу"""
    model = CivilPetition
    extra = 0
    fields = ('petitions_incase', 'petitioner_type', 'petitioner_id')
    raw_id_fields = ('petitions_incase',)  # Вместо autocomplete_fields
    can_delete = True


@admin.register(CivilProceedings)
class CivilProceedingsAdmin(admin.ModelAdmin):
    """Основная админка для гражданских дел"""
    
    # Поля, отображаемые в списке дел
    list_display = (
        'case_number_civil', 'incoming_date', 'status_colored', 
        'case_type_display', 'presiding_judge_short', 'get_registered_case_short'
    )
    list_display_links = ('case_number_civil',)
    list_filter = ('status', 'case_type', 'incoming_date', 'hearing_compliance')
    search_fields = ('case_number_civil', 'incoming_from', 'category')
    date_hierarchy = 'incoming_date'
    
    # Поля только для чтения
    readonly_fields = ('created_at', 'updated_at', 'get_registered_case_info')
    
    # Разделы в карточке дела (группировка полей)
    fieldsets = (
        ('1. Общие сведения', {
            'fields': (
                'case_number_civil', 'incoming_date', 'incoming_from', 
                'referring_authority', 'judge_acceptance_date',
                'presiding_judge', 'judge_code', 'category', 'case_type'
            )
        }),
        ('1.1. Досудебная подготовка', {
            'classes': ('collapse',),
            'fields': (
                'is_collective_claim', 'number_of_plaintiffs', 'admission_order',
                'related_case_number', 'previous_court_code', 'state_duty_amount',
                'state_duty_payer', 'state_duty_paid', 'ruling_preparation',
                'ruling_preparation_date', 'is_simplified_procedure', 'control_date',
                'ruling_preliminary_hearing', 'preliminary_hearing_date',
                'ruling_closed_hearing', 'ruling_court_order', 'court_order_sent_date',
                'court_order_received_date', 'ruling_expertise', 'expertise_sent_date',
                'expertise_received_date', 'expertise_institution', 'expertise_type',
                'preliminary_protection', 'preliminary_protection_date',
                'ruling_transition_to_general', 'ruling_transition_date',
                'ruling_scheduled_trial', 'scheduled_trial_date', 'is_state_secret'
            )
        }),
        ('2. Рассмотрение дела', {
            'classes': ('collapse',),
            'fields': (
                'preliminary_hearing_result', 'first_hearing_date', 'hearing_date',
                'is_vcs_used', 'is_audio_recorded', 'is_video_recorded',
                'hearing_compliance', 'hearing_postponed', 'postponement_count',
                'postponement_reason_code', 'postponement_reason_text',
                'case_suspended', 'suspension_date', 'suspension_reason_code',
                'suspension_reason_text', 'suspension_clause', 'suspension_article',
                'resumption_date', 'suspension_duration_days', 'reconciliation_deadline_date'
            )
        }),
        ('7. Особые отметки и архив', {
            'fields': (
                'special_notes', 'status', 'archived_date', 'archive_notes',
                'registered_case'
            )
        }),
        ('Технические поля', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at', 'get_registered_case_info')
        }),
    )
    
    # Встроенные таблицы (Inline)
    inlines = [
        CivilDecisionInline,
        CivilExecutionInline,
        CivilSidesCaseInCaseInline,
        CivilLawyerInline,
        CivilCaseMovementInline,
        CivilPetitionInline
    ]
    
    # Автодополнение для ForeignKey полей (только для зарегистрированных в админке моделей)
    autocomplete_fields = ('referring_authority', 'presiding_judge', 'case_type')
    
    # Действия для выделенных дел
    actions = ['mark_as_archived', 'mark_as_active']
    
    def status_colored(self, obj):
        """Цветной статус дела"""
        colors = {
            'active': 'green',
            'completed': 'blue',
            'execution': 'orange',
            'archived': 'gray'
        }
        color = colors.get(obj.status, 'black')
        status_display = dict(CivilProceedings.STATUS_CHOICES).get(obj.status, obj.status)
        return format_html(f'<span style="color: {color}; font-weight: bold;">{status_display}</span>')
    status_colored.short_description = "Статус"
    status_colored.admin_order_field = 'status'
    
    def case_type_display(self, obj):
        """Отображение вида производства"""
        return obj.case_type.label if obj.case_type else '-'
    case_type_display.short_description = "Вид производства"
    case_type_display.admin_order_field = 'case_type'
    
    def presiding_judge_short(self, obj):
        """Краткое ФИО судьи"""
        if obj.presiding_judge:
            parts = filter(None, [
                obj.presiding_judge.last_name,
                obj.presiding_judge.first_name[:1] + '.' if obj.presiding_judge.first_name else '',
                obj.presiding_judge.middle_name[:1] + '.' if obj.presiding_judge.middle_name else ''
            ])
            return ' '.join(parts)
        return '-'
    presiding_judge_short.short_description = "Судья"
    
    def get_registered_case_short(self, obj):
        """Краткая информация о зарегистрированном деле"""
        if obj.registered_case:
            return obj.registered_case.full_number
        return '-'
    get_registered_case_short.short_description = "Рег. дело"
    
    def get_registered_case_info(self, obj):
        """Полная информация о зарегистрированном деле для карточки"""
        if obj.registered_case:
            return format_html(
                '<div><strong>Номер:</strong> {}<br/>'
                '<strong>Дата регистрации:</strong> {}<br/>'
                '<strong>Статус:</strong> {}</div>',
                obj.registered_case.full_number,
                obj.registered_case.registration_date,
                obj.registered_case.get_status_display()
            )
        return "Не зарегистрировано"
    get_registered_case_info.short_description = "Зарегистрированное дело"
    
    def mark_as_archived(self, request, queryset):
        """Перевести выделенные дела в архив"""
        updated = queryset.update(status='archived', archived_date=db_models.functions.Now())
        self.message_user(request, f'{updated} дел(о) отправлено в архив.')
    mark_as_archived.short_description = "Отправить в архив"
    
    def mark_as_active(self, request, queryset):
        """Вернуть выделенные дела из архива в активные"""
        updated = queryset.update(status='active', archived_date=None)
        self.message_user(request, f'{updated} дел(о) возвращено из архива.')
    mark_as_active.short_description = "Вернуть из архива"


@admin.register(CivilDecision)
class CivilDecisionAdmin(admin.ModelAdmin):
    """Админка для решений по гражданским делам"""
    list_display = ('id', 'civil_proceedings_link', 'decision_date', 'outcome', 'appeal_result')
    list_filter = ('outcome', 'appeal_result', 'decision_date')
    search_fields = ('civil_proceedings__case_number_civil',)
    raw_id_fields = ('civil_proceedings',)
    
    def civil_proceedings_link(self, obj):
        return format_html('<a href="/admin/civil_proceedings/civilproceedings/{}/change/">{}</a>', 
                          obj.civil_proceedings.id, obj.civil_proceedings.case_number_civil)
    civil_proceedings_link.short_description = "Дело"


@admin.register(CivilExecution)
class CivilExecutionAdmin(admin.ModelAdmin):
    """Админка для исполнения по гражданским делам"""
    list_display = ('id', 'civil_proceedings_link', 'execution_date', 'execution_amount', 'execution_result')
    list_filter = ('execution_result', 'execution_date')
    search_fields = ('civil_proceedings__case_number_civil',)
    raw_id_fields = ('civil_proceedings',)
    
    def civil_proceedings_link(self, obj):
        return format_html('<a href="/admin/civil_proceedings/civilproceedings/{}/change/">{}</a>', 
                          obj.civil_proceedings.id, obj.civil_proceedings.case_number_civil)
    civil_proceedings_link.short_description = "Дело"


@admin.register(CivilSidesCaseInCase)
class CivilSidesCaseInCaseAdmin(admin.ModelAdmin):
    """Админка для сторон по делу"""
    list_display = ('id', 'civil_proceedings_link', 'sides_case_incase', 'sides_case_role')
    list_filter = ('sides_case_role',)
    search_fields = ('civil_proceedings__case_number_civil', 'sides_case_incase__name')
    raw_id_fields = ('civil_proceedings', 'sides_case_incase', 'sides_case_role')
    
    def civil_proceedings_link(self, obj):
        return format_html('<a href="/admin/civil_proceedings/civilproceedings/{}/change/">{}</a>', 
                          obj.civil_proceedings.id, obj.civil_proceedings.case_number_civil)
    civil_proceedings_link.short_description = "Дело"


@admin.register(CivilLawyer)
class CivilLawyerAdmin(admin.ModelAdmin):
    """Админка для адвокатов по делу"""
    list_display = ('id', 'civil_proceedings_link', 'lawyer', 'sides_case_role')
    list_filter = ('sides_case_role',)
    search_fields = ('civil_proceedings__case_number_civil', 'lawyer__law_firm_name')
    raw_id_fields = ('civil_proceedings', 'lawyer', 'sides_case_role')
    
    def civil_proceedings_link(self, obj):
        return format_html('<a href="/admin/civil_proceedings/civilproceedings/{}/change/">{}</a>', 
                          obj.civil_proceedings.id, obj.civil_proceedings.case_number_civil)
    civil_proceedings_link.short_description = "Дело"


@admin.register(CivilCaseMovement)
class CivilCaseMovementAdmin(admin.ModelAdmin):
    """Админка для движения дела"""
    list_display = ('id', 'civil_proceedings_link', 'business_movement')
    search_fields = ('civil_proceedings__case_number_civil',)
    raw_id_fields = ('civil_proceedings', 'business_movement')
    
    def civil_proceedings_link(self, obj):
        return format_html('<a href="/admin/civil_proceedings/civilproceedings/{}/change/">{}</a>', 
                          obj.civil_proceedings.id, obj.civil_proceedings.case_number_civil)
    civil_proceedings_link.short_description = "Дело"


@admin.register(CivilPetition)
class CivilPetitionAdmin(admin.ModelAdmin):
    """Админка для ходатайств по делу"""
    list_display = ('id', 'civil_proceedings_link', 'petitions_incase', 'petitioner_type')
    list_filter = ('petitioner_type',)
    search_fields = ('civil_proceedings__case_number_civil',)
    raw_id_fields = ('civil_proceedings', 'petitions_incase')
    
    def civil_proceedings_link(self, obj):
        return format_html('<a href="/admin/civil_proceedings/civilproceedings/{}/change/">{}</a>', 
                          obj.civil_proceedings.id, obj.civil_proceedings.case_number_civil)
    civil_proceedings_link.short_description = "Дело"