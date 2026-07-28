# case_distribution/serializers.py
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from users.models import User
from .models import (
    DistributionSettings, JudgeSpecialization, DepartmentDistribution,
    JudgeLoad, CaseDistribution, DistributionLog, JudgeExclusion,
    SanctionJudge, ReassignmentLog, DistributionRule, ComplexitySetting
)


class UserSimpleSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для пользователя"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class DistributionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistributionSettings
        exclude = ['id']
        read_only_fields = ['updated_at']


class JudgeSpecializationSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JudgeSpecialization
        fields = '__all__'
    
    def get_user_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else None


class DepartmentDistributionSerializer(serializers.ModelSerializer):
    judges_count = serializers.SerializerMethodField()
    judges_full_names = serializers.SerializerMethodField()
    
    class Meta:
        model = DepartmentDistribution
        fields = '__all__'
    
    def get_judges_count(self, obj):
        return obj.judges.count()
    
    def get_judges_full_names(self, obj):
        return [j.get_full_name() for j in obj.judges.all()]


class JudgeLoadSerializer(serializers.ModelSerializer):
    judge_full_name = serializers.SerializerMethodField()
    load_percentage = serializers.SerializerMethodField()
    effective_max_cases = serializers.SerializerMethodField()
    
    class Meta:
        model = JudgeLoad
        fields = '__all__'
    
    def get_judge_full_name(self, obj):
        return obj.judge.get_full_name() if obj.judge else None
    
    def get_load_percentage(self, obj):
        from .models import JudgeSpecialization
        spec = JudgeSpecialization.objects.filter(user=obj.judge).first()
        return spec.load_percentage if spec else 100
    
    def get_effective_max_cases(self, obj):
        from .models import DistributionSettings
        settings = DistributionSettings.objects.first()
        max_cases = settings.max_cases_per_judge_per_month if settings else 100
        return max_cases


# case_distribution/serializers.py

class CaseDistributionSerializer(serializers.ModelSerializer):
    assigned_judge_name = serializers.SerializerMethodField()
    previous_judge_name = serializers.SerializerMethodField()
    distributed_by_name = serializers.SerializerMethodField()
    case_info = serializers.SerializerMethodField()
    # Добавляем поле для проверки наличия судьи
    has_judge = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseDistribution
        fields = '__all__'
        read_only_fields = [
            'distributed_at', 'reassigned_at', 'created_at', 'updated_at'
        ]
    
    def get_assigned_judge_name(self, obj):
        if obj.assigned_judge:
            return obj.assigned_judge.get_full_name() or obj.assigned_judge.username
        return None
    
    def get_previous_judge_name(self, obj):
        if obj.previous_judge:
            return obj.previous_judge.get_full_name() or obj.previous_judge.username
        return None
    
    def get_distributed_by_name(self, obj):
        if obj.distributed_by:
            return obj.distributed_by.get_full_name() or obj.distributed_by.username
        return None
    
    def get_case_info(self, obj):
        if not obj.case:
            return None
        return {
            'id': obj.case.id,
            'number': obj.case_number,
            'category': obj.case_category
        }
    
    def get_has_judge(self, obj):
        return obj.assigned_judge is not None


class DistributionLogSerializer(serializers.ModelSerializer):
    executed_by_name = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    
    class Meta:
        model = DistributionLog
        fields = '__all__'
        read_only_fields = ['started_at']
    
    def get_executed_by_name(self, obj):
        return obj.executed_by.get_full_name() if obj.executed_by else None
    
    def get_summary(self, obj):
        return obj.get_summary()


class JudgeExclusionSerializer(serializers.ModelSerializer):
    judge_full_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    is_active_today = serializers.SerializerMethodField()
    
    class Meta:
        model = JudgeExclusion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_judge_full_name(self, obj):
        return obj.judge.get_full_name() if obj.judge else None
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_is_active_today(self, obj):
        return obj.is_active_today()


class SanctionJudgeSerializer(serializers.ModelSerializer):
    judge_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SanctionJudge
        fields = '__all__'
    
    def get_judge_full_name(self, obj):
        return obj.judge.get_full_name() if obj.judge else None


class ReassignmentLogSerializer(serializers.ModelSerializer):
    from_judge_name = serializers.SerializerMethodField()
    to_judge_name = serializers.SerializerMethodField()
    performed_by_name = serializers.SerializerMethodField()
    case_number = serializers.SerializerMethodField()
    
    class Meta:
        model = ReassignmentLog
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def get_from_judge_name(self, obj):
        return obj.from_judge.get_full_name() if obj.from_judge else None
    
    def get_to_judge_name(self, obj):
        return obj.to_judge.get_full_name() if obj.to_judge else None
    
    def get_performed_by_name(self, obj):
        return obj.performed_by.get_full_name() if obj.performed_by else None
    
    def get_case_number(self, obj):
        return obj.case_distribution.case_number if obj.case_distribution else None


class DistributionRuleSerializer(serializers.ModelSerializer):
    target_judges_names = serializers.SerializerMethodField()
    target_departments_names = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DistributionRule
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_target_judges_names(self, obj):
        return [j.get_full_name() for j in obj.target_judges.all()]
    
    def get_target_departments_names(self, obj):
        return [d.name for d in obj.target_departments.all()]
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class ComplexitySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplexitySetting
        fields = '__all__'
