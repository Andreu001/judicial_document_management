# case_management/services.py

from django.template import Template, Context
from django.utils import timezone
from datetime import datetime


class NotificationService:
    """Сервис для работы с уведомлениями и шаблонами повесток"""
    
    @staticmethod
    def prepare_context(case, participant, hearing_date=None, hearing_room=None):
        """Подготовка контекста для шаблона"""
        
        # Получаем номер дела в зависимости от типа
        case_number = ''
        if hasattr(case, 'case_number_criminal'):
            case_number = case.case_number_criminal or ''
        elif hasattr(case, 'case_number_civil'):
            case_number = case.case_number_civil or ''
        elif hasattr(case, 'case_number_admin'):
            case_number = case.case_number_admin or ''
        elif hasattr(case, 'case_number_coap'):
            case_number = case.case_number_coap or ''
        else:
            case_number = str(case.id)
        
        # Получаем ФИО участника
        full_name = ''
        if participant:
            if hasattr(participant, 'full_name_criminal'):
                full_name = participant.full_name_criminal or ''
            elif hasattr(participant, 'full_name_civil'):
                full_name = participant.full_name_civil or ''
            elif hasattr(participant, 'full_name'):
                full_name = participant.full_name or ''
            elif hasattr(participant, 'name'):
                full_name = participant.name or ''
            elif hasattr(participant, 'law_firm_name'):
                full_name = participant.law_firm_name or ''
            else:
                full_name = str(participant)
        
        # Форматируем дату и время заседания
        hearing_date_formatted = ''
        hearing_time_formatted = ''
        if hearing_date:
            if isinstance(hearing_date, str):
                try:
                    hearing_date = datetime.fromisoformat(hearing_date.replace('Z', '+00:00'))
                except:
                    pass
            if hasattr(hearing_date, 'strftime'):
                hearing_date_formatted = hearing_date.strftime('%d.%m.%Y')
                hearing_time_formatted = hearing_date.strftime('%H:%M')
        
        # Данные суда (должны быть в настройках или модели суда)
        court_name = "Районный суд"  # TODO: взять из настроек
        court_address = "г. Москва, ул. Примерная, д. 1"
        court_phone = "+7 (495) 123-45-67"
        court_email = "court@example.com"
        
        # Статья (для уголовных дел)
        article = ''
        if hasattr(participant, 'article'):
            article = participant.article or ''
        
        # Статус участника
        participant_status = ''
        if participant:
            if hasattr(participant, 'sides_case_defendant'):
                participant_status = str(participant.sides_case_defendant) if participant.sides_case_defendant else ''
        
        # Категория дела
        case_category = ''
        if hasattr(case, 'case_category'):
            case_category = case.case_category or ''
        
        context = {
            'case_number': case_number,
            'full_name': full_name,
            'court_name': court_name,
            'hearing_date': hearing_date_formatted,
            'hearing_time': hearing_time_formatted,
            'hearing_room': hearing_room or '',
            'address': court_address,
            'judge_name': '',  # TODO: взять из судьи дела
            'article': article,
            'participant_status': participant_status,
            'case_category': case_category,
            'court_phone': court_phone,
            'court_email': court_email,
            'current_date': timezone.now().strftime('%d.%m.%Y'),
        }
        
        return context
    
    @staticmethod
    def render_notification_text(template_content, context):
        """Рендеринг текста повестки с подстановкой переменных"""
        try:
            template = Template(template_content)
            rendered = template.render(Context(context))
            return rendered
        except Exception as e:
            # Если ошибка рендеринга, возвращаем исходный шаблон с ошибкой
            return f"[Ошибка рендеринга: {str(e)}]\n\n{template_content}"
    
    @staticmethod
    def get_template_for_participant(case_category, participant_type):
        """Получение подходящего шаблона для участника"""
        from .models import NotificationTemplate
        
        try:
            template = NotificationTemplate.objects.get(
                case_category=case_category,
                participant_type=participant_type,
                is_active=True
            )
            return template
        except NotificationTemplate.DoesNotExist:
            return None