# case_distribution/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    DistributionSettings, JudgeSpecialization, DepartmentDistribution,
    JudgeLoad, CaseDistribution, DistributionLog, JudgeExclusion,
    SanctionJudge, ReassignmentLog, DistributionRule, ComplexitySetting
)


@admin.register(DistributionSettings)
class DistributionSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Основные настройки', {
            'fields': (
                'auto_distribution_enabled', 'balance_period_months',
                'default_complexity'
            )
        }),
        ('Сложность по категориям', {
            'fields': (
                'criminal_complexity_multiplier', 'civil_complexity_multiplier',
                'coap_complexity_multiplier', 'kas_complexity_multiplier'
            )
        }),
        ('Отпуска и отсутствия', {
            'fields': (
                'vacation_block_days_before', 'vacation_block_days_after',
                'sick_block_days_after'
            )
        }),
        ('Нагрузка', {
            'fields': (
                'max_cases_per_judge_per_month', 'base_load_percentage'
            )
        }),
        ('Дополнительные настройки', {
            'fields': (
                'use_department_specialization', 'sanction_judges_enabled',
                'sanction_judges_balance_period'
            )
        }),
    )
    
    def has_add_permission(self, request):
        # Запрещаем добавление, если настройки уже существуют
        if DistributionSettings.objects.exists():
            return False
        return True


@admin.register(JudgeSpecialization)
class JudgeSpecializationAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'is_primary', 'load_percentage', 'is_active']
    list_filter = ['specialization', 'is_primary', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'user__username']
    list_editable = ['load_percentage', 'is_active']


@admin.register(DepartmentDistribution)
class DepartmentDistributionAdmin(admin.ModelAdmin):
    list_display = ['name', 'department_type', 'judges_count', 'is_active', 'priority']
    list_filter = ['department_type', 'is_active']
    search_fields = ['name', 'description']
    filter_horizontal = ['judges']
    
    def judges_count(self, obj):
        return obj.judges.count()
    judges_count.short_description = 'Количество судей'


@admin.register(JudgeLoad)
class JudgeLoadAdmin(admin.ModelAdmin):
    list_display = ['judge', 'year', 'month', 'total_cases', 'total_complexity', 'pending_cases']
    list_filter = ['year', 'month', 'judge']
    search_fields = ['judge__first_name', 'judge__last_name']
    readonly_fields = ['last_updated']


@admin.register(CaseDistribution)
class CaseDistributionAdmin(admin.ModelAdmin):
    list_display = [
        'case_number', 'case_category', 'assigned_judge', 'status',
        'complexity', 'source', 'distributed_at'
    ]
    list_filter = ['status', 'source', 'case_category']
    search_fields = ['case_number', 'assigned_judge__first_name', 'assigned_judge__last_name']
    readonly_fields = ['distributed_at', 'reassigned_at', 'created_at', 'updated_at']
    raw_id_fields = ['assigned_judge', 'previous_judge', 'distributed_by']


@admin.register(DistributionLog)
class DistributionLogAdmin(admin.ModelAdmin):
    list_display = [
        'protocol_number', 'executed_by', 'status', 'total_cases',
        'distributed_cases', 'failed_cases', 'started_at'
    ]
    list_filter = ['status', 'distribution_type', 'executed_by']
    search_fields = ['protocol_number']
    readonly_fields = ['started_at', 'protocol_number']
    
    def has_add_permission(self, request):
        return False


@admin.register(JudgeExclusion)
class JudgeExclusionAdmin(admin.ModelAdmin):
    list_display = [
        'judge', 'exclusion_type', 'start_date', 'end_date',
        'is_permanent', 'block_distribution'
    ]
    list_filter = ['exclusion_type', 'is_permanent', 'block_distribution']
    search_fields = ['judge__first_name', 'judge__last_name', 'reason']
    date_hierarchy = 'start_date'


@admin.register(SanctionJudge)
class SanctionJudgeAdmin(admin.ModelAdmin):
    list_display = ['judge', 'sanction_type', 'priority', 'max_cases_per_week', 'is_active']
    list_filter = ['sanction_type', 'is_active']
    search_fields = ['judge__first_name', 'judge__last_name']
    list_editable = ['priority', 'max_cases_per_week', 'is_active']


@admin.register(ReassignmentLog)
class ReassignmentLogAdmin(admin.ModelAdmin):
    list_display = [
        'case_distribution', 'from_judge', 'to_judge',
        'reason_type', 'performed_by', 'created_at'
    ]
    list_filter = ['reason_type', 'performed_by']
    search_fields = ['case_distribution__case_number']
    readonly_fields = ['created_at']


@admin.register(DistributionRule)
class DistributionRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'rule_type', 'category', 'priority', 'is_active']
    list_filter = ['rule_type', 'category', 'is_active']
    search_fields = ['name', 'description']
    filter_horizontal = ['target_judges', 'target_departments']


@admin.register(ComplexitySetting)
class ComplexitySettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'complexity_value', 'priority', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    list_editable = ['complexity_value', 'priority', 'is_active']
