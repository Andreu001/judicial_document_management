# judge_assistant/serializers.py
from rest_framework import serializers
from .models import JudgeNote, SupremeCourtDocumentRef


class JudgeNoteSerializer(serializers.ModelSerializer):
    """Сериализатор для заметок судьи"""
    
    created_by_name = serializers.SerializerMethodField()
    note_type_display = serializers.CharField(source='get_note_type_display', read_only=True)
    importance_display = serializers.CharField(source='get_importance_display', read_only=True)
    
    class Meta:
        model = JudgeNote
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class SupremeCourtDocumentRefSerializer(serializers.ModelSerializer):
    """Сериализатор для документов ВС РФ"""
    
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    applicable_stage_display = serializers.CharField(source='get_applicable_stages_display', read_only=True)
    
    class Meta:
        model = SupremeCourtDocumentRef
        fields = '__all__'


class DeadlineViolationSerializer(serializers.Serializer):
    """Сериализатор для нарушений сроков"""
    type = serializers.CharField()
    title = serializers.CharField()
    deadline_days = serializers.IntegerField()
    actual_days = serializers.IntegerField()
    description = serializers.CharField()
    severity = serializers.ChoiceField(choices=['low', 'medium', 'high', 'critical'])


class RecommendedActionSerializer(serializers.Serializer):
    """Сериализатор для рекомендаций"""
    title = serializers.CharField()
    priority = serializers.ChoiceField(choices=['low', 'medium', 'high', 'critical'])
    stage = serializers.CharField(required=False, allow_null=True)
    deadline_days = serializers.IntegerField(required=False, allow_null=True)
    details = serializers.CharField(required=False, allow_null=True)


class UsefulLinkSerializer(serializers.Serializer):
    """Сериализатор для полезных ссылок"""
    title = serializers.CharField()
    url = serializers.CharField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_null=True)
    from_db = serializers.BooleanField(default=False)


class PendingPetitionSerializer(serializers.Serializer):
    """Сериализатор для нерассмотренных ходатайств"""
    id = serializers.IntegerField()
    petitioner = serializers.CharField()
    petitioner_type = serializers.CharField()
    date_application = serializers.DateField(allow_null=True)
    description = serializers.CharField()


class UnnotifiedParticipantSerializer(serializers.Serializer):
    """Сериализатор для неуведомленных участников"""
    id = serializers.IntegerField()
    type = serializers.CharField()
    type_label = serializers.CharField()
    name = serializers.CharField()
    suggestion = serializers.CharField()


class CaseAnalysisSerializer(serializers.Serializer):
    """Главный сериализатор для анализа дела"""
    
    current_stage = serializers.DictField()
    deadline_violations = DeadlineViolationSerializer(many=True)
    pending_petitions = serializers.DictField()
    unnotified_participants = serializers.DictField()
    recommended_actions = RecommendedActionSerializer(many=True)
    useful_links = UsefulLinkSerializer(many=True)
    next_stage_hint = serializers.CharField()
    statistics = serializers.DictField()