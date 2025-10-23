# case_registry/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from criminal_proceedings.models import CriminalProceedings
from .managers import case_registry
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CriminalProceedings)
def register_criminal_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация уголовного дела при создании
    """
    if created and not hasattr(instance, 'registered_case'):
        try:
            # Определяем индекс в зависимости от типа дела
            index_code = '1'  # Базовый индекс для уголовных дел
            
            # Дополнительная логика для определения специальных индексов
            if instance.case_category == '2':  # С участием несовершеннолетнего
                index_code = '1/1'  # Пример специального индекса
            
            description = f"Уголовное дело {instance.business_card.original_name}"
            
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                business_card=instance.business_card,
                criminal_proceedings=instance
            )
            
            logger.info(f"Автоматически зарегистрировано уголовное дело: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации уголовного дела: {e}")


@receiver(post_delete, sender=CriminalProceedings)
def handle_criminal_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления уголовного дела
    """
    try:
        if hasattr(instance, 'registered_case'):
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено уголовное производство"
            )
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления уголовного дела: {e}")