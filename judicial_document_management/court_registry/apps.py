from django.apps import AppConfig


class CourtRegistryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'court_registry'
    verbose_name = 'Реестр судов и межсудебное взаимодействие'

    def ready(self):
        import court_registry.signals
