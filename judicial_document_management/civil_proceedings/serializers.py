from rest_framework import serializers
from .models import CivilProceedings, CivilDecision, CivilSide, CivilProcedureAction


class CivilSideSerializer(serializers.ModelSerializer):
    class Meta:
        model = CivilSide
        fields = '__all__'


class CivilProcedureActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CivilProcedureAction
        fields = '__all__'


class CivilDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CivilDecision
        fields = '__all__'


class CivilProceedingsSerializer(serializers.ModelSerializer):
    sides = CivilSideSerializer(many=True, read_only=True)
    procedure_actions = CivilProcedureActionSerializer(many=True, read_only=True)
    decisions = CivilDecisionSerializer(many=True, read_only=True)
    
    business_card_number = serializers.CharField(
        source='business_card.original_name',
        read_only=True
    )
    
    class Meta:
        model = CivilProceedings
        fields = '__all__'


class CivilOptionsSerializer(serializers.Serializer):
    """Сериализатор для опций гражданского дела"""
    
    @staticmethod
    def get_choices_from_model():
        """Получение всех choices полей из моделей"""
        choices_data = {
            'admission_order': [],
            'postponed_reason': [],
            'compliance_with_deadlines': [],
            'ruling_type': [],
            'consideration_result_main': [],
            'consideration_result_additional': [],
            'consideration_result_counter': [],
            'second_instance_result': [],
            'court_composition': []
        }
        
        return choices_data


class CivilDecisionOptionsSerializer(serializers.Serializer):
    """Сериализатор для опций решений"""
    
    @staticmethod
    def get_choices_from_model():
        """Получение всех choices полей из модели решений"""
        choices_data = {
            'ruling_type': [],
            'consideration_result_main': [],
            'consideration_result_additional': [],
            'consideration_result_counter': [],
            'second_instance_result': [],
            'court_composition': []
        }
        
        return choices_data
