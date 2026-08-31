# judge_assistant/gp_knowledge.py
"""
База знаний Гражданско-процессуального кодекса РФ для помощника судьи.
Содержит этапы рассмотрения дела, сроки, условия переходов и ссылки на статьи.
"""

from datetime import timedelta
from enum import Enum


class GPPage(Enum):
    """Этапы гражданского судопроизводства в суде первой инстанции"""
    # Этап 1: Поступление дела в суд
    CASE_RECEIVED = 'case_received'
    
    # Этап 2: Решение по поступившему делу
    JUDGE_DECISION = 'judge_decision'
    
    # Этап 3: Подготовка дела к судебному разбирательству (Глава 14, ст. 147-153)
    PREPARATION = 'preparation'
    
    # Этап 4: Предварительное судебное заседание (ст. 152)
    PRELIMINARY_HEARING = 'preliminary_hearing'
    
    # Этап 5: Судебное разбирательство (Глава 15, ст. 154-193)
    TRIAL = 'trial'
    
    # Этап 6: Постановление решения (Глава 16, ст. 194-214)
    VERDICT = 'verdict'
    
    # Этап 7: Дополнительное решение (ст. 201)
    ADDITIONAL_DECISION = 'additional_decision'
    
    # Этап 8: Разъяснение решения (ст. 202)
    CLARIFICATION = 'clarification'
    
    # Этап 9: Прекращение производства (ст. 220)
    TERMINATION = 'termination'
    
    # Этап 10: Оставление без рассмотрения (ст. 222)
    DISMISSAL = 'dismissal'
    
    # Этап 11: Апелляция (Глава 39, ст. 320-335)
    APPEAL = 'appeal'
    
    # Этап 12: Кассация (Глава 41, ст. 376-391)
    CASSATION = 'cassation'
    
    # Этап 13: Исполнение решения (Глава 43, ст. 428-446)
    EXECUTION = 'execution'
    
    # Этап 14: Архив
    ARCHIVE = 'archive'


# Сроки по ГПК РФ (в днях)
DEADLINES = {
    # Сроки для судьи
    'decision_on_case': 5,  # 5 суток на решение по поступившему делу (ст. 133 ГПК)
    
    # Сроки подготовки (ст. 147 ГПК)
    'preparation': 15,  # 15 суток на подготовку
    
    # Сроки судебного разбирательства (ст. 154 ГПК)
    'trial_start': 60,  # 60 дней общий срок
    
    # Сроки апелляции (ст. 321 ГПК)
    'appeal': 30,  # 30 дней на подачу апелляции
    
    # Сроки кассации (ст. 377 ГПК)
    'cassation': 30,  # 30 дней на подачу кассации
    
    # Обращение к исполнению (ст. 428 ГПК)
    'execution': 10,  # 10 дней после вступления в силу
}

