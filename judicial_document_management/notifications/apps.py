# notifications/apps.py
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        # Импортируем signals, чтобы они были зарегистрированы
        import notifications.signals  # noqa: F401
