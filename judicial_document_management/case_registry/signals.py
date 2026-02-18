# case_registry/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from criminal_proceedings.models import CriminalProceedings
from civil_proceedings.models import CivilProceedings
from .managers import case_registry
import logging

logger = logging.getLogger(__name__)


# case_registry/signals.py

@receiver(post_save, sender=CriminalProceedings)
def register_criminal_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация уголовного дела при создании
    """
    if created and not instance.registered_case:
        try:
            # Определяем индекс в зависимости от типа дела
            index_code = '1'  # Базовый индекс для уголовных дел
            
            # Дополнительная логика для определения специальных индексов
            if hasattr(instance, 'case_category_criminal') and instance.case_category_criminal == '2':
                index_code = '1/1'
            
            description = f"Уголовное дело {instance.case_number_criminal}"
            
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                criminal_proceedings_id=instance.id  # Передаем ID уголовного дела
            )
            
            # Сохраняем связь - используем поле registered_case в CriminalProceedings
            instance.registered_case = case
            instance.save(update_fields=['registered_case'])
            
            logger.info(f"Автоматически зарегистрировано уголовное дело: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации уголовного дела: {e}")


@receiver(post_delete, sender=CriminalProceedings)
def handle_criminal_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления уголовного дела
    """
    try:
        # Проверяем, есть ли связанная регистрация через поле registered_case
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено уголовное производство"
            )
            logger.info(f"Удалена регистрация для уголовного дела {instance.case_number_criminal}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления уголовного дела: {e}")


# Аналогично для гражданских дел
@receiver(post_save, sender=CivilProceedings)
def register_civil_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация гражданского дела при создании
    """
    if created and not instance.registered_case:
        try:
            # Определяем индекс для гражданских дел
            index_code = '2'  # Базовый индекс для гражданских дел
            
            description = f"Гражданское дело {instance.case_number_civil}"
            
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                business_card_id=instance.business_card.id if hasattr(instance, 'business_card') else None
            )
            
            # Сохраняем связь
            instance.registered_case = case
            instance.save(update_fields=['registered_case'])
            
            logger.info(f"Автоматически зарегистрировано гражданское дело: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации гражданского дела: {e}")


@receiver(post_delete, sender=CivilProceedings)
def handle_civil_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления гражданского дела
    """
    try:
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено гражданское производство"
            )
            logger.info(f"Удалена регистрация для гражданского дела {instance.case_number_civil}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления гражданского дела: {e}")
