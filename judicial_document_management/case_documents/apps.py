from django.apps import AppConfig


class CaseDocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'case_documents'

    def ready(self):
        import case_documents.signals