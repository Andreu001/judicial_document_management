from rest_framework import serializers
from django.contrib.auth import get_user_model
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

User = get_user_model()

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'username', 'email', 'password', 
                 'first_name', 'last_name', 'role', 'phone', 'subject_level')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 
                 'last_name', 'role', 'phone', 'court', 'bar_association', 'subject_level')
        read_only_fields = ('username', 'email')