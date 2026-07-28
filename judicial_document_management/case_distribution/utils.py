# case_distribution/utils.py
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


def get_available_judges_for_period(start_date, end_date, exclude_judge_ids=None):
    """
    Получить список судей, доступных в указанный период.
    """
    from users.models import User
    from .models import JudgeExclusion
    
    judges = User.objects.filter(role='judge', is_active=True)
    
    if exclude_judge_ids:
        judges = judges.exclude(id__in=exclude_judge_ids)
    
    # Исключаем судей с активными исключениями
    excluded = JudgeExclusion.objects.filter(
        block_distribution=True
    ).filter(
        Q(is_permanent=True) |
        Q(start_date__lte=end_date, end_date__gte=start_date)
    ).values_list('judge_id', flat=True)
    
    judges = judges.exclude(id__in=excluded)
    
    return judges


def calculate_judge_load_balance(judge_ids, target_date=None):
    """
    Рассчитать баланс нагрузки для судей.
    """
    from .models import JudgeLoad
    
    if target_date is None:
        target_date = timezone.now().date()
    
    loads = JudgeLoad.objects.filter(
        judge_id__in=judge_ids,
        year=target_date.year,
        month=target_date.month
    )
    
    result = {}
    for load in loads:
        result[load.judge_id] = {
            'total_cases': load.total_cases,
            'total_complexity': float(load.total_complexity),
            'pending_cases': load.pending_cases,
        }
    
    # Для судей без нагрузки
    for judge_id in judge_ids:
        if judge_id not in result:
            result[judge_id] = {
                'total_cases': 0,
                'total_complexity': 0,
                'pending_cases': 0,
            }
    
    return result


def get_case_complexity_factors(case):
    """
    Получить факторы, влияющие на сложность дела.
    """
    factors = []
    
    # Проверяем наличие томов
    if hasattr(case, 'volume_count') and case.volume_count:
        if case.volume_count > 10:
            factors.append(('volume', min(case.volume_count / 10, 5)))
    
    # Проверяем количество участников
    if hasattr(case, 'number_of_persons') and case.number_of_persons:
        if case.number_of_persons > 3:
            factors.append(('persons', min(case.number_of_persons / 3, 3))
    
    # Проверяем наличие присяжных
    if hasattr(case, 'composition_court'):
        if case.composition_court == '3':  # с участием присяжных
            factors.append(('jury', 2.0))
    
    # Проверяем наличие экспертизы
    if hasattr(case, 'expertise_type') and case.expertise_type:
        factors.append(('expertise', 1.5))
    
    return factors
