# ai_assistant/serializers.py
from rest_framework import serializers
from .models import (
    AISession, AIMessage, AICaseAnalysis,
    AIConfiguration, ChatMessage, UploadedFile, ChatSession
    )


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


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'attached_files', 'metadata', 'created_at']


class UploadedFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UploadedFile
        fields = ['id', 'file_name', 'file_type', 'file_size', 'extracted_text', 
                  'uploaded_at', 'processed', 'processing_error', 'file_url']
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    uploaded_files = UploadedFileSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    context_string = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'session_type', 'context', 'context_string',
                  'messages', 'uploaded_files', 'message_count', 
                  'created_at', 'updated_at', 'is_active', 'is_archived',
                  'last_message_at']
    
    def get_context_string(self, obj):
        return obj.get_context_string()


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['title', 'session_type', 'context']
        extra_kwargs = {
            'title': {'required': False, 'default': 'Новый диалог'},
            'session_type': {'required': False, 'default': 'general'},
            'context': {'required': False, 'default': dict}
        }
