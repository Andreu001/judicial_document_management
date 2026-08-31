# judge_assistant/koap_knowledge.py
"""
База знаний Кодекса РФ об административных правонарушениях для помощника судьи.
Содержит этапы рассмотрения дела, сроки, условия переходов и ссылки на статьи.
"""

from enum import Enum


class KOAPPage(Enum):
    """Этапы производства по делам об административных правонарушениях"""
    CASE_RECEIVED = 'case_received'
    PREPARATION = 'preparation'
    TRIAL = 'trial'
    DECISION = 'decision'
    TERMINATION = 'termination'
    APPEAL = 'appeal'
    CASSATION = 'cassation'
    EXECUTION = 'execution'
    ARCHIVE = 'archive'


DEADLINES = {
    'preparation': 15,  # 15 суток на подготовку
    'trial': 15,  # 15 суток на рассмотрение
    'appeal': 10,  # 10 дней на подачу жалобы
    'cassation': 10,  # 10 дней на подачу кассации
    'execution': 30,  # 30 дней на исполнение
}

STAGE_INFO = {
    KOAPPage.CASE_RECEIVED: {
        'name': 'Поступление дела в суд',
        'chapters': ['Глава 25', 'ст. 29.1-29.2 КоАП РФ'],
        'description': 'Дело поступило в суд, судья должен подготовиться к рассмотрению',
        'required_actions': [
            {'action': 'Подготовиться к рассмотрению дела (ст. 29.1 КоАП)', 'deadline': DEADLINES['preparation']},
            {'action': 'Проверить правильность составления протокола', 'deadline': None},
            {'action': 'Проверить подсудность дела (ст. 23.1 КоАП)', 'deadline': None},
        ],
    },
    KOAPPage.PREPARATION: {
        'name': 'Подготовка к рассмотрению дела',
        'chapters': ['Глава 25', 'ст. 29.1-29.2 КоАП РФ'],
        'description': 'Судья подготавливается к рассмотрению дела',
        'required_actions': [
            {'action': 'Вызвать лиц, участвующих в деле', 'deadline': None},
            {'action': 'Истребовать необходимые доказательства', 'deadline': None},
            {'action': 'Назначить дату рассмотрения', 'deadline': DEADLINES['trial']},
        ],
    },
    KOAPPage.TRIAL: {
        'name': 'Рассмотрение дела',
        'chapters': ['Глава 25', 'ст. 29.7-29.11 КоАП РФ'],
        'description': 'Рассмотрение дела об административном правонарушении',
        'required_actions': [
            {'action': 'Открыть заседание (ст. 29.7 КоАП)', 'deadline': None},
            {'action': 'Заслушать лицо, привлекаемое к ответственности', 'deadline': None},
            {'action': 'Исследовать доказательства', 'deadline': None},
            {'action': 'Вынести постановление (ст. 29.10 КоАП)', 'deadline': None},
        ],
    },
    KOAPPage.DECISION: {
        'name': 'Вынесение постановления',
        'chapters': ['Глава 25', 'ст. 29.10-29.12 КоАП РФ'],
        'description': 'Постановление по делу об административном правонарушении',
        'required_actions': [
            {'action': 'Объявить постановление (ст. 29.10 КоАП)', 'deadline': None},
            {'action': 'Разъяснить порядок и срок обжалования', 'deadline': None},
        ],
    },
    KOAPPage.TERMINATION: {
        'name': 'Прекращение производства по делу',
        'chapters': ['Глава 25', 'ст. 29.9 КоАП РФ'],
        'description': 'Производство по делу прекращено по основаниям ст. 24.5 КоАП РФ',
        'required_actions': [
            {'action': 'Вынести постановление о прекращении', 'deadline': None},
        ],
    },
    KOAPPage.APPEAL: {
        'name': 'Апелляционное обжалование',
        'chapters': ['Глава 30', 'ст. 30.1-30.9 КоАП РФ'],
        'description': 'Обжалование постановления в апелляционном порядке',
        'required_actions': [
            {'action': 'Направить жалобу в апелляционную инстанцию', 'deadline': DEADLINES['appeal']},
        ],
    },
    KOAPPage.EXECUTION: {
        'name': 'Исполнение постановления',
        'chapters': ['Глава 31', 'ст. 31.1-31.10 КоАП РФ'],
        'description': 'Обращение постановления к исполнению',
        'required_actions': [
            {'action': 'Направить постановление для исполнения (ст. 31.1 КоАП)', 'deadline': DEADLINES['execution']},
        ],
    },
    KOAPPage.ARCHIVE: {
        'name': 'Архив',
        'chapters': [],
        'description': 'Дело сдано в архив',
        'required_actions': [],
    },
}


def get_current_stage(case):
    """Определяет текущий этап дела по КоАП на основе данных из модели AdministrativeProceedings."""
    if case.status == 'archived':
        return KOAPPage.ARCHIVE
    
    if hasattr(case, 'admin_decisions') and case.admin_decisions.exists():
        decision = case.admin_decisions.first()
        if decision.decision_effective_date:
            if case.status == 'execution':
                return KOAPPage.EXECUTION
            return KOAPPage.DECISION
    
    if hasattr(case, 'admin_decisions') and case.admin_decisions.exists():
        decision = case.admin_decisions.first()
        if hasattr(case, 'appeal') and case.appeal and case.appeal.complaint_filed:
            return KOAPPage.APPEAL
    
    if case.hearing_date:
        return KOAPPage.TRIAL
    
    return KOAPPage.CASE_RECEIVED


def get_stage_deadline(stage, case):
    """Возвращает срок для данного этапа по КоАП."""
    if stage == KOAPPage.TRIAL:
        return DEADLINES.get('trial', 15)
    
    if stage == KOAPPage.APPEAL:
        return DEADLINES.get('appeal', 10)
    
    if stage == KOAPPage.CASSATION:
        return DEADLINES.get('cassation', 10)
    
    if stage == KOAPPage.EXECUTION:
        return DEADLINES.get('execution', 30)
    
    return DEADLINES.get(stage.value, None)


SUPREME_COURT_LINKS_BY_STAGE = {
    KOAPPage.TRIAL: [
        {'title': 'Постановление Пленума ВС РФ от 24.03.2005 № 5 "О некоторых вопросах, возникающих у судов при применении КоАП РФ"', 'url': 'https://vsrf.ru/documents/own/8230/'},
    ],
    KOAPPage.PREPARATION: [
        {'title': 'Постановление Пленума ВС РФ от 24.03.2005 № 5 "О некоторых вопросах, возникающих у судов при применении КоАП РФ"', 'url': 'https://vsrf.ru/documents/own/8230/'},
    ],
}