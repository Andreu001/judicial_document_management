from django.apps import AppConfig

class SideCaseAccessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'side_case_access'
    
    def ready(self):
        import side_case_access.signals