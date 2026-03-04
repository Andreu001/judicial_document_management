from rest_framework import serializers
from .models import LegalDocument

class LegalDocumentListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка документов"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = LegalDocument
        fields = [
            'id', 'title', 'document_type', 'document_type_display',
            'category', 'category_display', 'document_number',
            'document_date', 'description', 'is_active',
            'uploaded_at', 'uploaded_by_name',
            'file_word', 'file_pdf'
        ]

class LegalDocumentDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_word_size = serializers.CharField(read_only=True)
    file_pdf_size = serializers.CharField(read_only=True)
    
    class Meta:
        model = LegalDocument
        fields = '__all__'

class LegalDocumentCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления"""
    
    class Meta:
        model = LegalDocument
        fields = [
            'title', 'document_type', 'category', 'file_word', 'file_pdf',
            'document_number', 'document_date', 'description', 'articles',
            'keywords', 'source', 'is_active'
        ]
    
    def validate(self, data):
        """Проверка, что хотя бы один файл загружен"""
        if not data.get('file_word') and not data.get('file_pdf'):
            raise serializers.ValidationError(
                "Необходимо загрузить хотя бы один файл (Word или PDF)"
            )
        return data

class DocumentSearchSerializer(serializers.Serializer):
    """Сериализатор для параметров поиска"""
    query = serializers.CharField(required=False, allow_blank=True)
    document_type = serializers.ChoiceField(
        choices=['plenum', 'review', 'reference', 'all'],
        required=False,
        default='all'
    )
    category = serializers.ChoiceField(
        choices=['criminal', 'civil', 'administrative', 'arbitration', 
                 'coap', 'military', 'general', 'all'],
        required=False,
        default='all'
    )
    article = serializers.CharField(required=False, allow_blank=True)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    is_active = serializers.BooleanField(required=False, default=True)
