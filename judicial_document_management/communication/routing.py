"""
WebSocket-маршрутизация для коммуникационной платформы.
"""
from django.urls import re_path
from communication.consumers import ChatConsumer, GlobalConsumer

websocket_urlpatterns = [
    # Чат-комната
    re_path(r'^ws/chat/(?P<chat_id>\d+)/$', ChatConsumer.as_asgi()),
    # Глобальные уведомления
    re_path(r'^ws/global/$', GlobalConsumer.as_asgi()),
]
