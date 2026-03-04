# case_documents/serializers.py
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import CaseDocument, DocumentTemplate

class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Сериализатор для шаблонов документов (справочник)."""
    class Meta:
        model = DocumentTemplate
        fields = ['id', 'case_category', 'name', 'description']


class CaseDocumentListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка документов."""
    template_name = serializers.CharField(source='template.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    signed_by_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CaseDocument
        fields = [
            'id', 'title', 'template_name', 'status', 'status_display',
            'signed_by_name', 'signed_at', 'created_by_name', 'created_at'
        ]

    def get_signed_by_name(self, obj):
        if obj.signed_by:
            return obj.signed_by.get_full_name() or obj.signed_by.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class CaseDocumentDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра/создания/редактирования."""
    template = serializers.PrimaryKeyRelatedField(queryset=DocumentTemplate.objects.all())
    template_detail = DocumentTemplateSerializer(source='template', read_only=True)
    content_type = serializers.SlugRelatedField(
        slug_field='model',
        queryset=ContentType.objects.filter(
            model__in=('criminalproceedings', 'administrativeproceedings', 'civilproceedings', 'kasproceedings')
        )
    )
    signed_by_name = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CaseDocument
        fields = '__all__'
        read_only_fields = ['status', 'signed_by', 'signed_at', 'signature_text', 'created_by', 'created_at', 'updated_at']

    def get_signed_by_name(self, obj):
        if obj.signed_by:
            return obj.signed_by.get_full_name() or obj.signed_by.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def create(self, validated_data):
        # Автоматически проставляем создателя
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)
