from django.apps import AppConfig


class CaseRegistryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'case_registry'

    def ready(self):
        import case_registry.signals
