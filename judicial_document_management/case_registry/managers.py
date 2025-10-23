# case_registry/managers.py
from django.db import models, transaction
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from .models import RegistryCounter, RegisteredCase, NumberAdjustment
import logging

logger = logging.getLogger(__name__)


class CaseRegistryManager:
    """
    Менеджер для работы с регистрацией дел
    """
# case_registry/managers.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

    class CaseRegistryManager:
        @transaction.atomic
        def register_case(self, index_code, description=None, business_card_id=None, criminal_proceedings_id=None):
            """
            Регистрация нового дела
            """
            from .models import RegistryIndex
            
            try:
                index = RegistryIndex.objects.get(index=index_code)
            except RegistryIndex.DoesNotExist:
                raise ValueError(f"Индекс {index_code} не найден или не активен")
            
            # Получаем или создаем счетчик
            counter, created = RegistryCounter.objects.get_or_create(
                index=index,
                defaults={'current_number': 0}
            )
            
            # Увеличиваем счетчик и сразу сохраняем
            counter.current_number += 1
            counter.total_registered += 1
            counter.save()  # ВАЖНО: сохраняем увеличенный счетчик
            
            # Создаем запись о деле
            case = RegisteredCase.objects.create(
                index=index,
                case_number=counter.current_number,  # Используем увеличенный номер
                description=description,
                business_card_id=business_card_id,
                criminal_proceedings_id=criminal_proceedings_id
            )
            
            logger.info(f"Зарегистрировано новое дело: {case.full_number}")
            return case
    
    @transaction.atomic
    def delete_case(self, case_id, reason="Удаление дела"):
        """
        Удаление дела с возможностью отката нумерации
        """
        try:
            case = RegisteredCase.objects.get(id=case_id)
        except RegisteredCase.DoesNotExist:
            raise ValueError("Дело не найдено")
        
        if case.status == 'deleted':
            raise ValueError("Дело уже удалено")
        
        # Помечаем дело как удаленное
        case.status = 'deleted'
        case.save()
        
        # Автоматически откатываем нумерацию, если это последнее зарегистрированное дело
        self._rollback_numbering_if_needed(case.index, case.case_number, reason)
        
        logger.info(f"Дело {case.full_number} удалено. Причина: {reason}")
        return case
    
    @transaction.atomic
    def adjust_numbering(self, index_code, new_current_number, reason, adjusted_by):
        """
        Ручная корректировка нумерации
        """
        from .models import RegistryIndex
        
        try:
            index = RegistryIndex.objects.get(index=index_code)
            counter = RegistryCounter.objects.get(index=index)
        except (RegistryIndex.DoesNotExist, RegistryCounter.DoesNotExist):
            raise ValueError(f"Счетчик для индекса {index_code} не найден")
        
        old_number = counter.current_number
        
        if new_current_number >= counter.current_number:
            raise ValueError("Новый номер должен быть меньше текущего")
        
        # Проверяем, нет ли конфликтующих дел
        conflicting_cases = RegisteredCase.objects.filter(
            index=index,
            case_number__gt=new_current_number,
            status__in=['active', 'completed', 'archived']
        )
        
        if conflicting_cases.exists():
            raise ValueError("Существуют активные дела с номерами больше нового значения")
        
        # Сохраняем запись о корректировке
        adjustment = NumberAdjustment.objects.create(
            index=index,
            old_number=old_number,
            new_number=new_current_number,
            reason=reason,
            adjusted_by=adjusted_by
        )
        
        # Обновляем счетчик
        counter.current_number = new_current_number
        counter.save()
        
        logger.info(f"Нумерация для индекса {index_code} скорректирована: {old_number} -> {new_current_number}")
        return adjustment
    
    def _rollback_numbering_if_needed(self, index, case_number, reason):
        """
        Автоматический откат нумерации при удалении последнего дела
        """
        try:
            counter = RegistryCounter.objects.get(index=index)
        except RegistryCounter.DoesNotExist:
            return
        
        # Если удаляемое дело имеет максимальный номер, откатываем счетчик
        if case_number == counter.current_number:
            new_number = case_number - 1 if case_number > 1 else 0
            
            # Сохраняем запись о корректировке
            NumberAdjustment.objects.create(
                index=index,
                old_number=counter.current_number,
                new_number=new_number,
                reason=f"Автоматический откат: {reason}",
                adjusted_by="system"
            )
            
            counter.current_number = new_number
            counter.save()
            
            logger.info(f"Автоматический откат нумерации для индекса {index.index}: {case_number} -> {new_number}")
    
    def get_next_number(self, index_code):
        """
        Получение следующего номера для указанного индекса
        """
        from .models import RegistryIndex
        
        try:
            index = RegistryIndex.objects.get(index=index_code)
            counter, created = RegistryCounter.objects.get_or_create(
                index=index,
                defaults={'current_number': 0}
            )
            
            # ВАЖНО: Возвращаем следующий номер (текущий + 1)
            return counter.current_number + 1
            
        except RegistryIndex.DoesNotExist:
            return 1
    
    def get_case_by_full_number(self, full_number):
        """
        Получение дела по полному номеру
        """
        try:
            return RegisteredCase.objects.get(full_number=full_number, status__in=['active', 'completed', 'archived'])
        except RegisteredCase.DoesNotExist:
            return None


# Глобальный экземпляр менеджера
case_registry = CaseRegistryManager()