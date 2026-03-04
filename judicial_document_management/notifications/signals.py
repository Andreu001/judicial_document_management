# notifications/signals.py
from django.apps import apps
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
from case_registry.models import Correspondence
from .models import Notification

logger = logging.getLogger(__name__)
User = get_user_model()


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


# Используем простой флаг в памяти (для продакшена лучше использовать кэш)
_processed_notifications = set()

@receiver(post_save, sender=Correspondence)
def create_correspondence_notification(sender, instance, created, **kwargs):
    """
    Создает уведомление при создании новой корреспонденции,
    если она привязана к делу
    """
    # Уникальный ключ для этого сигнала
    signal_key = f"correspondence_notification_{instance.id}"
    
    # Если этот сигнал уже обрабатывался, пропускаем
    if signal_key in _processed_notifications:
        logger.info(f"Сигнал для корреспонденции {instance.id} уже обработан, пропускаем")
        return
    
    logger.info(f"=== Сработал сигнал create_correspondence_notification ===")
    logger.info(f"Создан: {created}, ID корреспонденции: {instance.id}")
    logger.info(f"Тип: {instance.correspondence_type}, Документ: {instance.document_type}")
    
    # ДЛЯ НОВЫХ ЗАПИСЕЙ - нужно подождать, пока завершится транзакция
    if created:
        logger.info("Это НОВАЯ запись. Используем значения напрямую из объекта")
        # Для новых записей значения уже должны быть установлены
        pass
    
    # Логируем все поля
    logger.info(f"criminal_case_id: {instance.criminal_case_id}")
    logger.info(f"civil_case_id: {instance.civil_case_id}")
    logger.info(f"admin_case_id: {instance.admin_case_id}")
    logger.info(f"kas_case_id: {instance.kas_case_id}")
    
    # Определяем, к какому делу привязана корреспонденция
    proceeding = None
    proceeding_type = None
    user = None
    proceeding_number = None
    
    # Проверяем все возможные типы дел
    if instance.criminal_case_id:
        logger.info(f"Найдена связь с уголовным делом ID: {instance.criminal_case_id}")
        try:
            CriminalProceedings = apps.get_model('criminal_proceedings', 'CriminalProceedings')
            proceeding = CriminalProceedings.objects.get(id=instance.criminal_case_id)
            proceeding_type = 'criminal'
            proceeding_number = proceeding.case_number_criminal
            logger.info(f"Уголовное дело найдено: {proceeding.case_number_criminal}")
            
            # Получаем судью
            user = get_presiding_judge_from_proceeding(proceeding)
            if user:
                logger.info(f"Найден судья: {user.username} (ID: {user.id})")
            else:
                logger.warning(f"Судья не найден для уголовного дела {proceeding.id}")
                
        except Exception as e:
            logger.error(f"Ошибка получения уголовного дела: {e}", exc_info=True)
    
    elif instance.civil_case_id:
        logger.info(f"Найдена связь с гражданским делом ID: {instance.civil_case_id}")
        try:
            CivilProceedings = apps.get_model('civil_proceedings', 'CivilProceedings')
            proceeding = CivilProceedings.objects.get(id=instance.civil_case_id)
            proceeding_type = 'civil'
            proceeding_number = proceeding.case_number_civil
            logger.info(f"Гражданское дело найдено: {proceeding.case_number_civil}")
            
            user = get_presiding_judge_from_proceeding(proceeding)
            if user:
                logger.info(f"Найден судья: {user.username} (ID: {user.id})")
            else:
                logger.warning(f"Судья не найден для гражданского дела {proceeding.id}")
                
        except Exception as e:
            logger.error(f"Ошибка получения гражданского дела: {e}", exc_info=True)
    
    elif instance.admin_case_id:
        logger.info(f"Найдена связь с делом об АП ID: {instance.admin_case_id}")
        try:
            AdministrativeProceedings = apps.get_model('administrative_code', 'AdministrativeProceedings')
            proceeding = AdministrativeProceedings.objects.get(id=instance.admin_case_id)
            proceeding_type = 'admin'
            proceeding_number = proceeding.case_number_admin
            logger.info(f"Дело об АП найдено: {proceeding.case_number_admin}")
            
            user = get_presiding_judge_from_proceeding(proceeding)
            if user:
                logger.info(f"Найден судья: {user.username} (ID: {user.id})")
            else:
                logger.warning(f"Судья не найден для дела об АП {proceeding.id}")
                
        except Exception as e:
            logger.error(f"Ошибка получения дела об АП: {e}", exc_info=True)
    
    elif instance.kas_case_id:
        logger.info(f"Найдена связь с делом по КАС ID: {instance.kas_case_id}")
        try:
            KasProceedings = apps.get_model('administrative_proceedings', 'KasProceedings')
            proceeding = KasProceedings.objects.get(id=instance.kas_case_id)
            proceeding_type = 'kas'
            proceeding_number = proceeding.case_number_kas
            logger.info(f"Дело по КАС найдено: {proceeding.case_number_kas}")
            
            user = get_presiding_judge_from_proceeding(proceeding)
            if user:
                logger.info(f"Найден судья: {user.username} (ID: {user.id})")
            else:
                logger.warning(f"Судья не найден для дела по КАС {proceeding.id}")
                
        except Exception as e:
            logger.error(f"Ошибка получения дела по КАС: {e}", exc_info=True)
    
    # Если есть судья и дело, создаем уведомление
    if user and proceeding:
        logger.info(f"Создаем уведомление для судьи {user.username}")
        
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
        
        logger.info(f"Создаем уведомление:")
        logger.info(f"  - Заголовок: {title}")
        logger.info(f"  - Сообщение: {message}")
        
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
            notification = Notification.objects.create(**notification_kwargs)
            logger.info(f"✅ Уведомление создано успешно! ID: {notification.id}")
            
            # Помечаем, что этот сигнал обработан
            _processed_notifications.add(signal_key)
            
        except Exception as e:
            logger.error(f"❌ Ошибка создания уведомления: {e}", exc_info=True)
    else:
        logger.warning("Не удалось создать уведомление:")
        if not proceeding:
            logger.warning("  - Дело не найдено")
        if not user:
            logger.warning("  - Судья не найден")


