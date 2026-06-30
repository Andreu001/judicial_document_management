"""
API views для коммуникационной платформы.
"""
from django.db.models import Q, Count, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from communication.models import (
    Chat, ChatMember, Message, MessageRead, MessageAttachment,
    Broadcast, BroadcastRecipient, Task, TaskComment, TaskAttachment,
    DocumentExchange, DocumentExchangeAttachment,
    IntercourtRoute, AutoNotificationRule,
    MessageAnalytics, MessageSearchIndex, VideoConference,
    ChatType, MemberRole, MessageType, BroadcastStatus,
    TaskStatus, DocumentExchangeStatus, ChatType 
)
from communication.serializers import (
    ChatListSerializer, ChatDetailSerializer, ChatCreateSerializer,
    ChatMemberSerializer,
    MessageSerializer, MessageCreateSerializer, MessageUpdateSerializer,
    MessageAttachmentSerializer,
    BroadcastSerializer, BroadcastCreateSerializer, BroadcastRecipientSerializer,
    TaskSerializer, TaskCreateSerializer, TaskCommentSerializer, TaskAttachmentSerializer,
    DocumentExchangeSerializer, DocumentExchangeCreateSerializer,
    DocumentExchangeAttachmentSerializer,
    IntercourtRouteSerializer, AutoNotificationRuleSerializer,
    MessageAnalyticsSerializer, MessageSearchResultSerializer,
    VideoConferenceSerializer,
)
from communication.permissions import (
    IsChatMember, IsChatAdmin, IsChatOwner,
    CanSendMessage, CanManageChat,
    IsCourtEmployee,
)
from communication.utils import (
    get_user_court, get_available_courts_for_chat, search_messages,
    format_message_for_ws,
)


# =============================================================================
# Chat ViewSet
# =============================================================================

