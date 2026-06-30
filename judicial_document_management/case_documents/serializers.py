from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import CaseDocument, DocumentTemplate, PartyDocument, PartyDocumentHistory


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = ['id', 'case_category', 'name', 'description']


class CaseDocumentListSerializer(serializers.ModelSerializer):
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
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# ========== НОВЫЕ СЕРИАЛИЗАТОРЫ ДЛЯ ДОКУМЕНТОВ СТОРОН ==========

class PartyDocumentListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка документов сторон"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)
    submission_method_display = serializers.CharField(source='get_submission_method_display', read_only=True)
    is_read_by_judge = serializers.SerializerMethodField()  # ДОБАВИТЬ ЭТО ПОЛЕ
    
    class Meta:
        model = PartyDocument
        fields = [
            'id', 'title', 'document_type', 'document_type_display',
            'review_status', 'review_status_display', 'submission_method_display',
            'submitter_name', 'registration_number', 'submission_date',
            'document_file', 'created_at', 'is_read_by_judge'  # ДОБАВИТЬ is_read_by_judge
        ]
    
    def get_is_read_by_judge(self, obj):
        """Проверяет, есть ли непрочитанная активность для этого документа"""
        from django.contrib.contenttypes.models import ContentType
        from notifications.models import CaseActivity
        
        if not obj.case:
            return True
        
        try:
            case_ct = ContentType.objects.get_for_model(obj.case)
            doc_ct = ContentType.objects.get_for_model(obj)
            
            # Если есть непрочитанная активность типа new_party_document для этого документа
            has_unread = CaseActivity.objects.filter(
                case_content_type=case_ct,
                case_object_id=obj.case.id,
                related_content_type=doc_ct,
                related_object_id=obj.id,
                activity_type='new_party_document',
                is_read_by_judge=False
            ).exists()
            
            # Возвращаем True если ПРОЧИТАНО (нет непрочитанных активностей)
            return not has_unread
        except Exception as e:
            return True


class PartyDocumentDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра документа стороны"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)
    submission_method_display = serializers.CharField(source='get_submission_method_display', read_only=True)
    content_type = serializers.SlugRelatedField(
        slug_field='model',
        queryset=ContentType.objects.filter(
            model__in=('criminalproceedings', 'administrativeproceedings', 'civilproceedings', 'kasproceedings')
        )
    )
    
    class Meta:
        model = PartyDocument
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'file_size', 'registration_number',
            'registration_date', 'reviewed_by', 'judge_decision_date',
            'external_user', 'submitted_by'
        ]


class PartyDocumentCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания документа стороны"""
    content_type = serializers.SlugRelatedField(
        slug_field='model',
        queryset=ContentType.objects.filter(
            model__in=('criminalproceedings', 'administrativeproceedings', 'civilproceedings', 'kasproceedings')
        )
    )
    
    class Meta:
        model = PartyDocument
        fields = [
            'content_type', 'object_id', 'document_type', 'title',
            'description', 'document_file', 'submitter_name', 'submitter_role',
            'submission_method'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        # Определяем, кто создаёт документ
        if request and request.user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Проверяем, внешний ли это пользователь (из side_case_access)
            if hasattr(request.user, 'social_provider'):  # ExternalUser
                validated_data['external_user'] = request.user
                # Если не указано имя подателя, берём из данных пользователя
                if not validated_data.get('submitter_name'):
                    validated_data['submitter_name'] = request.user.full_name
            elif isinstance(request.user, User):  # Внутренний сотрудник
                validated_data['submitted_by'] = request.user
                if not validated_data.get('submitter_name'):
                    validated_data['submitter_name'] = request.user.get_full_name() or request.user.username
        
        return super().create(validated_data)


class PartyDocumentReviewSerializer(serializers.Serializer):
    """Сериализатор для принятия решения по документу стороны"""
    action = serializers.ChoiceField(choices=['accept', 'reject', 'return', 'register'])
    decision_text = serializers.CharField(required=False, allow_blank=True)
    registration_number = serializers.CharField(required=False, allow_blank=True)


class PartyDocumentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyDocumentHistory
        fields = ['id', 'previous_status', 'new_status', 'changed_by', 'comment', 'created_at']


class SignedCourtDocumentDownloadSerializer(serializers.Serializer):
    """Сериализатор для проверки подписи перед скачиванием"""
    document_id = serializers.IntegerField()
    confirm_status = serializers.BooleanField(default=True)