from rest_framework import serializers
from .models import ExternalUser, CaseAccessGrant, SyncLog
from django.contrib.contenttypes.models import ContentType

class ExternalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalUser
        fields = ['id', 'full_name', 'first_name', 'last_name', 'email', 'birth_date', 'social_provider']


class CaseInfoSerializer(serializers.Serializer):
    """Сериализатор для информации о деле (без деталей)"""
    id = serializers.IntegerField()
    type = serializers.CharField()
    type_display = serializers.CharField()
    number = serializers.CharField()
    status = serializers.CharField()


class CaseAccessGrantSerializer(serializers.ModelSerializer):
    case_info = serializers.SerializerMethodField()
    external_user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseAccessGrant
        fields = ['id', 'external_user', 'external_user_info', 'case_info', 'access_level', 'side_type', 'side_name', 'granted_at', 'is_active']
        read_only_fields = ['granted_at']
    
    def get_case_info(self, obj):
        return obj.get_case_display()
    
    def get_external_user_info(self, obj):
        return {
            'id': obj.external_user.id,
            'full_name': obj.external_user.full_name,
            'email': obj.external_user.email,
        }


class CaseDetailSerializer(serializers.Serializer):
    """Базовый сериализатор для деталей дела (будет расширяться)"""
    case_info = serializers.DictField()
    case_data = serializers.DictField()


class PetitionInputSerializer(serializers.Serializer):
    """Сериализатор для подачи ходатайства"""
    case_type = serializers.CharField()  # criminal, civil, kas, administrative
    case_id = serializers.IntegerField()
    petition_text = serializers.CharField()
    petitioner_info = serializers.CharField(required=False, allow_blank=True)


class DocumentUploadSerializer(serializers.Serializer):
    """Сериализатор для загрузки документа"""
    case_type = serializers.CharField()
    case_id = serializers.IntegerField()
    document_title = serializers.CharField()
    document_file = serializers.FileField()
    description = serializers.CharField(required=False, allow_blank=True)