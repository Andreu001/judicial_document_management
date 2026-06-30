# side_case_access/permissions.py
from rest_framework import permissions


class IsExternalUser(permissions.BasePermission):
    """
    Разрешение для внешних пользователей (участников процесса).
    """
    def has_permission(self, request, view):
        # Проверяем, что пользователь - внешний (из модели ExternalUser)
        from .models import ExternalUser
        return request.user and isinstance(request.user, ExternalUser)
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsInternalUser(permissions.BasePermission):
    """
    Разрешение для внутренних сотрудников суда (модель User).
    """
    def has_permission(self, request, view):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Пользователь аутентифицирован и это модель User (внутренний сотрудник)
        return request.user and request.user.is_authenticated and isinstance(request.user, User)
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class ExternalUserReadOnly(permissions.BasePermission):
    """
    Внешние пользователи имеют только чтение (GET), 
    кроме определенных actions (create_petition, upload_document).
    """
    SAFE_ACTIONS = ['create_petition', 'upload_document', 'download_decision']
    
    def has_permission(self, request, view):
        from .models import ExternalUser
        
        # Внутренние сотрудники имеют полный доступ
        if request.user and request.user.is_authenticated:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if isinstance(request.user, User):
                return True
        
        # Внешние пользователи
        if request.user and isinstance(request.user, ExternalUser):
            # GET запросы разрешены всегда
            if request.method in permissions.SAFE_METHODS:
                return True
            
            # Разрешаем определенные действия
            action = getattr(view, 'action', None)
            if action in self.SAFE_ACTIONS:
                return True
            
            # POST на создание ходатайств и загрузку документов
            if request.method == 'POST':
                if hasattr(view, 'basename') and view.basename in ['petition', 'document']:
                    return True
            
            return False
        
        return False


class ExternalUserCaseAccess(permissions.BasePermission):
    """
    Проверка доступа внешнего пользователя к конкретному делу.
    """
    def has_object_permission(self, request, view, obj):
        from .models import ExternalUser, CaseAccessGrant
        
        # Внутренние сотрудники имеют полный доступ
        if request.user and request.user.is_authenticated:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if isinstance(request.user, User):
                return True
        
        # Внешние пользователи
        if request.user and isinstance(request.user, ExternalUser):
            # Проверяем, есть ли у пользователя доступ к делу
            case_id = None
            content_type = None
            
            # Пытаемся получить дело из obj
            if hasattr(obj, 'case'):
                case_id = obj.case.id
                content_type = obj.case._meta.model._meta.label_lower
            elif hasattr(obj, 'criminal_proceedings'):
                case_id = obj.criminal_proceedings.id
                content_type = 'criminal_proceedings.criminalproceedings'
            elif hasattr(obj, 'civil_proceedings'):
                case_id = obj.civil_proceedings.id
                content_type = 'civil_proceedings.civilproceedings'
            elif hasattr(obj, 'kas_proceedings'):
                case_id = obj.kas_proceedings.id
                content_type = 'administrative_proceedings.kasproceedings'
            elif hasattr(obj, 'administrative_proceedings'):
                case_id = obj.administrative_proceedings.id
                content_type = 'administrative_code.administrativeproceedings'
            
            if case_id and content_type:
                from django.contrib.contenttypes.models import ContentType
                ct = ContentType.objects.get_by_natural_key(*content_type.split('.'))
                return CaseAccessGrant.objects.filter(
                    external_user=request.user,
                    content_type=ct,
                    object_id=case_id,
                    is_active=True
                ).exists()
        
        return False


class CanSubmitPetition(permissions.BasePermission):
    """
    Проверка права на подачу ходатайства.
    """
    def has_permission(self, request, view):
        from .models import ExternalUser, CaseAccessGrant
        
        if not request.user or not isinstance(request.user, ExternalUser):
            return False
        
        # Получаем case_id и case_type из запроса
        case_id = request.data.get('case_id')
        case_type = request.data.get('case_type')
        
        if not case_id or not case_type:
            return False
        
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return False
        
        from django.contrib.contenttypes.models import ContentType
        app_label, model_name = type_mapping[case_type]
        ct = ContentType.objects.get(app_label=app_label, model=model_name)
        
        grant = CaseAccessGrant.objects.filter(
            external_user=request.user,
            content_type=ct,
            object_id=case_id,
            is_active=True,
            access_level__in=['petition', 'full']
        ).first()
        
        return grant is not None


class CanUploadDocument(permissions.BasePermission):
    """
    Проверка права на загрузку документов.
    """
    def has_permission(self, request, view):
        from .models import ExternalUser, CaseAccessGrant
        
        if not request.user or not isinstance(request.user, ExternalUser):
            return False
        
        case_id = request.data.get('case_id')
        case_type = request.data.get('case_type')
        
        if not case_id or not case_type:
            return False
        
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return False
        
        from django.contrib.contenttypes.models import ContentType
        app_label, model_name = type_mapping[case_type]
        ct = ContentType.objects.get(app_label=app_label, model=model_name)
        
        grant = CaseAccessGrant.objects.filter(
            external_user=request.user,
            content_type=ct,
            object_id=case_id,
            is_active=True,
            access_level__in=['document', 'full']
        ).first()
        
        return grant is not None