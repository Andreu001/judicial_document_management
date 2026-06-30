# notifications/signals.py - ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ

from django.apps import apps
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# Хранилище обработанных уведомлений для защиты от дублей
_processed_notifications = set()


def get_presiding_judge_from_proceeding(proceeding):
    """Универсальная функция для получения судьи из дела"""
    if not proceeding:
        return None
    
    # Пробуем получить через прямой атрибут
    if hasattr(proceeding, 'presiding_judge') and proceeding.presiding_judge:
        return proceeding.presiding_judge
    
    # Пробуем получить через _meta
    try:
        judge_id = getattr(proceeding, 'presiding_judge_id', None)
        if judge_id:
            try:
                return User.objects.get(id=judge_id)
            except User.DoesNotExist:
                logger.warning(f"Пользователь с ID {judge_id} не найден")
                return None
    except Exception as e:
        logger.error(f"Ошибка при получении presiding_judge_id: {e}")
    
    return None


# ========== СИГНАЛЫ ДЛЯ КОРРЕСПОНДЕНЦИИ ==========

@receiver(post_save, sender='case_registry.Correspondence')
def create_correspondence_notification(sender, instance, created, **kwargs):
    """
    Создает уведомление при создании новой корреспонденции.
    ПРОПУСКАЕТ корреспонденцию, созданную автоматически из PartyDocument.
    """
    # Пропускаем, если это корреспонденция от PartyDocument (автоматическая)
    if instance.notes and "PartyDocument ID:" in instance.notes:
        logger.info(f"Пропускаем уведомление для корреспонденции {instance.id} - создана автоматически")
        return
    
    if not created:
        return
    
    signal_key = f"correspondence_notification_{instance.id}"
    if signal_key in _processed_notifications:
        return
    _processed_notifications.add(signal_key)
    
    # Определяем дело и судью
    proceeding = None
    proceeding_type = None
    user = None
    proceeding_number = None
    
    if instance.criminal_case_id:
        try:
            CriminalProceedings = apps.get_model('criminal_proceedings', 'CriminalProceedings')
            proceeding = CriminalProceedings.objects.get(id=instance.criminal_case_id)
            proceeding_type = 'criminal'
            proceeding_number = proceeding.case_number_criminal
            user = get_presiding_judge_from_proceeding(proceeding)
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    elif instance.civil_case_id:
        try:
            CivilProceedings = apps.get_model('civil_proceedings', 'CivilProceedings')
            proceeding = CivilProceedings.objects.get(id=instance.civil_case_id)
            proceeding_type = 'civil'
            proceeding_number = proceeding.case_number_civil
            user = get_presiding_judge_from_proceeding(proceeding)
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    elif instance.admin_case_id:
        try:
            AdministrativeProceedings = apps.get_model('administrative_code', 'AdministrativeProceedings')
            proceeding = AdministrativeProceedings.objects.get(id=instance.admin_case_id)
            proceeding_type = 'admin'
            proceeding_number = proceeding.case_number_admin
            user = get_presiding_judge_from_proceeding(proceeding)
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    elif instance.kas_case_id:
        try:
            KasProceedings = apps.get_model('administrative_proceedings', 'KasProceedings')
            proceeding = KasProceedings.objects.get(id=instance.kas_case_id)
            proceeding_type = 'kas'
            proceeding_number = proceeding.case_number_kas
            user = get_presiding_judge_from_proceeding(proceeding)
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    if user and proceeding:
        if instance.correspondence_type == 'incoming':
            title = f"📥 Новая входящая корреспонденция"
            message = f"По делу №{proceeding_number} поступил документ: {instance.document_type}"
            if instance.sender:
                message += f" от {instance.sender}"
            priority = 'medium'
            
            important_types = ['Жалоба', 'Ходатайство', 'Заявление', 'Представление']
            if instance.document_type in important_types:
                priority = 'high'
                title = f"⚠️ ВАЖНО: {title}"
        else:
            title = f"📤 Исходящая корреспонденция"
            message = f"По делу №{proceeding_number} отправлен документ: {instance.document_type}"
            if instance.recipient:
                message += f" получателю {instance.recipient}"
            priority = 'low'
        
        if instance.summary:
            message += f"\nКраткое содержание: {instance.summary[:100]}..."
        
        from .models import Notification
        
        notification_kwargs = {
            'user': user,
            'title': title,
            'message': message,
            'priority': priority,
            'correspondence': instance,
            'notification_type': f'{instance.correspondence_type}_correspondence',
        }
        
        if proceeding_type == 'criminal':
            notification_kwargs['criminal_proceeding'] = proceeding
        elif proceeding_type == 'civil':
            notification_kwargs['civil_proceeding'] = proceeding
        elif proceeding_type == 'admin':
            notification_kwargs['admin_proceeding'] = proceeding
        elif proceeding_type == 'kas':
            notification_kwargs['kas_proceeding'] = proceeding
        
        try:
            Notification.objects.create(**notification_kwargs)
            logger.info(f"Уведомление создано для корреспонденции {instance.id}")
        except Exception as e:
            logger.error(f"Ошибка создания уведомления: {e}")


