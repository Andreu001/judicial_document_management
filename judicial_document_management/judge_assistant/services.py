# judge_assistant/services.py
"""
Сервис анализа уголовного дела для автоматизированного помощника судьи.
"""

from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.contenttypes.models import ContentType

from .upc_knowledge import (
    UPCPage, DEADLINES, STAGE_INFO, JUDGE_DECISION_TO_STAGE,
    get_current_stage, get_stage_deadline, SUPREME_COURT_LINKS_BY_STAGE
)


class CaseAnalyzerService:
    """
    Сервис для анализа уголовного дела и генерации подсказок.
    """

    def __init__(self, case):
        self.case = case
        self.current_stage = get_current_stage(case)
        self.stage_info = STAGE_INFO.get(self.current_stage, {})

    def analyze(self):
        """
        Главный метод анализа дела.
        Возвращает словарь с результатами анализа.
        """
        return {
            'current_stage': {
                'code': self.current_stage.value,
                'name': self.stage_info.get('name', 'Неизвестный этап'),
                'chapters': self.stage_info.get('chapters', []),
                'description': self.stage_info.get('description', ''),
            },
            'deadline_violations': self._check_deadlines(),
            'pending_petitions': self._check_pending_petitions(),
            'unnotified_participants': self._check_unnotified_participants(),
            'recommended_actions': self._get_recommended_actions(),
            'useful_links': self._get_useful_links(),
            'next_stage_hint': self._get_next_stage_hint(),
            'statistics': self._get_statistics(),
        }

    def _check_deadlines(self):
        """
        Проверяет соблюдение сроков по Главе 17 УПК РФ.
        Возвращает список нарушений.
        """
        violations = []
        today = timezone.now().date()

        # 1. Срок принятия решения по поступившему делу (ст. 227 УПК)
        if self.case.incoming_date and not self.case.judge_decision:
            days_passed = (today - self.case.incoming_date).days
            deadline = DEADLINES.get('decision_on_case', 14)
            if days_passed > deadline:
                violations.append({
                    'type': 'decision_on_case',
                    'title': 'Нарушение срока принятия решения по делу (ст. 227 УПК)',
                    'deadline_days': deadline,
                    'actual_days': days_passed,
                    'description': f'Решение по поступившему делу должно быть принято в течение {deadline} суток. Прошло {days_passed} суток.',
                    'severity': 'high',
                })

        # 2. Срок назначения судебного заседания (ст. 233, 241.1 УПК)
        # Используем judge_acceptance_date или incoming_date как дату решения
        if self.case.judge_decision and self.case.judge_decision in ['3', '4']:
            # Решение о назначении судебного заседания
            judge_decision_date = self.case.judge_acceptance_date or self.case.incoming_date
            if judge_decision_date and not self.case.consideration_date:
                days_passed = (today - judge_decision_date).days
                deadline = get_stage_deadline(self.current_stage, self.case) or 14
                if days_passed > deadline:
                    violations.append({
                        'type': 'trial_start',
                        'title': 'Нарушение срока начала судебного разбирательства',
                        'deadline_days': deadline,
                        'actual_days': days_passed,
                        'description': f'Судебное заседание должно начаться в течение {deadline} суток. Прошло {days_passed} суток.',
                        'severity': 'high',
                    })

        # 3. Срок рассмотрения дела (общий) - используем consideration_date
        if self.case.consideration_date and not self.case.sentence_date:
            days_passed = (today - self.case.consideration_date).days
            reasonable_days = 90
            if days_passed > reasonable_days:
                violations.append({
                    'type': 'consideration',
                    'title': 'Превышение разумного срока рассмотрения дела',
                    'deadline_days': reasonable_days,
                    'actual_days': days_passed,
                    'description': f'С момента назначения рассмотрения прошло {days_passed} дней, что превышает разумный срок.',
                    'severity': 'medium',
                })

        # 4. Срок обращения приговора к исполнению (ст. 390, 393 УПК)
        if self.case.sentence_effective_date:
            days_passed = (today - self.case.sentence_effective_date).days
            deadline = DEADLINES.get('execution', 15)
            if days_passed > deadline and not self.case.sentence_execution_date:
                violations.append({
                    'type': 'execution',
                    'title': 'Нарушение срока обращения приговора к исполнению (ст. 390, 393 УПК)',
                    'deadline_days': deadline,
                    'actual_days': days_passed,
                    'description': f'Приговор должен быть обращен к исполнению в течение {deadline} суток. Прошло {days_passed} суток.',
                    'severity': 'high',
                })

        return violations

    def _check_pending_petitions(self):
        """
        Проверяет нерассмотренные ходатайства.
        """
        from criminal_proceedings.models import PetitionCriminal

        # Ходатайства, по которым нет решения
        pending = PetitionCriminal.objects.filter(
            criminal_proceedings=self.case,
            petitions_incase__date_decision__isnull=True
        )
        
        result = []
        for petition in pending:
            petitioner_info = petition.petitioner_info
            result.append({
                'id': petition.id,
                'petitioner': petitioner_info.get('name') if petitioner_info else 'Неизвестно',
                'petitioner_type': petition.get_petitioner_type_display() if petition.petitioner_type else 'Не указан',
                'date_application': petition.petitions_incase.date_application if petition.petitions_incase else None,
                'description': f'Ходатайство ожидает рассмотрения (подано {petition.petitions_incase.date_application})' if petition.petitions_incase and petition.petitions_incase.date_application else 'Ходатайство ожидает рассмотрения',
            })
        
        return {
            'count': len(result),
            'items': result,
        }

    def _check_unnotified_participants(self):
        """
        Проверяет, все ли участники уведомлены о судебном заседании.
        """
        from case_management.models import Notification, NotificationStatus
        from criminal_proceedings.models import Defendant, CriminalSidesCaseInCase, LawyerCriminal

        result = []
        
        # Если еще нет даты рассмотрения, не проверяем
        hearing_date = self.case.consideration_date
        if not hearing_date:
            return {'count': 0, 'items': []}

        # Получаем всех участников
        participants = []
        
        # Обвиняемые (исправлено: используем Defendant, а не defendants через related_name)
        try:
            defendants = Defendant.objects.filter(criminal_proceedings=self.case)
        except AttributeError:
            defendants = []
        for defendant in defendants:
            participants.append({
                'id': defendant.id,
                'type': 'defendant',
                'type_label': 'Обвиняемый',
                'name': defendant.full_name_criminal,
            })
        
        # Стороны
        try:
            sides = self.case.criminal_sides.all()
        except AttributeError:
            sides = []
        for side in sides:
            if side.criminal_side_case:
                participants.append({
                    'id': side.id,
                    'type': 'side',
                    'type_label': 'Сторона',
                    'name': side.criminal_side_case.name or 'Неизвестно',
                })
        
        # Адвокаты
        try:
            lawyers = self.case.criminal_lawyers.all()
        except AttributeError:
            lawyers = []
        for lawyer in lawyers:
            if lawyer.lawyer:
                participants.append({
                    'id': lawyer.id,
                    'type': 'lawyer',
                    'type_label': 'Адвокат',
                    'name': lawyer.lawyer.law_firm_name or 'Неизвестно',
                })

        # Проверяем, кто не уведомлен
        try:
            case_ct = ContentType.objects.get_for_model(self.case)
        except Exception:
            case_ct = None

        for participant in participants:
            # Ищем уведомления на эту дату
            if case_ct:
                notifications = Notification.objects.filter(
                    case_content_type=case_ct,
                    case_object_id=self.case.id,
                    hearing_date=hearing_date,
                    participant_object_id=participant['id']
                )
            else:
                notifications = []
            
            if not notifications.exists():
                result.append({
                    'id': participant['id'],
                    'type': participant['type'],
                    'type_label': participant['type_label'],
                    'name': participant['name'],
                    'suggestion': f'Необходимо уведомить {participant["name"]} о заседании {hearing_date}',
                })

        return {
            'count': len(result),
            'items': result,
        }

    def _get_recommended_actions(self):
        """
        Возвращает список рекомендуемых действий на основе УПК.
        """
        actions = []

        # Рекомендации из STAGE_INFO
        required_actions = self.stage_info.get('required_actions', [])
        for action_info in required_actions:
            action = {
                'title': action_info['action'],
                'priority': 'high',
                'stage': self.current_stage.value,
            }
            if action_info.get('deadline'):
                action['deadline_days'] = action_info['deadline']
            actions.append(action)

        # Особые рекомендации для конкретных этапов
        if self.current_stage == UPCPage.CASE_RECEIVED:
            actions.append({
                'title': 'Проверить подсудность дела (ст. 31-34 УПК РФ)',
                'priority': 'high',
            })
            actions.append({
                'title': 'Проверить наличие оснований для возврата дела прокурору (ст. 237 УПК РФ)',
                'priority': 'high',
            })

        elif self.current_stage == UPCPage.PRELIMINARY_HEARING:
            actions.append({
                'title': 'Проверить ходатайство об исключении доказательств (ст. 235 УПК РФ)',
                'priority': 'high',
            })
            actions.append({
                'title': 'Рассмотреть вопрос о возврате дела прокурору (ст. 237 УПК РФ)',
                'priority': 'high',
            })
            actions.append({
                'title': 'Рассмотреть вопрос о приостановлении или прекращении дела',
                'priority': 'medium',
            })

        elif self.current_stage in [UPCPage.TRIAL_GENERAL, UPCPage.TRIAL_SCHEDULED]:
            # Проверка на несовершеннолетнего (исправлено)
            try:
                has_minor = self.case.defendants.filter(is_minor=True).exists()
            except (AttributeError, Exception):
                has_minor = False
            if has_minor:
                actions.append({
                    'title': 'Учесть особенности по делам несовершеннолетних (Глава 50 УПК РФ)',
                    'priority': 'high',
                    'details': 'Обязательное участие законного представителя, педагога/психолога',
                })
            
            # Проверка на меру пресечения
            try:
                has_custody = self.case.defendants.filter(restraint_measure='7').exists()
            except (AttributeError, Exception):
                has_custody = False
            if has_custody:
                actions.append({
                    'title': 'Проверить сроки содержания под стражей (ст. 109-110 УПК РФ)',
                    'priority': 'high',
                })

        elif self.current_stage == UPCPage.TRIAL_SPECIAL_CHAPTER_40:
            actions.append({
                'title': 'Проверить добровольность согласия обвиняемого с обвинением (ст. 314 УПК)',
                'priority': 'critical',
            })
            actions.append({
                'title': 'Разъяснить последствия особого порядка (ст. 315 УПК)',
                'priority': 'critical',
            })
            actions.append({
                'title': 'Убедиться, что наказание не превышает 2/3 максимального срока (ст. 316 УПК)',
                'priority': 'high',
            })

        elif self.current_stage == UPCPage.TRIAL_SPECIAL_CHAPTER_401:
            actions.append({
                'title': 'Проверить выполнение условий досудебного соглашения (ст. 317.1-317.5 УПК)',
                'priority': 'critical',
            })
            actions.append({
                'title': 'Постановить приговор с учетом условий соглашения (ст. 317.7 УПК)',
                'priority': 'high',
            })

        elif self.current_stage == UPCPage.VERDICT:
            actions.append({
                'title': 'Постановить приговор в совещательной комнате (ст. 296-298 УПК)',
                'priority': 'critical',
            })
            actions.append({
                'title': 'Разъяснить порядок и срок обжалования (ст. 310 УПК)',
                'priority': 'high',
            })

        # Проверка на отложенные заседания (используем suspension_duration_days или similar)
        # В вашей модели может быть другое поле для отложений
        postponement_count = getattr(self.case, 'postponement_count', 0) or 0
        if postponement_count > 0:
            actions.append({
                'title': f'Анализ причин отложения (было {postponement_count} отложений) - ст. 253-254 УПК',
                'priority': 'medium',
            })

        return actions

    def _get_useful_links(self):
        """
        Возвращает полезные ссылки (Пленумы ВС РФ, Обзоры) для текущего этапа.
        """
        from .models import SupremeCourtDocumentRef
        
        links = []
        
        # Предустановленные ссылки
        preset_links = SUPREME_COURT_LINKS_BY_STAGE.get(self.current_stage, [])
        for link in preset_links:
            links.append(link)
        
        # Ссылки из базы SupremeCourtDocumentRef (можно добавлять через админку)
        try:
            db_links = SupremeCourtDocumentRef.objects.filter(
                applicable_stages=self.current_stage.value,
                is_active=True
            )
            for doc in db_links:
                links.append({
                    'title': f'{doc.get_document_type_display()}: {doc.title}',
                    'url': doc.url,
                    'description': doc.description,
                    'from_db': True,
                })
        except Exception:
            pass
        
        # Дополнительные ссылки по категориям дел
        try:
            has_minor = self.case.defendants.filter(is_minor=True).exists()
        except (AttributeError, Exception):
            has_minor = False
        if has_minor:
            links.append({
                'title': 'Постановление Пленума ВС РФ от 01.02.2011 № 1 "О судебной практике применения законодательства, регламентирующего особенности уголовной ответственности и наказания несовершеннолетних"',
                'url': 'https://vsrf.ru/documents/own/8411/',
                'description': 'Особенности рассмотрения дел в отношении несовершеннолетних',
            })
        
        return links

    def _get_next_stage_hint(self):
        """
        Подсказка о следующем этапе.
        """
        next_stages = {
            UPCPage.CASE_RECEIVED: 'Примите одно из решений по ст. 227 УПК РФ',
            UPCPage.JUDGE_DECISION: 'Назначьте судебное заседание или предварительное слушание',
            UPCPage.PRELIMINARY_HEARING: 'Проведите предварительное слушание и примите решение',
            UPCPage.TRIAL_SCHEDULED: 'Проведите судебное заседание',
            UPCPage.TRIAL_GENERAL: 'Исследуйте доказательства, заслушайте стороны, постановите приговор',
            UPCPage.TRIAL_SPECIAL_CHAPTER_40: 'Постановите приговор в особом порядке',
            UPCPage.TRIAL_SPECIAL_CHAPTER_401: 'Постановите приговор с учетом условий соглашения',
            UPCPage.VERDICT: 'Направьте копии приговора участникам, разъясните порядок обжалования',
            UPCPage.TERMINATION: 'Направьте копии постановления участникам',
            UPCPage.EXECUTION: 'Обратите приговор к исполнению',
            UPCPage.APPEAL: 'Направьте дело в суд апелляционной инстанции',
        }
        return next_stages.get(self.current_stage, 'Продолжайте рассмотрение дела')

    def _get_statistics(self):
        """
        Собирает статистику по делу.
        """
        from criminal_proceedings.models import PetitionCriminal
        
        # Расчет продолжительности
        total_days = 0
        if self.case.incoming_date:
            end_date = self.case.archived_date or self.case.sentence_effective_date or date.today()
            total_days = (end_date - self.case.incoming_date).days
        
        # Количество ходатайств
        try:
            total_petitions = PetitionCriminal.objects.filter(criminal_proceedings=self.case).count()
            resolved_petitions = PetitionCriminal.objects.filter(
                criminal_proceedings=self.case,
                petitions_incase__date_decision__isnull=False
            ).count()
        except Exception:
            total_petitions = 0
            resolved_petitions = 0
        
        # Количество судебных заседаний - используем case_to_office_date как маркер?
        # Или считаем движения дела
        hearing_count = 0
        
        # Используем признак того, что было хотя бы одно заседание
        if self.case.consideration_date:
            hearing_count = 1
        
        # Если есть отложения (suspension_duration_days может указывать на приостановление)
        if self.case.date_suspension_case:
            hearing_count += 1
        
        try:
            defendants_count = self.case.defendants.count()
        except (AttributeError, Exception):
            defendants_count = 0
        
        try:
            has_minor = self.case.defendants.filter(is_minor=True).exists()
        except (AttributeError, Exception):
            has_minor = False
        
        try:
            has_custody = self.case.defendants.filter(restraint_measure='7').exists()
        except (AttributeError, Exception):
            has_custody = False
        
        return {
            'total_days_in_progress': total_days,
            'postponement_count': getattr(self.case, 'postponement_count', 0) or 0,
            'total_petitions': total_petitions,
            'resolved_petitions': resolved_petitions,
            'pending_petitions': total_petitions - resolved_petitions,
            'hearing_count': hearing_count,
            'defendants_count': defendants_count,
            'has_minor': has_minor,
            'has_custody': has_custody,
        }