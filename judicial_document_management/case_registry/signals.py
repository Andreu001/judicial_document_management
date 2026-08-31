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


# ========== УГОЛОВНЫЕ ДЕЛА ==========

@receiver(post_save, sender=CriminalProceedings)
def register_criminal_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация уголовного дела при создании (БЫСТРО)
    """
    if created and not instance.registered_case:
        try:
            case_number_full = instance.case_number_criminal
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)
                case_number = int(match.group(2))
            else:
                case_number = 1
                logger.warning(f"Не удалось распарсить номер уголовного дела: {case_number_full}")
            
            description = f"Уголовное дело {instance.case_number_criminal}"
            
            # Регистрируем дело
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,
                criminal_proceedings_id=instance.id
            )
            
            # ===== БЫСТРОЕ СОХРАНЕНИЕ СВЯЗИ (через update) =====
            CriminalProceedings.objects.filter(id=instance.id).update(registered_case=case)
            
            logger.info(f"Автоматически зарегистрировано уголовное дело: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации уголовного дела: {e}")


@receiver(post_delete, sender=CriminalProceedings)
def handle_criminal_case_deletion(sender, instance, **kwargs):
    """Обработка удаления уголовного дела"""
    try:
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено уголовное производство"
            )
            logger.info(f"Удалена регистрация для уголовного дела {instance.case_number_criminal}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления уголовного дела: {e}")


# ========== ГРАЖДАНСКИЕ ДЕЛА ==========

@receiver(post_save, sender=CivilProceedings)
def register_civil_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация гражданского дела при создании (БЫСТРО)
    """
    if created and not instance.registered_case:
        try:
            case_number_full = instance.case_number_civil
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)
                case_number = int(match.group(2))
            else:
                logger.error(f"Не удалось распарсить номер гражданского дела: {case_number_full}")
                return
            
            description = f"Гражданское дело {instance.case_number_civil}"
            
            # Регистрируем дело
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,
                civil_proceedings_id=instance.id
            )
            
            # ===== БЫСТРОЕ СОХРАНЕНИЕ СВЯЗИ (через update) =====
            CivilProceedings.objects.filter(id=instance.id).update(registered_case=case)
            
            logger.info(f"Автоматически зарегистрировано гражданское дело: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации гражданского дела: {e}")


@receiver(post_delete, sender=CivilProceedings)
def handle_civil_case_deletion(sender, instance, **kwargs):
    """Обработка удаления гражданского дела"""
    try:
        if instance.registered_case:
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено гражданское производство"
            )
            logger.info(f"Удалена регистрация для гражданского дела {instance.case_number_civil}")
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления гражданского дела: {e}")


# ========== АДМИНИСТРАТИВНЫЕ ДЕЛА (КАС РФ) ==========

@receiver(post_save, sender=KasProceedings)
def register_kas_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация административного дела (КАС РФ) при создании (БЫСТРО)
    """
    if created and not instance.registered_case:
        try:
            case_number_full = instance.case_number_kas
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)
                case_number = int(match.group(2))
            else:
                logger.error(f"Не удалось распарсить номер административного дела (КАС): {case_number_full}")
                return
            
            description = f"Административное дело (КАС РФ) {instance.case_number_kas}"
            
            # Регистрируем дело
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,
                kas_proceedings_id=instance.id
            )
            
            # ===== БЫСТРОЕ СОХРАНЕНИЕ СВЯЗИ (через update) =====
            KasProceedings.objects.filter(id=instance.id).update(registered_case=case)
            
            logger.info(f"Автоматически зарегистрировано административное дело (КАС): {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации административного дела (КАС): {e}")


@receiver(post_delete, sender=KasProceedings)
def handle_kas_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления административного дела (КАС РФ)
    """
    try:
        # Ищем запись в реестре по ID производства
        from case_registry.models import RegisteredCase
        case = RegisteredCase.objects.filter(kas_proceedings_id=instance.id).first()
        if case:
            case_registry.delete_case(case.id, reason="Удалено административное производство (КАС РФ)")
            logger.info(f"Удалена регистрация для административного дела (КАС) {instance.case_number_kas}")
        elif instance.registered_case:
            # Если связь сохранена (старый способ)
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено административное производство (КАС РФ)"
            )
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления административного дела (КАС): {e}")


# ========== ДЕЛА ОБ АДМИНИСТРАТИВНЫХ ПРАВОНАРУШЕНИЯХ (КоАП) ==========

@receiver(post_save, sender=AdministrativeProceedings)
def register_admin_offense_case(sender, instance, created, **kwargs):
    """
    Автоматическая регистрация дела об административном правонарушении (КоАП) при создании (БЫСТРО)
    """
    if created and not instance.registered_case:
        try:
            case_number_full = instance.case_number_admin
            match = re.match(r'^([0-9а-яА-Я\/]+)-(\d+)\/\d{4}$', case_number_full)
            if match:
                index_code = match.group(1)
                case_number = int(match.group(2))
            else:
                logger.error(f"Не удалось распарсить номер дела об АП: {case_number_full}")
                return
            
            description = f"Дело об административном правонарушении (КоАП) {instance.case_number_admin}"
            
            # Регистрируем дело
            case = case_registry.register_case(
                index_code=index_code,
                description=description,
                case_number=case_number,
                administrative_proceedings_id=instance.id
            )
            
            # ===== БЫСТРОЕ СОХРАНЕНИЕ СВЯЗИ (через update) =====
            AdministrativeProceedings.objects.filter(id=instance.id).update(registered_case=case)
            
            logger.info(f"Автоматически зарегистрировано дело об АП: {case.full_number}")
            
        except Exception as e:
            logger.error(f"Ошибка при автоматической регистрации дела об АП: {e}")


@receiver(post_delete, sender=AdministrativeProceedings)
def handle_admin_offense_case_deletion(sender, instance, **kwargs):
    """
    Обработка удаления дела об административном правонарушении (КоАП)
    """
    try:
        # Ищем запись в реестре по ID производства
        from case_registry.models import RegisteredCase
        case = RegisteredCase.objects.filter(administrative_proceedings_id=instance.id).first()
        if case:
            case_registry.delete_case(case.id, reason="Удалено производство по делу об АП")
            logger.info(f"Удалена регистрация для дела об АП {instance.case_number_admin}")
        elif instance.registered_case:
            # Если связь сохранена (старый способ)
            case_registry.delete_case(
                instance.registered_case.id,
                reason="Удалено производство по делу об АП"
            )
    except Exception as e:
        logger.error(f"Ошибка при обработке удаления дела об АП: {e}")