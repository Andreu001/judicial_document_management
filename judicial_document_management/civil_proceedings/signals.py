from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import CivilProceedings
from case_management.models import CaseProgressEntry, ProgressActionType
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=CivilProceedings)
def create_progress_on_civil_creation(sender, instance, created, **kwargs):
    """Автоматически создает запись в справочном листе при создании гражданского дела"""
    if created:
        try:
            # Получаем тип действия "поступление дела"
            action_type = ProgressActionType.objects.filter(code='case_received').first()
            if action_type:
                # Получаем ContentType для модели CivilProceedings
                content_type = ContentType.objects.get_for_model(instance)
                
                CaseProgressEntry.objects.create(
                    case_content_type=content_type,
                    case_object_id=instance.id,
                    action_type=action_type,
                    description=f"Дело №{instance.case_number_civil} поступило в суд",
                    action_date=instance.incoming_date or timezone.now().date(),
                    author=None  # создается системой, можно оставить None
                )
                logger.info(f"Создана запись в справочном листе для гражданского дела {instance.case_number_civil}")
        except Exception as e:
            logger.error(f"Ошибка создания прогресса для гражданского дела: {e}")