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
    """Создает уведомление при создании новой корреспонденции."""
    if instance.notes and "PartyDocument ID:" in instance.notes:
        logger.info(f"Пропускаем уведомление для корреспонденции {instance.id} - создана автоматически")
        return
    
    if not created:
        return
    
    signal_key = f"correspondence_notification_{instance.id}"
    if signal_key in _processed_notifications:
        return
    _processed_notifications.add(signal_key)
    
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
    """Создает активность при создании новой корреспонденции."""
    from .activity_service import CaseActivityService
    
    if not created:
        return
    
    if instance.notes and "PartyDocument ID:" in instance.notes:
        return
    
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
        auto_notify=False
    )


# ========== СИГНАЛ ДЛЯ ДОКУМЕНТОВ СТОРОН ==========

@receiver(post_save, sender='case_documents.PartyDocument')
def create_activity_for_party_document(sender, instance, created, **kwargs):
    """Создает активность при создании нового документа от стороны."""
    from .activity_service import CaseActivityService
    from django.contrib.contenttypes.models import ContentType
    from .models import CaseActivity
    
    if not created:
        return
    
    case = instance.case
    if not case:
        logger.warning(f"Документ {instance.id} не привязан к делу")
        return
    
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
    
    doc_type_display = instance.get_document_type_display()
    title = f"Новый документ от стороны: {doc_type_display}"
    description = f"{instance.title}\nПодатель: {instance.submitter_name}"
    
    model_name = case._meta.model_name
    if model_name == 'administrativeproceedings':
        link = f"/admin-proceedings/{case.id}/party-documents/{instance.id}/"
    elif model_name == 'criminalproceedings':
        link = f"/criminal-proceedings/{case.id}/party-documents/{instance.id}/"
    elif model_name == 'civilproceedings':
        link = f"/civil-proceedings/{case.id}/party-documents/{instance.id}/"
    else:
        link = f"/kas-proceedings/{case.id}/party-documents/{instance.id}/"
    
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


# ========== СИГНАЛ ДЛЯ СОЗДАНИЯ УВЕДОМЛЕНИЯ ПРИ СОЗДАНИИ ХОДАТАЙСТВА ==========
# ========== ВАЖНО: используем сигнал на модели CivilPetition, а не PetitionsInCase ==========

@receiver(post_save, sender='civil_proceedings.CivilPetition')
def create_activity_for_civil_petition(sender, instance, created, **kwargs):
    """
    Создает активность и уведомление при создании нового ходатайства в гражданском деле.
    """
    from .activity_service import CaseActivityService
    
    if not created:
        return
    
    case = instance.civil_proceedings
    if not case:
        logger.warning(f"Нет дела для ходатайства {instance.id}")
        return
    
    petitions_incase = instance.petitions_incase
    if not petitions_incase:
        logger.warning(f"Нет PetitionsInCase для ходатайства {instance.id}")
        return
    
    # Получаем информацию о заявителе
    petitioner_info = getattr(petitions_incase, 'petitioner_info', {})
    petitioner_name = petitioner_info.get('name', 'Неизвестный участник') if isinstance(petitioner_info, dict) else str(petitioner_info)
    
    # Получаем типы ходатайств
    petitions_names = [p.petitions for p in petitions_incase.petitions_name.all()] if hasattr(petitions_incase, 'petitions_name') else []
    petition_type_str = ', '.join(petitions_names) if petitions_names else 'Ходатайство'
    
    title = f"📄 Новое ходатайство: {petition_type_str}"
    description = f"Заявитель: {petitioner_name}\n{petitions_incase.notation[:200] if petitions_incase.notation else ''}"
    
    link = f"/petitions/{petitions_incase.id}/"
    
    try:
        activity = CaseActivityService.create_activity(
            case=case,
            activity_type='new_petition',
            title=title,
            description=description,
            related_object=petitions_incase,
            link=link,
            auto_notify=True
        )
        logger.info(f"✅ Активность #{activity.id} и уведомление созданы для ходатайства {instance.id} по гражданскому делу {case}")
    except Exception as e:
        logger.error(f"❌ Ошибка создания активности для ходатайства {instance.id}: {e}")


@receiver(post_save, sender='criminal_proceedings.PetitionCriminal')
def create_activity_for_criminal_petition(sender, instance, created, **kwargs):
    """
    Создает активность и уведомление при создании нового ходатайства в уголовном деле.
    """
    from .activity_service import CaseActivityService
    
    if not created:
        return
    
    case = instance.criminal_proceedings
    if not case:
        logger.warning(f"Нет дела для ходатайства {instance.id}")
        return
    
    petitions_incase = instance.petitions_incase
    if not petitions_incase:
        logger.warning(f"Нет PetitionsInCase для ходатайства {instance.id}")
        return
    
    petitioner_info = getattr(petitions_incase, 'petitioner_info', {})
    petitioner_name = petitioner_info.get('name', 'Неизвестный участник') if isinstance(petitioner_info, dict) else str(petitioner_info)
    
    petitions_names = [p.petitions for p in petitions_incase.petitions_name.all()] if hasattr(petitions_incase, 'petitions_name') else []
    petition_type_str = ', '.join(petitions_names) if petitions_names else 'Ходатайство'
    
    title = f"📄 Новое ходатайство: {petition_type_str}"
    description = f"Заявитель: {petitioner_name}\n{petitions_incase.notation[:200] if petitions_incase.notation else ''}"
    
    link = f"/petitions/{petitions_incase.id}/"
    
    try:
        activity = CaseActivityService.create_activity(
            case=case,
            activity_type='new_petition',
            title=title,
            description=description,
            related_object=petitions_incase,
            link=link,
            auto_notify=True
        )
        logger.info(f"✅ Активность #{activity.id} и уведомление созданы для ходатайства {instance.id} по уголовному делу {case}")
    except Exception as e:
        logger.error(f"❌ Ошибка создания активности для ходатайства {instance.id}: {e}")


