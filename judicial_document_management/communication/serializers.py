"""
Сериализаторы для коммуникационной платформы.
"""
from rest_framework import serializers
from django.db.models import Q
from django.utils import timezone

from communication.models import (
    Chat, ChatMember, Message, MessageRead, MessageAttachment,
    Broadcast, BroadcastRecipient, Task, TaskComment, TaskAttachment,
    DocumentExchange, DocumentExchangeAttachment,
    IntercourtRoute, AutoNotificationRule,
    MessageAnalytics, VideoConference, ChatType, MemberRole,
    MessageType, MessageSearchIndex,
)
from users.models import User
from users.serializers import UserSerializer
from court_registry.models import Court, CourtDepartment, CourtEmployee


# =============================================================================
# Вспомогательные сериализаторы
# =============================================================================

class SlimUserSerializer(serializers.ModelSerializer):
    """Облегчённый сериализатор пользователя для чатов."""
    display_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name',
                  'display_name', 'avatar_url', 'is_online', 'role']

    def get_display_name(self, obj):
        from communication.utils import get_user_display_name
        return get_user_display_name(obj)

    def get_avatar_url(self, obj):
        if hasattr(obj, 'avatar') and obj.avatar:
            return obj.avatar.url
        return None

    def get_is_online(self, obj):
        # Проверка онлайна: был активен в последние 5 минут
        if hasattr(obj, 'last_activity'):
            if obj.last_activity:
                delta = timezone.now() - obj.last_activity
                return delta.total_seconds() < 300
        return False


class ChatMemberSerializer(serializers.ModelSerializer):
    user = SlimUserSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = ChatMember
        fields = ['id', 'user', 'role', 'role_display', 'joined_at',
                  'last_read_at', 'is_pinned', 'pinned_at',
                  'is_muted', 'muted_until', 'custom_title',
                  'notifications_enabled', 'unread_count']

    def get_unread_count(self, obj):
        return obj.get_unread_count()


# =============================================================================
# Вложения
# =============================================================================

class MessageAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MessageAttachment
        fields = ['id', 'url', 'original_filename', 'file_size',
                  'mime_type', 'file_type', 'width', 'height', 'duration']

    def get_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class TaskAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ['id', 'url', 'original_filename', 'file_size',
                  'uploaded_by', 'created_at']
        read_only_fields = ['uploaded_by']

    def get_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


# =============================================================================
# Сообщения
# =============================================================================

class MessageReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageRead
        fields = ['user_id', 'read_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = SlimUserSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    read_by = MessageReadSerializer(many=True, read_only=True)
    reply_to_preview = serializers.SerializerMethodField()
    forward_from_preview = serializers.SerializerMethodField()
    task_info = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'uuid', 'chat', 'sender', 'message_type',
            'text', 'html_text', 'reply_to', 'reply_to_preview',
            'forward_from', 'forward_from_preview',
            'attachments', 'read_by',
            'is_edited', 'edited_at', 'edit_history',
            'is_deleted', 'is_pinned', 'pinned_at',
            'task_info', 'created_at',
            'can_edit', 'can_delete',
        ]
        read_only_fields = ['uuid', 'sender', 'is_edited', 'edited_at',
                           'is_deleted', 'is_pinned', 'created_at']

    def get_reply_to_preview(self, obj):
        if obj.reply_to and not obj.reply_to.is_deleted:
            return {
                'id': obj.reply_to.id,
                'text': obj.reply_to.text[:100],
                'sender_name': (
                    obj.reply_to.sender.get_full_name() or obj.reply_to.sender.username
                ) if obj.reply_to.sender else 'Система',
            }
        return None

    def get_forward_from_preview(self, obj):
        if obj.forward_from:
            return {
                'id': obj.forward_from.id,
                'chat_title': obj.forward_from.chat.title or f"Чат #{obj.forward_from.chat_id}",
                'sender_name': (
                    obj.forward_from.sender.get_full_name() or obj.forward_from.sender.username
                ) if obj.forward_from.sender else 'Система',
            }
        return None

    def get_task_info(self, obj):
        if obj.task:
            return {
                'id': obj.task.id,
                'uuid': str(obj.task.uuid),
                'title': obj.task.title,
                'status': obj.task.status,
                'status_display': obj.task.get_status_display(),
                'priority': obj.task.priority,
                'deadline': obj.task.deadline.isoformat() if obj.task.deadline else None,
                'assigned_to_id': obj.task.assigned_to_id,
            }
        return None

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user and obj.sender == request.user:
            return not obj.is_deleted
        return False

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user:
            if obj.sender == request.user:
                return True
            if obj.chat.is_admin(request.user):
                return True
        return False

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['sender'] = request.user
        return super().create(validated_data)


class MessageCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания сообщения."""
    reply_to_id = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    forward_from_id = serializers.IntegerField(required=False, write_only=True, allow_null=True)
    attachment_ids = serializers.ListField(  # Изменено с attachments_ids на attachment_ids
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Message
        fields = ['chat', 'message_type', 'text', 'html_text',
                  'reply_to_id', 'forward_from_id', 'attachment_ids']  # Изменено

    def create(self, validated_data):
        reply_to_id = validated_data.pop('reply_to_id', None)
        forward_from_id = validated_data.pop('forward_from_id', None)
        attachment_ids = validated_data.pop('attachment_ids', [])

        request = self.context['request']
        validated_data['sender'] = request.user

        if reply_to_id:
            validated_data['reply_to'] = Message.objects.filter(pk=reply_to_id).first()
        if forward_from_id:
            validated_data['forward_from'] = Message.objects.filter(pk=forward_from_id).first()

        message = super().create(validated_data)

        # Привязываем вложения
        if attachment_ids:
            MessageAttachment.objects.filter(
                pk__in=attachment_ids, message__isnull=True  # Добавлено условие
            ).update(message=message)

        # Обновляем last_message в чате
        message.chat.update_last_message(message)

        return message

class MessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['text', 'html_text']


# =============================================================================
# Чаты
# =============================================================================

class ChatListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка чатов."""
    last_message_preview = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_pinned = serializers.SerializerMethodField()
    is_muted = serializers.SerializerMethodField()
    member_info = serializers.SerializerMethodField()
    court_info = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    target_court_name = serializers.SerializerMethodField()
    target_court_code = serializers.SerializerMethodField()
    target_court_region = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = [
            'id', 'uuid', 'chat_type', 'title', 'description',
            'avatar_url', 'last_message_preview', 'last_message_at',
            'member_count', 'unread_count', 'is_pinned', 'is_muted',
            'only_admins_can_post', 'is_announcement_channel',
            'member_info', 'court_info', 'created_at',
            'target_court_name', 'target_court_code', 'target_court_region',
        ]

    def get_last_message_preview(self, obj):
        if obj.last_message and not obj.last_message.is_deleted:
            text = obj.last_message.text[:100] if obj.last_message.text else ''
            if obj.last_message.attachments.exists():
                text = text or '[Вложение]'
            sender_name = 'Система'
            if obj.last_message.sender:
                sender_name = (obj.last_message.sender.get_full_name()
                              or obj.last_message.sender.username)
            return {
                'text': text,
                'sender_name': sender_name,
                'created_at': obj.last_message.created_at.isoformat(),
                'message_type': obj.last_message.message_type,
            }
        return None

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            member = obj.members.filter(user=request.user, is_active=True).first()
            if member:
                return member.get_unread_count()
        return 0

    def get_is_pinned(self, obj):
        request = self.context.get('request')
        if request and request.user:
            member = obj.members.filter(user=request.user, is_active=True).first()
            return member.is_pinned if member else False
        return False

    def get_is_muted(self, obj):
        request = self.context.get('request')
        if request and request.user:
            member = obj.members.filter(user=request.user, is_active=True).first()
            return member.is_muted if member else False
        return False

    def get_member_info(self, obj):
        if obj.chat_type == ChatType.DIRECT:
            members = obj.members.filter(is_active=True).select_related('user')[:2]
            return [
                {
                    'id': m.user_id,
                    'name': m.user.get_full_name() or m.user.username,
                    'role': m.user.role if hasattr(m.user, 'role') else None,
                }
                for m in members
            ]
        return None

    def get_court_info(self, obj):
        if obj.chat_type in [ChatType.INTERCOURT, ChatType.INTERREGIONAL,
                             ChatType.HIGHER_INSTANCE]:
            return {
                'court_id': obj.court_id,
                'target_court_id': obj.target_court_id,
                'target_court_name': (
                    obj.target_court.name if obj.target_court else None
                ),
                'target_region_id': obj.target_region_id,
            }
        return None

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_target_court_name(self, obj):
        if obj.target_court:

            return obj.target_court.name
        return None

    def get_target_court_code(self, obj):
        if obj.target_court and hasattr(obj.target_court, 'code'):
            return obj.target_court.code
        return None

    def get_target_court_region(self, obj):
        if obj.target_court and hasattr(obj.target_court, 'region') and obj.target_court.region:
            return obj.target_court.region.name
        return None


class ChatDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра чата."""
    members = serializers.SerializerMethodField()
    pinned_messages = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    can_post = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = [
            'id', 'uuid', 'chat_type', 'title', 'description',
            'avatar', 'court', 'department', 'target_court', 'target_region',
            'is_announcement_channel', 'only_admins_can_post',
            'members', 'pinned_messages', 'current_user_role', 'can_post',
            'member_count', 'created_by', 'created_at',
        ]

    def get_members(self, obj):
        members = obj.members.filter(is_active=True).select_related('user')
        return ChatMemberSerializer(members, many=True).data

    def get_pinned_messages(self, obj):
        pinned = obj.messages.filter(is_pinned=True, is_deleted=False).order_by('-pinned_at')[:10]
        return MessageSerializer(pinned, many=True, context=self.context).data

    def get_current_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user:
            member = obj.members.filter(user=request.user, is_active=True).first()
            return member.role if member else None
        return None

    def get_can_post(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_post(request.user)
        return False


class ChatCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания чата."""
    member_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    department_id = serializers.IntegerField(required=False, write_only=True)
    target_court_code = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Chat
        fields = ['chat_type', 'title', 'description', 'member_ids',
                  'department_id', 'target_court_code',
                  'only_admins_can_post', 'is_announcement_channel']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        department_id = validated_data.pop('department_id', None)
        target_court_code = validated_data.pop('target_court_code', None)

        request = self.context['request']
        validated_data['created_by'] = request.user

        # Определяем суд
        from communication.utils import get_user_court
        user_court = get_user_court(request.user)
        if user_court:
            validated_data['court'] = user_court

        # Привязываем отдел
        if department_id:
            validated_data['department'] = CourtDepartment.objects.filter(
                pk=department_id, court=user_court
            ).first()

        # Привязываем целевой суд (межсудебный)
        if target_court_code:
            from court_registry.models import CourtDirectory
            validated_data['target_court'] = CourtDirectory.objects.filter(
                code=target_court_code
            ).first()

        chat = super().create(validated_data)

        # Добавляем создателя как владельца
        owner_role = MemberRole.OWNER if chat.chat_type != ChatType.DIRECT else MemberRole.MEMBER
        ChatMember.objects.create(chat=chat, user=request.user, role=owner_role)

        # Добавляем остальных участников
        for uid in set(member_ids) - {request.user.id}:
            if User.objects.filter(pk=uid).exists():
                ChatMember.objects.get_or_create(
                    chat=chat, user_id=uid,
                    defaults={'role': MemberRole.MEMBER}
                )

        # Для чата отдела — авто-добавление всех сотрудников
        if chat.chat_type == ChatType.DEPARTMENT and chat.department:
            from communication.utils import auto_create_department_chats
            employees = CourtEmployee.objects.filter(
                department=chat.department, is_active=True
            ).select_related('employee')
            for emp in employees:
                role = MemberRole.ADMIN if emp.is_head_of_department else MemberRole.MEMBER
                ChatMember.objects.get_or_create(
                    chat=chat, user=emp.employee,
                    defaults={'role': role}
                )

        return chat


