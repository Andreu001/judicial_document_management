"""
Сигналы приложения court_registry.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

from .models import CourtEmployee, CourtDepartment, CourtMessengerRegistration, Court

logger = logging.getLogger(__name__)

User = get_user_model()


# =============================================================================
# Автоматическая привязка пользователей к суду
# =============================================================================

@receiver(post_save, sender=User)
def auto_add_user_to_court_employees(sender, instance, created, **kwargs):
    """
    Автоматически добавляет пользователя в CourtEmployee при регистрации или изменении,
    если это сотрудник суда (администратор, судья, секретарь и т.д.)
    """
    if not instance.is_active:
        return
    
    # Сотрудники суда — роли, которые должны быть привязаны к суду
    STAFF_ROLES = ['admin', 'judge', 'secretary', 'assistant_referee', 'hr']
    
    # Проверяем, является ли пользователь сотрудником суда
    if instance.role not in STAFF_ROLES:
        return
    
    # Находим текущий суд (синглтон)
    court = Court.objects.first()
    if not court:
        logger.warning(f"Не найден текущий суд для привязки пользователя {instance.username}")
        return
    
    # Находим или создаем отдел "Общий отдел" (или первый существующий)
    department = CourtDepartment.objects.filter(
        court=court,
        is_active=True
    ).first()
    
    if not department:
        # Если нет отделов, создаем "Общий отдел"
        department = CourtDepartment.objects.create(
            court=court,
            name="Общий отдел",
            is_active=True,
            sort_order=0
        )
        logger.info(f"Создан общий отдел для суда {court.code}")
    
    # Определяем должность на основе роли
    role_position_map = {
        'admin': 'Администратор',
        'judge': 'Судья',
        'secretary': 'Секретарь',
        'assistant_referee': 'Помощник судьи',
        'hr': 'Сотрудник кадров',
    }
    
    position = role_position_map.get(instance.role, instance.role)
    
    # Создаем запись о сотруднике, если её нет
    emp, created = CourtEmployee.objects.get_or_create(
        employee=instance,
        department=department,
        defaults={
            'position': position,
            'is_active': True,
        }
    )
    
    if created:
        logger.info(f"Автоматически привязан пользователь {instance.username} к суду {court.code} как {position}")
    else:
        # Обновляем существующую запись, если она была неактивна
        if not emp.is_active:
            emp.is_active = True
            emp.save(update_fields=['is_active', 'updated_at'])
            logger.info(f"Активирован сотрудник {instance.username}")


@receiver(post_save, sender=CourtEmployee)
def update_messenger_registration_on_employee_save(sender, instance, **kwargs):
    """
    Обновляет счетчики синхронизации мессенджера 
    при добавлении/изменении сотрудника.
    """
    try:
        reg = CourtMessengerRegistration.objects.filter(
            court=instance.department.court
        ).first()
        if reg and reg.is_registered:
            reg.update_sync_counts()
    except Exception as e:
        logger.error(f"Error updating messenger reg on employee save: {e}")


@receiver(post_delete, sender=CourtEmployee)
def update_messenger_registration_on_employee_delete(sender, instance, **kwargs):
    """Обновляет счетчики при удалении сотрудника"""
    try:
        reg = CourtMessengerRegistration.objects.filter(
            court_id=instance.department.court_id
        ).first()
        if reg and reg.is_registered:
            reg.update_sync_counts()
    except Exception as e:
        logger.error(f"Error updating messenger reg on employee delete: {e}")


@receiver(post_save, sender=CourtDepartment)
def update_messenger_registration_on_department_save(sender, instance, **kwargs):
    """Обновляет счетчики при изменении отдела"""
    try:
        reg = CourtMessengerRegistration.objects.filter(
            court=instance.court
        ).first()
        if reg and reg.is_registered:
            reg.update_sync_counts()
    except Exception as e:
        logger.error(f"Error updating messenger reg on department save: {e}")


@receiver(post_delete, sender=CourtDepartment)
def update_messenger_registration_on_department_delete(sender, instance, **kwargs):
    """Обновляет счетчики при удалении отдела"""
    try:
        reg = CourtMessengerRegistration.objects.filter(
            court_id=instance.court_id
        ).first()
        if reg and reg.is_registered:
            reg.update_sync_counts()
    except Exception as e:
        logger.error(f"Error updating messenger reg on department delete: {e}")