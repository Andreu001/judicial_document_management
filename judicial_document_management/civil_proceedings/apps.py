# civil_proceedings/apps.py
from django.apps import AppConfig

class CivilProceedingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'civil_proceedings'
    
    def ready(self):
        import civil_proceedings.signals  # noqa