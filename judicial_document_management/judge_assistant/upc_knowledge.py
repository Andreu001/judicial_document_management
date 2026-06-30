# judge_assistant/upc_knowledge.py
"""
База знаний Уголовно-процессуального кодекса РФ для помощника судьи.
Содержит этапы рассмотрения дела, сроки, условия переходов и ссылки на статьи.
"""

from datetime import timedelta
from enum import Enum


class UPCPage(Enum):
    """Этапы уголовного судопроизводства в суде первой инстанции"""
    # Этап 1: Поступление дела в суд (Глава 33, ст. 227-228)
    CASE_RECEIVED = 'case_received'
    
    # Этап 2: Решение по поступившему делу (ст. 227 УПК)
    JUDGE_DECISION = 'judge_decision'
    
    # Этап 3: Предварительное слушание (Глава 34, ст. 229-236)
    PRELIMINARY_HEARING = 'preliminary_hearing'
    
    # Этап 4: Назначение судебного заседания (ст. 231 УПК)
    TRIAL_SCHEDULED = 'trial_scheduled'
    
    # Этап 5: Общий порядок судебного разбирательства (Главы 35-38)
    TRIAL_GENERAL = 'trial_general'
    
    # Этап 5а: Особый порядок при согласии с обвинением (Глава 40)
    TRIAL_SPECIAL_CHAPTER_40 = 'trial_special_chapter_40'
    
    # Этап 5б: Особый порядок при досудебном соглашении (Глава 40.1)
    TRIAL_SPECIAL_CHAPTER_401 = 'trial_special_chapter_401'
    
    # Этап 5в: Суд с участием присяжных (Глава 42)
    TRIAL_JURY = 'trial_jury'
    
    # Этап 6: Постановление приговора (Глава 39)
    VERDICT = 'verdict'
    
    # Этап 7: Прекращение дела (Глава 51.1)
    TERMINATION = 'termination'
    
    # Этап 8: Принудительные меры медицинского характера (Глава 51)
    MEDICAL_MEASURES = 'medical_measures'
    
    # Этап 9: Апелляция (Глава 45.1)
    APPEAL = 'appeal'
    
    # Этап 10: Кассация (Глава 47.1)
    CASSATION = 'cassation'
    
    # Этап 11: Исполнение приговора (Глава 46)
    EXECUTION = 'execution'
    
    # Этап 12: Архив
    ARCHIVE = 'archive'


# Сроки по Главе 17 УПК РФ (в днях)
DEADLINES = {
    # Сроки для судьи (ст. 227 УПК)
    'decision_on_case': 14,  # 14 суток на решение по поступившему делу
    
    # Сроки предварительного слушания (ст. 227, 233 УПК)
    'preliminary_hearing': 14,  # не позднее 14 суток со дня поступления дела
    
    # Сроки начала судебного разбирательства (ст. 233, 241.1 УПК)
    'trial_start_general': 14,  # не позднее 14 суток для общих дел
    'trial_start_special': 14,   # не позднее 14 суток для особого порядка
    'trial_start_custody': 30,   # до 30 суток для дел с содержанием под стражей
    
    # Сроки рассмотрения дела в апелляции (ст. 389.11 УПК)
    'appeal_start': 30,  # не позднее 30 суток со дня поступления апелляции
    
    # Сроки кассации (ст. 401.8 УПК)
    'cassation_start_first': 30,   # первая кассация - 30 суток
    'cassation_start_second': 60,  # вторая кассация - 60 суток
    
    # Обращение к исполнению (ст. 390, 393 УПК)
    'execution': 15,  # в течение 15 суток после вступления в силу
}

