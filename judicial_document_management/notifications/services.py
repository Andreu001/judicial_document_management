# notifications/services.py
from django.utils import timezone
from datetime import timedelta
from django.apps import apps
from .models import Notification, JurisdictionCheck, DeadlineWarning, NotificationRule

class JurisdictionService:
    """Сервис проверки подсудности"""
    
    @staticmethod
    def check_jurisdiction(criminal_proceeding, user):
        """Проверка соответствия подсудности"""
        # Получаем максимальное наказание из дела
        max_penalty = None
        for defendant in criminal_proceeding.defendants.all():
            if defendant.maximum_penalty_article:
                try:
                    penalty_years = int(defendant.maximum_penalty_article)
                    if max_penalty is None or penalty_years > max_penalty:
                        max_penalty = penalty_years
                except (ValueError, TypeError):
                    continue
        
        # Определяем требуемый тип суда
        if max_penalty is not None and max_penalty <= 3:
            required_type = 'magistrate'
        else:
            required_type = 'district'
        
        # Получаем уровень суда пользователя
        user_court_level = user.subject_level if hasattr(user, 'subject_level') else 'district'
        
        # Сопоставляем уровень пользователя с типом дела
        if user_court_level == 'magistrate':
            actual_type = 'magistrate'
        else:
            actual_type = 'district'
        
        is_correct = (required_type == actual_type)
        
        # Создаем запись о проверке
        check = JurisdictionCheck.objects.create(
            criminal_proceeding=criminal_proceeding,
            user=user,
            case_type_actual=actual_type,
            case_type_required=required_type,
            is_correct=is_correct,
            notes=f"Максимальное наказание: {max_penalty} лет, уровень суда: {user_court_level}"
        )
        
        # Создаем уведомление
        if is_correct:
            title = "✅ Подсудность соответствует"
            message = f"Дело подсудно {user.get_subject_level_display()}. Максимальное наказание: {max_penalty} лет."
            priority = 'low'
        else:
            title = "⚠️ Нарушение подсудности"
            message = f"Дело должно рассматриваться в {check.get_case_type_required_display()}, но находится в {check.get_case_type_actual_display()}. Максимальное наказание: {max_penalty} лет."
            priority = 'high'
        
        Notification.objects.create(
            user=user,
            criminal_proceeding=criminal_proceeding,
            title=title,
            message=message,
            priority=priority,
            jurisdiction_check=check
        )
        
        return check

class DeadlineService:
    """Сервис контроля сроков"""
    
    @staticmethod
    def check_deadlines(criminal_proceeding):
        """Проверка сроков по уголовному делу"""
        today = timezone.now().date()
        warnings = []
        
        # Проверка срока подготовки к судебному заседанию (30 дней)
        if criminal_proceeding.incoming_date:
            preparation_deadline = criminal_proceeding.incoming_date + timedelta(days=30)
            days_remaining = (preparation_deadline - today).days
            
            if 0 <= days_remaining <= 5:
                warnings.append({
                    'type': 'pre_trial_preparation',
                    'deadline': preparation_deadline,
                    'days_remaining': days_remaining,
                    'message': f'Срок подготовки к судебному заседанию истекает через {days_remaining} дней'
                })
        
        # Проверка срока судебного разбирательства
        if criminal_proceeding.first_hearing_date:
            trial_deadline = criminal_proceeding.first_hearing_date + timedelta(days=180)  # 6 месяцев
            days_remaining = (trial_deadline - today).days
            
            if 0 <= days_remaining <= 10:
                warnings.append({
                    'type': 'trial_start',
                    'deadline': trial_deadline,
                    'days_remaining': days_remaining,
                    'message': f'Срок судебного разбирательства истекает через {days_remaining} дней'
                })
        
        # Создаем уведомления для предупреждений
        for warning in warnings:
            # Создаем запись предупреждения
            deadline_warning = DeadlineWarning.objects.create(
                criminal_proceeding=criminal_proceeding,
                warning_type=warning['type'],
                deadline_date=warning['deadline'],
                days_remaining=warning['days_remaining']
            )
            
            # Создаем уведомление для судьи
            Notification.objects.create(
                user=criminal_proceeding.business_card.user,  # предполагая, что есть связь
                criminal_proceeding=criminal_proceeding,
                title=f"⏰ Срок: {warning['message']}",
                message=f"Дело {criminal_proceeding}. {warning['message']}",
                priority='high' if warning['days_remaining'] <= 3 else 'medium',
                deadline=warning['deadline']
            )
        
        return warnings

class NotificationService:
    """Основной сервис уведомлений"""
    
    @staticmethod
    def create_jurisdiction_notification(criminal_proceeding, user):
        """Создание уведомления о проверке подсудности"""
        return JurisdictionService.check_jurisdiction(criminal_proceeding, user)
    
    @staticmethod
    def create_deadline_notifications(criminal_proceeding):
        """Создание уведомлений о сроках"""
        return DeadlineService.check_deadlines(criminal_proceeding)
    
    @staticmethod
    def create_preliminary_hearing_notification(criminal_proceeding, user):
        """Уведомление о необходимости предварительного слушания"""
        # Проверяем условия для предварительного слушания
        needs_hearing = False
        reasons = []
        
        # Пример условий (можно расширить)
        if criminal_proceeding.defendants.filter(restraint_measure='7').exists():  # заключение под стражу
            needs_hearing = True
            reasons.append("обвиняемый содержится под стражей")
        
        if criminal_proceeding.case_category and '2' in criminal_proceeding.case_category:  # несовершеннолетний
            needs_hearing = True
            reasons.append("участие несовершеннолетнего")
        
        if needs_hearing:
            title = "🎯 Требуется предварительное слушание"
            message = f"Основания: {', '.join(reasons)}"
            
            notification = Notification.objects.create(
                user=user,
                criminal_proceeding=criminal_proceeding,
                title=title,
                message=message,
                priority='medium'
            )
            
            return notification
        
        return None