# communication/audit.py

from .models import (
    CommunicationAuditLog
)

class AuditService:

    @staticmethod
    def log(
        user,
        action,
        object_type="",
        object_id=None,
        description=""
    ):

        return CommunicationAuditLog.objects.create(
            user=user,
            action=action,
            object_type=object_type,
            object_id=object_id,
            description=description
        )
