# case_distribution/apps.py
from django.apps import AppConfig


class CaseDistributionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'case_distribution'
    verbose_name = 'Распределение дел'
    
    def ready(self):
        import case_distribution.signals
