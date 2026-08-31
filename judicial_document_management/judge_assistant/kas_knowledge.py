# judge_assistant/kas_knowledge.py
"""
База знаний Кодекса административного судопроизводства РФ для помощника судьи.
Содержит этапы рассмотрения дела, сроки, условия переходов и ссылки на статьи.
"""

from enum import Enum


class KASPage(Enum):
    """Этапы административного судопроизводства"""
    CASE_RECEIVED = 'case_received'
    PREPARATION = 'preparation'
    PRELIMINARY_HEARING = 'preliminary_hearing'
    TRIAL = 'trial'
    VERDICT = 'verdict'
    TERMINATION = 'termination'
    DISMISSAL = 'dismissal'
    APPEAL = 'appeal'
    CASSATION = 'cassation'
    EXECUTION = 'execution'
    ARCHIVE = 'archive'


DEADLINES = {
    'decision_on_case': 5,  # 5 суток (ст. 126 КАС)
    'preparation': 15,  # 15 суток
    'trial_start': 60,  # 60 дней
    'appeal': 30,  # 30 дней
    'cassation': 30,  # 30 дней
    'execution': 10,  # 10 дней
}

STAGE_INFO = {
    KASPage.CASE_RECEIVED: {
        'name': 'Поступление дела в суд',
        'chapters': ['Глава 10', 'ст. 125-129 КАС РФ'],
        'description': 'Дело поступило в суд, судья должен принять одно из решений по ст. 126 КАС РФ',
        'required_actions': [
            {'action': 'Принять решение по поступившему делу (ст. 126 КАС)', 'deadline': DEADLINES['decision_on_case']},
            {'action': 'Проверить подсудность дела (ст. 17-22 КАС)', 'deadline': None},
        ],
    },
    KASPage.PREPARATION: {
        'name': 'Подготовка дела к судебному разбирательству',
        'chapters': ['Глава 11', 'ст. 132-140 КАС РФ'],
        'description': 'Судья проводит подготовку дела к судебному разбирательству',
        'required_actions': [
            {'action': 'Назначить подготовку дела (ст. 132 КАС)', 'deadline': DEADLINES['preparation']},
            {'action': 'Истребовать доказательства', 'deadline': None},
        ],
    },
    KASPage.PRELIMINARY_HEARING: {
        'name': 'Предварительное судебное заседание',
        'chapters': ['Глава 11', 'ст. 138 КАС РФ'],
        'description': 'Проводится для решения вопросов, связанных с подготовкой дела',
        'required_actions': [
            {'action': 'Назначить предварительное заседание', 'deadline': None},
            {'action': 'Разрешить ходатайства сторон', 'deadline': None},
        ],
    },
    KASPage.TRIAL: {
        'name': 'Судебное разбирательство',
        'chapters': ['Главы 12-14', 'ст. 141-195 КАС РФ'],
        'description': 'Рассмотрение дела по существу',
        'required_actions': [
            {'action': 'Открыть судебное заседание (ст. 143 КАС)', 'deadline': None},
            {'action': 'Заслушать объяснения сторон', 'deadline': None},
            {'action': 'Исследовать доказательства', 'deadline': None},
            {'action': 'Заслушать прения', 'deadline': None},
            {'action': 'Вынести решение', 'deadline': None},
        ],
    },
    KASPage.VERDICT: {
        'name': 'Постановление решения',
        'chapters': ['Глава 15', 'ст. 175-195 КАС РФ'],
        'description': 'Судья постановляет решение',
        'required_actions': [
            {'action': 'Составить решение в письменной форме', 'deadline': None},
            {'action': 'Разъяснить порядок и срок обжалования', 'deadline': None},
        ],
    },
    KASPage.TERMINATION: {
        'name': 'Прекращение производства по делу',
        'chapters': ['Глава 16', 'ст. 194 КАС РФ'],
        'description': 'Производство по делу прекращено',
        'required_actions': [
            {'action': 'Вынести определение о прекращении', 'deadline': None},
        ],
    },
    KASPage.APPEAL: {
        'name': 'Апелляционное производство',
        'chapters': ['Глава 33', 'ст. 295-318 КАС РФ'],
        'description': 'Обжалование решения в апелляционном порядке',
        'required_actions': [
            {'action': 'Направить дело в апелляционную инстанцию', 'deadline': DEADLINES['appeal']},
        ],
    },
    KASPage.CASSATION: {
        'name': 'Кассационное производство',
        'chapters': ['Глава 35', 'ст. 318-331 КАС РФ'],
        'description': 'Обжалование в кассационном порядке',
        'required_actions': [
            {'action': 'Рассмотреть кассационную жалобу', 'deadline': DEADLINES['cassation']},
        ],
    },
    KASPage.EXECUTION: {
        'name': 'Исполнение решения',
        'chapters': ['Глава 37', 'ст. 353-363 КАС РФ'],
        'description': 'Обращение решения к исполнению',
        'required_actions': [
            {'action': 'Выдать исполнительный лист', 'deadline': DEADLINES['execution']},
        ],
    },
    KASPage.ARCHIVE: {
        'name': 'Архив',
        'chapters': [],
        'description': 'Дело сдано в архив',
        'required_actions': [],
    },
}


def get_current_stage(case):
    """Определяет текущий этап дела по КАС на основе данных из модели KasProceedings."""
    if case.status == 'archived':
        return KASPage.ARCHIVE
    
    if hasattr(case, 'kas_decisions') and case.kas_decisions.exists():
        decision = case.kas_decisions.first()
        if decision.decision_effective_date:
            if case.status == 'execution':
                return KASPage.EXECUTION
            return KASPage.VERDICT
    
    if hasattr(case, 'kas_decisions') and case.kas_decisions.exists():
        decision = case.kas_decisions.first()
        if decision.is_appealed:
            return KASPage.APPEAL
    
    if case.hearing_date:
        return KASPage.TRIAL
    
    if case.preliminary_hearing_date:
        return KASPage.PRELIMINARY_HEARING
    
    if case.ruling_preparation:
        return KASPage.PREPARATION
    
    return KASPage.CASE_RECEIVED


def get_stage_deadline(stage, case):
    """Возвращает срок для данного этапа по КАС."""
    is_simplified = getattr(case, 'is_simplified_procedure', False)
    
    if stage == KASPage.TRIAL:
        return DEADLINES.get('trial_start', 60)
    
    if stage == KASPage.APPEAL:
        return DEADLINES.get('appeal', 30)
    
    if stage == KASPage.CASSATION:
        return DEADLINES.get('cassation', 30)
    
    if stage == KASPage.EXECUTION:
        return DEADLINES.get('execution', 10)
    
    return DEADLINES.get(stage.value, None)


SUPREME_COURT_LINKS_BY_STAGE = {
    KASPage.TRIAL: [
        {'title': 'Постановление Пленума ВС РФ от 27.09.2016 № 36 "О некоторых вопросах применения судами КАС РФ"', 'url': 'https://vsrf.ru/documents/own/8468/'},
    ],
    KASPage.PREPARATION: [
        {'title': 'Постановление Пленума ВС РФ от 27.09.2016 № 36 "О некоторых вопросах применения судами КАС РФ"', 'url': 'https://vsrf.ru/documents/own/8468/'},
    ],
    KASPage.APPEAL: [
        {'title': 'Постановление Пленума ВС РФ от 27.09.2016 № 36 "О некоторых вопросах применения судами КАС РФ"', 'url': 'https://vsrf.ru/documents/own/8468/'},
    ],
}