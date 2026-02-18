from rest_framework import serializers
from .models import AbsenceType, AbsenceRecord
from users.models import User

class JudgeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'middle_name', 'full_name', 'court']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class AbsenceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceType
        fields = '__all__'


class AbsenceRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    absence_type_name = serializers.CharField(source='absence_type.name', read_only=True)
    absence_type_color = serializers.CharField(source='absence_type.color', read_only=True)

    class Meta:
        model = AbsenceRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
