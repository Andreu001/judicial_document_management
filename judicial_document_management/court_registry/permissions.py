"""
Права доступа для приложения court_registry.
"""
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from django.contrib.contenttypes.models import ContentType
import logging

logger = logging.getLogger(__name__)


class IsCourtAdmin(BasePermission):
    """
    Проверяет, является ли пользователь администратором суда
    (системный админ ИЛИ руководитель отдела/судья).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Системный администратор
        if request.user.is_staff or request.user.is_superuser:
            return True

        if request.user.role == 'admin':
            return True

        # Председатель суда или заместитель
        from .models import CourtEmployee, Court
        try:
            employment = CourtEmployee.objects.filter(
                employee=request.user,
                is_active=True
            ).first()
            if employment:
                if employment.is_head_of_department:
                    return True
                if employment.employee.role == 'judge':
                    court = employment.department.court
                    if court.chairman == request.user:
                        return True
                    if court.vice_chairmen.filter(id=request.user.id).exists():
                        return True
        except Exception as e:
            logger.error(f"Error in IsCourtAdmin: {e}")

        return False


class IsCourtEmployee(BasePermission):
    """Проверяет, привязан ли пользователь к суду как сотрудник"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        from .models import CourtEmployee
        return CourtEmployee.objects.filter(
            employee=request.user,
            is_active=True
        ).exists()


class IsSameCourt(BasePermission):
    """Проверяет, что пользователь принадлежит к тому же суду, что и объект"""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        from .models import CourtEmployee
        try:
            employment = CourtEmployee.objects.filter(
                employee=request.user,
                is_active=True
            ).first()
            if not employment:
                return False

            court_id = employment.department.court_id

            # Определяем суд объекта
            if hasattr(obj, 'court'):
                return obj.court_id == court_id
            elif hasattr(obj, 'source_court'):
                return obj.source_court_id == court_id or obj.destination_court_id == court_id
            elif hasattr(obj, 'initiator_court'):
                return obj.initiator_court_id == court_id
            elif hasattr(obj, 'department') and hasattr(obj.department, 'court'):
                return obj.department.court_id == court_id
        except Exception as e:
            logger.error(f"Error in IsSameCourt: {e}")

        return False


class IsSourceCourt(BasePermission):
    """Проверяет, что пользователь принадлежит к суду-отправителю"""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        from .models import CourtEmployee
        try:
            employment = CourtEmployee.objects.filter(
                employee=request.user,
                is_active=True
            ).first()
            if employment:
                court_id = employment.department.court_id
                if hasattr(obj, 'source_court'):
                    return obj.source_court_id == court_id
                if hasattr(obj, 'initiator_court'):
                    return obj.initiator_court_id == court_id
        except Exception:
            pass

        return False


class IsDestinationCourt(BasePermission):
    """Проверяет, что пользователь принадлежит к суду-получателю"""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        from .models import CourtEmployee
        try:
            employment = CourtEmployee.objects.filter(
                employee=request.user,
                is_active=True
            ).first()
            if employment:
                court_id = employment.department.court_id
                if hasattr(obj, 'destination_court'):
                    return obj.destination_court_id == court_id
        except Exception:
            pass

        return False


class CanCreateInterCourtMessages(BasePermission):
    """Может создавать межсудебные сообщения (удалено - возвращаем False)"""
    def has_permission(self, request, view):
        return False
