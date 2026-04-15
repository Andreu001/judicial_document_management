from rest_framework import serializers
from .models import Notification, NotificationType, CaseProgressEntry, ProgressActionType
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = '__all__'


class ProgressActionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressActionType
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    participant_type = serializers.SlugRelatedField(
        source='content_type',
        slug_field='model',
        read_only=True
    )
    participant_name = serializers.SerializerMethodField()
    participant_id = serializers.IntegerField(source='object_id', read_only=True)
    case_number = serializers.SerializerMethodField()
    notification_type_name = serializers.CharField(source='notification_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'sent_date', 'created_by')
    
    def get_participant_name(self, obj):
        if obj.participant:
            if hasattr(obj.participant, 'full_name_criminal'):
                return obj.participant.full_name_criminal
            if hasattr(obj.participant, 'name'):
                return obj.participant.name
            if hasattr(obj.participant, 'law_firm_name'):
                return obj.participant.law_firm_name
            return str(obj.participant)
        return "Участник удален"
    
    def get_case_number(self, obj):
        if obj.case:
            if hasattr(obj.case, 'case_number_criminal'):
                return obj.case.case_number_criminal
            if hasattr(obj.case, 'case_number_civil'):
                return obj.case.case_number_civil
            if hasattr(obj.case, 'case_number_admin'):
                return obj.case.case_number_admin
            return str(obj.case)
        return "Дело удалено"
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CaseProgressEntrySerializer(serializers.ModelSerializer):
    action_type_name = serializers.CharField(source='action_type.name', read_only=True)
    author_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseProgressEntry
        fields = '__all__'
        read_only_fields = ('id', 'created_date', 'author', 'case_content_type', 'case_object_id')
    
    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return "Система"
    
    def create(self, validated_data):
        validated_data.pop('case', None)
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания уведомления с автоматической записью в справочный лист."""
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'participant', 'case', 'recipient_address', 'recipient_phone', 'recipient_email', 'notes', 'delivery_date']
        read_only_fields = ['id', 'sent_date', 'status']

    def create(self, validated_data):
        validated_data['status'] = 'sent'
        validated_data['created_by'] = self.context['request'].user
        
        notification = super().create(validated_data)
        
        notification_type_name = notification.notification_type.name
        participant_name = str(notification.participant)
        
        description = f"Направлено извещение ({notification_type_name}) для {participant_name}"
        if notification.recipient_address:
            description += f" по адресу: {notification.recipient_address}"
        if notification.recipient_phone:
            description += f" (тел.: {notification.recipient_phone})"
            
        CaseProgressEntry.objects.create(
            case=notification.case,
            action_type=ProgressActionType.objects.get_or_create(
                name="Направление извещения",
                defaults={'code': 'send_notification'}
            )[0],
            description=description,
            action_date=timezone.now().date(),
            author=notification.created_by,
            related_notification=notification
        )
        
        return notification


# ИСПРАВЛЕННЫЙ сериализатор для создания уведомления с указанием участника
class NotificationCreateForParticipantSerializer(serializers.ModelSerializer):
    """Сериализатор для создания уведомления с указанием участника по типу и ID"""
    participant_type = serializers.CharField(write_only=True)
    participant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'delivery_method', 
            'recipient_address', 'recipient_phone', 'recipient_email', 
            'notes', 'delivery_date', 'status',
            'participant_type', 'participant_id'
        ]
        read_only_fields = ['id', 'sent_date', 'status']
    
    def validate(self, data):
        participant_type = data.pop('participant_type')
        participant_id = data.pop('participant_id')
        
        # Импортируем модели прямо здесь, чтобы избежать проблем с циклическим импортом
        from criminal_proceedings.models import Defendant, LawyerCriminal, CriminalSidesCaseInCase
        
        # Маппинг типов участников на модели
        model_map = {
            'defendant': Defendant,
            'lawyer': LawyerCriminal, 
            'side': CriminalSidesCaseInCase
        }
        
        model = model_map.get(participant_type)
        if not model:
            raise serializers.ValidationError({'participant_type': f'Неизвестный тип участника: {participant_type}'})
        
        try:
            participant = model.objects.get(id=participant_id)
        except model.DoesNotExist:
            raise serializers.ValidationError({'participant_id': f'Участник типа {participant_type} с ID {participant_id} не найден'})
        
        data['participant'] = participant
        return data
    
    def create(self, validated_data):
        validated_data['status'] = 'sent'
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)