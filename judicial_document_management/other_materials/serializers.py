from rest_framework import serializers
from users.models import User
from business_card.models import (
    SidesCase, SidesCaseInCase, Lawyer
)
from .models import (
    OtherMaterial, OtherMaterialType,
    OtherMaterialSidesCaseInCase, OtherMaterialLawyer,
    OtherMaterialDecision
)
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument


class OtherMaterialTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherMaterialType
        fields = ['id', 'code', 'name', 'is_active', 'order']


class OtherMaterialDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherMaterialDecision
        fields = '__all__'
        read_only_fields = ('other_material',)


class OtherMaterialSerializer(serializers.ModelSerializer):
    responsible_person_full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)
    material_type_detail = OtherMaterialTypeSerializer(source='material_type', read_only=True)
    documents_count = serializers.SerializerMethodField()
    other_decisions = OtherMaterialDecisionSerializer(many=True, read_only=True)
    
    # Для удобства фронтенда - связь с делом
    related_case_info = serializers.SerializerMethodField()

    class Meta:
        model = OtherMaterial
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_responsible_person_full_name(self, obj):
        if obj.responsible_person:
            parts = filter(None, [
                obj.responsible_person.last_name,
                obj.responsible_person.first_name,
                obj.responsible_person.middle_name
            ])
            return ' '.join(parts).strip() or str(obj.responsible_person)
        return None

    def get_documents_count(self, obj):
        content_type = ContentType.objects.get_for_model(obj)
        return CaseDocument.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).count()
    
    def get_related_case_info(self, obj):
        if obj.related_case:
            return {
                'id': obj.object_id,
                'type': obj.content_type.model if obj.content_type else None,
                'type_label': obj.content_type.app_label if obj.content_type else None,
                'number': obj.related_case_number,
            }
        return None

    def validate_registration_number(self, value):
        instance = self.instance
        if instance and instance.registration_number == value:
            return value
        if OtherMaterial.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError("Материал с таким регистрационным номером уже существует")
        return value

    def validate(self, data):
        instance = self.instance
        if instance and instance.status == 'archived':
            editable_fields = ['archive_notes', 'status', 'archived_date', 'special_notes']
            for field in data.keys():
                if field not in editable_fields:
                    raise serializers.ValidationError(
                        f"Поле '{field}' нельзя редактировать в архивном материале"
                    )
        return data


class ArchivedOtherMaterialSerializer(OtherMaterialSerializer):
    class Meta(OtherMaterialSerializer.Meta):
        read_only_fields = OtherMaterialSerializer.Meta.read_only_fields + (
            'registration_number', 'registration_date', 'title', 'incoming_number',
            'incoming_date', 'sender', 'responsible_person',
        )


class OtherMaterialSidesCaseInCaseSerializer(serializers.ModelSerializer):
    sides_case_incase_detail = serializers.SerializerMethodField()
    sides_case_role_detail = serializers.SerializerMethodField()

    class Meta:
        model = OtherMaterialSidesCaseInCase
        fields = ['id', 'other_material', 'sides_case_incase', 'sides_case_role',
                  'sides_case_incase_detail', 'sides_case_role_detail']
        read_only_fields = ('other_material',)

    def get_sides_case_incase_detail(self, obj):
        if obj.sides_case_incase:
            return {
                'id': obj.sides_case_incase.id,
                'name': obj.sides_case_incase.name,
                'phone': obj.sides_case_incase.phone,
                'email': obj.sides_case_incase.email,
                'address': obj.sides_case_incase.address,
            }
        return None

    def get_sides_case_role_detail(self, obj):
        if obj.sides_case_role:
            return {
                'id': obj.sides_case_role.id,
                'name': obj.sides_case_role.sides_case,
            }
        return None


class OtherMaterialLawyerSerializer(serializers.ModelSerializer):
    lawyer_detail = serializers.SerializerMethodField()
    sides_case_role_detail = serializers.SerializerMethodField()

    class Meta:
        model = OtherMaterialLawyer
        fields = ['id', 'other_material', 'lawyer', 'sides_case_role',
                  'lawyer_detail', 'sides_case_role_detail']
        read_only_fields = ('other_material',)

    def get_lawyer_detail(self, obj):
        if obj.lawyer:
            return {
                'id': obj.lawyer.id,
                'law_firm_name': obj.lawyer.law_firm_name,
                'law_firm_phone': obj.lawyer.law_firm_phone,
                'law_firm_email': obj.lawyer.law_firm_email,
            }
        return None

    def get_sides_case_role_detail(self, obj):
        if obj.sides_case_role:
            return {
                'id': obj.sides_case_role.id,
                'name': obj.sides_case_role.sides_case,
            }
        return None


class OtherMaterialOptionsSerializer(serializers.Serializer):
    @staticmethod
    def get_options():
        return {
            'status': [
                {'value': 'active', 'label': 'Активное'},
                {'value': 'completed', 'label': 'Завершено'},
                {'value': 'archived', 'label': 'В архиве'},
            ],
            'outcome': [
                {'value': 'satisfied', 'label': 'Удовлетворено'},
                {'value': 'rejected', 'label': 'Отказано в удовлетворении'},
                {'value': 'dismissed', 'label': 'Прекращено производство'},
                {'value': 'left_without', 'label': 'Оставлено без рассмотрения'},
                {'value': 'transferred', 'label': 'Передано по подсудности/подведомственности'},
            ],
            'responsiblePersonRoles': [
                {'value': 'judge', 'label': 'Судья'},
                {'value': 'secretary', 'label': 'Секретарь'},
                {'value': 'assistant', 'label': 'Помощник'},
            ],
        }