"""
Маршрутизация WebSockets для приложения court_registry.
Для реал-тайм уведомлений о поступлении дел и сообщений.
"""
from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
# from . import consumers  # Раскомментировать при создании consumers.py

# websocket_urlpatterns = [
#     re_path(r'ws/court/notifications/(?P<court_id>\w+)/$', consumers.CourtNotificationConsumer.as_asgi()),
#     re_path(r'ws/court/chat/(?P<chat_uuid>\w+)/$', consumers.InterCourtChatConsumer.as_asgi()),
# ]