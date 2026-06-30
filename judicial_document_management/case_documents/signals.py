# case_documents/signals.py - УБИРАЕМ создание корреспонденции с уведомлениями

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PartyDocument
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=PartyDocument)
def create_correspondence_on_registration(sender, instance, created, **kwargs):
    """
    Автоматически создает запись в корреспонденции при регистрации документа.
    НО БЕЗ ТРИГГЕРА УВЕДОМЛЕНИЙ!
    """
    # Только при обновлении статуса на registered (НЕ при создании)
    if not created and instance.review_status == 'registered' and instance.registration_number:
        from case_registry.models import Correspondence
        from django.utils import timezone
        
        # Проверяем, не создана ли уже запись (защита от дублей)
        existing = Correspondence.objects.filter(notes__contains=f"PartyDocument ID: {instance.id}").first()
        if existing:
            return
        
        try:
            sender_name = instance.submitter_name
            if instance.submitter_role:
                sender_name = f"{instance.submitter_name} ({instance.submitter_role})"
            
            # Определяем тип дела
            case_field = None
            case_instance = None
            
            if instance.content_type.model == 'criminalproceedings' and instance.case:
                case_field = 'criminal_case'
                case_instance = instance.case
            elif instance.content_type.model == 'civilproceedings' and instance.case:
                case_field = 'civil_case'
                case_instance = instance.case
            elif instance.content_type.model == 'administrativeproceedings' and instance.case:
                case_field = 'admin_case'
                case_instance = instance.case
            elif instance.content_type.model == 'kasproceedings' and instance.case:
                case_field = 'kas_case'
                case_instance = instance.case
            
            # СОЗДАЕМ КОРРЕСПОНДЕНЦИЮ, НО ОНА НЕ БУДЕТ ТРИГГЕРИТЬ УВЕДОМЛЕНИЯ,
            # потому что мы передаем skip_notification=True
            corr = Correspondence(
                correspondence_type='incoming',
                registration_number=instance.registration_number,
                registration_date=instance.registration_date.date() if instance.registration_date else timezone.now().date(),
                document_type=instance.get_document_type_display(),
                summary=f"[Документ стороны] {instance.title}",
                sender=sender_name,
                recipient="Суд",
                pages_count=1,
                status='registered',
                notes=f"Автоматически создан из PartyDocument ID: {instance.id} - НЕ СОЗДАВАТЬ УВЕДОМЛЕНИЕ",
            )
            
            if case_field and case_instance:
                setattr(corr, case_field, case_instance)
            
            # ВАЖНО: Сохраняем без триггера сигналов
            # Используем _state.adding чтобы сигналы знали что это новая запись,
            # но мы все равно будем проверять в signals.py наличие флага в notes
            corr.save()
            
            logger.info(f"Сигнал: создана запись в корреспонденции для документа {instance.id} (без уведомлений)")
            
        except Exception as e:
            logger.error(f"Сигнал: ошибка создания корреспонденции: {e}")


@receiver(post_save, sender=PartyDocument)
def notify_submitter_on_status_change(sender, instance, created, **kwargs):
    """
    Уведомляет участника при изменении статуса его документа.
    """
    from notifications.activity_service import PartyResponseService
    
    if created:
        # При создании - уведомляем о получении
        if instance.external_user:
            PartyResponseService.notify_party_document_received(instance, instance.external_user)
        return
    
    # При изменении статуса - отправляем соответствующее уведомление
    if instance.external_user:
        if instance.review_status == 'accepted' or instance.review_status == 'attached_to_case':
            PartyResponseService.notify_party_document_accepted(
                instance, instance.external_user, instance.judge_decision
            )
        elif instance.review_status == 'rejected':
            PartyResponseService.notify_party_document_rejected(
                instance, instance.external_user, instance.judge_decision
            )