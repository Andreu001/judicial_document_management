# communication/services.py

from django.db import transaction
from django.contrib.auth import get_user_model

from .models import (
    Chat, ChatParticipant, Broadcast,
    BroadcastRecipient, Task, Court,
    Department
)

User = get_user_model()

# =====================================================

# CHAT SERVICE

# =====================================================

class ChatService:

    @staticmethod
    @transaction.atomic
    def create_private_chat(
        creator,
        second_user
    ):

        chat = Chat.objects.create(
            chat_type="private",
            created_by=creator
        )

        ChatParticipant.objects.create(
            chat=chat,
            user=creator,
            is_admin=True
        )

        ChatParticipant.objects.create(
            chat=chat,
            user=second_user
        )

        return chat

    @staticmethod
    @transaction.atomic
    def create_group_chat(
        creator,
        title,
        participants
    ):

        chat = Chat.objects.create(
            title=title,
            chat_type="group",
            created_by=creator
        )

        ChatParticipant.objects.create(
            chat=chat,
            user=creator,
            is_admin=True
        )

        for user in participants:

            ChatParticipant.objects.get_or_create(
                chat=chat,
                user=user
            )

        return chat


# =====================================================

# BROADCAST SERVICE

# =====================================================

class BroadcastService:

    @staticmethod
    def send_to_role(
        creator,
        role,
        title,
        text
    ):

        broadcast = Broadcast.objects.create(
            title=title,
            text=text,
            created_by=creator
        )

        users = User.objects.filter(
            role=role
        )

        recipients = []

        for user in users:

            recipients.append(
                BroadcastRecipient(
                    broadcast=broadcast,
                    user=user,
                    delivered=True
                )
            )

        BroadcastRecipient.objects.bulk_create(
            recipients
        )

        return broadcast

    @staticmethod
    def send_to_department(
        creator,
        department,
        title,
        text
    ):

        broadcast = Broadcast.objects.create(
            title=title,
            text=text,
            created_by=creator
        )

        users = User.objects.filter(
            department=department
        )

        recipients = []

        for user in users:

            recipients.append(
                BroadcastRecipient(
                    broadcast=broadcast,
                    user=user,
                    delivered=True
                )
            )

        BroadcastRecipient.objects.bulk_create(
            recipients
        )

        return broadcast

    @staticmethod
    def send_to_court(
        creator,
        court,
        title,
        text
    ):

        broadcast = Broadcast.objects.create(
            title=title,
            text=text,
            created_by=creator
        )

        users = User.objects.filter(
            court=court
        )

        recipients = []

        for user in users:

            recipients.append(
                BroadcastRecipient(
                    broadcast=broadcast,
                    user=user,
                    delivered=True
                )
            )

        BroadcastRecipient.objects.bulk_create(
            recipients
        )

        return broadcast


# =====================================================

# TASK SERVICE

# =====================================================

class TaskService:

    @staticmethod
    def create_task(
        creator,
        executor,
        title,
        description,
        due_date=None
    ):

        return Task.objects.create(
            created_by=creator,
            assigned_to=executor,
            title=title,
            description=description,
            due_date=due_date
        )

    @staticmethod
    def complete_task(task):

        task.status = "done"
        task.save(
            update_fields=["status"]
        )

        return task

    @staticmethod
    def start_task(task):

        task.status = "progress"
        task.save(
            update_fields=["status"]
        )

        return task


# =====================================================

# COURT DIRECTORY SERVICE

# =====================================================

class CourtDirectoryService:

    @staticmethod
    def search_courts(query):

        return Court.objects.filter(
            name__icontains=query
        )

    @staticmethod
    def get_by_level(level):

        return Court.objects.filter(
            level=level
        )

    @staticmethod
    def get_by_region(region):

        return Court.objects.filter(
            federal_subject=region
        )

    @staticmethod
    def get_departments(court):

        return Department.objects.filter(
            court=court
        )


# =====================================================

# INTERCOURT SERVICE

# =====================================================

class IntercourtCommunicationService:

    @staticmethod
    def create_intercourt_chat(
        creator,
        title
    ):

        access = getattr(
            creator,
            "communication_access",
            None
        )

        if not access:
            raise PermissionError(
                "No communication access"
            )

        if not access.can_create_intercourt_chats:
            raise PermissionError(
                "Intercourt chat denied"
            )

        return Chat.objects.create(
            title=title,
            chat_type="intercourt",
            created_by=creator
        )
