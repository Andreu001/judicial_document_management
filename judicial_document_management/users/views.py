from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import filters, permissions
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from .permissions import IsAdmin
from rest_framework.permissions import AllowAny
from .serializers import (UserSerializer, UserCreateSerializer, 
                         UserUpdateSerializer, UserPasswordSerializer)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    # Ограничиваем доступ для не-админов
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Только админы могут создавать/изменять/удалять пользователей
            return [IsAdmin()]
        # Все аутентифицированные могут просматривать
        return [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class UserChangePasswordView(generics.UpdateAPIView):
    serializer_class = UserPasswordSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            if not check_password(serializer.validated_data['old_password'], user.password):
                return Response(
                    {'old_password': ['Текущий пароль неверен']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': 'Пароль успешно изменен'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


