from rest_framework import serializers
from .models import RegisteredCase, RegistryIndex, Correspondence


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
            'criminal_proceedings', 'created_at'
        ]
        read_only_fields = ['full_number', 'created_at']


class CaseRegistrationSerializer(serializers.Serializer):
    index = serializers.CharField(max_length=10)
    description = serializers.CharField(required=False, allow_blank=True)
    business_card_id = serializers.IntegerField(
                                                required=False,
                                                allow_null=True)
    criminal_proceedings_id = serializers.IntegerField(
                                                        required=False,
                                                        allow_null=True)


class NumberAdjustmentSerializer(serializers.Serializer):
    index = serializers.CharField(max_length=10)
    new_current_number = serializers.IntegerField(min_value=0)
    reason = serializers.CharField()
    adjusted_by = serializers.CharField()


class CorrespondenceSerializer(serializers.ModelSerializer):
    business_card_name = serializers.CharField(
        source='business_card.original_name',
        read_only=True
    )

    class Meta:
        model = Correspondence
        fields = [
            'id',
            'correspondence_type',
            'registration_number',
            'registration_date',
            'sender',
            'recipient',
            'document_type',
            'summary',
            'pages_count',
            'status',
            'business_card',
            'business_card_name',
            'attached_files',
            'notes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['registration_number', 'created_at', 'updated_at']


class CorrespondenceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Correspondence
        fields = [
            'correspondence_type',
            'sender',
            'recipient',
            'document_type',
            'summary',
            'pages_count',
            'business_card',
            'attached_files',
            'notes'
        ]