# Информация об этапах
STAGE_INFO = {
    UPCPage.CASE_RECEIVED: {
        'name': 'Поступление дела в суд',
        'chapters': ['Глава 33', 'ст. 227-228 УПК РФ'],
        'description': 'Дело поступило в суд, судья должен принять одно из решений по ст. 227 УПК РФ',
        'required_actions': [
            {'action': 'Принять решение по поступившему делу (ст. 227 УПК)', 'deadline': DEADLINES['decision_on_case']},
        ],
    },
    UPCPage.JUDGE_DECISION: {
        'name': 'Решение судьи по делу',
        'chapters': ['Глава 33', 'ст. 227 УПК РФ'],
        'description': 'Судья вынес решение: о направлении дела по подсудности, о назначении предварительного слушания или о назначении судебного заседания',
        'required_actions': [],
    },
    UPCPage.PRELIMINARY_HEARING: {
        'name': 'Предварительное слушание',
        'chapters': ['Глава 34', 'ст. 229-236 УПК РФ'],
        'description': 'Проводится при наличии оснований из ст. 229 УПК РФ (ходатайства об исключении доказательств, основания для возврата прокурору и др.)',
        'required_actions': [
            {'action': 'Назначить и провести предварительное слушание', 'deadline': DEADLINES['preliminary_hearing']},
            {'action': 'Принять меры по обеспечению прав участников (ст. 230 УПК)', 'deadline': None},
        ],
    },
    UPCPage.TRIAL_SCHEDULED: {
        'name': 'Назначение судебного заседания',
        'chapters': ['Глава 34', 'ст. 231 УПК РФ'],
        'description': 'Судья назначил судебное заседание',
        'required_actions': [
            {'action': 'Известить участников процесса о месте и времени заседания (ст. 231, 232 УПК)', 'deadline': None},
        ],
    },
    UPCPage.TRIAL_GENERAL: {
        'name': 'Судебное разбирательство (общий порядок)',
        'chapters': ['Главы 35-39 УПК РФ'],
        'description': 'Рассмотрение дела в общем порядке',
        'required_actions': [
            {'action': 'Провести подготовительную часть (ст. 261-272 УПК)', 'deadline': None},
            {'action': 'Исследовать доказательства (ст. 273-291 УПК)', 'deadline': None},
            {'action': 'Заслушать прения сторон (ст. 292 УПК)', 'deadline': None},
            {'action': 'Предоставить последнее слово подсудимому (ст. 293 УПК)', 'deadline': None},
        ],
        'special_rules': {
            'minor': 'Глава 50 УПК РФ - особенности по делам несовершеннолетних',
            'medical': 'Глава 51 УПК РФ - применение принудительных мер медицинского характера',
        }
    },
    UPCPage.TRIAL_SPECIAL_CHAPTER_40: {
        'name': 'Особый порядок судебного разбирательства (Глава 40 УПК)',
        'chapters': ['Глава 40 УПК РФ'],
        'description': 'При согласии обвиняемого с предъявленным обвинением',
        'required_actions': [
            {'action': 'Проверить соблюдение условий для особого порядка (ст. 314 УПК)', 'deadline': None},
            {'action': 'Разъяснить сторонам последствия особого порядка (ст. 315 УПК)', 'deadline': None},
            {'action': 'Постановить приговор без исследования доказательств (ст. 316 УПК)', 'deadline': None},
        ],
    },
    UPCPage.TRIAL_SPECIAL_CHAPTER_401: {
        'name': 'Особый порядок при досудебном соглашении (Глава 40.1 УПК)',
        'chapters': ['Глава 40.1 УПК РФ'],
        'description': 'При заключении досудебного соглашения о сотрудничестве',
        'required_actions': [
            {'action': 'Проверить соблюдение условий для особого порядка (ст. 317.1 УПК)', 'deadline': None},
            {'action': 'Постановить приговор с учетом условий соглашения (ст. 317.7 УПК)', 'deadline': None},
        ],
    },
    UPCPage.TRIAL_JURY: {
        'name': 'Суд с участием присяжных заседателей',
        'chapters': ['Глава 42 УПК РФ'],
        'description': 'Рассмотрение дела с участием присяжных заседателей',
        'required_actions': [
            {'action': 'Провести формирование коллегии присяжных (ст. 328 УПК)', 'deadline': None},
            {'action': 'Исследование доказательств с участием присяжных (ст. 335 УПК)', 'deadline': None},
            {'action': 'Постановка вопросов и напутственное слово (ст. 338-340 УПК)', 'deadline': None},
        ],
    },
    UPCPage.VERDICT: {
        'name': 'Постановление приговора',
        'chapters': ['Глава 39 УПК РФ'],
        'description': 'Судья постановляет приговор в совещательной комнате',
        'required_actions': [
            {'action': 'Совещание судей и постановление приговора (ст. 296-313 УПК)', 'deadline': None},
            {'action': 'Провозглашение приговора (ст. 310 УПК)', 'deadline': None},
            {'action': 'Разъяснение порядка и срока обжалования (ст. 310 УПК)', 'deadline': None},
        ],
    },
    UPCPage.TERMINATION: {
        'name': 'Прекращение уголовного дела',
        'chapters': ['Глава 51.1 УПК РФ'],
        'description': 'Прекращение дела на основании статей 24, 25, 25.1, 27, 28, 28.1 УПК РФ',
        'required_actions': [
            {'action': 'Вынести постановление о прекращении дела', 'deadline': None},
            {'action': 'Направить копии постановления участникам (ст. 213 УПК)', 'deadline': None},
        ],
    },
    UPCPage.MEDICAL_MEASURES: {
        'name': 'Принудительные меры медицинского характера',
        'chapters': ['Глава 51 УПК РФ'],
        'description': 'Применение принудительных мер медицинского характера',
        'required_actions': [
            {'action': 'Назначить судебно-психиатрическую экспертизу (ст. 435 УПК)', 'deadline': None},
            {'action': 'Провести судебное заседание (ст. 438-441 УПК)', 'deadline': None},
        ],
    },
    UPCPage.APPEAL: {
        'name': 'Апелляционное производство',
        'chapters': ['Глава 45.1 УПК РФ'],
        'description': 'Обжалование приговора в апелляционном порядке',
        'required_actions': [
            {'action': 'Направить дело в апелляционную инстанцию (ст. 389.10 УПК)', 'deadline': DEADLINES['appeal_start']},
        ],
    },
    UPCPage.CASSATION: {
        'name': 'Кассационное производство',
        'chapters': ['Глава 47.1 УПК РФ'],
        'description': 'Обжалование в кассационном порядке',
        'required_actions': [
            {'action': 'Рассмотреть кассационную жалобу', 'deadline': DEADLINES['cassation_start_first']},
        ],
    },
    UPCPage.EXECUTION: {
        'name': 'Исполнение приговора',
        'chapters': ['Глава 46 УПК РФ'],
        'description': 'Обращение приговора к исполнению',
        'required_actions': [
            {'action': 'Обратить приговор к исполнению (ст. 390, 393 УПК)', 'deadline': DEADLINES['execution']},
            {'action': 'Направить копии приговора в органы исполнения', 'deadline': None},
        ],
    },
    UPCPage.ARCHIVE: {
        'name': 'Архив',
        'chapters': [],
        'description': 'Дело сдано в архив',
        'required_actions': [],
    },
}

