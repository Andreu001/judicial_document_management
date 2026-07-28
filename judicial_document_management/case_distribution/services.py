# case_distribution/services.py
from django.db import models, transaction
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg
from decimal import Decimal
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Optional, Tuple, Any

from users.models import User
from .models import (
    DistributionSettings, JudgeSpecialization, DepartmentDistribution,
    JudgeLoad, CaseDistribution, DistributionLog, JudgeExclusion,
    SanctionJudge, ReassignmentLog, ComplexitySetting, DistributionRule
)

logger = logging.getLogger(__name__)


class DistributionService:
    """
    Сервис для распределения дел.
    """
    
    def __init__(self, user=None):
        self.user = user
        self.settings = self._get_settings()
        self.available_judges = []

    def _get_settings(self):
        """Получить настройки распределения"""
        try:
            settings = DistributionSettings.objects.first()
            if not settings:
                # Создаем настройки с явной обработкой ошибок блокировки
                try:
                    settings = DistributionSettings.objects.create(
                        auto_distribution_enabled=True,
                        balance_period_months=12,
                        default_complexity=1.0,
                        max_cases_per_judge_per_month=100,
                        base_load_percentage=100,
                        vacation_block_days_before=14,
                    )
                except Exception as e:
                    # Если не удалось создать, пробуем получить еще раз
                    settings = DistributionSettings.objects.first()
                    if not settings:
                        # Если все еще нет, создаем с помощью get_or_create
                        settings, created = DistributionSettings.objects.get_or_create(
                            id=1,
                            defaults={
                                'auto_distribution_enabled': True,
                                'balance_period_months': 12,
                                'default_complexity': 1.0,
                                'max_cases_per_judge_per_month': 100,
                                'base_load_percentage': 100,
                                'vacation_block_days_before': 14,
                            }
                        )
            return settings
        except Exception as e:
            logger.error(f"Ошибка получения настроек: {e}")
            # Возвращаем объект-заглушку с настройками по умолчанию
            return type('Settings', (), {
                'auto_distribution_enabled': True,
                'balance_period_months': 12,
                'default_complexity': 1.0,
                'max_cases_per_judge_per_month': 100,
                'base_load_percentage': 100,
                'vacation_block_days_before': 14,
                'criminal_complexity_multiplier': 1.0,
                'civil_complexity_multiplier': 1.0,
                'coap_complexity_multiplier': 1.0,
                'kas_complexity_multiplier': 1.0,
                'vacation_block_days_after': 0,
                'sick_block_days_after': 7,
                'use_department_specialization': True,
                'sanction_judges_enabled': True,
                'sanction_judges_balance_period': 6,
            })()
    
    def get_available_judges(self, date=None, case=None, exclude_judge=None):
        """
        Получить список доступных судей для распределения.
        
        Args:
            date: Дата для проверки (по умолчанию сегодня)
            case: Дело для определения специализации
            exclude_judge: Судья, которого нужно исключить
        
        Returns:
            Список доступных судей с информацией о нагрузке
        """
        if date is None:
            date = timezone.now().date()
        
        # Получаем всех активных судей
        judges = User.objects.filter(
            role='judge',
            is_active=True
        )
        
        if exclude_judge:
            judges = judges.exclude(id=exclude_judge.id)
        
        # Исключаем судей с активными исключениями
        active_exclusions = JudgeExclusion.objects.filter(
            judge__in=judges,
            block_distribution=True
        ).filter(
            Q(is_permanent=True) |
            Q(start_date__lte=date, end_date__gte=date)
        )
        
        excluded_judge_ids = active_exclusions.values_list('judge_id', flat=True)
        judges = judges.exclude(id__in=excluded_judge_ids)
        
        # Проверяем отпуска из personnel
        from personnel.models import AbsenceRecord
        vacation_judges = AbsenceRecord.objects.filter(
            user__in=judges,
            block_start_date__lte=date,
            block_end_date__gte=date
        ).values_list('user_id', flat=True)
        judges = judges.exclude(id__in=vacation_judges)
        
        # Проверяем блокировку за 2 недели до отпуска
        vacation_block_date = date + timedelta(days=self.settings.vacation_block_days_before)
        vacation_soon = AbsenceRecord.objects.filter(
            user__in=judges,
            block_start_date__lte=vacation_block_date,
            block_end_date__gte=date
        ).values_list('user_id', flat=True)
        judges = judges.exclude(id__in=vacation_soon)
        
        # Если есть дело, фильтруем по специализации
        if case:
            judges = self._filter_by_specialization(judges, case)
        
        # Получаем нагрузку для каждого судьи
        available = []
        for judge in judges:
            load_info = self._get_judge_load_info(judge, date)
            available.append({
                'judge': judge,
                'load_info': load_info
            })
        
        # Сортируем по нагрузке (от меньшей к большей)
        available.sort(key=lambda x: x['load_info']['total_complexity'])
        
        return available
    
    def _filter_by_specialization(self, judges, case):
        """Фильтровать судей по специализации дела"""
        case_type = self._determine_case_type(case)
        
        # Получаем специализации судей
        specializations = JudgeSpecialization.objects.filter(
            user__in=judges,
            is_active=True
        )
        
        # Определяем нужную специализацию
        type_mapping = {
            'criminal': ['criminal', 'mixed'],
            'civil': ['civil', 'mixed'],
            'coap': ['coap', 'mixed'],
            'kas': ['kas', 'mixed'],
        }
        
        required_specializations = type_mapping.get(case_type, [])
        
        # Если есть правило для конкретной категории
        rule = DistributionRule.objects.filter(
            category=case_type,
            is_active=True
        ).order_by('priority').first()
        
        if rule:
            rule_judges = rule.target_judges.all()
            if rule_judges.exists():
                return judges.filter(id__in=rule_judges)
        
        # Ищем судей с нужной специализацией
        specialized_judges = specializations.filter(
            specialization__in=required_specializations
        ).values_list('user_id', flat=True)
        
        if specialized_judges.exists():
            return judges.filter(id__in=specialized_judges)
        
        return judges
    
    def _determine_case_type(self, case):
        """Определить тип дела"""
        from django.contrib.contenttypes.models import ContentType
        
        ct = ContentType.objects.get_for_model(case)
        app_label = ct.app_label
        model_name = ct.model.lower()
        
        if 'criminal' in app_label or 'criminal' in model_name:
            return 'criminal'
        elif 'civil' in app_label or 'civil' in model_name:
            return 'civil'
        elif 'administrative_code' in app_label:
            return 'coap'
        elif 'administrative_proceedings' in app_label:
            return 'kas'
        return 'other'
    
    def _get_judge_load_info(self, judge, date):
        """Получить информацию о нагрузке судьи"""
        # Определяем период балансировки
        start_month = date.month - self.settings.balance_period_months
        start_year = date.year
        
        if start_month <= 0:
            start_month += 12
            start_year -= 1
        
        # Получаем нагрузку за период
        loads = JudgeLoad.objects.filter(
            judge=judge,
            year__gte=start_year,
            year__lte=date.year,
            month__gte=start_month if start_year == date.year else 1,
            month__lte=date.month if start_year == date.year else 12
        )
        
        total_complexity = loads.aggregate(Sum('total_complexity'))['total_complexity__sum'] or Decimal(0)
        total_cases = loads.aggregate(Sum('total_cases'))['total_cases__sum'] or 0
        
        # Текущая нагрузка за месяц
        current_month_load = JudgeLoad.objects.filter(
            judge=judge,
            year=date.year,
            month=date.month
        ).first()
        
        current_complexity = current_month_load.total_complexity if current_month_load else Decimal(0)
        current_cases = current_month_load.total_cases if current_month_load else 0
        
        # Получаем специализацию судьи
        specialization = JudgeSpecialization.objects.filter(
            user=judge,
            is_active=True
        ).order_by('priority').first()
        
        load_percentage = specialization.load_percentage if specialization else 100
        max_cases = self.settings.max_cases_per_judge_per_month
        
        if specialization and specialization.max_cases_per_month:
            max_cases = specialization.max_cases_per_month
        
        effective_max = int(max_cases * load_percentage / 100)
        
        return {
            'total_complexity': total_complexity,
            'total_cases': total_cases,
            'current_complexity': current_complexity,
            'current_cases': current_cases,
            'load_percentage': load_percentage,
            'max_cases': max_cases,
            'effective_max_cases': effective_max,
            'load_ratio': (total_complexity / max(1, total_cases)) if total_cases > 0 else Decimal(1),
        }
    
    def calculate_case_complexity(self, case):
        """
        Рассчитать сложность дела.
        
        Args:
            case: Экземпляр дела
        
        Returns:
            Decimal: Значение сложности
        """
        from django.contrib.contenttypes.models import ContentType
        
        case_type = self._determine_case_type(case)
        
        # Проверяем, есть ли уже установленная сложность
        distribution = CaseDistribution.objects.filter(
            case_content_type=ContentType.objects.get_for_model(case),
            case_object_id=case.id
        ).first()
        
        if distribution and distribution.complexity > 0:
            return distribution.complexity
        
        # Базовая сложность
        base_complexity = self.settings.default_complexity
        
        # Применяем множители по категории
        multipliers = {
            'criminal': self.settings.criminal_complexity_multiplier,
            'civil': self.settings.civil_complexity_multiplier,
            'coap': self.settings.coap_complexity_multiplier,
            'kas': self.settings.kas_complexity_multiplier,
        }
        
        complexity = base_complexity * multipliers.get(case_type, Decimal(1))
        
        # Применяем настройки сложности
        settings = ComplexitySetting.objects.filter(
            category=case_type,
            is_active=True
        ).order_by('priority')
        
        for setting in settings:
            if self._check_condition(case, setting.condition):
                complexity = setting.complexity_value
                break
        
        return max(Decimal('0.5'), complexity)
    
    def _check_condition(self, case, condition):
        """
        Проверить, соответствует ли дело условию.
        
        Args:
            case: Дело
            condition: Словарь с условиями
        
        Returns:
            bool: Соответствует ли условию
        """
        if not condition:
            return False
        
        for key, value in condition.items():
            # Проверяем наличие атрибута
            if not hasattr(case, key):
                return False
            
            attr_value = getattr(case, key)
            
            # Простые условия
            if isinstance(value, dict):
                # Сложные условия (gte, lte, contains и т.д.)
                for op, val in value.items():
                    if op == 'gte':
                        if not (attr_value >= val):
                            return False
                    elif op == 'lte':
                        if not (attr_value <= val):
                            return False
                    elif op == 'eq':
                        if not (attr_value == val):
                            return False
                    elif op == 'contains':
                        if not (val in attr_value):
                            return False
                    elif op == 'in':
                        if not (attr_value in val):
                            return False
            else:
                # Простое сравнение
                if attr_value != value:
                    return False
        
        return True
    
    @transaction.atomic
    def distribute_cases(self, cases, log=None):
        """
        Распределить дела.
        
        Args:
            cases: Список дел для распределения
            log: Журнал распределения
        
        Returns:
            dict: Результат распределения
        """
        if not self.settings.auto_distribution_enabled:
            return {'error': 'Автоматическое распределение отключено'}
        
        if not log:
            log = self._create_log()
        
        results = {
            'total': len(cases),
            'distributed': 0,
            'failed': 0,
            'reassigned': 0,
            'details': []
        }
        
        for case in cases:
            try:
                result = self._distribute_single_case(case, log)
                
                if result['success']:
                    results['distributed'] += 1
                    results['details'].append(result)
                else:
                    results['failed'] += 1
                    results['details'].append(result)
            except Exception as e:
                logger.error(f"Ошибка распределения дела {case}: {e}")
                results['failed'] += 1
                results['details'].append({
                    'case': str(case),
                    'success': False,
                    'error': str(e)
                })
        
        # Обновляем журнал
        self._update_log(log, results)
        
        return results
    
    @transaction.atomic
    def _distribute_single_case(self, case, log):
        """
        Распределить одно дело с заполнением presiding_judge.
        """
        from django.contrib.contenttypes.models import ContentType
        
        ct = ContentType.objects.get_for_model(case)
        
        distribution = CaseDistribution.objects.filter(
            case_content_type=ct,
            case_object_id=case.id
        ).first()
        
        if distribution and distribution.assigned_judge:
            return {
                'case': str(case),
                'success': False,
                'error': 'Дело уже распределено',
                'judge': distribution.assigned_judge.get_full_name() if distribution.assigned_judge else None
            }
        
        complexity = self.calculate_case_complexity(case)
        available_judges = self.get_available_judges(case=case)
        
        if not available_judges:
            return {
                'case': str(case),
                'success': False,
                'error': 'Нет доступных судей'
            }
        
        best_judge = available_judges[0]
        selected_judge = best_judge['judge']
        
        # ===== КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ =====
        # Заполняем поле presiding_judge в самом деле
        self._set_presiding_judge(case, selected_judge)
        
        if not distribution:
            distribution = CaseDistribution(
                case_content_type=ct,
                case_object_id=case.id,
                case_number=self._get_case_number(case),
                case_category=self._determine_case_type(case),
                complexity=complexity,
            )
        
        distribution.assign_judge(
            judge=selected_judge,
            user=self.user or selected_judge,
            source='auto',
            log_entry=log
        )
        
        self._update_judge_load(selected_judge, case, complexity, log)
        
        return {
            'case': str(case),
            'success': True,
            'judge': selected_judge.get_full_name(),
            'judge_id': selected_judge.id,
            'complexity': float(complexity)
        }
    
    def _set_presiding_judge(self, case, judge):
        """
        Установить presiding_judge в дело.
        """
        try:
            # Определяем тип дела и соответствующее поле
            case_type = self._determine_case_type(case)
            
            # Маппинг полей presiding_judge по типам дел
            field_map = {
                'criminal': 'presiding_judge',
                'civil': 'presiding_judge',
                'coap': 'presiding_judge',
                'kas': 'presiding_judge',
            }
            
            field_name = field_map.get(case_type, 'presiding_judge')
            
            if hasattr(case, field_name):
                setattr(case, field_name, judge)
                case.save(update_fields=[field_name])
                logger.info(f"Установлен presiding_judge={judge} для дела {case}")
            else:
                logger.warning(f"Поле {field_name} не найдено в модели {case.__class__.__name__}")
                
        except Exception as e:
            logger.error(f"Ошибка установки presiding_judge: {e}")
    
    def _get_case_number(self, case):
        """Получить номер дела"""
        if hasattr(case, 'case_number_criminal'):
            return case.case_number_criminal
        elif hasattr(case, 'case_number_civil'):
            return case.case_number_civil
        elif hasattr(case, 'case_number_admin'):
            return case.case_number_admin
        elif hasattr(case, 'case_number_kas'):
            return case.case_number_kas
        elif hasattr(case, 'registration_number'):
            return case.registration_number
        return str(case.id)
    
    def _update_judge_load(self, judge, case, complexity, log):
        """Обновить нагрузку судьи"""
        now = timezone.now()
        load = JudgeLoad.get_or_create_for_period(judge, now.year, now.month)
        load.add_case(case, complexity)
    
    def _create_log(self):
        """Создать журнал распределения"""
        return DistributionLog.objects.create(
            executed_by=self.user,
            distribution_type='auto'
        )
    
    def _update_log(self, log, results):
        """Обновить журнал распределения"""
        log.total_cases = results['total']
        log.distributed_cases = results['distributed']
        log.failed_cases = results['failed']
        log.reassigned_cases = results.get('reassigned', 0)
        
        # Собираем информацию о судьях
        judges_info = {}
        for detail in results.get('details', []):
            if detail.get('success') and detail.get('judge'):
                judge_name = detail['judge']
                if judge_name not in judges_info:
                    judges_info[judge_name] = 0
                judges_info[judge_name] += 1
        
        log.judges_info = judges_info
        log.mark_completed()
    
    @transaction.atomic
    def reassign_case(self, case_distribution, new_judge, reason, reason_type='other'):
        """
        Перераспределить дело.
        
        Args:
            case_distribution: Объект CaseDistribution
            new_judge: Новый судья
            reason: Причина перераспределения
            reason_type: Тип причины
        
        Returns:
            dict: Результат перераспределения
        """
        if case_distribution.status == 'pending':
            return {'error': 'Дело еще не распределено'}
        
        old_judge = case_distribution.assigned_judge
        
        if old_judge == new_judge:
            return {'error': 'Новый судья совпадает с текущим'}
        
        # Проверяем доступность нового судьи
        available = self.get_available_judges(
            exclude_judge=old_judge,
            case=case_distribution.case
        )
        
        available_judge_ids = [j['judge'].id for j in available]
        if new_judge.id not in available_judge_ids:
            return {'error': 'Судья недоступен для перераспределения'}
        
        # Выполняем перераспределение
        case_distribution.assign_judge(
            judge=new_judge,
            user=self.user or new_judge,
            source='reassignment'
        )
        case_distribution.reassign_reason = reason
        case_distribution.save()
        
        # Создаем запись в журнале перераспределений
        ReassignmentLog.objects.create(
            case_distribution=case_distribution,
            from_judge=old_judge,
            to_judge=new_judge,
            reason=reason,
            reason_type=reason_type,
            performed_by=self.user
        )
        
        return {
            'success': True,
            'case_number': case_distribution.case_number,
            'from_judge': old_judge.get_full_name() if old_judge else None,
            'to_judge': new_judge.get_full_name(),
            'reason': reason
        }
    
    def distribute_sanction(self, case, sanction_type='arrest'):
        """
        Распределить санкционное дело.
        
        Args:
            case: Дело
            sanction_type: Тип санкции
        
        Returns:
            dict: Результат распределения
        """
        from django.contrib.contenttypes.models import ContentType
        
        # Получаем судей по санкциям
        sanction_judges = SanctionJudge.objects.filter(
            sanction_type=sanction_type,
            is_active=True
        ).select_related('judge')
        
        if not sanction_judges.exists():
            return {'error': f'Нет судей для санкций типа {sanction_type}'}
        
        # Проверяем исключения
        available = []
        for sj in sanction_judges:
            judge = sj.judge
            
            # Проверяем исключения
            is_excluded = JudgeExclusion.objects.filter(
                judge=judge,
                block_distribution=True
            ).filter(
                Q(is_permanent=True) |
                Q(start_date__lte=timezone.now().date(), end_date__gte=timezone.now().date())
            ).exists()
            
            if not is_excluded:
                # Проверяем нагрузку за неделю
                week_ago = timezone.now() - timedelta(days=7)
                weekly_count = CaseDistribution.objects.filter(
                    assigned_judge=judge,
                    is_sanction=True,
                    distributed_at__gte=week_ago
                ).count()
                
                if weekly_count < sj.max_cases_per_week:
                    available.append((judge, weekly_count, sj.priority))
        
        if not available:
            return {'error': 'Нет доступных судей для санкций'}
        
        # Сортируем по нагрузке (меньше) и приоритету (выше)
        available.sort(key=lambda x: (x[1], x[2]))
        selected_judge = available[0][0]
        
        # Создаем распределение
        ct = ContentType.objects.get_for_model(case)
        
        distribution, created = CaseDistribution.objects.get_or_create(
            case_content_type=ct,
            case_object_id=case.id,
            defaults={
                'case_number': self._get_case_number(case),
                'case_category': self._determine_case_type(case),
                'is_sanction': True,
                'complexity': self.settings.default_complexity,
            }
        )
        
        distribution.assign_judge(
            judge=selected_judge,
            user=self.user or selected_judge,
            source='sanction'
        )
        
        return {
            'success': True,
            'judge': selected_judge.get_full_name(),
            'judge_id': selected_judge.id
        }
    
    def get_statistics(self, year=None, month=None):
        """
        Получить статистику по распределению.
        
        Args:
            year: Год
            month: Месяц
        
        Returns:
            dict: Статистика
        """
        if year is None:
            year = timezone.now().year
        
        if month is None:
            month = timezone.now().month
        
        # Общая статистика
        total_cases = CaseDistribution.objects.filter(
            distributed_at__year=year,
            distributed_at__month=month
        )
        
        stats = {
            'total': total_cases.count(),
            'auto': total_cases.filter(source='auto').count(),
            'manual': total_cases.filter(source='manual').count(),
            'reassigned': total_cases.filter(source='reassignment').count(),
            'sanction': total_cases.filter(source='sanction').count(),
            'pending': CaseDistribution.objects.filter(
                status='pending'
            ).count(),
        }
        
        # Статистика по судьям
        judges_stats = []
        for judge in User.objects.filter(role='judge', is_active=True):
            judge_cases = total_cases.filter(assigned_judge=judge)
            judge_load = JudgeLoad.objects.filter(
                judge=judge,
                year=year,
                month=month
            ).first()
            
            judges_stats.append({
                'judge': judge.get_full_name(),
                'judge_id': judge.id,
                'total_cases': judge_cases.count(),
                'pending_cases': judge_cases.filter(status='distributed').count(),
                'completed_cases': judge_load.completed_cases if judge_load else 0,
                'total_complexity': float(judge_load.total_complexity) if judge_load else 0,
            })
        
        stats['judges'] = sorted(judges_stats, key=lambda x: x['total_cases'], reverse=True)
        
        return stats
