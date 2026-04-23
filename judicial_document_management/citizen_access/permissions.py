from rest_framework import permissions


class IsCitizen(permissions.BasePermission):
    """Проверка, что пользователь является гражданином"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'citizen'
    
    def has_object_permission(self, request, view, obj):
        return obj.citizen == request.user


class HasCaseAccess(permissions.BasePermission):
    """Проверка доступа к конкретному делу"""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'citizen'):
            return obj.citizen == request.user
        elif hasattr(obj, 'case_access'):
            return obj.case_access.citizen == request.user
        return False


class CanSubmitPetition(permissions.BasePermission):
    """Проверка права на подачу ходатайства"""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'case_access'):
            return obj.case_access.citizen == request.user and \
                   obj.case_access.access_type in ['petition', 'full']
        return False


class CanUploadDocuments(permissions.BasePermission):
    """Проверка права на загрузку документов"""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'case_access'):
            return obj.case_access.citizen == request.user and \
                   obj.case_access.access_type in ['documents', 'full']
        return False