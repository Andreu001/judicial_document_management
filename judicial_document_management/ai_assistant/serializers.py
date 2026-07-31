# ai_assistant/serializers.py
from rest_framework import serializers
from .models import AISession, AIMessage, AICaseAnalysis, AIConfiguration


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'metadata', 'created_at']


class AISessionSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = AISession
        fields = ['id', 'session_id', 'session_type', 'title', 'context', 
                  'case_content_type', 'case_object_id', 'messages', 
                  'created_at', 'updated_at', 'is_active']


class AICaseAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICaseAnalysis
        fields = ['id', 'case_content_type', 'case_object_id', 'analysis_type',
                  'data', 'recommendations', 'violations', 'statistics',
                  'compliance_score', 'quality_score', 'created_by', 'created_at']


class AIConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIConfiguration
        fields = ['is_enabled', 'model_type', 'model_path', 'max_tokens',
                  'temperature', 'top_p', 'citizen_access_enabled',
                  'citizen_restricted_fields', 'analyze_criminal', 'analyze_civil',
                  'analyze_coap', 'analyze_kas', 'auto_analyze_on_create',
                  'auto_analyze_on_update']
