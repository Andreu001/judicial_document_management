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
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True, 'allow_null': True}
        }
    
    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return "Система"
    
    def to_internal_value(self, data):
        """Обработка пустого значения description"""
        internal_value = super().to_internal_value(data)
        # Если description не передан или пустая строка/null, устанавливаем пустую строку
        if 'description' not in internal_value or internal_value.get('description') is None:
            internal_value['description'] = ''
        return internal_value
    
    def create(self, validated_data):
        validated_data.pop('case', None)
        validated_data['author'] = self.context['request'].user
        # Убеждаемся, что description не None
        if validated_data.get('description') is None:
            validated_data['description'] = ''
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Убеждаемся, что description не None при обновлении
        if validated_data.get('description') is None:
            validated_data['description'] = ''
        return super().update(instance, validated_data)


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


    def _get_participant_model(self, participant_type):
        # Прямое соответствие - самый простой способ
        direct_mapping = {
            'defendant': 'Defendant',
            'lawyercriminal': 'LawyerCriminal', 
            'sidescaseincase': 'SidesCaseInCase',
            'side': 'SidesCaseInCase',
            'civilside': 'CivilSide',
            'adminside': 'AdministrativeSide',
            'kasside': 'KasSide',
        }
        
        participant_type_lower = participant_type.lower()
        
        if participant_type_lower in direct_mapping:
            model_name = direct_mapping[participant_type_lower]
            # Импортируем модели напрямую
            try:
                from criminal_proceedings.models import Defendant, LawyerCriminal, SidesCaseInCase
                from civil_proceedings.models import CivilSide
                from administrative_proceedings.models import AdministrativeSide
                from kas_proceedings.models import KasSide
                
                models_map = {
                    'Defendant': Defendant,
                    'LawyerCriminal': LawyerCriminal,
                    'SidesCaseInCase': SidesCaseInCase,
                    'CivilSide': CivilSide,
                    'AdministrativeSide': AdministrativeSide,
                    'KasSide': KasSide,
                }
                return models_map.get(model_name)
            except ImportError:
                pass
        
        return None
    
    def validate(self, data):
        print("=== Validation start ===")
        print(f"Input data: {data}")
        
        participant_type = data.pop('participant_type', None)
        participant_id = data.pop('participant_id', None)
        
        print(f"participant_type: {participant_type}, participant_id: {participant_id}")
        
        if not participant_type or not participant_id:
            raise serializers.ValidationError({
                'participant_type': 'Не указан тип участника',
                'participant_id': 'Не указан ID участника'
            })
        
        model = self._get_participant_model(participant_type)
        
        print(f"Found model: {model}")
        
        if not model:
            raise serializers.ValidationError({
                'participant_type': f'Неизвестный тип участника: {participant_type}. Доступные типы: defendant, lawyer, side, victim, witness, expert'
            })
        
        try:
            participant = model.objects.get(id=participant_id)
            print(f"Found participant: {participant}")
        except model.DoesNotExist:
            raise serializers.ValidationError({
                'participant_id': f'Участник типа {participant_type} с ID {participant_id} не найден'
            })
        
        data['participant'] = participant
        
        # Сохраняем дополнительные поля
        data['_template_id'] = data.pop('template_id', None)
        data['_notification_text_edited'] = data.pop('notification_text_edited', None)
        data['_hearing_date'] = data.pop('hearing_date', None)
        data['_hearing_room'] = data.pop('hearing_room', None)
        data['_consent_sms'] = data.pop('consent_sms', False)
        data['_consent_email'] = data.pop('consent_email', False)
        
        print(f"Validated data after processing: {data.keys()}")
        print("=== Validation end ===")
        
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
        
        # Удаляем все поля, которые начинаются с '_' (они не нужны для создания)
        keys_to_remove = [key for key in validated_data.keys() if key.startswith('_')]
        for key in keys_to_remove:
            validated_data.pop(key, None)
        
        notification = super().create(validated_data)
        
        # Создаем запись в справочном листе
        from .models import CaseProgressEntry, ProgressActionType
        
        case = self.context.get('case')
        if case:
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
