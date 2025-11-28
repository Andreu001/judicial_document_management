# criminal_proceedings/serializers.py
from rest_framework import serializers
from .models import CriminalProceedings, Defendant, CriminalDecision, CriminalRuling

class DefendantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Defendant
        fields = "__all__"
        read_only_fields = ("criminal_proceedings",)


class CriminalDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalDecision
        fields = "__all__"
        read_only_fields = ("criminal_proceedings",)


class CriminalProceedingsSerializer(serializers.ModelSerializer):
    defendants = DefendantSerializer(many=True, read_only=True)
    criminal_decisions = CriminalDecisionSerializer(many=True, read_only=True)

    class Meta:
        model = CriminalProceedings
        fields = "__all__"
        read_only_fields = ("business_card",)


class CriminalOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices полей модели CriminalProceedings"""
    
    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели CriminalProceedings"""
        model_fields = CriminalProceedings._meta.get_fields()
        choices_data = {}
        
        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]
        
        return choices_data


class DefendantOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices полей модели Defendant"""
    
    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели Defendant"""
        model_fields = Defendant._meta.get_fields()
        choices_data = {}
        
        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]
        
        return choices_data


class CriminalDecisionOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices полей модели CriminalDecision"""
    
    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели CriminalDecision"""
        model_fields = CriminalDecision._meta.get_fields()
        choices_data = {}
        
        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]
        
        return choices_data


class CriminalRulingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalRuling
        fields = "__all__"
        read_only_fields = ("criminal_proceedings", "created_at", "updated_at")