# Связь между решениями судьи (judge_decision) и этапами
JUDGE_DECISION_TO_STAGE = {
    '1': UPCPage.TERMINATION,  # о направлении по подсудности - по сути завершение в этом суде
    '2': UPCPage.PRELIMINARY_HEARING,  # о назначении предварительного слушания
    '3': UPCPage.TRIAL_SCHEDULED,  # о назначении судебного заседания
    '4': UPCPage.TRIAL_SCHEDULED,  # о назначении закрытого судебного заседания
}


def get_current_stage(case):
    """
    Определяет текущий этап дела по УПК на основе данных из модели.
    """
    # 1. Архив
    if case.status == 'archived':
        return UPCPage.ARCHIVE
    
    # 2. Если есть решение судьи
    if case.judge_decision:
        if case.judge_decision in JUDGE_DECISION_TO_STAGE:
            return JUDGE_DECISION_TO_STAGE[case.judge_decision]
    
    # 3. Если особый порядок
    if case.special_procedure_consent:
        # Проверяем, есть ли досудебное соглашение
        if case.special_procedure_agreement:
            return UPCPage.TRIAL_SPECIAL_CHAPTER_401
        return UPCPage.TRIAL_SPECIAL_CHAPTER_40
    
    # 4. Если есть приговор (sentence_date)
    if case.sentence_date:
        # Проверяем, был ли обжалован
        try:
            has_appeal = case.appeal_instances.exists() if hasattr(case, 'appeal_instances') else False
        except Exception:
            has_appeal = False
        if has_appeal:
            return UPCPage.APPEAL
        # Проверяем исполнение
        if case.sentence_execution_date:
            return UPCPage.EXECUTION
        return UPCPage.VERDICT
    
    # 5. Прекращение дела
    if case.case_result == '2':  # прекращено
        return UPCPage.TERMINATION
    
    # 6. Принудительные меры
    if case.case_result == '3':  # принудительные меры медицинского характера
        return UPCPage.MEDICAL_MEASURES
    
    # 7. Если было предварительное слушание
    if case.preliminary_hearing_date:
        return UPCPage.PRELIMINARY_HEARING
    
    # 8. Если назначено заседание (есть consideration_date или judge_decision о назначении)
    if case.consideration_date or case.judge_decision in ['3', '4']:
        return UPCPage.TRIAL_SCHEDULED
    
    # 9. Если есть результат предварительного слушания
    if case.preliminary_hearing_result:
        return UPCPage.PRELIMINARY_HEARING
    
    # 10. По умолчанию - дело поступило
    return UPCPage.CASE_RECEIVED


