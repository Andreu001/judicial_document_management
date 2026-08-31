# notifications/activity_service.py
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class CaseActivityService:
    """
    Универсальный сервис для создания активностей по делам
    и уведомления председательствующего судьи.
    """
    
    JUDGE_FIELD_MAPPING = {
        'administrativeproceedings': 'presiding_judge',
        'criminalproceedings': 'presiding_judge',
        'civilproceedings': 'presiding_judge',
        'kasproceedings': 'presiding_judge',
    }
    
    @classmethod
    def get_presiding_judge(cls, case):
        """
        Получить председательствующего судью по делу.
        Универсальный метод для всех типов дел.
        """
        model_name = case._meta.model_name
        
        field_name = cls.JUDGE_FIELD_MAPPING.get(model_name)
        if field_name and hasattr(case, field_name):
            judge = getattr(case, field_name)
            if judge:
                return judge
        return None

    @classmethod
    def create_activity(cls, case, activity_type, title, description='', 
                        related_object=None, link='', auto_notify=True):
        """
        Создать активность по делу и опционально отправить уведомление судье.
        """
        from .models import CaseActivity, CaseNotificationSummary
        
        logger.info(f"=== create_activity: case={case}, activity_type={activity_type}, auto_notify={auto_notify} ===")
        
        case_content_type = ContentType.objects.get_for_model(case)
        
        related_ct = None
        related_id = None
        if related_object:
            related_ct = ContentType.objects.get_for_model(related_object)
            related_id = related_object.id
        
        activity = CaseActivity.objects.create(
            case_content_type=case_content_type,
            case_object_id=case.id,
            activity_type=activity_type,
            title=title,
            description=description,
            related_content_type=related_ct,
            related_object_id=related_id,
            link=link,
            is_read_by_judge=False
        )
        
        logger.info(f"Создана активность #{activity.id} по делу {case} типа {activity_type}")
        
        # Автоматическое уведомление судьи
        if auto_notify:
            logger.info(f"auto_notify=True, вызываем notify_judge для активности {activity.id}")
            cls.notify_judge(activity, case)
        else:
            logger.info(f"auto_notify=False, пропускаем уведомление")
        
        # Обновляем сводку
        cls.update_notification_summary(case)
        
        return activity

    @classmethod
    def notify_judge(cls, activity, case):
        """
        Отправить уведомление председательствующему судье.
        """
        from .models import Notification
        
        logger.info(f"=== notify_judge вызван для активности {activity.id} ===")
        
        judge = cls.get_presiding_judge(case)
        if not judge:
            logger.warning(f"Нет судьи для уведомления по делу {case}")
            return False
        
        logger.info(f"Судья найден: {judge.username} (ID: {judge.id})")
        
        # Определяем приоритет
        priority = 'high' if 'petition' in activity.activity_type else 'medium'
        
        # Формируем заголовок и сообщение
        title = f" {activity.title}"
        
        logger.info(f"Создаем уведомление: title='{title}', priority='{priority}'")
        
        # Создаем уведомление
        notification_kwargs = {
            'user': judge,
            'title': title,
            'message': activity.description or activity.title,
            'priority': priority,
            'notification_type': activity.activity_type,
        }
        
        # Добавляем связь с конкретным типом дела
        case_model_name = case._meta.model_name
        
        if case_model_name == 'administrativeproceedings':
            notification_kwargs['admin_proceeding'] = case
        elif case_model_name == 'criminalproceedings':
            notification_kwargs['criminal_proceeding'] = case
        elif case_model_name == 'civilproceedings':
            notification_kwargs['civil_proceeding'] = case
        elif case_model_name == 'kasproceedings':
            notification_kwargs['kas_proceeding'] = case
        
        try:
            notification = Notification.objects.create(**notification_kwargs)
            logger.info(f"✅ Уведомление #{notification.id} отправлено судье {judge.username} по делу {case}")
            return True
        except Exception as e:
            logger.error(f"❌ Ошибка создания уведомления: {e}")
            return False
    
    @classmethod
    def update_notification_summary(cls, case):
        """
        Обновить сводку уведомлений по делу для судьи.
        """
        from .models import CaseNotificationSummary
        
        judge = cls.get_presiding_judge(case)
        if not judge:
            return None
        
        case_content_type = ContentType.objects.get_for_model(case)
        
        summary, created = CaseNotificationSummary.objects.get_or_create(
            case_content_type=case_content_type,
            case_object_id=case.id,
            judge=judge
        )
        
        summary.update_summary()
        return summary

    @classmethod
    def mark_activity_by_related_object(cls, case, related_object, judge):
        """
        Отметить активность как прочитанную по связанному объекту.
        """
        from .models import CaseActivity
        from django.contrib.contenttypes.models import ContentType
        
        if not case or not related_object or not judge:
            return False
        
        # Проверяем, что судья является председательствующим
        presiding_judge = cls.get_presiding_judge(case)
        if presiding_judge and presiding_judge.id != judge.id:
            return False
        
        case_content_type = ContentType.objects.get_for_model(case)
        related_ct = ContentType.objects.get_for_model(related_object)
        
        updated = CaseActivity.objects.filter(
            case_content_type=case_content_type,
            case_object_id=case.id,
            related_content_type=related_ct,
            related_object_id=related_object.id,
            activity_type='new_party_document',
            is_read_by_judge=False
        ).update(is_read_by_judge=True)
        
        if updated > 0:
            cls.update_notification_summary(case)
        
        return updated > 0

    @classmethod
    def mark_activities_as_read(cls, case, judge, activity_ids=None, activity_type=None):
        """
        Отметить активности по делу как прочитанные.
        """
        from .models import CaseActivity
        
        # Проверяем права судьи
        presiding_judge = cls.get_presiding_judge(case)
        if presiding_judge and presiding_judge.id != judge.id:
            return 0
        
        case_content_type = ContentType.objects.get_for_model(case)
        
        queryset = CaseActivity.objects.filter(
            case_content_type=case_content_type,
            case_object_id=case.id,
            is_read_by_judge=False
        )
        
        if activity_ids:
            queryset = queryset.filter(id__in=activity_ids)
        
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        count = queryset.update(is_read_by_judge=True)
        
        if count > 0:
            cls.update_notification_summary(case)
        
        return count
    
    @classmethod
    def get_case_notification_status(cls, case, judge):
        """
        Получить статус уведомлений по делу для отображения в карточке.
        
        Returns:
            Dict с количеством непрочитанных по типам
        """
        from .models import CaseNotificationSummary
        
        case_content_type = ContentType.objects.get_for_model(case)
        
        # Проверяем, что судья является председательствующим
        presiding_judge = cls.get_presiding_judge(case)
        if presiding_judge and presiding_judge.id != judge.id:
            return {
                'has_unread': False,
                'total_unread': 0,
                'party_documents': 0,
                'petitions': 0,
                'correspondence': 0,
            }
        
        try:
            summary = CaseNotificationSummary.objects.get(
                case_content_type=case_content_type,
                case_object_id=case.id,
                judge=judge
            )
            summary.update_summary()
            summary.refresh_from_db()
            
            return {
                'has_unread': summary.total_unread > 0,
                'total_unread': summary.total_unread,
                'party_documents': summary.unread_party_documents,
                'petitions': summary.unread_petitions,
                'correspondence': summary.unread_correspondence,
            }
        except CaseNotificationSummary.DoesNotExist:
            return {
                'has_unread': False,
                'total_unread': 0,
                'party_documents': 0,
                'petitions': 0,
                'correspondence': 0,
            }


