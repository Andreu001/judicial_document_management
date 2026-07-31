# ai_assistant/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType

from .models import AIConfiguration, AICaseAnalysis
from .services import CaseAnalyzer


@receiver(post_save, sender=AIConfiguration)
def update_ai_config(sender, instance, **kwargs):
    """Обновляет конфигурацию AI при изменении настроек"""
    if instance.is_enabled:
        # Перезагружаем модель при изменении настроек
        from .services import AIService
        AIService()


@receiver(post_save)
def auto_analyze_case(sender, instance, created, **kwargs):
    """Автоматический анализ дела при создании/обновлении"""
    from criminal_proceedings.models import CriminalProceedings
    from civil_proceedings.models import CivilProceedings
    from administrative_code.models import AdministrativeProceedings
    from administrative_proceedings.models import KasProceedings
    
    if not isinstance(instance, (CriminalProceedings, CivilProceedings, AdministrativeProceedings, KasProceedings)):
        return
    
    config = AIConfiguration.get_config()
    
    if created and config.auto_analyze_on_create:
        # Анализ при создании дела
        analyzer = CaseAnalyzer()
        if config.is_enabled:
            analyzer.analyze_case(instance, 'full')
    
    elif not created and config.auto_analyze_on_update:
        # Анализ при обновлении дела
        # Проверяем, изменились ли важные поля
        if hasattr(instance, '_state') and instance._state.adding:
            return
        
        analyzer = CaseAnalyzer()
        if config.is_enabled:
            analyzer.analyze_case(instance, 'full')