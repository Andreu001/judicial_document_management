# criminal_proceedings/serializers.py
from rest_framework import serializers
from .models import CriminalProceedings, Defendant, CriminalDecision

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
