"""
Разрешения для коммуникационной платформы.
"""
from rest_framework import permissions
from communication.utils import get_user_court


class IsCourtEmployee(permissions.BasePermission):
    """Доступ только сотрудникам суда."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Суперпользователь всегда имеет доступ
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        court = get_user_court(request.user)
        return court is not None


class IsChatMember(permissions.BasePermission):
    """Доступ только участникам чата."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Суперпользователь имеет доступ ко всем чатам
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # obj может быть Chat или Message
        if hasattr(obj, 'members'):
            return obj.is_member(request.user)
        if hasattr(obj, 'chat'):
            return obj.chat.is_member(request.user)
        return False


class IsChatAdmin(permissions.BasePermission):
    """Доступ только администраторам чата."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        if hasattr(obj, 'is_admin'):
            return obj.is_admin(request.user)
        if hasattr(obj, 'chat'):
            return obj.chat.is_admin(request.user)
        return False


class IsChatOwner(permissions.BasePermission):
    """Доступ только владельцу чата."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        chat = obj if hasattr(obj, 'members') else obj.chat
        return chat.members.filter(
            user=request.user, is_active=True, role='owner'
        ).exists()


class CanSendMessage(permissions.BasePermission):
    """Проверка, может ли пользователь отправлять сообщения в чат."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.is_staff:
            return True

        chat_id = request.data.get('chat')
        if not chat_id:
            return True  # Пусть валидация обработает

        from communication.models import Chat
        chat = Chat.objects.filter(pk=chat_id).first()
        if not chat:
            return True

        return chat.can_post(request.user)


class CanManageChat(permissions.BasePermission):
    """Проверка прав на управление чатом."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        if hasattr(obj, 'is_admin'):
            return obj.is_admin(request.user)
        if hasattr(obj, 'chat'):
            return obj.chat.is_admin(request.user)
        return False