@receiver(post_save, sender='case_registry.Correspondence')
def create_activity_for_correspondence(sender, instance, created, **kwargs):
    """
    Создает активность при создании новой корреспонденции.
    """
    from .activity_service import CaseActivityService
    
    if not created:
        return
    
    # Пропускаем автоматическую корреспонденцию от PartyDocument
    if instance.notes and "PartyDocument ID:" in instance.notes:
        return
    
    # Определяем дело
    case = None
    if instance.criminal_case_id:
        from criminal_proceedings.models import CriminalProceedings
        case = CriminalProceedings.objects.filter(id=instance.criminal_case_id).first()
    elif instance.civil_case_id:
        from civil_proceedings.models import CivilProceedings
        case = CivilProceedings.objects.filter(id=instance.civil_case_id).first()
    elif instance.admin_case_id:
        from administrative_code.models import AdministrativeProceedings
        case = AdministrativeProceedings.objects.filter(id=instance.admin_case_id).first()
    elif instance.kas_case_id:
        from administrative_proceedings.models import KasProceedings
        case = KasProceedings.objects.filter(id=instance.kas_case_id).first()
    
    if not case:
        return
    
    corr_type = "Входящая" if instance.correspondence_type == 'incoming' else "Исходящая"
    title = f"{corr_type} корреспонденция"
    description = f"{instance.document_type}\nОт: {instance.sender or instance.recipient}"
    if instance.summary:
        description += f"\n{instance.summary[:200]}"
    
    CaseActivityService.create_activity(
        case=case,
        activity_type='new_correspondence',
        title=title,
        description=description,
        related_object=instance,
        link=f"/correspondence/{instance.id}/",
        auto_notify=False  # Не создаем дублирующее уведомление
    )


# ========== СИГНАЛ ДЛЯ ДОКУМЕНТОВ СТОРОН (ТОЛЬКО ОДИН!) ==========

@receiver(post_save, sender='case_documents.PartyDocument')
def create_activity_for_party_document(sender, instance, created, **kwargs):
    """
    Создает активность ПРИ СОЗДАНИИ нового документа от стороны.
    ТОЛЬКО ОДИН РАЗ - ПРИ СОЗДАНИИ!
    """
    from .activity_service import CaseActivityService
    
    # ТОЛЬКО ПРИ СОЗДАНИИ НОВОГО ДОКУМЕНТА
    if not created:
        return
    
    # Получаем дело
    case = instance.case
    if not case:
        logger.warning(f"Документ {instance.id} не привязан к делу")
        return
    
    # Проверяем, нет ли уже активности (защита от дублей)
    from django.contrib.contenttypes.models import ContentType
    from .models import CaseActivity
    
    case_ct = ContentType.objects.get_for_model(case)
    doc_ct = ContentType.objects.get_for_model(instance)
    
    existing = CaseActivity.objects.filter(
        case_content_type=case_ct,
        case_object_id=case.id,
        related_content_type=doc_ct,
        related_object_id=instance.id,
        activity_type='new_party_document'
    ).exists()
    
    if existing:
        logger.info(f"Активность для документа {instance.id} уже существует, пропускаем")
        return
    
    # Формируем заголовок и описание
    doc_type_display = instance.get_document_type_display()
    title = f"Новый документ от стороны: {doc_type_display}"
    description = f"{instance.title}\nПодатель: {instance.submitter_name}"
    
    # Формируем ссылку
    model_name = case._meta.model_name
    if model_name == 'administrativeproceedings':
        link = f"/admin-proceedings/{case.id}/party-documents/{instance.id}/"
    elif model_name == 'criminalproceedings':
        link = f"/criminal-proceedings/{case.id}/party-documents/{instance.id}/"
    elif model_name == 'civilproceedings':
        link = f"/civil-proceedings/{case.id}/party-documents/{instance.id}/"
    else:
        link = f"/kas-proceedings/{case.id}/party-documents/{instance.id}/"
    
    # Создаем активность
    try:
        CaseActivityService.create_activity(
            case=case,
            activity_type='new_party_document',
            title=title,
            description=description,
            related_object=instance,
            link=link,
            auto_notify=True
        )
        logger.info(f"Активность создана для документа {instance.id}")
    except Exception as e:
        logger.error(f"Ошибка создания активности: {e}")


# ========== СИГНАЛЫ ДЛЯ ХОДАТАЙСТВ ==========

def create_activity_for_petition(case, petition, petitioner, case_type):
    """
    Универсальная функция для создания активности по ходатайству.
    Вызывается из соответствующих приложений.
    """
    from .activity_service import CaseActivityService
    
    title = "Новое ходатайство"
    description = f"{petition.notation[:200] if hasattr(petition, 'notation') else 'Ходатайство по делу'}"
    
    if hasattr(petition, 'petitions_incase'):
        petitions_names = [p.petitions for p in petition.petitions_incase.petitions_name.all()]
        if petitions_names:
            title = f"Новое ходатайство: {', '.join(petitions_names)}"
            description = petition.petitions_incase.notation
    
    CaseActivityService.create_activity(
        case=case,
        activity_type='new_petition',
        title=title,
        description=description,
        related_object=petition,
        link=f"/petitions/{petition.id}/",
        auto_notify=True
    )