class PartyResponseService:
    """
    Сервис для отправки автоматических ответов участникам процесса
    в личный кабинет.
    """
    
    @classmethod
    def notify_party_document_received(cls, party_document, external_user):
        if not external_user:
            return False
        
        logger.info(f"Уведомление для участника {external_user.full_name}: "
                   f"Документ '{party_document.title}' получен судом")
        return True
    
    @classmethod
    def notify_party_document_accepted(cls, party_document, external_user, judge_decision):
        if not external_user:
            return False
        
        logger.info(f"Уведомление для участника {external_user.full_name}: "
                   f"Документ '{party_document.title}' приобщен к делу. "
                   f"Решение: {judge_decision}")
        return True
    
    @classmethod
    def notify_party_document_rejected(cls, party_document, external_user, reason):
        if not external_user:
            return False
        
        logger.info(f"Уведомление для участника {external_user.full_name}: "
                   f"Отказано в приобщении документа '{party_document.title}'. "
                   f"Причина: {reason}")
        return True
    
    @classmethod
    def notify_party_petition_received(cls, petition, external_user, case):
        if not external_user:
            return False
        
        logger.info(f"Уведомление для участника {external_user.full_name}: "
                   f"Ходатайство по делу {case} получено судом")
        return True
    
    @classmethod
    def notify_party_petition_resolved(cls, petition, external_user, decision):
        if not external_user:
            return False
        
        logger.info(f"Уведомление для участника {external_user.full_name}: "
                   f"По ходатайству принято решение: {decision}")
        return True