# =============================================================================
# Рассылки (Broadcast)
# =============================================================================

class BroadcastRecipientSerializer(serializers.ModelSerializer):
    user = SlimUserSerializer(read_only=True)

    class Meta:
        model = BroadcastRecipient
        fields = ['id', 'user', 'is_read', 'read_at', 'is_confirmed',
                  'confirmed_at', 'delivered_at']


class BroadcastSerializer(serializers.ModelSerializer):
    sender = SlimUserSerializer(read_only=True)
    recipients = BroadcastRecipientSerializer(many=True, read_only=True)
    read_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Broadcast
        fields = [
            'id', 'uuid', 'title', 'text', 'html_text', 'sender',
            'court', 'broadcast_type', 'target_roles', 'target_departments',
            'target_courts', 'importance', 'requires_confirmation',
            'deadline', 'status', 'total_recipients', 'sent_count',
            'read_count', 'read_percentage', 'recipients',
            'created_at', 'sent_at',
        ]
        read_only_fields = ['uuid', 'sender', 'status', 'total_recipients',
                           'sent_count', 'read_count', 'sent_at', 'created_at']

    def get_read_percentage(self, obj):
        if obj.sent_count > 0:
            return round(obj.read_count / obj.sent_count * 100, 1)
        return 0


class BroadcastCreateSerializer(serializers.ModelSerializer):
    attachment_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Broadcast
        fields = ['title', 'text', 'html_text', 'broadcast_type',
                  'target_roles', 'target_departments', 'target_courts',
                  'importance', 'requires_confirmation', 'deadline',
                  'attachment_ids']

    def create(self, validated_data):
        validated_data.pop('attachment_ids', [])
        request = self.context['request']
        validated_data['sender'] = request.user

        from communication.utils import get_user_court
        court = get_user_court(request.user)
        if court:
            validated_data['court'] = court

        return super().create(validated_data)


# =============================================================================
# Поручения (Task)
# =============================================================================

