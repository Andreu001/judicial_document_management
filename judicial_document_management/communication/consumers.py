"""
WebSocket-консьюмеры для real-time мессенджера.
"""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import logging

from communication.models import Chat, ChatMember, Message, MessageRead
from communication.utils import format_message_for_ws

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Основной WebSocket-консьюмер для чатов.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.chat_id = None
        self.chat_group = None
        self.chat = None
        self.member = None

    async def connect(self):
        # Получаем токен из query параметров
        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        # Пытаемся авторизоваться через токен
        if token:
            self.user = await self.get_user_from_token(token)
            if self.user:
                self.scope['user'] = self.user
                logger.info(f"WebSocket authenticated: user {self.user.id} via token")

        # Если пользователь не авторизован — пробуем через сессию
        if not self.user:
            self.user = self.scope.get('user')
            if self.user and self.user.is_authenticated:
                logger.info(f"WebSocket authenticated: user {self.user.id} via session")

        if not self.user or not self.user.is_authenticated:
            logger.warning("WebSocket rejected: user not authenticated")
            await self.close(code=4001)
            return

        self.chat_id = self.scope['url_route']['kwargs'].get('chat_id')
        if not self.chat_id:
            await self.close(code=4002)
            return

        # Проверяем доступ к чату
        has_access = await self.check_chat_access()
        if not has_access:
            logger.warning(f"WebSocket rejected: user {self.user.id} has no access to chat {self.chat_id}")
            await self.close(code=4003)
            return

        self.chat_group = f'chat_{self.chat_id}'

        # Присоединяемся к группе чата
        await self.channel_layer.group_add(self.chat_group, self.channel_name)

        # Присоединяемся к персональной группе
        await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)

        await self.accept()

        # Отмечаем вход
        await self.mark_online()

        # Отправляем участникам уведомление об онлайне
        await self.channel_layer.group_send(
            self.chat_group,
            {
                'type': 'presence_online',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name() or self.user.username,
            }
        )

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Получить пользователя из токена."""
        from rest_framework.authtoken.models import Token
        try:
            token_obj = Token.objects.get(key=token)
            return token_obj.user
        except Token.DoesNotExist:
            logger.warning(f"Invalid token: {token[:10]}...")
            return None

    async def disconnect(self, close_code):
        if self.chat_group:
            # Отмечаем выход
            await self.mark_offline()

            # Уведомляем группу
            if self.user:
                await self.channel_layer.group_send(
                    self.chat_group,
                    {
                        'type': 'presence_offline',
                        'user_id': self.user.id,
                    }
                )

            await self.channel_layer.group_discard(self.chat_group, self.channel_name)

        if self.user:
            await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)

    # ---- Receive ----

    async def receive_json(self, content, **kwargs):
        """Обработка входящих сообщений."""
        msg_type = content.get('type', '')

        handlers = {
            'chat.message': self.handle_message,
            'chat.message_read': self.handle_mark_read,
            'chat.typing': self.handle_typing,
            'chat.ping': self.handle_ping,
        }

        handler = handlers.get(msg_type)
        if handler:
            await handler(content)
        else:
            await self.send_error(f'Неизвестный тип сообщения: {msg_type}')

    async def handle_message(self, content):
        """Отправка нового сообщения."""
        text = content.get('text', '')
        reply_to_id = content.get('reply_to_id')
        forward_from_id = content.get('forward_from_id')
        attachment_ids = content.get('attachment_ids', [])
        message_type = content.get('message_type', 'text')

        try:
            message = await self.create_message(
                text=text,
                message_type=message_type,
                reply_to_id=reply_to_id,
                forward_from_id=forward_from_id,
                attachment_ids=attachment_ids,
            )
        except Exception as e:
            await self.send_error(str(e))
            return

        # Отправляем всем в группе
        message_data = await self.get_message_data(message)

        await self.channel_layer.group_send(
            self.chat_group,
            {
                'type': 'chat_message',
                'message': message_data,
            }
        )

    async def handle_mark_read(self, content):
        """Отметка о прочтении."""
        message_id = content.get('message_id')
        if message_id:
            await self.mark_message_read(message_id)

    async def handle_typing(self, content):
        """Пользователь печатает."""
        await self.channel_layer.group_send(
            self.chat_group,
            {
                'type': 'chat_typing',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name() or self.user.username,
            }
        )

    async def handle_ping(self, content):
        """Пинг для поддержания соединения."""
        await self.send_json({'type': 'pong'})

    # ---- Group event handlers ----

    async def chat_message(self, event):
        """Новое сообщение в чате."""
        await self.send_json({
            'type': 'chat.message',
            'message': event['message'],
        })

    async def chat_message_edited(self, event):
        """Сообщение отредактировано."""
        await self.send_json({
            'type': 'chat.message_edited',
            'message_id': event['message_id'],
            'text': event['text'],
            'edited_at': event['edited_at'],
            'edit_history': event.get('edit_history', []),
        })

    async def chat_message_deleted(self, event):
        """Сообщение удалено."""
        await self.send_json({
            'type': 'chat.message_deleted',
            'message_id': event['message_id'],
        })

    async def chat_message_read(self, event):
        """Сообщение прочитано."""
        await self.send_json({
            'type': 'chat.message_read',
            'message_id': event['message_id'],
            'user_id': event['user_id'],
            'read_at': event['read_at'],
        })

    async def chat_pinned(self, event):
        """Сообщение закреплено/откреплено."""
        await self.send_json({
            'type': 'chat.pinned',
            'message_id': event['message_id'],
            'is_pinned': event['is_pinned'],
        })

    async def chat_typing(self, event):
        """Кто-то печатает."""
        await self.send_json({
            'type': 'chat.typing',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
        })

    async def chat_member_joined(self, event):
        """Участник присоединился."""
        await self.send_json({
            'type': 'chat.member_joined',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
        })

    async def chat_member_left(self, event):
        """Участник вышел."""
        await self.send_json({
            'type': 'chat.member_left',
            'user_id': event['user_id'],
        })

    async def chat_title_changed(self, event):
        """Название чата изменено."""
        await self.send_json({
            'type': 'chat.title_changed',
            'title': event['title'],
        })

    async def presence_online(self, event):
        """Пользователь онлайн."""
        await self.send_json({
            'type': 'presence.online',
            'user_id': event['user_id'],
            'user_name': event.get('user_name', ''),
        })

    async def presence_offline(self, event):
        """Пользователь офлайн."""
        await self.send_json({
            'type': 'presence.offline',
            'user_id': event['user_id'],
        })

    async def notification(self, event):
        """Системное уведомление (рассылка, поручение, etc)."""
        await self.send_json({
            'type': 'notification',
            'notification_type': event.get('notification_type', 'system'),
            'title': event.get('title', ''),
            'text': event.get('text', ''),
            'data': event.get('data', {}),
        })

    # ---- Database helpers ----

    @database_sync_to_async
    def check_chat_access(self):
        """Проверить доступ пользователя к чату."""
        try:
            self.chat = Chat.objects.get(pk=self.chat_id, is_active=True)
            self.member = ChatMember.objects.get(
                chat=self.chat, user=self.user, is_active=True
            )
            return True
        except (Chat.DoesNotExist, ChatMember.DoesNotExist):
            return False

    @database_sync_to_async
    def create_message(self, text, message_type, reply_to_id, forward_from_id, attachment_ids):
        """Создать сообщение в БД."""
        kwargs = {
            'chat': self.chat,
            'sender': self.user,
            'text': text,
            'message_type': message_type,
        }
        if reply_to_id:
            kwargs['reply_to'] = Message.objects.filter(pk=reply_to_id).first()
        if forward_from_id:
            kwargs['forward_from'] = Message.objects.filter(pk=forward_from_id).first()

        message = Message.objects.create(**kwargs)

        # Вложения
        if attachment_ids:
            from communication.models import MessageAttachment
            MessageAttachment.objects.filter(
                pk__in=attachment_ids, message__isnull=True
            ).update(message=message)

        # Авто-прочтение
        MessageRead.objects.create(message=message, user=self.user)

        # Обновляем last_message чата
        self.chat.update_last_message(message)

        return message

    @database_sync_to_async
    def get_message_data(self, message):
        """Получить данные сообщения для отправки."""
        return format_message_for_ws(message)

    @database_sync_to_async
    def mark_message_read(self, message_id):
        """Отметить сообщение прочитанным."""
        try:
            message = Message.objects.get(pk=message_id)
            MessageRead.objects.get_or_create(message=message, user=self.user)

            # Обновляем last_read_at участника
            ChatMember.objects.filter(chat=self.chat, user=self.user).update(
                last_read_at=timezone.now()
            )
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_online(self):
        """Отметить пользователя онлайн."""
        pass

    @database_sync_to_async
    def mark_offline(self):
        """Отметить пользователя офлайн."""
        pass

    async def send_error(self, message):
        """Отправить ошибку."""
        await self.send_json({
            'type': 'chat.error',
            'message': message,
        })


class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """
    Глобальный WebSocket для уведомлений.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None

    async def connect(self):
        # Получаем токен из query параметров
        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            self.user = await self.get_user_from_token(token)
            if self.user:
                self.scope['user'] = self.user

        if not self.user:
            self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)
        await self.accept()

    @database_sync_to_async
    def get_user_from_token(self, token):
        from rest_framework.authtoken.models import Token
        try:
            token_obj = Token.objects.get(key=token)
            return token_obj.user
        except Token.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        if self.user:
            await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get('type', '')
        if msg_type == 'ping':
            await self.send_json({'type': 'pong'})

    async def notification_broadcast(self, event):
        await self.send_json({
            'type': 'notification.broadcast',
            'broadcast_id': event['broadcast_id'],
            'title': event.get('title', ''),
            'importance': event.get('importance', 'normal'),
        })

    async def notification_task(self, event):
        await self.send_json({
            'type': 'notification.task',
            'task_id': event['task_id'],
            'title': event.get('title', ''),
            'status': event.get('status', ''),
            'action': event.get('action', 'created'),
        })

    async def notification_document(self, event):
        await self.send_json({
            'type': 'notification.document',
            'exchange_id': event['exchange_id'],
            'title': event.get('title', ''),
            'from_court': event.get('from_court', ''),
        })

    async def notification_system(self, event):
        await self.send_json({
            'type': 'notification.system',
            'title': event.get('title', ''),
            'text': event.get('text', ''),
        })