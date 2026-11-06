# criminal_proceedings/apps.py
from django.apps import AppConfig


class CriminalProceedingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'criminal_proceedings'

    def ready(self):
        import criminal_proceedings.signals  # noqa