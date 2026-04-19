# case_management/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import (CaseProgressEntry, ProgressActionType,
    NotificationChannel, NotificationStatus, 
    NotificationTemplate, Notification
)

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
        return obj.author.get_full_name() or obj.author.username if obj.author else "Система"


class NotificationChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationChannel
        fields = '__all__'


class NotificationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationStatus
        fields = '__all__'


class NotificationTemplateSerializer(serializers.ModelSerializer):
    case_category_display = serializers.CharField(source='get_case_category_display', read_only=True)
    participant_type_display = serializers.CharField(source='get_participant_type_display', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = '__all__'


class ParticipantInfoSerializer(serializers.Serializer):
    """Сериализатор для информации об участнике"""
    id = serializers.IntegerField()
    type = serializers.CharField()
    name = serializers.CharField()
    role = serializers.CharField()
    phone = serializers.CharField(allow_null=True, allow_blank=True)
    email = serializers.CharField(allow_null=True, allow_blank=True)
    address = serializers.CharField(allow_null=True, allow_blank=True)


class NotificationSerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    status_code = serializers.CharField(source='status.code', read_only=True)
    participant_info = serializers.SerializerMethodField()
    
    # Поля для создания/обновления
    case_id = serializers.IntegerField(write_only=True, required=False)
    case_type = serializers.CharField(write_only=True, required=False)
    participant_type = serializers.CharField(write_only=True, required=False)
    participant_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'progress_entry', 
                           'case_content_type', 'case_object_id', 'participant_content_type', 
                           'participant_object_id')
        extra_kwargs = {
            'channel': {'required': False, 'allow_null': True},
            'status': {'required': False, 'allow_null': True},
            'template': {'required': False, 'allow_null': True},
            'hearing_time': {'required': False, 'allow_null': True},
            'hearing_room': {'required': False, 'allow_null': True},
            'message_text': {'required': False, 'allow_null': True},
            'participant_name': {'required': False, 'allow_null': True},
            'participant_role': {'required': False, 'allow_null': True},
            'contact_phone': {'required': False, 'allow_null': True},
            'contact_email': {'required': False, 'allow_null': True},
            'contact_address': {'required': False, 'allow_null': True},
        }
    
    def get_participant_info(self, obj):
        return {
            'id': obj.participant_object_id,
            'type': obj.participant_content_type.model if obj.participant_content_type else None,
            'name': obj.participant_name,
            'role': obj.participant_role,
            'phone': obj.contact_phone,
            'email': obj.contact_email,
            'address': obj.contact_address,
        }
    
    def validate(self, data):
        # Проверяем, что для создания переданы необходимые поля
        if not self.instance:  # создание
            case_type = data.get('case_type')
            case_id = data.get('case_id')
            participant_type = data.get('participant_type')
            participant_id = data.get('participant_id')
            
            if not case_type:
                raise serializers.ValidationError({'case_type': 'Обязательное поле при создании'})
            if not case_id:
                raise serializers.ValidationError({'case_id': 'Обязательное поле при создании'})
            if not participant_type:
                raise serializers.ValidationError({'participant_type': 'Обязательное поле при создании'})
            if not participant_id:
                raise serializers.ValidationError({'participant_id': 'Обязательное поле при создании'})
        
        return data

    def create(self, validated_data):
        from django.contrib.contenttypes.models import ContentType
        from django.utils import timezone
        
        # Извлекаем временные поля
        case_type = validated_data.pop('case_type', None)
        case_id = validated_data.pop('case_id', None)
        participant_type = validated_data.pop('participant_type', None)
        participant_id = validated_data.pop('participant_id', None)
        
        # Получаем ContentType для дела
        if case_type and case_id:
            app_label_map = {
                'criminal': 'criminal_proceedings',
                'civil': 'civil_proceedings',
                'coap': 'administrative_code',
                'kas': 'administrative_proceedings',
                'other': 'other_materials',
            }
            model_name_map = {
                'criminal': 'criminalproceedings',
                'civil': 'civilproceedings',
                'coap': 'administrativeproceedings',
                'kas': 'kasproceedings',
                'other': 'othermaterial',
            }
            app_label = app_label_map.get(case_type)
            model_name = model_name_map.get(case_type)
            if app_label and model_name:
                try:
                    case_content_type = ContentType.objects.get(app_label=app_label, model=model_name)
                    validated_data['case_content_type'] = case_content_type
                    validated_data['case_object_id'] = case_id
                except ContentType.DoesNotExist:
                    pass
        
        # Получаем объект участника в зависимости от типа дела и типа участника
        participant_content_type = None
        participant_name = ''
        participant_role = ''
        contact_phone = ''
        contact_email = ''
        contact_address = ''
        
        if participant_type and participant_id:
            print(f"Looking for participant: case_type={case_type}, participant_type={participant_type}, participant_id={participant_id}")
            
            # Для уголовных дел
            if case_type == 'criminal':
                if participant_type == 'defendant':
                    try:
                        from criminal_proceedings.models import Defendant
                        defendant = Defendant.objects.get(id=participant_id)
                        participant_content_type = ContentType.objects.get_for_model(defendant)
                        participant_name = defendant.full_name_criminal or ''
                        participant_role = 'Подсудимый/Обвиняемый'
                        contact_phone = ''
                        contact_email = ''
                        contact_address = defendant.address or ''
                        print(f"Found defendant: {participant_name}")
                    except Exception as e:
                        print(f"Error getting defendant: {e}")
                
                elif participant_type == 'lawyer':
                    try:
                        from criminal_proceedings.models import LawyerCriminal
                        lawyer = LawyerCriminal.objects.get(id=participant_id)
                        if lawyer.lawyer:
                            participant_content_type = ContentType.objects.get_for_model(lawyer.lawyer)
                            participant_name = lawyer.lawyer.law_firm_name or ''
                            participant_role = 'Адвокат/Защитник'
                            contact_phone = lawyer.lawyer.law_firm_phone or ''
                            contact_email = lawyer.lawyer.law_firm_email or ''
                            contact_address = lawyer.lawyer.law_firm_address or ''
                            print(f"Found criminal lawyer: {participant_name}")
                    except Exception as e:
                        print(f"Error getting criminal lawyer: {e}")
                
                elif participant_type == 'side':
                    try:
                        from criminal_proceedings.models import CriminalSidesCaseInCase
                        side = CriminalSidesCaseInCase.objects.get(id=participant_id)
                        if side.criminal_side_case:
                            participant_content_type = ContentType.objects.get_for_model(side.criminal_side_case)
                            participant_name = side.criminal_side_case.name or ''
                            participant_role = side.sides_case_criminal.sides_case if side.sides_case_criminal else 'Сторона'
                            contact_phone = side.criminal_side_case.phone or ''
                            contact_email = side.criminal_side_case.email or ''
                            contact_address = side.criminal_side_case.address or ''
                            print(f"Found criminal side: {participant_name}")
                    except Exception as e:
                        print(f"Error getting criminal side: {e}")
            
            # Для гражданских дел
            elif case_type == 'civil':
                if participant_type == 'side':
                    try:
                        from civil_proceedings.models import CivilSidesCaseInCase
                        side = CivilSidesCaseInCase.objects.get(id=participant_id)
                        if side.sides_case_incase:
                            participant_content_type = ContentType.objects.get_for_model(side.sides_case_incase)
                            participant_name = side.sides_case_incase.name or ''
                            participant_role = side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                            contact_phone = side.sides_case_incase.phone or ''
                            contact_email = side.sides_case_incase.email or ''
                            contact_address = side.sides_case_incase.address or ''
                            print(f"Found civil side: {participant_name}")
                    except Exception as e:
                        print(f"Error getting civil side: {e}")
                
                elif participant_type == 'lawyer':
                    try:
                        from civil_proceedings.models import CivilLawyer
                        lawyer = CivilLawyer.objects.get(id=participant_id)
                        if lawyer.lawyer:
                            participant_content_type = ContentType.objects.get_for_model(lawyer.lawyer)
                            participant_name = lawyer.lawyer.law_firm_name or ''
                            participant_role = 'Представитель'
                            contact_phone = lawyer.lawyer.law_firm_phone or ''
                            contact_email = lawyer.lawyer.law_firm_email or ''
                            contact_address = lawyer.lawyer.law_firm_address or ''
                            print(f"Found civil lawyer: {participant_name}")
                    except Exception as e:
                        print(f"Error getting civil lawyer: {e}")
            
            # Для дел об АП (КоАП)
            elif case_type == 'coap':
                if participant_type == 'side':
                    try:
                        from administrative_code.models import AdministrativeSidesCaseInCase
                        side = AdministrativeSidesCaseInCase.objects.get(id=participant_id)
                        if side.sides_case_incase:
                            participant_content_type = ContentType.objects.get_for_model(side.sides_case_incase)
                            participant_name = side.sides_case_incase.name or ''
                            participant_role = side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                            contact_phone = side.sides_case_incase.phone or ''
                            contact_email = side.sides_case_incase.email or ''
                            contact_address = side.sides_case_incase.address or ''
                            print(f"Found coap side: {participant_name}")
                    except Exception as e:
                        print(f"Error getting coap side: {e}")
                
                elif participant_type == 'lawyer':
                    try:
                        from administrative_code.models import AdministrativeLawyer
                        lawyer = AdministrativeLawyer.objects.get(id=participant_id)
                        if lawyer.lawyer:
                            participant_content_type = ContentType.objects.get_for_model(lawyer.lawyer)
                            participant_name = lawyer.lawyer.law_firm_name or ''
                            participant_role = 'Защитник'
                            contact_phone = lawyer.lawyer.law_firm_phone or ''
                            contact_email = lawyer.lawyer.law_firm_email or ''
                            contact_address = lawyer.lawyer.law_firm_address or ''
                            print(f"Found coap lawyer: {participant_name}")
                    except Exception as e:
                        print(f"Error getting coap lawyer: {e}")
            
            # Для дел по КАС
            elif case_type == 'kas':
                if participant_type == 'side':
                    try:
                        from administrative_proceedings.models import KasSidesCaseInCase
                        side = KasSidesCaseInCase.objects.get(id=participant_id)
                        if side.sides_case_incase:
                            participant_content_type = ContentType.objects.get_for_model(side.sides_case_incase)
                            participant_name = side.sides_case_incase.name or ''
                            participant_role = side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                            contact_phone = side.sides_case_incase.phone or ''
                            contact_email = side.sides_case_incase.email or ''
                            contact_address = side.sides_case_incase.address or ''
                            print(f"Found kas side: {participant_name}")
                    except Exception as e:
                        print(f"Error getting kas side: {e}")
                
                elif participant_type == 'lawyer':
                    try:
                        from administrative_proceedings.models import KasLawyer
                        lawyer = KasLawyer.objects.get(id=participant_id)
                        if lawyer.lawyer:
                            participant_content_type = ContentType.objects.get_for_model(lawyer.lawyer)
                            participant_name = lawyer.lawyer.law_firm_name or ''
                            participant_role = 'Представитель'
                            contact_phone = lawyer.lawyer.law_firm_phone or ''
                            contact_email = lawyer.lawyer.law_firm_email or ''
                            contact_address = lawyer.lawyer.law_firm_address or ''
                            print(f"Found kas lawyer: {participant_name}")
                    except Exception as e:
                        print(f"Error getting kas lawyer: {e}")
            
            # Для иных материалов
            elif case_type == 'other':
                if participant_type == 'side':
                    try:
                        from other_materials.models import OtherMaterialSidesCaseInCase
                        side = OtherMaterialSidesCaseInCase.objects.get(id=participant_id)
                        if side.sides_case_incase:
                            participant_content_type = ContentType.objects.get_for_model(side.sides_case_incase)
                            participant_name = side.sides_case_incase.name or ''
                            participant_role = side.sides_case_role.sides_case if side.sides_case_role else 'Сторона'
                            contact_phone = side.sides_case_incase.phone or ''
                            contact_email = side.sides_case_incase.email or ''
                            contact_address = side.sides_case_incase.address or ''
                            print(f"Found other side: {participant_name}")
                    except Exception as e:
                        print(f"Error getting other side: {e}")
                
                elif participant_type == 'lawyer':
                    try:
                        from other_materials.models import OtherMaterialLawyer
                        lawyer = OtherMaterialLawyer.objects.get(id=participant_id)
                        if lawyer.lawyer:
                            participant_content_type = ContentType.objects.get_for_model(lawyer.lawyer)
                            participant_name = lawyer.lawyer.law_firm_name or ''
                            participant_role = 'Представитель'
                            contact_phone = lawyer.lawyer.law_firm_phone or ''
                            contact_email = lawyer.lawyer.law_firm_email or ''
                            contact_address = lawyer.lawyer.law_firm_address or ''
                            print(f"Found other lawyer: {participant_name}")
                    except Exception as e:
                        print(f"Error getting other lawyer: {e}")
        
        # Устанавливаем поля участника
        validated_data['participant_content_type'] = participant_content_type
        validated_data['participant_object_id'] = participant_id
        validated_data['participant_name'] = participant_name
        validated_data['participant_role'] = participant_role
        validated_data['contact_phone'] = contact_phone
        validated_data['contact_email'] = contact_email
        validated_data['contact_address'] = contact_address
        
        # Проверяем, что participant_content_type найден
        if not participant_content_type:
            print(f"WARNING: participant_content_type is None for case_type={case_type}, participant_type={participant_type}, participant_id={participant_id}")
            # Временно создаем фейковый ContentType для SidesCaseInCase, чтобы избежать ошибки
            try:
                from business_card.models import SidesCaseInCase
                participant_content_type = ContentType.objects.get_for_model(SidesCaseInCase)
                validated_data['participant_content_type'] = participant_content_type
                validated_data['participant_name'] = f"Участник #{participant_id}"
            except:
                pass
        
        # Устанавливаем статус по умолчанию, если не передан
        if 'status' not in validated_data or not validated_data.get('status'):
            from .models import NotificationStatus
            try:
                validated_data['status'] = NotificationStatus.objects.get(code='draft')
            except NotificationStatus.DoesNotExist:
                pass
        
        # Устанавливаем канал по умолчанию, если не передан
        if 'channel' not in validated_data or not validated_data.get('channel'):
            from .models import NotificationChannel
            try:
                validated_data['channel'] = NotificationChannel.objects.filter(is_active=True).first()
            except:
                pass
        
        # Добавляем создателя
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class NotificationMarkSentSerializer(serializers.Serializer):
    """Сериализатор для отметки об отправке"""
    sent_date = serializers.DateTimeField(required=False)
    
    def validate_sent_date(self, value):
        if not value:
            from django.utils import timezone
            return timezone.now()
        return value


class NotificationMarkDeliveredSerializer(serializers.Serializer):
    """Сериализатор для отметки о вручении"""
    delivery_date = serializers.DateTimeField(required=False)


class NotificationMarkUndeliveredSerializer(serializers.Serializer):
    """Сериализатор для отметки о не вручении"""
    return_reason = serializers.CharField(required=True)
    return_date = serializers.DateField(required=False)
    
    def validate_return_date(self, value):
        if not value:
            from django.utils import timezone
            return timezone.now().date()
        return value
