# case_registry/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from criminal_proceedings.models import CriminalProceedings
from civil_proceedings.models import CivilProceedings
from administrative_proceedings.models import KasProceedings
from administrative_code.models import AdministrativeProceedings
from .managers import case_registry
import logging
import re

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CriminalProceedings)
def register_criminal_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация уголовного дела при создании
    """
    if created and not instance.registered_case:
        try:
            # Определяем индекс в зависимости от типа дела
            index_code = '1'  # Базовый индекс для уголовных дел
            
            # Парсим номер дела для получения индекса и номера
            # Формат номера: X-XXX/YYYY или X/X-XXX/YYYY
            case_number_full = instance.case_number_criminal
            
            # Извлекаем индекс и номер из полного номера
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)  # Индекс (может содержать /)
                case_number = int(match.group(2))  # Номер дела
            else:
                # Если не удалось распарсить, используем значения по умолчанию
                case_number = 1
                logger.warning(f"Не удалось распарсить номер уголовного дела: {case_number_full}")
            
            description = f"Уголовное дело {instance.case_number_criminal}"
            
            # Регистрируем дело с уже существующим номером
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,  # Передаем уже существующий номер
                criminal_proceedings_id=instance.id
            )
            
            # Сохраняем связь
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
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено уголовное производство"
            )
            logger.info(f"Удалена регистрация для уголовного дела {instance.case_number_criminal}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления уголовного дела: {e}")


@receiver(post_save, sender=CivilProceedings)
def register_civil_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация гражданского дела при создании
    """
    if created and not instance.registered_case:
        try:
            # Определяем индекс для гражданских дел
            index_code = '2'  # Базовый индекс для гражданских дел
            
            # Парсим номер дела для получения индекса и номера
            case_number_full = instance.case_number_civil
            
            # Извлекаем индекс и номер из полного номера
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)  # Индекс (может содержать /)
                case_number = int(match.group(2))  # Номер дела
            else:
                # Если не удалось распарсить, используем значения по умолчанию
                case_number = 1
                logger.warning(f"Не удалось распарсить номер гражданского дела: {case_number_full}")
            
            description = f"Гражданское дело {instance.case_number_civil}"
            
            # ВАЖНО: Передаём civil_proceedings_id
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,  # Передаем уже существующий номер
                business_card_id=instance.business_card.id if hasattr(instance, 'business_card') and instance.business_card else None,
                civil_proceedings_id=instance.id  # ЭТО КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
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


# НОВЫЙ СИГНАЛ: Для административных дел (КАС РФ)
@receiver(post_save, sender=KasProceedings)
def register_kas_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация административного дела (КАС РФ) при создании
    """
    if created and not instance.registered_case:
        try:
            # Парсим номер дела для получения индекса и номера
            case_number_full = instance.case_number_kas
            
            # Извлекаем индекс и номер из полного номера
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)  # Индекс (2а, 9а, 13а и т.д.)
                case_number = int(match.group(2))  # Номер дела
            else:
                # Если не удалось распарсить, логируем ошибку
                logger.error(f"Не удалось распарсить номер административного дела (КАС): {case_number_full}")
                return
            
            description = f"Административное дело (КАС РФ) {instance.case_number_kas}"
            
            # Регистрируем дело с уже существующим номером
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,
                business_card_id=instance.business_card.id if hasattr(instance, 'business_card') else None
                # Добавьте поле для связи с KasProceedings в модели RegisteredCase, если его нет
                # kas_proceedings_id=instance.id
            )
            
            # Сохраняем связь (нужно добавить поле в модель RegisteredCase)
            # instance.registered_case = case
            # instance.save(update_fields=['registered_case'])
            
            logger.info(f"Автоматически зарегистрировано административное дело (КАС): {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации административного дела (КАС): {e}")


@receiver(post_delete, sender=KasProceedings)
def handle_kas_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления административного дела (КАС РФ)
    """
    try:
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено административное производство (КАС РФ)"
            )
            logger.info(f"Удалена регистрация для административного дела (КАС) {instance.case_number_kas}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления административного дела (КАС): {e}")


# НОВЫЙ СИГНАЛ: Для дел об административных правонарушениях (КоАП/КРФоАП)
@receiver(post_save, sender=AdministrativeProceedings)
def register_admin_offense_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация дела об административном правонарушении (КоАП) при создании
    """
    if created and not instance.registered_case:
        try:
            # Парсим номер дела для получения индекса и номера
            case_number_full = instance.case_number_admin
            
            # Извлекаем индекс и номер из полного номера
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)  # Индекс (5, 12 и т.д.)
                case_number = int(match.group(2))  # Номер дела
            else:
                # Если не удалось распарсить, логируем ошибку
                logger.error(f"Не удалось распарсить номер дела об АП: {case_number_full}")
                return
            
            description = f"Дело об административном правонарушении (КоАП) {instance.case_number_admin}"
            
            # Регистрируем дело с уже существующим номером
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,
                business_card_id=instance.business_card.id if hasattr(instance, 'business_card') else None
                # Добавьте поле для связи с AdministrativeProceedings в модели RegisteredCase, если его нет
                # administrative_proceedings_id=instance.id
            )
            
            # Сохраняем связь (нужно добавить поле в модель RegisteredCase)
            # instance.registered_case = case
            # instance.save(update_fields=['registered_case'])
            
            logger.info(f"Автоматически зарегистрировано дело об АП: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации дела об АП: {e}")


@receiver(post_delete, sender=AdministrativeProceedings)
def handle_admin_offense_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления дела об административном правонарушении (КоАП)
    """
    try:
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено производство по делу об АП"
            )
            logger.info(f"Удалена регистрация для дела об АП {instance.case_number_admin}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления дела об АП: {e}")