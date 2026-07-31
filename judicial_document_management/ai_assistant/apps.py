from django.apps import AppConfig


class AiAssistantConfig(AppConfig):
    name = 'ai_assistant'
    
    def ready(self):
        # Импортируем сигналы
        import ai_assistant.signals