class TaskCommentSerializer(serializers.ModelSerializer):
    author = SlimUserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'author', 'text', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    created_by = SlimUserSerializer(read_only=True)
    assigned_to = SlimUserSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    chat = serializers.PrimaryKeyRelatedField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'uuid', 'title', 'description', 'created_by',
            'assigned_to', 'department', 'court', 'chat',
            'status', 'status_display', 'priority', 'priority_display',
            'deadline', 'is_overdue', 'completed_at', 'accepted_at',
            'comments', 'attachments', 'created_at', 'updated_at',
        ]
        read_only_fields = ['uuid', 'created_by', 'status', 'completed_at',
                           'accepted_at', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(write_only=True)
    department_id = serializers.IntegerField(required=False, write_only=True)
    chat_id = serializers.IntegerField(required=False, write_only=True)
    attachment_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Task
        fields = ['title', 'description', 'assigned_to_id', 'department_id',
                  'chat_id', 'priority', 'deadline', 'attachment_ids']

    def create(self, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id')
        department_id = validated_data.pop('department_id', None)
        chat_id = validated_data.pop('chat_id', None)
        validated_data.pop('attachment_ids', [])

        request = self.context['request']
        validated_data['created_by'] = request.user
        validated_data['assigned_to'] = User.objects.get(pk=assigned_to_id)

        if department_id:
            validated_data['department'] = CourtDepartment.objects.filter(
                pk=department_id
            ).first()

        from communication.utils import get_user_court
        court = get_user_court(request.user)
        if court:
            validated_data['court'] = court

        if chat_id:
            validated_data['chat'] = Chat.objects.filter(pk=chat_id).first()

        return super().create(validated_data)


# =============================================================================
# Межсудебный обмен документами
# =============================================================================

class DocumentExchangeAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentExchangeAttachment
        fields = ['id', 'url', 'original_filename', 'file_size',
                  'mime_type', 'page_count', 'is_signed', 'signature_info']

    def get_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class DocumentExchangeSerializer(serializers.ModelSerializer):
    source_court_name = serializers.SerializerMethodField()
    target_court_name = serializers.SerializerMethodField()
    source_user = SlimUserSerializer(read_only=True)
    attachments = DocumentExchangeAttachmentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DocumentExchange
        fields = [
            'id', 'uuid', 'source_court', 'source_court_name',
            'source_user', 'target_court', 'target_court_name',
            'target_department', 'title', 'description', 'document_type',
            'reference_number', 'case_number', 'status', 'status_display',
            'is_urgent', 'requires_response', 'response_deadline',
            'attachments', 'rejection_reason', 'internal_notes',
            'transfer', 'created_at', 'sent_at', 'received_at', 'processed_at',
        ]
        read_only_fields = ['uuid', 'source_court', 'source_user', 'status',
                           'sent_at', 'received_at', 'processed_at', 'created_at']

    def get_source_court_name(self, obj):
        return obj.source_court.name if obj.source_court else None

    def get_target_court_name(self, obj):
        return obj.target_court.name if obj.target_court else None


class DocumentExchangeCreateSerializer(serializers.ModelSerializer):
    target_court_code = serializers.CharField(write_only=True)
    attachment_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = DocumentExchange
        fields = ['target_court_code', 'target_department', 'title',
                  'description', 'document_type', 'reference_number',
                  'case_number', 'is_urgent', 'requires_response',
                  'response_deadline', 'internal_notes', 'attachment_ids']

    def create(self, validated_data):
        target_court_code = validated_data.pop('target_court_code')
        validated_data.pop('attachment_ids', [])

        request = self.context['request']
        validated_data['source_user'] = request.user

        from communication.utils import get_user_court
        court = get_user_court(request.user)
        if court:
            validated_data['source_court'] = court

        from court_registry.models import CourtDirectory
        validated_data['target_court'] = CourtDirectory.objects.get(code=target_court_code)

        return super().create(validated_data)


# =============================================================================
# Маршрутизация
# =============================================================================

class IntercourtRouteSerializer(serializers.ModelSerializer):
    source_level_name = serializers.CharField(source='source_level.name', read_only=True)
    target_level_name = serializers.CharField(source='target_level.name', read_only=True)

    class Meta:
        model = IntercourtRoute
        fields = ['id', 'source_level', 'source_level_name',
                  'target_level', 'target_level_name', 'direction',
                  'allow_documents', 'allow_chats', 'allow_vks',
                  'allow_case_transfer', 'require_confirmation', 'is_active']


# =============================================================================
# Автоуведомления
# =============================================================================

class AutoNotificationRuleSerializer(serializers.ModelSerializer):
    trigger_display = serializers.CharField(source='get_trigger_display', read_only=True)

    class Meta:
        model = AutoNotificationRule
        fields = ['id', 'name', 'trigger', 'trigger_display', 'is_active',
                  'filter_params', 'notify_departments', 'notify_roles',
                  'notify_chairman', 'notify_vice_chairmen',
                  'message_template', 'create_chat_message', 'target_chat',
                  'last_triggered_at', 'created_at']


# =============================================================================
# Аналитика
# =============================================================================

class MessageAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAnalytics
        fields = '__all__'


# =============================================================================
# Поиск
# =============================================================================

class MessageSearchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageSearchIndex
        fields = ['message_id', 'chat_id', 'chat_title', 'sender_id',
                  'sender_name', 'text_content', 'attachment_names',
                  'created_at', 'message_type']


# =============================================================================
# Видеоконференции
# =============================================================================

class VideoConferenceSerializer(serializers.ModelSerializer):
    created_by = SlimUserSerializer(read_only=True)

    class Meta:
        model = VideoConference
        fields = ['id', 'uuid', 'title', 'chat', 'created_by',
                  'scheduled_at', 'duration_minutes', 'status',
                  'external_link', 'created_at']
        read_only_fields = ['uuid', 'created_by', 'status']
