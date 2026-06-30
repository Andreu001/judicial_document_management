"""
Административная панель для коммуникационной платформы.
"""
from django.contrib import admin
from django.utils.html import format_html

from communication.models import (
    Chat, ChatMember, Message, MessageRead, MessageAttachment,
    Broadcast, BroadcastRecipient, Task, TaskComment, TaskAttachment,
    DocumentExchange, DocumentExchangeAttachment,
    IntercourtRoute, AutoNotificationRule,
    MessageAnalytics, MessageSearchIndex, VideoConference,
)


class ChatMemberInline(admin.TabularInline):
    model = ChatMember
    extra = 0
    readonly_fields = ['joined_at', 'last_read_at']
    fields = ['user', 'role', 'is_active', 'is_pinned', 'last_read_at', 'joined_at']


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['id', 'uuid_short', 'chat_type', 'title', 'court',
                    'member_count_display', 'last_message_at', 'is_active']
    list_filter = ['chat_type', 'is_active', 'court', 'is_announcement_channel']
    search_fields = ['title', 'description', 'uuid']
    inlines = [ChatMemberInline]
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'last_message', 'last_message_at']

    def uuid_short(self, obj):
        return str(obj.uuid)[:8]
    uuid_short.short_description = 'UUID'

    def member_count_display(self, obj):
        return obj.members.filter(is_active=True).count()
    member_count_display.short_description = 'Участников'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'chat', 'sender', 'message_type',
                    'text_preview', 'created_at', 'is_edited', 'is_deleted']
    list_filter = ['message_type', 'is_deleted', 'is_edited', 'is_pinned', 'created_at']
    search_fields = ['text', 'sender__username', 'sender__first_name', 'sender__last_name']
    readonly_fields = ['uuid', 'created_at', 'edited_at', 'edit_history']

    def text_preview(self, obj):
        return obj.text[:80] if obj.text else '[нет текста]'
    text_preview.short_description = 'Текст'


@admin.register(Broadcast)
class BroadcastAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'broadcast_type', 'sender', 'status',
                    'importance', 'total_recipients', 'read_count', 'created_at']
    list_filter = ['broadcast_type', 'status', 'importance', 'court']
    search_fields = ['title', 'text']
    readonly_fields = ['uuid', 'sender', 'total_recipients', 'sent_count',
                      'read_count', 'created_at', 'sent_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_by', 'assigned_to',
                    'status', 'priority', 'deadline', 'created_at']
    list_filter = ['status', 'priority', 'court', 'department']
    search_fields = ['title', 'description']
    readonly_fields = ['uuid', 'created_at', 'updated_at']


@admin.register(DocumentExchange)
class DocumentExchangeAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'source_court', 'target_court',
                    'document_type', 'status', 'is_urgent', 'created_at']
    list_filter = ['status', 'document_type', 'is_urgent']
    search_fields = ['title', 'description', 'reference_number', 'case_number']
    readonly_fields = ['uuid', 'created_at', 'sent_at', 'received_at', 'processed_at']


@admin.register(IntercourtRoute)
class IntercourtRouteAdmin(admin.ModelAdmin):
    list_display = ['id', 'source_level', 'target_level', 'direction',
                    'allow_documents', 'allow_chats', 'is_active']
    list_filter = ['is_active', 'source_level', 'target_level']


@admin.register(AutoNotificationRule)
class AutoNotificationRuleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'trigger', 'court', 'is_active', 'last_triggered_at']
    list_filter = ['trigger', 'is_active', 'court']


@admin.register(VideoConference)
class VideoConferenceAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'chat', 'scheduled_at', 'status']
    list_filter = ['status']


@admin.register(MessageAnalytics)
class MessageAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['id', 'court', 'date', 'total_messages', 'tasks_created',
                    'tasks_completed', 'active_users']
    list_filter = ['court', 'date']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'original_filename', 'file_type', 'file_size', 'created_at']
    list_filter = ['file_type']


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'read_at']


@admin.register(MessageSearchIndex)
class MessageSearchIndexAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'chat_title', 'sender_name', 'created_at']
    search_fields = ['text_content', 'sender_name', 'chat_title']
