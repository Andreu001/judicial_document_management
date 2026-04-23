from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import CitizenCaseAccess, CitizenPetition, CitizenDocumentUpload


class CitizenCaseAccessSerializer(serializers.ModelSerializer):
    case_number = serializers.SerializerMethodField()
    case_type = serializers.SerializerMethodField()
    case_category = serializers.SerializerMethodField()
    case_status = serializers.SerializerMethodField()
    judge_name = serializers.SerializerMethodField()
    hearing_date = serializers.SerializerMethodField()
    
    class Meta:
        model = CitizenCaseAccess
        fields = [
            'id', 'access_type', 'role_in_case', 'granted_at',
            'case_number', 'case_type', 'case_category', 'case_status',
            'judge_name', 'hearing_date'
        ]
    
    def get_case_number(self, obj):
        case = obj.case
        if hasattr(case, 'case_number_criminal'):
            return case.case_number_criminal
        elif hasattr(case, 'case_number_civil'):
            return case.case_number_civil
        elif hasattr(case, 'case_number_admin'):
            return case.case_number_admin
        elif hasattr(case, 'case_number_kas'):
            return case.case_number_kas
        return str(case.id)
    
    def get_case_type(self, obj):
        return obj.content_type.model
    
    def get_case_category(self, obj):
        case = obj.case
        if hasattr(case, 'case_category'):
            return str(case.case_category)
        return None
    
    def get_case_status(self, obj):
        case = obj.case
        if hasattr(case, 'status'):
            return case.status
        return None
    
    def get_judge_name(self, obj):
        case = obj.case
        if hasattr(case, 'presiding_judge') and case.presiding_judge:
            return case.presiding_judge.get_full_name()
        return None
    
    def get_hearing_date(self, obj):
        case = obj.case
        if hasattr(case, 'hearing_date'):
            return case.hearing_date
        elif hasattr(case, 'first_hearing_date'):
            return case.first_hearing_date
        return None


class CitizenPetitionSerializer(serializers.ModelSerializer):
    case_number = serializers.SerializerMethodField()
    
    class Meta:
        model = CitizenPetition
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'court_response', 'court_response_date', 'submitted_at']
    
    def get_case_number(self, obj):
        case = obj.case_access.case
        if hasattr(case, 'case_number_criminal'):
            return case.case_number_criminal
        elif hasattr(case, 'case_number_civil'):
            return case.case_number_civil
        return str(case.id)


class CitizenPetitionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenPetition
        fields = ['case_access', 'title', 'content', 'attachments']
    
    def validate_case_access(self, value):
        request = self.context.get('request')
        if value.citizen != request.user:
            raise serializers.ValidationError('У вас нет доступа к этому делу')
        
        if value.access_type not in ['petition', 'full']:
            raise serializers.ValidationError('Вы не можете подавать ходатайства по этому делу')
        
        return value


class CitizenDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenDocumentUpload
        fields = '__all__'
        read_only_fields = ['citizen', 'status', 'court_comment', 'file_name', 'file_size']


class CitizenDocumentUploadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenDocumentUpload
        fields = ['case_access', 'title', 'description', 'file']
    
    def validate_case_access(self, value):
        request = self.context.get('request')
        if value.citizen != request.user:
            raise serializers.ValidationError('У вас нет доступа к этому делу')
        
        if value.access_type not in ['documents', 'full']:
            raise serializers.ValidationError('Вы не можете загружать документы по этому делу')
        
        return value


class CaseDetailSerializer(serializers.Serializer):
    access = CitizenCaseAccessSerializer()
    case = serializers.JSONField()
    content_type = serializers.CharField()