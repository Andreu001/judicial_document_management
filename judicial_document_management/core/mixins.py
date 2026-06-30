from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class ExternalUserReadOnlyMixin:
    """
    Миксин, который запрещает внешним пользователям 
    создание, редактирование и удаление объектов.
    """
    
    def get_permissions(self):
        from side_case_access.permissions import ExternalUserReadOnly
        
        if self.request.user and hasattr(self.request.user, 'social_provider'):
            # Для внешних пользователей - только чтение
            self.permission_classes = [ExternalUserReadOnly]
        else:
            # Для внутренних сотрудников - стандартные permissions
            self.permission_classes = [permissions.IsAuthenticated]
        
        return super().get_permissions()
    
    def check_object_permissions(self, request, obj):
        from side_case_access.models import ExternalUser
        
        # Внешние пользователи
        if request.user and isinstance(request.user, ExternalUser):
            # GET разрешен
            if request.method in permissions.SAFE_METHODS:
                return
            
            # POST/PUT/PATCH/DELETE запрещены
            raise PermissionDenied("У вас нет прав на изменение данных")
        
        super().check_object_permissions(request, obj)
    
    def create(self, request, *args, **kwargs):
        from side_case_access.models import ExternalUser
        
        if request.user and isinstance(request.user, ExternalUser):
            raise PermissionDenied("У вас нет прав на создание записей")
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        from side_case_access.models import ExternalUser
        
        if request.user and isinstance(request.user, ExternalUser):
            raise PermissionDenied("У вас нет прав на изменение записей")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        from side_case_access.models import ExternalUser
        
        if request.user and isinstance(request.user, ExternalUser):
            raise PermissionDenied("У вас нет прав на удаление записей")
        return super().destroy(request, *args, **kwargs)