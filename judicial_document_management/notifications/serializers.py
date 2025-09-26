# notifications/serializers.py
from rest_framework import serializers
from .models import *

class LegalReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalReference
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    legal_references = LegalReferenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'priority', 'is_read', 'is_completed',
            'deadline', 'created_at', 'criminal_proceeding', 'jurisdiction_check',
            'legal_references'
        ]

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