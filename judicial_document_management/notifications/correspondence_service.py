# notifications/correspondence_service.py
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from .models import Notification

class CorrespondenceNotificationService:
    """Сервис для создания уведомлений о корреспонденции"""
    
    @staticmethod
    def create_incoming_notification(correspondence):
        """
        Создает уведомление о поступлении входящей корреспонденции
        для судьи, назначенного на дело
        """
        # Определяем, к какому делу привязана корреспонденция
        case_info = None
        case_type = None
        case_obj = None
        case_display = "Не определено"
        
        # Проверяем все возможные типы дел
        if hasattr(correspondence, 'criminal_case_info') and correspondence.criminal_case_info:
            case_obj = correspondence.criminal_case_info
            case_type = 'criminal'
            case_display = f"Уголовное дело № {case_obj.case_number_criminal}"
        elif hasattr(correspondence, 'civil_case_info') and correspondence.civil_case_info:
            case_obj = correspondence.civil_case_info
            case_type = 'civil'
            case_display = f"Гражданское дело № {case_obj.case_number_civil}"
        elif hasattr(correspondence, 'admin_case_info') and correspondence.admin_case_info:
            case_obj = correspondence.admin_case_info
            case_type = 'admin'
            case_display = f"Дело об АП № {case_obj.case_number_admin}"
        elif hasattr(correspondence, 'kas_case_info') and correspondence.kas_case_info:
            case_obj = correspondence.kas_case_info
            case_type = 'kas'
            case_display = f"Дело по КАС № {case_obj.case_number_kas}"
        
        if not case_obj:
            # Если дело не привязано, не создаем уведомление
            return None
        
        # Получаем пользователя (судью), назначенного на дело
        # Предполагаем, что у каждого дела есть business_card, у которой есть user
        user = None
        if hasattr(case_obj, 'business_card') and case_obj.business_card:
            user = case_obj.business_card.user
        elif hasattr(case_obj, 'user'):  # На случай прямой связи
            user = case_obj.user
        
        if not user:
            return None
        
        # Единый приоритет medium для всех уведомлений (без разделения на важные)
        priority = 'medium'
        
        # Создаем уведомление
        title = f"📥 Входящая корреспонденция по делу"
        message = (
            f"Поступил документ: {correspondence.document_type}\n"
            f"Отправитель: {correspondence.recipient or 'Не указан'}\n"
            f"Краткое содержание: {correspondence.summary[:100]}..."
        )
        
        # Добавляем информацию о сроке, если есть
        if correspondence.deadline:
            message += f"\nСрок исполнения: {correspondence.deadline.strftime('%d.%m.%Y')}"
        
        notification_kwargs = {
            'user': user,
            'title': title,
            'message': message,
            'priority': priority,
            'notification_type': 'incoming_correspondence',
            'correspondence': correspondence,
        }
        
        # Добавляем связь с конкретным типом дела
        if case_type == 'criminal':
            notification_kwargs['criminal_proceeding'] = case_obj
        elif case_type == 'civil':
            notification_kwargs['civil_proceeding'] = case_obj
        elif case_type == 'admin':
            notification_kwargs['admin_proceeding'] = case_obj
        elif case_type == 'kas':
            notification_kwargs['kas_proceeding'] = case_obj
        
        notification = Notification.objects.create(**notification_kwargs)
        
        return notification
    
    @staticmethod
    def create_outgoing_notification(correspondence):
        """
        Создает уведомление об отправке исходящей корреспонденции
        (например, о направлении повесток сторонам)
        """
        # Аналогично incoming, но с другим сообщением
        case_info = None
        case_type = None
        case_obj = None
        case_display = "Не определено"
        
        # Проверяем все возможные типы дел
        if hasattr(correspondence, 'criminal_case_info') and correspondence.criminal_case_info:
            case_obj = correspondence.criminal_case_info
            case_type = 'criminal'
        elif hasattr(correspondence, 'civil_case_info') and correspondence.civil_case_info:
            case_obj = correspondence.civil_case_info
            case_type = 'civil'
        elif hasattr(correspondence, 'admin_case_info') and correspondence.admin_case_info:
            case_obj = correspondence.admin_case_info
            case_type = 'admin'
        elif hasattr(correspondence, 'kas_case_info') and correspondence.kas_case_info:
            case_obj = correspondence.kas_case_info
            case_type = 'kas'
        
        if not case_obj:
            return None
        
        # Получаем пользователя (судью), назначенного на дело
        user = None
        if hasattr(case_obj, 'business_card') and case_obj.business_card:
            user = case_obj.business_card.user
        elif hasattr(case_obj, 'user'):
            user = case_obj.user
        
        if not user:
            return None
        
        # Единый стиль для всех исходящих документов
        title = f"📤 Исходящая корреспонденция по делу"
        message = (
            f"Отправлен документ: {correspondence.document_type}\n"
            f"Получатель: {correspondence.recipient or 'Не указан'}\n"
            f"Содержание: {correspondence.summary[:100]}..."
        )
        
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            priority='medium',  # Единый приоритет для всех
            notification_type='outgoing_correspondence',
            correspondence=correspondence,
            criminal_proceeding=case_obj if case_type == 'criminal' else None,
            civil_proceeding=case_obj if case_type == 'civil' else None,
            admin_proceeding=case_obj if case_type == 'admin' else None,
            kas_proceeding=case_obj if case_type == 'kas' else None,
        )
        
        return notification