class ChatViewSet(viewsets.ModelViewSet):
    """
    API для управления чатами.
    """
    queryset = Chat.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['chat_type', 'court', 'department']
    search_fields = ['title', 'description']
    ordering_fields = ['last_message_at', 'created_at', 'title']
    ordering = ['-last_message_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ChatCreateSerializer
        if self.action in ['retrieve', 'update', 'partial_update']:
            return ChatDetailSerializer
        return ChatListSerializer

    def get_queryset(self):
        user = self.request.user
        # Только чаты, где пользователь — активный участник
        return Chat.objects.filter(
            members__user=user, members__is_active=True, is_active=True
        ).select_related(
            'last_message', 'last_message__sender', 'court', 'target_court'
        ).prefetch_related(
            'members', 'members__user'
        ).order_by('-last_message_at', '-created_at').distinct()

    def perform_create(self, serializer):
        chat = serializer.save()
        # Авто-создание чатов отделов при регистрации
        if chat.chat_type == ChatType.DEPARTMENT and chat.department:
            from communication.utils import auto_create_department_chats
            pass  # уже обработано в сериализаторе

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Присоединиться к чату."""
        chat = self.get_object()
        if ChatMember.objects.filter(chat=chat, user=request.user).exists():
            member = ChatMember.objects.get(chat=chat, user=request.user)
            member.is_active = True
            member.left_at = None
            member.save()
            return Response({'detail': 'Вы снова в чате'})
        ChatMember.objects.create(chat=chat, user=request.user, role=MemberRole.MEMBER)
        return Response({'detail': 'Вы присоединились к чату'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Покинуть чат."""
        chat = self.get_object()
        member = get_object_or_404(ChatMember, chat=chat, user=request.user, is_active=True)

        # Проверяем, является ли пользователь владельцем
        if member.role == MemberRole.OWNER:
            # Находим другого администратора или участника для передачи прав
            other_admin = ChatMember.objects.filter(
                chat=chat,
                is_active=True,
                role__in=[MemberRole.ADMIN, MemberRole.OWNER]
            ).exclude(user=request.user).first()
            
            # Если есть другой администратор — передаём ему права
            if other_admin:
                other_admin.role = MemberRole.OWNER
                other_admin.save()
            else:
                # Если других администраторов нет, ищем любого другого участника
                other_member = ChatMember.objects.filter(
                    chat=chat,
                    is_active=True
                ).exclude(user=request.user).first()
                
                if other_member:
                    # Делаем его владельцем
                    other_member.role = MemberRole.OWNER
                    other_member.save()
                else:
                    # Если участников больше нет — удаляем чат
                    chat.is_active = False
                    chat.save()
                    member.is_active = False
                    member.left_at = timezone.now()
                    member.save()
                    return Response({'detail': 'Чат удалён, так как вы были единственным участником'})
        
        # Если чат личный — просто удаляем его
        if chat.chat_type == ChatType.DIRECT:
            chat.is_active = False
            chat.save()
            member.is_active = False
            member.left_at = timezone.now()
            member.save()
            return Response({'detail': 'Личный чат удалён'})

        # Выход из чата
        member.is_active = False
        member.left_at = timezone.now()
        member.save()
        
        # Если в чате не осталось активных участников — деактивируем чат
        if not ChatMember.objects.filter(chat=chat, is_active=True).exists():
            chat.is_active = False
            chat.save()
            return Response({'detail': 'Чат удалён, так как не осталось участников'})
        
        return Response({'detail': 'Вы покинули чат'})

    @action(detail=True, methods=['post'])
    def add_members(self, request, pk=None):
        """Добавить участников в чат."""
        chat = self.get_object()
        if not chat.is_admin(request.user):
            raise PermissionDenied("Только администратор может добавлять участников")

        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'detail': 'Укажите user_ids'}, status=status.HTTP_400_BAD_REQUEST)

        added = []
        for uid in user_ids:
            member, created = ChatMember.objects.get_or_create(
                chat=chat, user_id=uid,
                defaults={'role': MemberRole.MEMBER}
            )
            if not created and not member.is_active:
                member.is_active = True
                member.left_at = None
                member.save()
                created = True
            if created:
                added.append(uid)

        return Response({'detail': f'Добавлено: {len(added)}', 'added_ids': added})

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Удалить участника из чата."""
        chat = self.get_object()
        if not chat.is_admin(request.user):
            raise PermissionDenied("Только администратор может удалять участников")

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'Укажите user_id'}, status=status.HTTP_400_BAD_REQUEST)

        member = get_object_or_404(ChatMember, chat=chat, user_id=user_id, is_active=True)
        if member.role == MemberRole.OWNER:
            return Response({'detail': 'Нельзя удалить владельца'},
                          status=status.HTTP_400_BAD_REQUEST)

        member.is_active = False
        member.left_at = timezone.now()
        member.save()
        return Response({'detail': 'Участник удалён'})

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Изменить роль участника."""
        chat = self.get_object()
        if not chat.is_admin(request.user):
            raise PermissionDenied()

        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        if not user_id or not new_role:
            return Response({'detail': 'Укажите user_id и role'},
                          status=status.HTTP_400_BAD_REQUEST)

        if new_role not in dict(MemberRole.choices):
            return Response({'detail': 'Недопустимая роль'}, status=status.HTTP_400_BAD_REQUEST)

        member = get_object_or_404(ChatMember, chat=chat, user_id=user_id, is_active=True)
        if member.role == MemberRole.OWNER and new_role != MemberRole.OWNER:
            return Response({'detail': 'Нельзя понизить владельца'},
                          status=status.HTTP_400_BAD_REQUEST)

        member.role = new_role
        member.save()
        return Response({'detail': f'Роль изменена на {member.get_role_display()}'})

    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """Закрепить/открепить чат."""
        member = get_object_or_404(
            ChatMember, chat_id=pk, user=request.user, is_active=True
        )
        member.is_pinned = not member.is_pinned
        member.pinned_at = timezone.now() if member.is_pinned else None
        member.save()
        return Response({
            'is_pinned': member.is_pinned,
            'detail': 'Чат закреплён' if member.is_pinned else 'Чат откреплён'
        })

    @action(detail=True, methods=['post'])
    def toggle_mute(self, request, pk=None):
        """Включить/выключить уведомления чата."""
        member = get_object_or_404(
            ChatMember, chat_id=pk, user=request.user, is_active=True
        )
        member.is_muted = not member.is_muted
        member.save()
        return Response({
            'is_muted': member.is_muted,
            'detail': 'Уведомления выключены' if member.is_muted else 'Уведомления включены'
        })

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Отметить чат как прочитанный."""
        member = get_object_or_404(
            ChatMember, chat_id=pk, user=request.user, is_active=True
        )
        member.mark_read()
        return Response({'detail': 'Прочитано'})

    @action(detail=False, methods=['post'])
    def direct_chat(self, request):
        """Создать/получить личный чат с пользователем."""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'Укажите user_id'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import User
        other_user = get_object_or_404(User, pk=user_id)

        chat, created = Chat.get_or_create_direct(request.user, other_user)
        serializer = ChatDetailSerializer(chat, context={'request': request})
        return Response(serializer.data,
                       status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def available_intercourt(self, request):
        """Список судов, доступных для межсудебных чатов."""
        courts = get_available_courts_for_chat(request.user)
        data = [{
            'id': c.id,
            'code': c.code,
            'name': c.name,
            'region': c.region.name if c.region else None,
            'level': c.level.name if c.level else None,
            'is_active': c.is_active,
        } for c in courts]
        return Response(data)

    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """Закреплённые чаты пользователя."""
        pinned_ids = ChatMember.objects.filter(
            user=request.user, is_active=True, is_pinned=True
        ).values_list('chat_id', flat=True)

        chats = self.get_queryset().filter(id__in=pinned_ids)
        serializer = ChatListSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Чаты с непрочитанными сообщениями."""
        chats = self.get_queryset()
        unread_chats = []
        for chat in chats:
            member = chat.members.filter(user=request.user, is_active=True).first()
            if member and member.get_unread_count() > 0:
                unread_chats.append(chat.id)

        chats = chats.filter(id__in=unread_chats)
        serializer = ChatListSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)