def get_stage_deadline(stage, case):
    """
    Возвращает срок для данного этапа в зависимости от категории дела.
    """
    # Проверяем, есть ли несовершеннолетний
    has_minor = case.defendants.filter(is_minor=True).exists()
    # Проверяем, есть ли лица под стражей
    has_custody = case.defendants.filter(restraint_measure='7').exists()
    
    if stage == UPCPage.TRIAL_GENERAL or stage == UPCPage.TRIAL_SCHEDULED:
        if has_custody:
            return DEADLINES['trial_start_custody']
        return DEADLINES['trial_start_general']
    
    if stage in [UPCPage.TRIAL_SPECIAL_CHAPTER_40, UPCPage.TRIAL_SPECIAL_CHAPTER_401]:
        return DEADLINES['trial_start_special']
    
    if stage == UPCPage.APPEAL:
        return DEADLINES['appeal_start']
    
    if stage == UPCPage.CASSATION:
        return DEADLINES['cassation_start_first']
    
    if stage == UPCPage.EXECUTION:
        return DEADLINES['execution']
    
    return DEADLINES.get(stage.value, None)


# Рекомендации по Пленумам ВС РФ для каждого этапа
SUPREME_COURT_LINKS_BY_STAGE = {
    UPCPage.TRIAL_GENERAL: [
        {'title': 'Постановление Пленума ВС РФ от 29.11.2016 № 55 "О судебном приговоре"', 'url': 'https://vsrf.ru/documents/own/8434/'},
        {'title': 'Постановление Пленума ВС РФ от 19.12.2017 № 51 "О практике применения законодательства при рассмотрении уголовных дел в суде первой инстанции"', 'url': 'https://vsrf.ru/documents/own/8478/'},
    ],
    UPCPage.TRIAL_SPECIAL_CHAPTER_40: [
        {'title': 'Постановление Пленума ВС РФ от 05.12.2006 № 60 "О применении судами особого порядка судебного разбирательства"', 'url': 'https://vsrf.ru/documents/own/8250/'},
    ],
    UPCPage.PRELIMINARY_HEARING: [
        {'title': 'Постановление Пленума ВС РФ от 22.12.2015 № 58 "О практике назначения судами РФ уголовного наказания"', 'url': 'https://vsrf.ru/documents/own/8332/'},
    ],
    UPCPage.VERDICT: [
        {'title': 'Постановление Пленума ВС РФ от 29.11.2016 № 55 "О судебном приговоре"', 'url': 'https://vsrf.ru/documents/own/8434/'},
        {'title': 'Постановление Пленума ВС РФ от 19.12.2017 № 51 "О практике применения законодательства при рассмотрении уголовных дел в суде первой инстанции"', 'url': 'https://vsrf.ru/documents/own/8478/'},
    ],
    UPCPage.APPEAL: [
        {'title': 'Постановление Пленума ВС РФ от 27.11.2012 № 26 "О применении норм УПК РФ, регулирующих производство в суде апелляционной инстанции"', 'url': 'https://vsrf.ru/documents/own/8364/'},
    ],
    UPCPage.CASSATION: [
        {'title': 'Постановление Пленума ВС РФ от 28.01.2014 № 2 "О применении норм УПК РФ, регулирующих производство в суде кассационной инстанции"', 'url': 'https://vsrf.ru/documents/own/8442/'},
    ],
}