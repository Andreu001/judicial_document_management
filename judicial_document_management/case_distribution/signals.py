# case_distribution/signals.py
from django.db.models.signals import post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import logging

from .models import CaseDistribution, JudgeLoad, DistributionLog
from criminal_proceedings.models import CriminalProceedings
from civil_proceedings.models import CivilProceedings
from administrative_code.models import AdministrativeProceedings
from administrative_proceedings.models import KasProceedings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CriminalProceedings)
@receiver(post_save, sender=CivilProceedings)
@receiver(post_save, sender=AdministrativeProceedings)
@receiver(post_save, sender=KasProceedings)
def update_case_distribution_on_save(sender, instance, created, **kwargs):
    """
    Автоматически создавать запись о распределении при создании дела.
    Статус = 'pending' (Ожидает распределения), пока нет судьи.
    """
    if created:
        ct = ContentType.objects.get_for_model(instance)
        
        case_number = None
        case_category = 'other'
        
        if hasattr(instance, 'case_number_criminal'):
            case_number = instance.case_number_criminal
            case_category = 'criminal'
        elif hasattr(instance, 'case_number_civil'):
            case_number = instance.case_number_civil
            case_category = 'civil'
        elif hasattr(instance, 'case_number_admin'):
            case_number = instance.case_number_admin
            case_category = 'coap'
        elif hasattr(instance, 'case_number_kas'):
            case_number = instance.case_number_kas
            case_category = 'kas'
        
        if case_number:
            exists = CaseDistribution.objects.filter(
                case_content_type=ct,
                case_object_id=instance.id
            ).exists()
            
            if not exists:
                # ===== ВАЖНО: статус всегда 'pending' =====
                # Статус изменится на 'distributed' только при назначении судьи
                CaseDistribution.objects.create(
                    case_content_type=ct,
                    case_object_id=instance.id,
                    case_number=case_number,
                    case_category=case_category,
                    status='pending',  # Всегда pending при создании
                    complexity=1.0
                )


@receiver(post_save, sender=CriminalProceedings)
@receiver(post_save, sender=CivilProceedings)
@receiver(post_save, sender=AdministrativeProceedings)
@receiver(post_save, sender=KasProceedings)
def sync_presiding_judge_to_distribution(sender, instance, **kwargs):
    """
    Синхронизировать presiding_judge из дела в CaseDistribution.
    Если в деле удалили судью — дело появляется в списке для распределения.
    """
    from django.contrib.contenttypes.models import ContentType
    
    ct = ContentType.objects.get_for_model(instance)
    
    # Получаем или создаем распределение
    distribution, created = CaseDistribution.objects.get_or_create(
        case_content_type=ct,
        case_object_id=instance.id,
        defaults={
            'case_number': _get_case_number(instance),
            'case_category': _get_case_category(instance),
            'status': 'pending',
            'complexity': 1.0,
        }
    )
    
    # Получаем presiding_judge из дела
    presiding_judge = getattr(instance, 'presiding_judge', None)
    
    # ===== СИНХРОНИЗАЦИЯ: если судья изменился =====
    if presiding_judge != distribution.assigned_judge:
        if presiding_judge:
            # Судья назначен — обновляем распределение
            distribution.assigned_judge = presiding_judge
            distribution.status = 'distributed'
            distribution.distributed_at = timezone.now()
            logger.info(f"Синхронизирован presiding_judge={presiding_judge} для дела {instance}")
        else:
            # Судья удален — дело снова ожидает распределения
            distribution.assigned_judge = None
            distribution.status = 'pending'
            distribution.distributed_at = None
            logger.info(f"Очищен assigned_judge для дела {instance} — дело доступно для распределения")
        
        distribution.save()


def _get_case_number(instance):
    if hasattr(instance, 'case_number_criminal'):
        return instance.case_number_criminal
    elif hasattr(instance, 'case_number_civil'):
        return instance.case_number_civil
    elif hasattr(instance, 'case_number_admin'):
        return instance.case_number_admin
    elif hasattr(instance, 'case_number_kas'):
        return instance.case_number_kas
    return str(instance.id)


def _get_case_category(instance):
    if hasattr(instance, 'case_number_criminal'):
        return 'criminal'
    elif hasattr(instance, 'case_number_civil'):
        return 'civil'
    elif hasattr(instance, 'case_number_admin'):
        return 'coap'
    elif hasattr(instance, 'case_number_kas'):
        return 'kas'
    return 'other'


@receiver(post_delete, sender=CaseDistribution)
def update_judge_load_on_distribution_delete(sender, instance, **kwargs):
    """
    Обновить нагрузку судьи при удалении распределения.
    """
    if instance.assigned_judge and instance.status == 'distributed':
        now = timezone.now()
        load = JudgeLoad.objects.filter(
            judge=instance.assigned_judge,
            year=now.year,
            month=now.month
        ).first()
        
        if load:
            load.remove_case(instance.case, instance.complexity)
            logger.info(
                f"Обновлена нагрузка судьи {instance.assigned_judge} "
                f"при удалении распределения дела {instance.case_number}"
            )
