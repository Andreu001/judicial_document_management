# case_management/serializers.py - ПОЛНОСТЬЮ ЗАМЕНИТЬ

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import (
    Notification, NotificationType, NotificationTemplate,
    CaseProgressEntry, ProgressActionType
)
from .services import NotificationService


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = '__all__'


class NotificationTemplateSerializer(serializers.ModelSerializer):
    case_category_display = serializers.CharField(source='get_case_category_display', read_only=True)
    participant_type_display = serializers.CharField(source='get_participant_type_display', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = '__all__'


class ProgressActionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressActionType
        fields = '__all__'


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
    notification_template_name = serializers.CharField(source='notification_template.name', read_only=True)
    notification_template_form_number = serializers.CharField(source='notification_template.form_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'sent_date', 'created_by', 'notification_text')
    
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


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания уведомления"""
    
    participant_type = serializers.CharField(write_only=True)
    participant_id = serializers.IntegerField(write_only=True)
    template_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    notification_text_edited = serializers.CharField(write_only=True, required=False, allow_blank=True)
    hearing_date = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    hearing_room = serializers.CharField(write_only=True, required=False, allow_blank=True)
    consent_sms = serializers.BooleanField(write_only=True, required=False, default=False)
    consent_email = serializers.BooleanField(write_only=True, required=False, default=False)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'delivery_method',
            'recipient_address', 'recipient_phone', 'recipient_email',
            'notes', 'delivery_date', 'status',
            'participant_type', 'participant_id',
            'template_id', 'notification_text_edited',
            'hearing_date', 'hearing_room', 'consent_sms', 'consent_email'
        ]
        read_only_fields = ['id', 'sent_date', 'status']
    
    def validate(self, data):
        participant_type = data.pop('participant_type')
        participant_id = data.pop('participant_id')
        
        # Импортируем модели
        from criminal_proceedings.models import Defendant, LawyerCriminal, CriminalSidesCaseInCase
        
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
        
        # Сохраняем дополнительные поля
        data['_template_id'] = data.pop('template_id', None)
        data['_notification_text_edited'] = data.pop('notification_text_edited', None)
        data['_hearing_date'] = data.pop('hearing_date', None)
        data['_hearing_room'] = data.pop('hearing_room', None)
        data['_consent_sms'] = data.pop('consent_sms', False)
        data['_consent_email'] = data.pop('consent_email', False)
        
        return data
    
    def create(self, validated_data):
        template_id = validated_data.pop('_template_id', None)
        notification_text_edited = validated_data.pop('_notification_text_edited', None)
        hearing_date = validated_data.pop('_hearing_date', None)
        hearing_room = validated_data.pop('_hearing_room', None)
        consent_sms = validated_data.pop('_consent_sms', False)
        consent_email = validated_data.pop('_consent_email', False)
        
        participant = validated_data.pop('participant')
        
        # Получаем content_type для участника
        content_type = ContentType.objects.get_for_model(participant)
        validated_data['content_type'] = content_type
        validated_data['object_id'] = participant.id
        
        validated_data['status'] = 'sent'
        validated_data['created_by'] = self.context['request'].user
        validated_data['consent_sms'] = consent_sms
        validated_data['consent_email'] = consent_email
        
        # Устанавливаем дату и место заседания
        if hearing_date:
            validated_data['hearing_date'] = hearing_date
        if hearing_room:
            validated_data['hearing_room'] = hearing_room
        
        # Если есть шаблон и текст, сохраняем его
        if template_id:
            try:
                template = NotificationTemplate.objects.get(id=template_id)
                validated_data['notification_template'] = template
                
                if notification_text_edited is None:
                    case = self.context.get('case')
                    context = NotificationService.prepare_context(
                        case, participant, hearing_date, hearing_room
                    )
                    validated_data['notification_text'] = NotificationService.render_notification_text(
                        template.content, context
                    )
                else:
                    validated_data['notification_text'] = notification_text_edited
            except NotificationTemplate.DoesNotExist:
                pass
        elif notification_text_edited:
            validated_data['notification_text'] = notification_text_edited
        
        notification = super().create(validated_data)
        
        # Создаем запись в справочном листе
        from .models import CaseProgressEntry, ProgressActionType
        
        case = self.context.get('case')
        if case:
            # Используем get_or_create с правильными параметрами
            action_type, created = ProgressActionType.objects.get_or_create(
                code='send_notification',
                defaults={
                    'name': 'Направление извещения'
                }
            )
            
            case_content_type = ContentType.objects.get_for_model(case)
            
            participant_name = str(participant)
            description = f"Направлено извещение ({notification.get_delivery_method_display()}) для {participant_name}"
            if validated_data.get('recipient_address'):
                description += f" по адресу: {validated_data['recipient_address']}"
            if validated_data.get('recipient_phone'):
                description += f" (тел.: {validated_data['recipient_phone']})"
            
            CaseProgressEntry.objects.create(
                case_content_type=case_content_type,
                case_object_id=case.id,
                action_type=action_type,
                description=description,
                action_date=timezone.now().date(),
                author=notification.created_by,
                related_notification=notification
            )
        
        return notification