# =============================================================================
# Message ViewSet
# =============================================================================

class MessageViewSet(viewsets.ModelViewSet):
    """
    API для сообщений.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['chat', 'message_type', 'sender', 'is_pinned']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        if self.action in ['update', 'partial_update']:
            return MessageUpdateSerializer
        return MessageSerializer

    def get_queryset(self):
        user = self.request.user
        chat_id = self.request.query_params.get('chat')
        if chat_id:
            # Проверяем, что пользователь — участник чата
            if not ChatMember.objects.filter(
                chat_id=chat_id, user=user, is_active=True
            ).exists():
                return Message.objects.none()

        return Message.objects.filter(
            is_deleted=False
        ).filter(
            chat__members__user=user, chat__members__is_active=True
        ).select_related(
            'sender', 'reply_to', 'forward_from', 'task', 'chat'
        ).prefetch_related(
            'attachments', 'read_by'
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        message = serializer.save()
        # Авто-прочтение отправителем
        MessageRead.objects.get_or_create(
            message=message, user=self.request.user
        )

    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None):
        """Редактировать сообщение."""
        message = self.get_object()
        text = request.data.get('text', '')
        try:
            message.edit(text, request.user)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def delete(self, request, pk=None):
        """Удалить сообщение."""
        message = self.get_object()

        # Проверка прав: отправитель или админ чата
        if message.sender != request.user and not message.chat.is_admin(request.user):
            raise PermissionDenied()

        message.soft_delete(request.user)
        message.chat.update_last_message()
        return Response({'detail': 'Сообщение удалено'})

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Закрепить сообщение в чате."""
        message = self.get_object()
        try:
            message.pin(request.user)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Сообщение закреплено'})

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        """Открепить сообщение."""
        message = self.get_object()
        try:
            message.unpin(request.user)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Сообщение откреплено'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Отметить сообщение как прочитанное."""
        message = self.get_object()
        MessageRead.objects.get_or_create(message=message, user=request.user)
        return Response({'detail': 'Прочитано'})

    @action(detail=True, methods=['post'])
    def forward(self, request, pk=None):
        """Переслать сообщение в другой чат."""
        message = self.get_object()
        target_chat_id = request.data.get('chat_id')
        if not target_chat_id:
            return Response({'detail': 'Укажите chat_id'}, status=status.HTTP_400_BAD_REQUEST)

        target_chat = get_object_or_404(Chat, pk=target_chat_id)
        if not target_chat.is_member(request.user):
            raise PermissionDenied()

        new_msg = Message.objects.create(
            chat=target_chat,
            sender=request.user,
            message_type=MessageType.FORWARD,
            text=message.text,
            forward_from=message,
        )
        target_chat.update_last_message(new_msg)
        MessageRead.objects.get_or_create(message=new_msg, user=request.user)
        return Response(MessageSerializer(new_msg, context={'request': request}).data,
                       status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """Закреплённые сообщения в чате."""
        chat_id = request.query_params.get('chat')
        if not chat_id:
            return Response({'detail': 'Укажите chat'}, status=status.HTTP_400_BAD_REQUEST)

        messages = self.get_queryset().filter(chat_id=chat_id, is_pinned=True)
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск по сообщениям."""
        query = request.query_params.get('q', '')
        chat_id = request.query_params.get('chat')
        court_id = request.query_params.get('court')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))

        results = search_messages(query, request.user, chat_id, court_id, limit, offset)
        return Response(MessageSearchResultSerializer(results, many=True).data)


# =============================================================================
# MessageAttachment ViewSet
# =============================================================================

class MessageAttachmentViewSet(viewsets.ModelViewSet):
    """Загрузка вложений к сообщениям."""
    queryset = MessageAttachment.objects.all()
    serializer_class = MessageAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        original_filename = file_obj.name
        file_size = file_obj.size

        # Определяем тип
        mime = file_obj.content_type or ''
        if mime.startswith('image/'):
            file_type = 'image'
        elif mime in ['application/pdf', 'application/msword',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            file_type = 'document'
        elif mime.startswith('video/'):
            file_type = 'video'
        elif mime.startswith('audio/'):
            file_type = 'audio'
        else:
            file_type = 'other'

        serializer.save(
            original_filename=original_filename,
            file_size=file_size,
            mime_type=mime,
            file_type=file_type,
        )

    @action(detail=False, methods=['post'])
    def upload_multiple(self, request):
        """Загрузка нескольких файлов."""
        files = request.FILES.getlist('files')
        if not files:
            return Response({'detail': 'Файлы не предоставлены'}, status=status.HTTP_400_BAD_REQUEST)

        attachments = []
        for f in files:
            mime = f.content_type or ''
            if mime.startswith('image/'):
                file_type = 'image'
            elif mime.startswith('video/'):
                file_type = 'video'
            elif mime.startswith('audio/'):
                file_type = 'audio'
            else:
                file_type = 'document'

            attachment = MessageAttachment.objects.create(
                file=f,
                original_filename=f.name,
                file_size=f.size,
                mime_type=mime,
                file_type=file_type,
            )
            attachments.append(MessageAttachmentSerializer(attachment).data)

        return Response(attachments, status=status.HTTP_201_CREATED)


# =============================================================================
# Broadcast ViewSet
# =============================================================================

class BroadcastViewSet(viewsets.ModelViewSet):
    """API для рассылок."""
    permission_classes = [IsAuthenticated, IsCourtEmployee]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['broadcast_type', 'status', 'importance']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return BroadcastCreateSerializer
        return BroadcastSerializer

    def get_queryset(self):
        court = get_user_court(self.request.user)
        if not court:
            return Broadcast.objects.none()
        return Broadcast.objects.filter(court=court).select_related('sender').prefetch_related(
            'recipients', 'recipients__user'
        )

    def perform_create(self, serializer):
        broadcast = serializer.save()
        broadcast.send()

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отменить рассылку."""
        broadcast = self.get_object()
        if broadcast.status not in [BroadcastStatus.DRAFT, BroadcastStatus.SENDING]:
            return Response({'detail': 'Нельзя отменить'}, status=status.HTTP_400_BAD_REQUEST)
        broadcast.status = BroadcastStatus.CANCELLED
        broadcast.save()
        return Response({'detail': 'Рассылка отменена'})

    @action(detail=True, methods=['get'])
    def recipients(self, request, pk=None):
        """Получатели рассылки."""
        broadcast = self.get_object()
        recipients = broadcast.recipients.select_related('user')
        return Response(BroadcastRecipientSerializer(recipients, many=True).data)


class BroadcastRecipientViewSet(viewsets.ReadOnlyModelViewSet):
    """Получатели рассылок (для отметки прочтения)."""
    serializer_class = BroadcastRecipientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BroadcastRecipient.objects.filter(
            user=self.request.user
        ).select_related('broadcast')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Отметить рассылку как прочитанную."""
        recipient = self.get_object()
        recipient.mark_read()
        return Response({'detail': 'Отмечено как прочитанное'})

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Подтвердить получение/исполнение."""
        recipient = self.get_object()
        recipient.is_confirmed = True
        recipient.confirmed_at = timezone.now()
        recipient.save()
        return Response({'detail': 'Подтверждено'})


# =============================================================================
# Task ViewSet
# =============================================================================

class TaskViewSet(viewsets.ModelViewSet):
    """API для поручений."""
    permission_classes = [IsAuthenticated, IsCourtEmployee]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'department', 'court']
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            Q(created_by=user) | Q(assigned_to=user) |
            Q(department__employees__employee=user, department__employees__is_active=True)
        ).select_related(
            'created_by', 'assigned_to', 'department', 'court', 'chat'
        ).prefetch_related(
            'comments', 'comments__author', 'attachments'
        ).distinct().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принять поручение."""
        task = self.get_object()
        try:
            task.accept(request.user)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Начать работу над поручением."""
        task = self.get_object()
        try:
            task.start(request.user)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Отметить поручение выполненным."""
        task = self.get_object()
        try:
            task.complete(request.user)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить поручение."""
        task = self.get_object()
        reason = request.data.get('reason', '')
        try:
            task.reject(request.user, reason)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if reason:
            TaskComment.objects.create(task=task, author=request.user, text=f"Отклонено: {reason}")

        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """Добавить комментарий к поручению."""
        task = self.get_object()
        text = request.data.get('text', '')
        if not text:
            return Response({'detail': 'Текст обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        comment = TaskComment.objects.create(task=task, author=request.user, text=text)
        return Response(TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Мои поручения (я исполнитель)."""
        tasks = self.get_queryset().filter(assigned_to=request.user)
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def created_by_me(self, request):
        """Поручения, созданные мной."""
        tasks = self.get_queryset().filter(created_by=request.user)
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Просроченные поручения."""
        tasks = self.get_queryset().filter(
            deadline__lt=timezone.now()
        ).exclude(
            status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.REJECTED]
        )
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        """Загрузить вложение к поручению."""
        task = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'Файл не предоставлен'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = TaskAttachment.objects.create(
            task=task,
            file=file_obj,
            original_filename=file_obj.name,
            file_size=file_obj.size,
            uploaded_by=request.user,
        )
        return Response(TaskAttachmentSerializer(attachment).data,
                       status=status.HTTP_201_CREATED)


# =============================================================================
# DocumentExchange ViewSet
# =============================================================================

class DocumentExchangeViewSet(viewsets.ModelViewSet):
    """API для межсудебного обмена документами."""
    permission_classes = [IsAuthenticated, IsCourtEmployee]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'document_type', 'source_court', 'target_court', 'is_urgent']
    search_fields = ['title', 'description', 'reference_number', 'case_number']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentExchangeCreateSerializer
        return DocumentExchangeSerializer

    def get_queryset(self):
        user = self.request.user
        court = get_user_court(user)
        if not court:
            return DocumentExchange.objects.none()

        return DocumentExchange.objects.filter(
            Q(source_court=court) | Q(target_court__code=court.code)
        ).select_related(
            'source_court', 'target_court', 'source_user', 'processed_by'
        ).prefetch_related('attachments').distinct()

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Отправить документ."""
        exchange = self.get_object()
        exchange.send()
        return Response({'detail': 'Документ отправлен'})

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принять входящий документ."""
        exchange = self.get_object()
        exchange.accept(request.user)
        return Response({'detail': 'Документ принят'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить входящий документ."""
        exchange = self.get_object()
        reason = request.data.get('reason', '')
        exchange.reject(request.user, reason)
        return Response({'detail': 'Документ отклонён'})

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        """Загрузить вложение к обмену."""
        exchange = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'Файл не предоставлен'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = DocumentExchangeAttachment.objects.create(
            exchange=exchange,
            file=file_obj,
            original_filename=file_obj.name,
            file_size=file_obj.size,
        )
        return Response(DocumentExchangeAttachmentSerializer(attachment).data,
                       status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def incoming(self, request):
        """Входящие документы."""
        court = get_user_court(request.user)
        if not court:
            return Response([])
        qs = self.get_queryset().filter(target_court__code=court.code)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def outgoing(self, request):
        """Исходящие документы."""
        court = get_user_court(request.user)
        if not court:
            return Response([])
        qs = self.get_queryset().filter(source_court=court)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(self.get_serializer(qs, many=True).data)


# =============================================================================
# IntercourtRoute ViewSet
# =============================================================================

class IntercourtRouteViewSet(viewsets.ReadOnlyModelViewSet):
    """Правила межсудебной маршрутизации (только чтение через API)."""
    queryset = IntercourtRoute.objects.filter(is_active=True)
    serializer_class = IntercourtRouteSerializer
    permission_classes = [IsAuthenticated, IsCourtEmployee]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['source_level', 'target_level', 'is_active']

    @action(detail=False, methods=['get'])
    def for_my_court(self, request):
        """Маршруты для текущего суда."""
        court = get_user_court(request.user)
        if not court:
            return Response([])
        routes = IntercourtRoute.objects.filter(
            source_level=court.level, is_active=True
        )
        return Response(IntercourtRouteSerializer(routes, many=True).data)


# =============================================================================
# AutoNotificationRule ViewSet
# =============================================================================

class AutoNotificationRuleViewSet(viewsets.ModelViewSet):
    """Правила автоматических уведомлений."""
    serializer_class = AutoNotificationRuleSerializer
    permission_classes = [IsAuthenticated, IsCourtEmployee]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['trigger', 'is_active']

    def get_queryset(self):
        court = get_user_court(self.request.user)
        if not court:
            return AutoNotificationRule.objects.none()
        return AutoNotificationRule.objects.filter(court=court)


# =============================================================================
# Analytics ViewSet
# =============================================================================

class MessageAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """Аналитика сообщений."""
    serializer_class = MessageAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsCourtEmployee]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['court']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        court = get_user_court(user)
        if not court:
            return MessageAnalytics.objects.none()

        # Обычные сотрудники видят только свой суд
        if user.role not in ['judge', 'admin']:
            return MessageAnalytics.objects.filter(court=court)

        return MessageAnalytics.objects.all()


# =============================================================================
# VideoConference ViewSet
# =============================================================================

class VideoConferenceViewSet(viewsets.ModelViewSet):
    """Видеоконференции."""
    queryset = VideoConference.objects.all()
    serializer_class = VideoConferenceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'chat']
    ordering = ['-scheduled_at']


# =============================================================================
# Court Directory (для мессенджера)
# =============================================================================

class CourtDirectorySearchView(generics.ListAPIView):
    """
    Поиск судов в справочнике для межсудебного взаимодействия.
    """
    permission_classes = [IsAuthenticated, IsCourtEmployee]

    def get(self, request):
        from court_registry.models import CourtDirectory, CourtLevel
        query = request.query_params.get('q', '')
        region_id = request.query_params.get('region')
        level_code = request.query_params.get('level')
        limit = int(request.query_params.get('limit', 50))

        qs = CourtDirectory.objects.filter(is_active=True).select_related('region', 'level')

        if query:
            qs = qs.filter(
                Q(name__icontains=query) |
                Q(code__icontains=query) |
                Q(region__name__icontains=query)
            )

        if region_id:
            qs = qs.filter(region_id=region_id)
        if level_code:
            qs = qs.filter(level__code=level_code)

        # Проверяем маршрутизацию
        user_court = get_user_court(request.user)
        if user_court:
            from communication.models import IntercourtRoute
            allowed_levels = IntercourtRoute.objects.filter(
                source_level=user_court.level, is_active=True
            ).values_list('target_level_id', flat=True)
            qs = qs.filter(level_id__in=allowed_levels)

        qs = qs[:limit]

        data = [{
            'id': c.id,
            'code': c.code,
            'name': c.name,
            'region': c.region.name if c.region else None,
            'region_id': c.region_id,
            'level': c.level.name if c.level else None,
            'level_code': c.level.code if c.level else None,
            'address': c.address,
            'website': c.website,
            'is_active': c.is_active,
        } for c in qs]

        return Response(data)


# =============================================================================
# Department / Employee search (для мессенджера)
# =============================================================================

class DepartmentSearchView(generics.ListAPIView):
    """Поиск отделов суда."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from court_registry.models import CourtDepartment
        query = request.query_params.get('q', '')
        court_id = request.query_params.get('court')
        limit = int(request.query_params.get('limit', 50))

        user_court = get_user_court(request.user)
        qs = CourtDepartment.objects.filter(is_active=True).select_related('court')

        if court_id:
            qs = qs.filter(court_id=court_id)
        elif user_court:
            qs = qs.filter(court=user_court)

        if query:
            qs = qs.filter(name__icontains=query)

        qs = qs[:limit]
        data = [{
            'id': d.id, 'name': d.name, 'court_id': d.court_id,
            'court_name': d.court.name_short or d.court.name,
            'phone_internal': d.phone_internal, 'room': d.room,
            'employees_count': d.employees_count,
        } for d in qs]

        return Response(data)


class EmployeeSearchView(generics.ListAPIView):
    """Поиск сотрудников суда."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from court_registry.models import CourtEmployee
        query = request.query_params.get('q', '')
        department_id = request.query_params.get('department')
        court_id = request.query_params.get('court')
        role = request.query_params.get('role')
        limit = int(request.query_params.get('limit', 50))

        user_court = get_user_court(request.user)
        qs = CourtEmployee.objects.filter(is_active=True).select_related(
            'employee', 'department', 'department__court'
        )

        if department_id:
            qs = qs.filter(department_id=department_id)
        elif court_id:
            qs = qs.filter(department__court_id=court_id)
        elif user_court:
            qs = qs.filter(department__court=user_court)

        if role and hasattr(qs.model, 'employee'):
            qs = qs.filter(employee__role=role)

        if query:
            qs = qs.filter(
                Q(employee__first_name__icontains=query) |
                Q(employee__last_name__icontains=query) |
                Q(employee__username__icontains=query) |
                Q(position__icontains=query) |
                Q(department__name__icontains=query)
            )

        qs = qs[:limit]
        data = [{
            'id': e.employee_id, 'user_id': e.employee_id,
            'name': e.employee.get_full_name() or e.employee.username,
            'position': e.position,
            'department': e.department.name,
            'department_id': e.department_id,
            'court': e.department.court.name_short or e.department.court.name,
            'court_id': e.department.court_id,
            'is_head_of_department': e.is_head_of_department,
            'phone_internal': e.phone_internal,
            'phone_mobile': e.phone_mobile,
            'role': e.employee.role if hasattr(e.employee, 'role') else None,
        } for e in qs]

        return Response(data)


# =============================================================================
# Dashboard stats
# =============================================================================

class MessengerDashboardView(generics.GenericAPIView):
    """Дашборд мессенджера: сводка для текущего пользователя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        court = get_user_court(user)

        # Чаты
        chats = Chat.objects.filter(members__user=user, members__is_active=True, is_active=True)
        unread = sum(1 for c in chats if c.members.filter(user=user).first() and
                    c.members.filter(user=user).first().get_unread_count() > 0)

        # Поручения
        tasks_new = Task.objects.filter(assigned_to=user, status=TaskStatus.NEW).count()
        tasks_in_progress = Task.objects.filter(assigned_to=user, status=TaskStatus.IN_PROGRESS).count()
        tasks_overdue = Task.objects.filter(
            assigned_to=user, deadline__lt=timezone.now()
        ).exclude(status__in=[TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.REJECTED]).count()

        # Рассылки
        broadcasts_unread = BroadcastRecipient.objects.filter(
            user=user, is_read=False
        ).count()

        # Межсудебные документы
        if court:
            incoming_docs = DocumentExchange.objects.filter(
                target_court__code=court.code,
                status=DocumentExchangeStatus.RECEIVED,
            ).count()
        else:
            incoming_docs = 0

        return Response({
            'total_chats': chats.count(),
            'unread_chats': unread,
            'tasks_new': tasks_new,
            'tasks_in_progress': tasks_in_progress,
            'tasks_overdue': tasks_overdue,
            'broadcasts_unread': broadcasts_unread,
            'incoming_documents': incoming_docs,
            'court_name': court.name_short if court else None,
        })


class IntercourtCourtSearchView(generics.ListAPIView):
    """
    Поиск судов для межсудебного чата из справочника CourtDirectory.
    """
    permission_classes = [IsAuthenticated, IsCourtEmployee]

    def get(self, request):
        from court_registry.models import CourtDirectory, CourtLevel
        from court_registry.models import Court as CurrentCourt
        from communication.models import IntercourtRoute
        
        query = request.query_params.get('q', '')
        region_id = request.query_params.get('region')
        level_code = request.query_params.get('level')
        limit = int(request.query_params.get('limit', 50))

        # Получаем текущий суд пользователя
        current_court = get_user_court(request.user)
        if not current_court:
            return Response(
                {'error': 'Текущий суд не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Начинаем с активных судов в справочнике
        qs = CourtDirectory.objects.filter(
            is_active=True
        ).select_related('region', 'level')

        # Исключаем текущий суд
        qs = qs.exclude(code=current_court.code)

        if query:
            qs = qs.filter(
                Q(name__icontains=query) |
                Q(code__icontains=query) |
                Q(region__name__icontains=query)
            )

        if region_id:
            qs = qs.filter(region_id=region_id)
        if level_code:
            qs = qs.filter(level__code=level_code)

        # Проверяем маршрутизацию — только разрешенные уровни
        allowed_levels = IntercourtRoute.objects.filter(
            source_level=current_court.level,
            is_active=True,
            allow_chats=True
        ).values_list('target_level_id', flat=True)
        
        if allowed_levels.exists():
            qs = qs.filter(level_id__in=allowed_levels)

        qs = qs[:limit]

        data = [{
            'id': c.id,
            'code': c.code,
            'name': c.name,
            # 'name_short': c.name_short or c.name,  # <-- УДАЛИТЕ ЭТУ СТРОКУ
            'region': c.region.name if c.region else None,
            'region_id': c.region_id,
            'level': c.level.name if c.level else None,
            'level_code': c.level.code if c.level else None,
            'address': c.address,
            'website': c.website,
            'is_active': c.is_active,
        } for c in qs]

        return Response(data)
