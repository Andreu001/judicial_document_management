# notifications/serializers.py
from rest_framework import serializers
from .models import *

class LegalReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalReference
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    legal_references = LegalReferenceSerializer(many=True, read_only=True)
    
    # Добавляем поля для отображения связанных объектов
    case_display_name = serializers.SerializerMethodField()
    correspondence_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'priority', 'is_read', 'is_completed',
            'deadline', 'created_at', 'criminal_proceeding', 'civil_proceeding',
            'admin_proceeding', 'kas_proceeding', 'jurisdiction_check',
            'legal_references', 'correspondence', 'notification_type',
            'case_display_name', 'correspondence_type_display'
        ]
    
    def get_case_display_name(self, obj):
        """Возвращает отображаемое название дела"""
        if obj.criminal_proceeding:
            return f"Уголовное дело № {obj.criminal_proceeding.case_number_criminal}"
        elif obj.civil_proceeding:
            return f"Гражданское дело № {obj.civil_proceeding.case_number_civil}"
        elif obj.admin_proceeding:
            return f"Дело об АП № {obj.admin_proceeding.case_number_admin}"
        elif obj.kas_proceeding:
            return f"Дело по КАС № {obj.kas_proceeding.case_number_kas}"
        return None
    
    def get_correspondence_type_display(self, obj):
        """Возвращает тип корреспонденции для отображения"""
        if obj.correspondence:
            return "Входящий" if obj.correspondence.correspondence_type == 'incoming' else "Исходящий"
        return None


class JurisdictionCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = JurisdictionCheck
        fields = '__all__'


class DeadlineWarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeadlineWarning
        fields = '__all__'


class NotificationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRule
        fields = '__all__'


class CaseActivitySerializer(serializers.ModelSerializer):
    """Сериализатор для активностей по делу"""
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    related_object_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseActivity
        fields = [
            'id', 'activity_type', 'activity_type_display', 'title', 'description',
            'link', 'is_read_by_judge', 'created_at', 'related_object_info'
        ]
    
    def get_related_object_info(self, obj):
        """Получить информацию о связанном объекте"""
        if obj.related_object:
            return {
                'id': obj.related_object.id,
                'type': obj.related_object._meta.model_name,
            }
        return None


class CaseNotificationStatusSerializer(serializers.Serializer):
    """Сериализатор для статуса уведомлений по делу"""
    has_unread = serializers.BooleanField()
    total_unread = serializers.IntegerField()
    party_documents = serializers.IntegerField()
    petitions = serializers.IntegerField()
    correspondence = serializers.IntegerField()


class MarkActivitiesReadSerializer(serializers.Serializer):
    """Сериализатор для отметки активностей как прочитанных"""
    activity_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Список ID активностей. Если не указан - отмечаются все по делу"
    )
