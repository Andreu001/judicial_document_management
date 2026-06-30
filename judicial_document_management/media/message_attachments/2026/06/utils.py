"""
Утилиты для коммуникационной платформы.
"""
import logging
from django.db.models import Q
from users.models import User
from court_registry.models import Court, CourtDepartment, CourtEmployee

logger = logging.getLogger(__name__)


def resolve_broadcast_recipients(broadcast):
    """
    Определить список получателей для рассылки на основе её параметров.
    Возвращает QuerySet[User].
    """
    from communication.models import Broadcast

    recipients = User.objects.none()

    if broadcast.broadcast_type == 'all_staff':
        # Все активные сотрудники суда
        recipients = User.objects.filter(
            court_employments__department__court=broadcast.court,
            court_employments__is_active=True,
            is_active=True,
        ).distinct()

    elif broadcast.broadcast_type == 'by_role':
        # По указанным ролям
        roles = broadcast.target_roles or []
        recipients = User.objects.filter(
            court_employments__department__court=broadcast.court,
            court_employments__is_active=True,
            role__in=roles,
            is_active=True,
        ).distinct()

    elif broadcast.broadcast_type == 'by_department':
        # По указанным отделам
        dept_ids = broadcast.target_departments or []
        recipients = User.objects.filter(
            court_employments__department__court=broadcast.court,
            court_employments__department_id__in=dept_ids,
            court_employments__is_active=True,
            is_active=True,
        ).distinct()

    elif broadcast.broadcast_type == 'by_court':
        # По указанным судам (межсудебная)
        court_ids = broadcast.target_courts or []
        # Ищем суды, у которых есть Court с is_registered_in_network=True
        # и active CourtEmployee
        recipients = User.objects.filter(
            court_employments__department__court__id__in=court_ids,
            court_employments__is_active=True,
            is_active=True,
        ).distinct()

    elif broadcast.broadcast_type == 'custom':
        # Получатели заданы напрямую — обрабатывается при создании
        return User.objects.none()

    return recipients


def get_user_court(user):
    """Получить суд пользователя через CourtEmployee."""
    emp = CourtEmployee.objects.filter(
        employee=user, is_active=True
    ).select_related('department__court').first()
    if emp:
        return emp.department.court
    return None


def get_user_department(user):
    """Получить отдел пользователя."""
    emp = CourtEmployee.objects.filter(
        employee=user, is_active=True
    ).select_related('department').first()
    if emp:
        return emp.department
    return None


def get_user_display_name(user):
    """Получить отображаемое имя пользователя."""
    emp = CourtEmployee.objects.filter(
        employee=user, is_active=True
    ).first()
    if emp:
        return f"{user.get_full_name() or user.username} ({emp.position})"
    return user.get_full_name() or user.username


def get_available_courts_for_chat(user):
    """
    Получить список судов, доступных для межсудебного чата.
    Учитывает правила маршрутизации.
    """
    user_court = get_user_court(user)
    if not user_court:
        return []

    from court_registry.models import CourtDirectory
    from communication.models import IntercourtRoute

    routes = IntercourtRoute.objects.filter(
        source_level=user_court.level, is_active=True
    ).values_list('target_level_id', flat=True)

    return CourtDirectory.objects.filter(
        level_id__in=routes, is_active=True
    ).select_related('region', 'level').exclude(code=user_court.code)


def search_messages(
    query, user, chat_id=None, court_id=None, limit=50, offset=0
):
    """
    Поиск сообщений по тексту.
    Ищет только в чатах, где пользователь — участник.
    """
    from communication.models import MessageSearchIndex, ChatMember

    user_chat_ids = ChatMember.objects.filter(
        user=user, is_active=True
    ).values_list('chat_id', flat=True)

    qs = MessageSearchIndex.objects.filter(chat_id__in=user_chat_ids)

    if chat_id:
        qs = qs.filter(chat_id=chat_id)
    if court_id:
        qs = qs.filter(court_id=court_id)
    if query:
        qs = qs.filter(
            Q(text_content__icontains=query) |
            Q(sender_name__icontains=query) |
            Q(attachment_names__icontains=query) |
            Q(chat_title__icontains=query)
        )

    return qs.order_by('-created_at')[offset:offset + limit]


def format_message_for_ws(message):
    """Форматировать сообщение для отправки через WebSocket."""
    return {
        'id': message.id,
        'uuid': str(message.uuid),
        'chat_id': message.chat_id,
        'sender': {
            'id': message.sender_id,
            'name': message.sender.get_full_name() or message.sender.username,
        } if message.sender else None,
        'message_type': message.message_type,
        'text': message.text,
        'html_text': message.html_text or message.text,
        'is_edited': message.is_edited,
        'edited_at': message.edited_at.isoformat() if message.edited_at else None,
        'created_at': message.created_at.isoformat(),
        'reply_to_id': message.reply_to_id,
        'forward_from_id': message.forward_from_id,
        'is_pinned': message.is_pinned,
        'attachments': [
            {
                'id': a.id,
                'url': a.file.url if a.file else None,
                'filename': a.original_filename,
                'file_size': a.file_size,
                'file_type': a.file_type,
                'mime_type': a.mime_type,
                'width': a.width,
                'height': a.height,
            }
            for a in message.attachments.all()
        ],
        'read_by': [
            {'user_id': r.user_id, 'read_at': r.read_at.isoformat()}
            for r in message.read_by.all()
        ],
        'task': {
            'id': message.task_id,
            'title': message.task.title,
            'status': message.task.status,
        } if message.task else None,
    }


def auto_create_department_chats(court):
    """Автоматически создать чаты для всех отделов суда при регистрации."""
    from communication.models import Chat, ChatMember, MemberRole

    departments = CourtDepartment.objects.filter(court=court, is_active=True)
    created_count = 0

    for dept in departments:
        chat, created = Chat.objects.get_or_create(
            chat_type='department',
            department=dept,
            court=court,
            defaults={
                'title': dept.name,
                'description': f"Служебный чат отдела: {dept.name}",
                'only_admins_can_post': False,
            }
        )
        if created:
            employees = CourtEmployee.objects.filter(
                department=dept, is_active=True
            ).select_related('employee')
            for emp in employees:
                role = 'admin' if emp.is_head_of_department else 'member'
                ChatMember.objects.get_or_create(
                    chat=chat, user=emp.employee,
                    defaults={'role': role}
                )
            created_count += 1

    return created_count


def auto_create_court_channel(court):
    """Автоматически создать служебный канал суда."""
    from communication.models import Chat, ChatMember, MemberRole

    chat, created = Chat.objects.get_or_create(
        chat_type='court_channel',
        court=court,
        department__isnull=True,
        defaults={
            'title': f"Канал {court.name_short or court.name}",
            'description': f"Официальный канал оповещений {court.name}",
            'is_announcement_channel': True,
            'only_admins_can_post': True,
        }
    )
    if created:
        # Добавляем председателя как владельца
        if court.chairman:
            ChatMember.objects.get_or_create(
                chat=chat, user=court.chairman,
                defaults={'role': MemberRole.OWNER}
            )
        # Добавляем зампредов как админов
        for vc in court.vice_chairmen.all():
            ChatMember.objects.get_or_create(
                chat=chat, user=vc,
                defaults={'role': MemberRole.ADMIN}
            )
        # Добавляем всех сотрудников как readonly
        employees = CourtEmployee.objects.filter(
            department__court=court, is_active=True
        ).select_related('employee')
        for emp in employees:
            ChatMember.objects.get_or_create(
                chat=chat, user=emp.employee,
                defaults={'role': MemberRole.READONLY}
            )

    return chat, created
