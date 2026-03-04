# case_registry/serializers.py
from rest_framework import serializers
from .models import RegisteredCase, RegistryIndex, Correspondence
import logging

logger = logging.getLogger(__name__)


class RegistryIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistryIndex
        fields = ['id', 'index', 'name']


class RegisteredCaseSerializer(serializers.ModelSerializer):
    index_name = serializers.CharField(source='index.name', read_only=True)

    class Meta:
        model = RegisteredCase
        fields = [
            'id', 'index', 'index_name', 'case_number', 'full_number',
            'registration_date', 'status', 'business_card',
            'criminal_proceedings', 'civil_proceedings', 
            'kas_proceedings', 'administrative_proceedings',
            'created_at'
        ]
        read_only_fields = ['full_number', 'created_at']


class CaseRegistrationSerializer(serializers.Serializer):
    index = serializers.CharField(max_length=10)
    description = serializers.CharField(required=False, allow_blank=True)
    case_number = serializers.IntegerField(required=False, allow_null=True)
    registration_date = serializers.DateField(required=False, allow_null=True)
    business_card_id = serializers.IntegerField(required=False, allow_null=True)
    criminal_proceedings_id = serializers.IntegerField(required=False, allow_null=True)
    civil_proceedings_id = serializers.IntegerField(required=False, allow_null=True)
    kas_proceedings_id = serializers.IntegerField(required=False, allow_null=True)
    administrative_proceedings_id = serializers.IntegerField(required=False, allow_null=True)


class NumberAdjustmentSerializer(serializers.Serializer):
    index = serializers.CharField(max_length=10)
    new_current_number = serializers.IntegerField(min_value=0)
    reason = serializers.CharField()
    adjusted_by = serializers.CharField()


# case_registry/serializers.py

class CorrespondenceSerializer(serializers.ModelSerializer):
    business_card_name = serializers.CharField(
        source='business_card.original_name',
        read_only=True
    )
    
    # Добавляем поля для отображения информации о связанных делах
    criminal_case_info = serializers.SerializerMethodField()
    civil_case_info = serializers.SerializerMethodField()
    admin_case_info = serializers.SerializerMethodField()
    kas_case_info = serializers.SerializerMethodField()
    
    # ДОБАВЛЯЕМ ЭТО ПОЛЕ
    case_display_name = serializers.SerializerMethodField()

    class Meta:
        model = Correspondence
        fields = [
            'id',
            'correspondence_type',
            'registration_number',
            'number_sender_document',
            'outgoing_date_document',
            'method_of_receipt',
            'registration_date',
            'sender',
            'recipient',
            'document_type',
            'summary',
            'pages_count',
            'status',
            'business_card',
            'business_card_name',
            'criminal_case',
            'civil_case',
            'admin_case',
            'kas_case',
            'criminal_case_info',
            'civil_case_info',
            'admin_case_info',
            'kas_case_info',
            'case_display_name',
            'attached_files',
            'notes',
            'created_at',
            'updated_at',
            'executor',
            'execution_deadline',
            'actual_execution_date'
        ]
        read_only_fields = ['registration_number', 'created_at', 'updated_at']

    def get_criminal_case_info(self, obj):
        if obj.criminal_case:
            return {
                'id': obj.criminal_case.id,
                'case_number': obj.criminal_case.case_number_criminal,
                'case_type': 'criminal',
                'case_type_label': 'Уголовное дело',
                'full_info': f"Уголовное дело № {obj.criminal_case.case_number_criminal}"
            }
        return None

    def get_civil_case_info(self, obj):
        if obj.civil_case:
            return {
                'id': obj.civil_case.id,
                'case_number': obj.civil_case.case_number_civil,
                'case_type': 'civil',
                'case_type_label': 'Гражданское дело',
                'full_info': f"Гражданское дело № {obj.civil_case.case_number_civil}"
            }
        return None

    def get_admin_case_info(self, obj):
        if obj.admin_case:
            return {
                'id': obj.admin_case.id,
                'case_number': obj.admin_case.case_number_admin,
                'case_type': 'administrative',
                'case_type_label': 'Дело об АП',
                'full_info': f"Дело об АП № {obj.admin_case.case_number_admin}"
            }
        return None

    def get_kas_case_info(self, obj):
        if obj.kas_case:
            return {
                'id': obj.kas_case.id,
                'case_number': obj.kas_case.case_number_kas,
                'case_type': 'kas',
                'case_type_label': 'Дело КАС',
                'full_info': f"Дело КАС № {obj.kas_case.case_number_kas}"
            }
        return None
    
    def get_case_display_name(self, obj):
        """Возвращает название связанного дела для отображения в списке"""
        if obj.criminal_case:
            return f"Уголовное дело № {obj.criminal_case.case_number_criminal}"
        elif obj.civil_case:
            return f"Гражданское дело № {obj.civil_case.case_number_civil}"
        elif obj.admin_case:
            return f"Дело об АП № {obj.admin_case.case_number_admin}"
        elif obj.kas_case:
            return f"Дело КАС № {obj.kas_case.case_number_kas}"
        return None


