from django.apps import AppConfig


class CommunicationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'communication'
    verbose_name = 'Коммуникационная платформа'

    def ready(self):
        import communication.signals
