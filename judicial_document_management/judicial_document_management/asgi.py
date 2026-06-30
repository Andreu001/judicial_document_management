# judicial_document_management/asgi.py

import os
from django.core.asgi import get_asgi_application

# ВАЖНО: сначала устанавливаем настройки ДО импорта других модулей
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'judicial_document_management.settings')

# Инициализируем Django приложение ДО импорта routing
django_asgi_app = get_asgi_application()

# Теперь можно импортировать routing
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from communication.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})