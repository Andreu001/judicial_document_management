# side_case_access/auth.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from .models import ExternalUser


class ExternalUserAuthentication(BaseAuthentication):
    """
    Аутентификация для внешних пользователей (участников процесса).
    Использует простой токен из поля auth_token (MD5).
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            # Поддержка формата "Bearer <token>" или "Token <token>"
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
            elif auth_header.startswith('Token '):
                token = auth_header[6:]
            else:
                token = auth_header
            
            # Ищем пользователя по токену (НЕ используем JWT decode!)
            try:
                user = ExternalUser.objects.get(auth_token=token, is_active=True)
                return (user, None)
            except ExternalUser.DoesNotExist:
                return None
                
        except Exception:
            return None
    
    def authenticate_header(self, request):
        return 'Bearer'