# Информация об этапах
STAGE_INFO = {
    GPPage.CASE_RECEIVED: {
        'name': 'Поступление дела в суд',
        'chapters': ['Глава 12', 'ст. 133-136 ГПК РФ'],
        'description': 'Дело поступило в суд, судья должен принять одно из решений по ст. 133 ГПК РФ',
        'required_actions': [
            {'action': 'Принять решение по поступившему делу (ст. 133 ГПК)', 'deadline': DEADLINES['decision_on_case']},
            {'action': 'Проверить подсудность дела (ст. 23-27 ГПК)', 'deadline': None},
            {'action': 'Проверить наличие оснований для возврата или оставления без движения', 'deadline': None},
        ],
    },
    GPPage.JUDGE_DECISION: {
        'name': 'Решение судьи по делу',
        'chapters': ['Глава 12', 'ст. 133-136 ГПК РФ'],
        'description': 'Судья вынес решение: о принятии, о возврате, об оставлении без движения или о передаче по подсудности',
        'required_actions': [],
    },
    GPPage.PREPARATION: {
        'name': 'Подготовка дела к судебному разбирательству',
        'chapters': ['Глава 14', 'ст. 147-153 ГПК РФ'],
        'description': 'Судья проводит подготовку дела к судебному разбирательству',
        'required_actions': [
            {'action': 'Назначить подготовку дела (ст. 147 ГПК)', 'deadline': DEADLINES['preparation']},
            {'action': 'Провести собеседование со сторонами (ст. 150 ГПК)', 'deadline': None},
            {'action': 'Направить судебные поручения (ст. 62 ГПК)', 'deadline': None},
        ],
    },
    GPPage.PRELIMINARY_HEARING: {
        'name': 'Предварительное судебное заседание',
        'chapters': ['Глава 14', 'ст. 152 ГПК РФ'],
        'description': 'Проводится для решения вопроса о подсудности, примирения сторон, истребования доказательств',
        'required_actions': [
            {'action': 'Назначить предварительное судебное заседание', 'deadline': None},
            {'action': 'Разрешить ходатайства сторон', 'deadline': None},
            {'action': 'Определить обстоятельства, имеющие значение для дела', 'deadline': None},
        ],
    },
    GPPage.TRIAL: {
        'name': 'Судебное разбирательство',
        'chapters': ['Глава 15', 'ст. 154-193 ГПК РФ'],
        'description': 'Рассмотрение дела по существу',
        'required_actions': [
            {'action': 'Открыть судебное заседание (ст. 157 ГПК)', 'deadline': None},
            {'action': 'Заслушать объяснения сторон (ст. 174 ГПК)', 'deadline': None},
            {'action': 'Исследовать доказательства (ст. 175-189 ГПК)', 'deadline': None},
            {'action': 'Заслушать судебные прения (ст. 190 ГПК)', 'deadline': None},
            {'action': 'Вынести решение (ст. 194 ГПК)', 'deadline': None},
        ],
    },
    GPPage.VERDICT: {
        'name': 'Постановление решения',
        'chapters': ['Глава 16', 'ст. 194-214 ГПК РФ'],
        'description': 'Судья постановляет решение в совещательной комнате',
        'required_actions': [
            {'action': 'Составить решение в письменной форме (ст. 198 ГПК)', 'deadline': None},
            {'action': 'Объявить решение (ст. 193 ГПК)', 'deadline': None},
            {'action': 'Разъяснить порядок и срок обжалования (ст. 209 ГПК)', 'deadline': None},
        ],
    },
    GPPage.TERMINATION: {
        'name': 'Прекращение производства по делу',
        'chapters': ['Глава 18', 'ст. 220 ГПК РФ'],
        'description': 'Производство по делу прекращено по основаниям ст. 220 ГПК РФ',
        'required_actions': [
            {'action': 'Вынести определение о прекращении производства', 'deadline': None},
            {'action': 'Разъяснить последствия прекращения', 'deadline': None},
        ],
    },
    GPPage.DISMISSAL: {
        'name': 'Оставление заявления без рассмотрения',
        'chapters': ['Глава 18', 'ст. 222 ГПК РФ'],
        'description': 'Заявление оставлено без рассмотрения по основаниям ст. 222 ГПК РФ',
        'required_actions': [
            {'action': 'Вынести определение об оставлении без рассмотрения', 'deadline': None},
            {'action': 'Разъяснить право на повторное обращение', 'deadline': None},
        ],
    },
    GPPage.APPEAL: {
        'name': 'Апелляционное производство',
        'chapters': ['Глава 39', 'ст. 320-335 ГПК РФ'],
        'description': 'Обжалование решения в апелляционном порядке',
        'required_actions': [
            {'action': 'Направить дело в апелляционную инстанцию', 'deadline': DEADLINES['appeal']},
        ],
    },
    GPPage.CASSATION: {
        'name': 'Кассационное производство',
        'chapters': ['Глава 41', 'ст. 376-391 ГПК РФ'],
        'description': 'Обжалование в кассационном порядке',
        'required_actions': [
            {'action': 'Рассмотреть кассационную жалобу', 'deadline': DEADLINES['cassation']},
        ],
    },
    GPPage.EXECUTION: {
        'name': 'Исполнение решения',
        'chapters': ['Глава 43', 'ст. 428-446 ГПК РФ'],
        'description': 'Обращение решения к исполнению',
        'required_actions': [
            {'action': 'Выдать исполнительный лист (ст. 428 ГПК)', 'deadline': DEADLINES['execution']},
            {'action': 'Направить исполнительный лист для исполнения', 'deadline': None},
        ],
    },
    GPPage.ARCHIVE: {
        'name': 'Архив',
        'chapters': [],
        'description': 'Дело сдано в архив',
        'required_actions': [],
    },
}