class CorrespondenceCreateSerializer(serializers.ModelSerializer):
    case_id = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Correspondence
        fields = [
            'correspondence_type',
            'sender',
            'recipient',
            'document_type',
            'summary',
            'pages_count',
            'case_id',
            'attached_files',
            'notes',
            'number_sender_document',
            'outgoing_date_document',
            'method_of_receipt',
            'executor',
            'execution_deadline',
            'actual_execution_date'
        ]
    
    def create(self, validated_data):
        case_id = validated_data.pop('case_id', None)
        
        # Убедимся, что registration_number не передается
        validated_data.pop('registration_number', None)
        
        # Создаем экземпляр без registration_number
        instance = Correspondence.objects.create(**validated_data)
        
        # Если передан case_id, устанавливаем связь с соответствующим делом
        if case_id and ':' in case_id:
            case_type, case_pk = case_id.split(':', 1)
            try:
                case_pk = int(case_pk)
                
                if case_type == 'criminal':
                    from criminal_proceedings.models import CriminalProceedings
                    instance.criminal_case = CriminalProceedings.objects.get(id=case_pk)
                elif case_type == 'civil':
                    from civil_proceedings.models import CivilProceedings
                    instance.civil_case = CivilProceedings.objects.get(id=case_pk)
                elif case_type == 'administrative':
                    from administrative_code.models import AdministrativeProceedings
                    instance.admin_case = AdministrativeProceedings.objects.get(id=case_pk)
                elif case_type == 'kas':
                    from administrative_proceedings.models import KasProceedings
                    instance.kas_case = KasProceedings.objects.get(id=case_pk)
                
                instance.save()
                logger.info(f"Связано дело {case_type} с ID {case_pk} с корреспонденцией {instance.id}")
            except (ValueError, Exception) as e:
                logger.error(f"Ошибка при связывании дела: {e}")
        
        return instance


class CorrespondenceUpdateSerializer(serializers.ModelSerializer):
    case_id = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Correspondence
        fields = [
            'correspondence_type',
            'registration_number',
            'number_sender_document',
            'outgoing_date_document',
            'method_of_receipt',
            'registration_date',
            'sender',
            'recipient',
            'document_type',
            'summary',
            'pages_count',
            'status',
            'case_id',
            'attached_files',
            'notes',
            'executor',
            'execution_deadline',
            'actual_execution_date'
        ]
        read_only_fields = ['registration_number']
    
    def update(self, instance, validated_data):
        case_id = validated_data.pop('case_id', None)
        
        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Обновляем связь с делом, если передан case_id
        if case_id and ':' in case_id:
            case_type, case_pk = case_id.split(':', 1)
            try:
                case_pk = int(case_pk)
                
                # Сбрасываем все связи
                instance.criminal_case = None
                instance.civil_case = None
                instance.admin_case = None
                instance.kas_case = None
                
                # Устанавливаем новую связь
                if case_type == 'criminal':
                    from criminal_proceedings.models import CriminalProceedings
                    instance.criminal_case = CriminalProceedings.objects.get(id=case_pk)
                elif case_type == 'civil':
                    from civil_proceedings.models import CivilProceedings
                    instance.civil_case = CivilProceedings.objects.get(id=case_pk)
                elif case_type == 'administrative':
                    from administrative_code.models import AdministrativeProceedings
                    instance.admin_case = AdministrativeProceedings.objects.get(id=case_pk)
                elif case_type == 'kas':
                    from administrative_proceedings.models import KasProceedings
                    instance.kas_case = KasProceedings.objects.get(id=case_pk)
                
                logger.info(f"Обновлена связь с делом {case_type} с ID {case_pk} для корреспонденции {instance.id}")
            except (ValueError, Exception) as e:
                logger.error(f"Ошибка при обновлении связи с делом: {e}")
        elif case_id == '':
            # Если передана пустая строка, сбрасываем все связи
            instance.criminal_case = None
            instance.civil_case = None
            instance.admin_case = None
            instance.kas_case = None
            logger.info(f"Сброшены все связи для корреспонденции {instance.id}")
        
        instance.save()
        return instance