@receiver(post_save, sender=Correspondence)
def notify_on_important_documents(sender, instance, created, **kwargs):
    """Отдельный обработчик для особо важных документов"""
    # Уникальный ключ для этого сигнала
    signal_key = f"important_document_{instance.id}"
    
    # Если этот сигнал уже обрабатывался, пропускаем
    if signal_key in _processed_notifications:
        logger.info(f"Сигнал important для корреспонденции {instance.id} уже обработан, пропускаем")
        return
    
    logger.info(f"=== Сработал сигнал notify_on_important_documents ===")
    
    if not created:
        logger.info("Пропускаем, так как это не новая запись")
        return
    
    important_types = ['Жалоба', 'Ходатайство', 'Заявление', 'Представление']
    
    if instance.document_type in important_types:
        logger.info(f"Документ {instance.document_type} в списке важных")
        
        # Находим пользователя и дело
        user = None
        proceeding = None
        proceeding_number = None
        
        if instance.criminal_case_id:
            try:
                CriminalProceedings = apps.get_model('criminal_proceedings', 'CriminalProceedings')
                proceeding = CriminalProceedings.objects.get(id=instance.criminal_case_id)
                user = get_presiding_judge_from_proceeding(proceeding)
                proceeding_number = proceeding.case_number_criminal
            except Exception as e:
                logger.error(f"Ошибка: {e}")
        
        elif instance.civil_case_id:
            try:
                CivilProceedings = apps.get_model('civil_proceedings', 'CivilProceedings')
                proceeding = CivilProceedings.objects.get(id=instance.civil_case_id)
                user = get_presiding_judge_from_proceeding(proceeding)
                proceeding_number = proceeding.case_number_civil
            except Exception as e:
                logger.error(f"Ошибка: {e}")
        
        elif instance.admin_case_id:
            try:
                AdministrativeProceedings = apps.get_model('administrative_code', 'AdministrativeProceedings')
                proceeding = AdministrativeProceedings.objects.get(id=instance.admin_case_id)
                user = get_presiding_judge_from_proceeding(proceeding)
                proceeding_number = proceeding.case_number_admin
            except Exception as e:
                logger.error(f"Ошибка: {e}")
        
        elif instance.kas_case_id:
            try:
                KasProceedings = apps.get_model('administrative_proceedings', 'KasProceedings')
                proceeding = KasProceedings.objects.get(id=instance.kas_case_id)
                user = get_presiding_judge_from_proceeding(proceeding)
                proceeding_number = proceeding.case_number_kas
            except Exception as e:
                logger.error(f"Ошибка: {e}")
        
        if user and proceeding:
            deadline = timezone.now() + timezone.timedelta(days=3)
            
            try:
                notification = Notification.objects.create(
                    user=user,
                    title=f"⚠️ ВАЖНО: {instance.document_type} по делу №{proceeding_number}",
                    message=f"Требуется рассмотреть {instance.document_type.lower()}: {instance.summary[:200]}",
                    priority='high',
                    correspondence=instance,
                    deadline=deadline,
                    notification_type=f'{instance.correspondence_type}_correspondence'
                )
                logger.info(f"✅ Дополнительное уведомление создано! ID: {notification.id}")
                
                # Помечаем, что этот сигнал обработан
                _processed_notifications.add(signal_key)
                
            except Exception as e:
                logger.error(f"❌ Ошибка: {e}", exc_info=True)