# Связь между решениями судьи и этапами
JUDGE_DECISION_TO_STAGE = {
    'accepted': GPPage.PREPARATION,
    'returned': GPPage.CASE_RECEIVED,
    'left_without_movement': GPPage.CASE_RECEIVED,
    'transferred': GPPage.CASE_RECEIVED,
}


def get_current_stage(case):
    """
    Определяет текущий этап дела по ГПК на основе данных из модели CivilProceedings.
    """
    # 1. Архив
    if case.status == 'archived':
        return GPPage.ARCHIVE
    
    # 2. Если есть решение судьи
    if hasattr(case, 'judge_decision') and case.judge_decision:
        # ... логика определения этапа
        pass
    
    # 3. Если есть дата вынесения решения и оно вступило в силу
    if hasattr(case, 'civil_decisions') and case.civil_decisions.exists():
        decision = case.civil_decisions.first()
        if decision.decision_effective_date:
            if case.status == 'execution':
                return GPPage.EXECUTION
            return GPPage.VERDICT
    
    # 4. Если есть апелляция
    if hasattr(case, 'civil_decisions') and case.civil_decisions.exists():
        decision = case.civil_decisions.first()
        if decision.is_appealed:
            return GPPage.APPEAL
    
    # 5. Если назначено заседание
    if case.hearing_date:
        return GPPage.TRIAL
    
    # 6. Если есть предварительное заседание
    if case.preliminary_hearing_date:
        return GPPage.PRELIMINARY_HEARING
    
    # 7. Если есть подготовка
    if case.ruling_preparation:
        return GPPage.PREPARATION
    
    # 8. По умолчанию - дело поступило
    return GPPage.CASE_RECEIVED


def get_stage_deadline(stage, case):
    """
    Возвращает срок для данного этапа в зависимости от категории дела.
    """
    # Для упрощенного производства
    is_simplified = getattr(case, 'is_simplified_procedure', False)
    
    if stage == GPPage.TRIAL:
        if is_simplified:
            return DEADLINES.get('trial_start', 60)  # 60 дней
        return DEADLINES.get('trial_start', 60)
    
    if stage == GPPage.APPEAL:
        return DEADLINES.get('appeal', 30)
    
    if stage == GPPage.CASSATION:
        return DEADLINES.get('cassation', 30)
    
    if stage == GPPage.EXECUTION:
        return DEADLINES.get('execution', 10)
    
    return DEADLINES.get(stage.value, None)


# Рекомендации по Пленумам ВС РФ для каждого этапа
SUPREME_COURT_LINKS_BY_STAGE = {
    GPPage.TRIAL: [
        {'title': 'Постановление Пленума ВС РФ от 19.12.2003 № 23 "О судебном решении"', 'url': 'https://vsrf.ru/documents/own/8234/'},
        {'title': 'Постановление Пленума ВС РФ от 24.06.2008 № 11 "О подготовке гражданских дел к судебному разбирательству"', 'url': 'https://vsrf.ru/documents/own/8248/'},
    ],
    GPPage.PREPARATION: [
        {'title': 'Постановление Пленума ВС РФ от 24.06.2008 № 11 "О подготовке гражданских дел к судебному разбирательству"', 'url': 'https://vsrf.ru/documents/own/8248/'},
    ],
    GPPage.VERDICT: [
        {'title': 'Постановление Пленума ВС РФ от 19.12.2003 № 23 "О судебном решении"', 'url': 'https://vsrf.ru/documents/own/8234/'},
    ],
    GPPage.APPEAL: [
        {'title': 'Постановление Пленума ВС РФ от 19.06.2012 № 13 "О применении норм ГПК РФ при рассмотрении дел в суде апелляционной инстанции"', 'url': 'https://vsrf.ru/documents/own/8356/'},
    ],
    GPPage.CASSATION: [
        {'title': 'Постановление Пленума ВС РФ от 11.12.2012 № 29 "О применении норм ГПК РФ при рассмотрении дел в суде кассационной инстанции"', 'url': 'https://vsrf.ru/documents/own/8360/'},
    ],
}