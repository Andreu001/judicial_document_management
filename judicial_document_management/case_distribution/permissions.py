from rest_framework import permissions


class CanManageAssignment(permissions.BasePermission):
    """
    Разрешение для управления распределением дел.
    """
    def has_permission(self, request, view):
        # Администратор всегда может
        if request.user.role == 'admin':
            return True
        
        # Судья может управлять
        if request.user.role == 'judge':
            return True
        
        # Секретарь может управлять
        if request.user.role in ['secretary', 'assistant_referee']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Проверка на уровне объекта
        return self.has_permission(request, view)


class IsJudgeOrAdmin(permissions.BasePermission):
    """
    Разрешение только для судей и администраторов.
    """
    def has_permission(self, request, view):
        return request.user.role in ['admin', 'judge']


class IsAssignmentManager(permissions.BasePermission):
    """
    Разрешение для менеджеров распределения.
    """
    def has_permission(self, request, view):
        return request.user.role in ['admin', 'judge', 'secretary', 'assistant_referee']