@receiver(post_save, sender='administrative_code.AdministrativePetition')
def create_activity_for_admin_petition(sender, instance, created, **kwargs):
    """
    Создает активность и уведомление при создании нового ходатайства в деле об АП (КоАП).
    """
    from .activity_service import CaseActivityService
    
    if not created:
        return
    
    case = instance.administrative_proceedings
    if not case:
        logger.warning(f"Нет дела для ходатайства {instance.id}")
        return
    
    petitions_incase = instance.petitions_incase
    if not petitions_incase:
        logger.warning(f"Нет PetitionsInCase для ходатайства {instance.id}")
        return
    
    petitioner_info = getattr(petitions_incase, 'petitioner_info', {})
    petitioner_name = petitioner_info.get('name', 'Неизвестный участник') if isinstance(petitioner_info, dict) else str(petitioner_info)
    
    petitions_names = [p.petitions for p in petitions_incase.petitions_name.all()] if hasattr(petitions_incase, 'petitions_name') else []
    petition_type_str = ', '.join(petitions_names) if petitions_names else 'Ходатайство'
    
    title = f"📄 Новое ходатайство: {petition_type_str}"
    description = f"Заявитель: {petitioner_name}\n{petitions_incase.notation[:200] if petitions_incase.notation else ''}"
    
    link = f"/petitions/{petitions_incase.id}/"
    
    try:
        activity = CaseActivityService.create_activity(
            case=case,
            activity_type='new_petition',
            title=title,
            description=description,
            related_object=petitions_incase,
            link=link,
            auto_notify=True
        )
        logger.info(f"✅ Активность #{activity.id} и уведомление созданы для ходатайства {instance.id} по делу об АП {case}")
    except Exception as e:
        logger.error(f"❌ Ошибка создания активности для ходатайства {instance.id}: {e}")


@receiver(post_save, sender='administrative_proceedings.KasPetition')
def create_activity_for_kas_petition(sender, instance, created, **kwargs):
    """
    Создает активность и уведомление при создании нового ходатайства в деле КАС.
    """
    from .activity_service import CaseActivityService
    
    if not created:
        return
    
    case = instance.kas_proceedings
    if not case:
        logger.warning(f"Нет дела для ходатайства {instance.id}")
        return
    
    petitions_incase = instance.petitions_incase
    if not petitions_incase:
        logger.warning(f"Нет PetitionsInCase для ходатайства {instance.id}")
        return
    
    petitioner_info = getattr(petitions_incase, 'petitioner_info', {})
    petitioner_name = petitioner_info.get('name', 'Неизвестный участник') if isinstance(petitioner_info, dict) else str(petitioner_info)
    
    petitions_names = [p.petitions for p in petitions_incase.petitions_name.all()] if hasattr(petitions_incase, 'petitions_name') else []
    petition_type_str = ', '.join(petitions_names) if petitions_names else 'Ходатайство'
    
    title = f"📄 Новое ходатайство: {petition_type_str}"
    description = f"Заявитель: {petitioner_name}\n{petitions_incase.notation[:200] if petitions_incase.notation else ''}"
    
    link = f"/petitions/{petitions_incase.id}/"
    
    try:
        activity = CaseActivityService.create_activity(
            case=case,
            activity_type='new_petition',
            title=title,
            description=description,
            related_object=petitions_incase,
            link=link,
            auto_notify=True
        )
        logger.info(f"✅ Активность #{activity.id} и уведомление созданы для ходатайства {instance.id} по делу КАС {case}")
    except Exception as e:
        logger.error(f"❌ Ошибка создания активности для ходатайства {instance.id}: {e}")


# ========== СИГНАЛ ДЛЯ УВЕДОМЛЕНИЯ СТОРОНЫ О РЕШЕНИИ ПО ХОДАТАЙСТВУ ==========

@receiver(post_save, sender='business_card.PetitionsInCase')
def notify_party_on_petition_decision(sender, instance, created, **kwargs):
    """
    Уведомляет сторону о решении по ходатайству.
    """
    from .activity_service import PartyResponseService
    from side_case_access.models import ExternalUser
    
    if created:
        return
    
    if not instance.date_decision:
        return
    
    petitioner_info = getattr(instance, 'petitioner_info', {})
    if not isinstance(petitioner_info, dict):
        return
    
    external_user = None
    user_email = petitioner_info.get('user_email')
    
    if user_email:
        try:
            external_user = ExternalUser.objects.get(email=user_email, is_active=True)
        except ExternalUser.DoesNotExist:
            pass
    
    if external_user:
        decision_text = instance.decision_rendered.name_case if instance.decision_rendered else 'Рассмотрено'
        PartyResponseService.notify_party_petition_resolved(
            petition=instance,
            external_user=external_user,
            decision=f"Решение от {instance.date_decision.strftime('%d.%m.%Y')}: {decision_text}"
        )
        logger.info(f"Уведомление отправлено участнику {external_user.full_name} о решении по ходатайству {instance.id}")
