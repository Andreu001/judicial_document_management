# judge_assistant/services.py
"""
Сервис анализа дел для автоматизированного помощника судьи.
Поддерживает все типы дел: уголовные, гражданские, административные (КАС) и об административных правонарушениях.
"""

from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Q

from .upc_knowledge import (
    UPCPage, DEADLINES as UPC_DEADLINES, STAGE_INFO as UPC_STAGE_INFO,
    JUDGE_DECISION_TO_STAGE as UPC_JUDGE_DECISION_TO_STAGE,
    get_current_stage as get_upc_stage,
    get_stage_deadline as get_upc_deadline,
    SUPREME_COURT_LINKS_BY_STAGE as UPC_LINKS
)

from .gp_knowledge import (
    GPPage, DEADLINES as GP_DEADLINES, STAGE_INFO as GP_STAGE_INFO,
    get_current_stage as get_gp_stage,
    get_stage_deadline as get_gp_deadline,
    SUPREME_COURT_LINKS_BY_STAGE as GP_LINKS
)

from .kas_knowledge import (
    KASPage, DEADLINES as KAS_DEADLINES, STAGE_INFO as KAS_STAGE_INFO,
    get_current_stage as get_kas_stage,
    get_stage_deadline as get_kas_deadline,
    SUPREME_COURT_LINKS_BY_STAGE as KAS_LINKS
)

from .koap_knowledge import (
    KOAPPage, DEADLINES as KOAP_DEADLINES, STAGE_INFO as KOAP_STAGE_INFO,
    get_current_stage as get_koap_stage,
    get_stage_deadline as get_koap_deadline,
    SUPREME_COURT_LINKS_BY_STAGE as KOAP_LINKS
)


class CaseAnalyzerService:
    """
    Сервис для анализа дела и генерации подсказок.
    Поддерживает все типы судопроизводства.
    """

    def __init__(self, case, case_type='criminal'):
        self.case = case
        self.case_type = case_type
        self._init_knowledge()
        self.current_stage = self._get_current_stage()

    def _init_knowledge(self):
        """Инициализация соответствующих модулей знаний в зависимости от типа дела."""
        if self.case_type == 'criminal':
            self.page_enum = UPCPage
            self.deadlines = UPC_DEADLINES
            self.stage_info = UPC_STAGE_INFO
            self.get_stage = get_upc_stage
            self.get_deadline = get_upc_deadline
            self.links = UPC_LINKS
        elif self.case_type == 'civil':
            self.page_enum = GPPage
            self.deadlines = GP_DEADLINES
            self.stage_info = GP_STAGE_INFO
            self.get_stage = get_gp_stage
            self.get_deadline = get_gp_deadline
            self.links = GP_LINKS
        elif self.case_type == 'kas':
            self.page_enum = KASPage
            self.deadlines = KAS_DEADLINES
            self.stage_info = KAS_STAGE_INFO
            self.get_stage = get_kas_stage
            self.get_deadline = get_kas_deadline
            self.links = KAS_LINKS
        elif self.case_type == 'coap':
            self.page_enum = KOAPPage
            self.deadlines = KOAP_DEADLINES
            self.stage_info = KOAP_STAGE_INFO
            self.get_stage = get_koap_stage
            self.get_deadline = get_koap_deadline
            self.links = KOAP_LINKS
        else:
            raise ValueError(f"Unsupported case type: {self.case_type}")

    def _get_current_stage(self):
        """Определяет текущий этап дела."""
        return self.get_stage(self.case)

    def analyze(self):
        """
        Главный метод анализа дела.
        Возвращает словарь с результатами анализа.
        """
        stage_info = self.stage_info.get(self.current_stage, {})
        
        return {
            'current_stage': {
                'code': self.current_stage.value,
                'name': stage_info.get('name', 'Неизвестный этап'),
                'chapters': stage_info.get('chapters', []),
                'description': stage_info.get('description', ''),
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
        Проверяет соблюдение процессуальных сроков.
        Возвращает список нарушений.
        """
        violations = []
        today = timezone.now().date()

        # Общие проверки для всех типов дел
        if hasattr(self.case, 'incoming_date') and self.case.incoming_date:
            days_passed = (today - self.case.incoming_date).days
            deadline = 30  # разумный срок по умолчанию
            
            if self.case_type == 'criminal':
                deadline = self.deadlines.get('decision_on_case', 14)
                if days_passed > deadline and not getattr(self.case, 'judge_decision', None):
                    violations.append({
                        'type': 'decision_on_case',
                        'title': 'Нарушение срока принятия решения по делу',
                        'deadline_days': deadline,
                        'actual_days': days_passed,
                        'description': f'Решение по поступившему делу должно быть принято в течение {deadline} суток. Прошло {days_passed} суток.',
                        'severity': 'high',
                    })
            
            elif self.case_type == 'civil' or self.case_type == 'kas':
                deadline = self.deadlines.get('decision_on_case', 5)
                if days_passed > deadline:
                    violations.append({
                        'type': 'decision_on_case',
                        'title': 'Нарушение срока принятия решения по делу',
                        'deadline_days': deadline,
                        'actual_days': days_passed,
                        'description': f'Решение по поступившему делу должно быть принято в течение {deadline} суток. Прошло {days_passed} суток.',
                        'severity': 'high',
                    })

        # Проверка сроков рассмотрения
        if hasattr(self.case, 'hearing_date') and self.case.hearing_date:
            days_from_hearing = (today - self.case.hearing_date).days
            if days_from_hearing > 30 and not self._is_case_completed():
                violations.append({
                    'type': 'consideration',
                    'title': 'Превышение разумного срока рассмотрения дела',
                    'deadline_days': 30,
                    'actual_days': days_from_hearing,
                    'description': f'С момента назначения рассмотрения прошло {days_from_hearing} дней, что превышает разумный срок.',
                    'severity': 'medium',
                })

        return violations

    def _is_case_completed(self):
        """Проверяет, завершено ли дело."""
        if self.case_type == 'criminal':
            return bool(getattr(self.case, 'sentence_date', None))
        elif self.case_type == 'civil':
            return hasattr(self.case, 'civil_decisions') and self.case.civil_decisions.exists()
        elif self.case_type == 'kas':
            return hasattr(self.case, 'kas_decisions') and self.case.kas_decisions.exists()
        elif self.case_type == 'coap':
            return hasattr(self.case, 'admin_decisions') and self.case.admin_decisions.exists()
        return False

    def _check_pending_petitions(self):
        """
        Проверяет нерассмотренные ходатайства.
        """
        result = []
        
        if self.case_type == 'criminal':
            from criminal_proceedings.models import PetitionCriminal
            pending = PetitionCriminal.objects.filter(
                criminal_proceedings=self.case,
                petitions_incase__date_decision__isnull=True
            )
            for petition in pending:
                petitioner_info = petition.petitioner_info
                result.append({
                    'id': petition.id,
                    'petitioner': petitioner_info.get('name') if petitioner_info else 'Неизвестно',
                    'petitioner_type': petition.get_petitioner_type_display() if petition.petitioner_type else 'Не указан',
                    'date_application': petition.petitions_incase.date_application if petition.petitions_incase else None,
                    'description': f'Ходатайство ожидает рассмотрения',
                })
        
        elif self.case_type == 'civil':
            from civil_proceedings.models import CivilPetition
            pending = CivilPetition.objects.filter(
                civil_proceedings=self.case,
                petitions_incase__date_decision__isnull=True
            )
            for petition in pending:
                petitioner_info = petition.petitioner_info
                result.append({
                    'id': petition.id,
                    'petitioner': petitioner_info.get('name') if petitioner_info else 'Неизвестно',
                    'petitioner_type': petitioner_info.get('type_label') if petitioner_info else 'Не указан',
                    'date_application': petition.petitions_incase.date_application if petition.petitions_incase else None,
                    'description': f'Ходатайство ожидает рассмотрения',
                })
        
        elif self.case_type == 'kas':
            # ← ИСПРАВЛЕНО: правильный импорт из kas_proceedings
            from administrative_proceedings.models import KasPetition
            pending = KasPetition.objects.filter(
                kas_proceedings=self.case,  # ← правильное имя поля
                petitions_incase__date_decision__isnull=True
            )
            for petition in pending:
                petitioner_info = petition.petitioner_info
                result.append({
                    'id': petition.id,
                    'petitioner': petitioner_info.get('name') if petitioner_info else 'Неизвестно',
                    'petitioner_type': petitioner_info.get('type_label') if petitioner_info else 'Не указан',
                    'date_application': petition.petitions_incase.date_application if petition.petitions_incase else None,
                    'description': f'Ходатайство ожидает рассмотрения',
                })
        
        elif self.case_type == 'coap':
            from administrative_code.models import AdministrativePetition
            pending = AdministrativePetition.objects.filter(
                administrative_proceedings=self.case,  # ← правильное имя поля
                petitions_incase__date_decision__isnull=True
            )
            for petition in pending:
                petitioner_info = petition.petitioner_info
                result.append({
                    'id': petition.id,
                    'petitioner': petitioner_info.get('name') if petitioner_info else 'Неизвестно',
                    'petitioner_type': petitioner_info.get('type_label') if petitioner_info else 'Не указан',
                    'date_application': petition.petitions_incase.date_application if petition.petitions_incase else None,
                    'description': f'Ходатайство ожидает рассмотрения',
                })

        return {
            'count': len(result),
            'items': result,
        }

    def _check_unnotified_participants(self):
        """
        Проверяет, все ли участники уведомлены о заседании.
        """
        result = []
        
        hearing_date = getattr(self.case, 'hearing_date', None)
        if not hearing_date:
            return {'count': 0, 'items': []}

        participants = self._get_participants()
        
        for participant in participants:
            # Проверяем наличие уведомлений
            if not self._has_notification(participant, hearing_date):
                result.append({
                    'id': participant.get('id'),
                    'type': participant.get('type'),
                    'type_label': participant.get('type_label', 'Участник'),
                    'name': participant.get('name', 'Неизвестно'),
                    'suggestion': f'Необходимо уведомить {participant.get("name")} о заседании {hearing_date}',
                })

        return {
            'count': len(result),
            'items': result,
        }

    def _get_participants(self):
        """Получает список участников в зависимости от типа дела."""
        participants = []
        
        if self.case_type == 'criminal':
            from criminal_proceedings.models import Defendant
            try:
                defendants = Defendant.objects.filter(criminal_proceedings=self.case)
                for d in defendants:
                    participants.append({
                        'id': d.id,
                        'type': 'defendant',
                        'type_label': 'Обвиняемый',
                        'name': d.full_name_criminal,
                    })
            except Exception:
                pass
        
        elif self.case_type == 'civil':
            from civil_proceedings.models import CivilSidesCaseInCase
            try:
                sides = CivilSidesCaseInCase.objects.filter(civil_proceedings=self.case)
                for s in sides:
                    participants.append({
                        'id': s.id,
                        'type': 'side',
                        'type_label': 'Сторона',
                        'name': getattr(s.sides_case_incase, 'name', 'Неизвестно'),
                    })
            except Exception:
                pass
        
        elif self.case_type == 'kas':
            # ← ИСПРАВЛЕНО: правильный импорт из administrative_proceedings
            from administrative_proceedings.models import KasSidesCaseInCase
            try:
                sides = KasSidesCaseInCase.objects.filter(kas_proceedings=self.case)
                for s in sides:
                    participants.append({
                        'id': s.id,
                        'type': 'side',
                        'type_label': 'Сторона',
                        'name': getattr(s.sides_case_incase, 'name', 'Неизвестно'),
                    })
            except Exception:
                pass
        
        elif self.case_type == 'coap':
            from administrative_code.models import AdministrativeSidesCaseInCase
            try:
                sides = AdministrativeSidesCaseInCase.objects.filter(administrative_proceedings=self.case)
                for s in sides:
                    participants.append({
                        'id': s.id,
                        'type': 'side',
                        'type_label': 'Сторона',
                        'name': getattr(s.sides_case_incase, 'name', 'Неизвестно'),
                    })
            except Exception:
                pass

        return participants

    def _has_notification(self, participant, hearing_date):
        """Проверяет наличие уведомления для участника."""
        from case_management.models import Notification
        from django.contrib.contenttypes.models import ContentType
        
        try:
            ct = ContentType.objects.get_for_model(self.case)
            exists = Notification.objects.filter(
                case_content_type=ct,
                case_object_id=self.case.id,
                hearing_date=hearing_date,
                participant_object_id=participant.get('id')
            ).exists()
            return exists
        except Exception:
            return False

    def _get_recommended_actions(self):
        """
        Возвращает список рекомендуемых действий.
        """
        actions = []
        stage_info = self.stage_info.get(self.current_stage, {})
        
        required_actions = stage_info.get('required_actions', [])
        for action_info in required_actions:
            action = {
                'title': action_info['action'],
                'priority': 'high',
                'stage': self.current_stage.value,
            }
            if action_info.get('deadline'):
                action['deadline_days'] = action_info['deadline']
            actions.append(action)

        # Дополнительные рекомендации для конкретных типов дел
        if self.case_type == 'criminal':
            actions.extend(self._get_criminal_actions())
        elif self.case_type == 'civil':
            actions.extend(self._get_civil_actions())
        elif self.case_type == 'kas':
            actions.extend(self._get_kas_actions())
        elif self.case_type == 'coap':
            actions.extend(self._get_administrative_actions())

        return actions

    def _get_criminal_actions(self):
        """Дополнительные рекомендации для уголовных дел."""
        actions = []
        stage = self.current_stage
        
        if stage == UPCPage.CASE_RECEIVED:
            actions.append({
                'title': 'Проверить подсудность дела (ст. 31-34 УПК РФ)',
                'priority': 'high',
            })
        elif stage == UPCPage.PRELIMINARY_HEARING:
            actions.append({
                'title': 'Проверить ходатайство об исключении доказательств (ст. 235 УПК РФ)',
                'priority': 'high',
            })
        elif stage == UPCPage.TRIAL_GENERAL:
            actions.append({
                'title': 'Исследовать доказательства, заслушать стороны (ст. 273-291 УПК)',
                'priority': 'high',
            })
        
        return actions

    def _get_civil_actions(self):
        """Дополнительные рекомендации для гражданских дел."""
        actions = []
        stage = self.current_stage
        
        if stage == GPPage.CASE_RECEIVED:
            actions.append({
                'title': 'Проверить подсудность дела (ст. 23-27 ГПК РФ)',
                'priority': 'high',
            })
            actions.append({
                'title': 'Проверить наличие оснований для возврата или оставления без движения',
                'priority': 'high',
            })
        elif stage == GPPage.PREPARATION:
            actions.append({
                'title': 'Провести собеседование со сторонами (ст. 150 ГПК)',
                'priority': 'medium',
            })
        elif stage == GPPage.TRIAL:
            actions.append({
                'title': 'Исследовать доказательства (ст. 175-189 ГПК)',
                'priority': 'high',
            })
        
        return actions

    def _get_kas_actions(self):
        """Дополнительные рекомендации для дел КАС."""
        actions = []
        stage = self.current_stage
        
        if stage == KASPage.CASE_RECEIVED:
            actions.append({
                'title': 'Проверить подсудность дела (ст. 17-22 КАС РФ)',
                'priority': 'high',
            })
        elif stage == KASPage.PREPARATION:
            actions.append({
                'title': 'Истребовать доказательства (ст. 135-136 КАС)',
                'priority': 'medium',
            })
        
        return actions

    def _get_administrative_actions(self):
        """Дополнительные рекомендации для дел об АП."""
        actions = []
        stage = self.current_stage
        
        if stage == KOAPPage.CASE_RECEIVED:
            actions.append({
                'title': 'Проверить правильность составления протокола об АП',
                'priority': 'high',
            })
            actions.append({
                'title': 'Проверить подсудность дела (ст. 23.1 КоАП РФ)',
                'priority': 'high',
            })
        elif stage == KOAPPage.PREPARATION:
            actions.append({
                'title': 'Вызвать лиц, участвующих в деле (ст. 29.4 КоАП)',
                'priority': 'high',
            })
        
        return actions

    def _get_useful_links(self):
        """
        Возвращает полезные ссылки для текущего этапа.
        """
        links = []
        
        # Предустановленные ссылки
        preset_links = self.links.get(self.current_stage, [])
        for link in preset_links:
            links.append(link)
        
        # Ссылки из базы SupremeCourtDocumentRef
        try:
            from .models import SupremeCourtDocumentRef
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

        return links

    def _get_next_stage_hint(self):
        """
        Подсказка о следующем этапе.
        """
        stage_hints = {}
        
        if self.case_type == 'criminal':
            stage_hints = {
                UPCPage.CASE_RECEIVED: 'Примите одно из решений по ст. 227 УПК РФ',
                UPCPage.JUDGE_DECISION: 'Назначьте судебное заседание или предварительное слушание',
                UPCPage.PRELIMINARY_HEARING: 'Проведите предварительное слушание и примите решение',
                UPCPage.TRIAL_SCHEDULED: 'Проведите судебное заседание',
                UPCPage.TRIAL_GENERAL: 'Исследуйте доказательства, заслушайте стороны, постановите приговор',
                UPCPage.VERDICT: 'Направьте копии приговора участникам, разъясните порядок обжалования',
            }
        elif self.case_type == 'civil':
            stage_hints = {
                GPPage.CASE_RECEIVED: 'Примите одно из решений по ст. 133 ГПК РФ',
                GPPage.JUDGE_DECISION: 'Назначьте подготовку дела к судебному разбирательству',
                GPPage.PREPARATION: 'Проведите подготовку дела, определите обстоятельства, имеющие значение',
                GPPage.PRELIMINARY_HEARING: 'Разрешите ходатайства сторон, определите предмет доказывания',
                GPPage.TRIAL: 'Исследуйте доказательства, заслушайте стороны, вынесите решение',
                GPPage.VERDICT: 'Изготовьте решение в окончательной форме, разъясните порядок обжалования',
            }
        elif self.case_type == 'kas':
            stage_hints = {
                KASPage.CASE_RECEIVED: 'Примите решение по поступившему делу (ст. 126 КАС РФ)',
                KASPage.PREPARATION: 'Проведите подготовку дела к судебному разбирательству',
                KASPage.PRELIMINARY_HEARING: 'Разрешите вопросы, связанные с подготовкой дела',
                KASPage.TRIAL: 'Исследуйте доказательства, вынесите решение',
                KASPage.VERDICT: 'Изготовьте решение, разъясните порядок обжалования',
            }
        elif self.case_type == 'coap':
            stage_hints = {
                KOAPPage.CASE_RECEIVED: 'Подготовьтесь к рассмотрению дела (ст. 29.1 КоАП)',
                KOAPPage.PREPARATION: 'Вызовите лиц, участвующих в деле, назначьте дату рассмотрения',
                KOAPPage.TRIAL: 'Рассмотрите дело, вынесите постановление',
                KOAPPage.DECISION: 'Разъясните порядок и срок обжалования постановления',
            }

        return stage_hints.get(self.current_stage, 'Продолжайте рассмотрение дела')

    def _get_statistics(self):
        """
        Собирает статистику по делу.
        """
        # Расчет продолжительности
        total_days = 0
        if hasattr(self.case, 'incoming_date') and self.case.incoming_date:
            end_date = getattr(self.case, 'archived_date', None) or date.today()
            total_days = (end_date - self.case.incoming_date).days

        # Количество ходатайств
        total_petitions = 0
        resolved_petitions = 0
        
        if self.case_type == 'criminal':
            from criminal_proceedings.models import PetitionCriminal
            try:
                total_petitions = PetitionCriminal.objects.filter(criminal_proceedings=self.case).count()
                resolved_petitions = PetitionCriminal.objects.filter(
                    criminal_proceedings=self.case,
                    petitions_incase__date_decision__isnull=False
                ).count()
            except Exception:
                pass
        elif self.case_type == 'civil':
            from civil_proceedings.models import CivilPetition
            try:
                total_petitions = CivilPetition.objects.filter(civil_proceedings=self.case).count()
                resolved_petitions = CivilPetition.objects.filter(
                    civil_proceedings=self.case,
                    petitions_incase__date_decision__isnull=False
                ).count()
            except Exception:
                pass
        elif self.case_type == 'kas':
            from administrative_proceedings.models import KasPetition
            try:
                total_petitions = KasPetition.objects.filter(kas_proceedings=self.case).count()
                resolved_petitions = KasPetition.objects.filter(
                    kas_proceedings=self.case,
                    petitions_incase__date_decision__isnull=False
                ).count()
            except Exception:
                pass
        elif self.case_type == 'coap':
            from administrative_code.models import AdministrativePetition
            try:
                total_petitions = AdministrativePetition.objects.filter(administrative_proceedings=self.case).count()
                resolved_petitions = AdministrativePetition.objects.filter(
                    administrative_proceedings=self.case,
                    petitions_incase__date_decision__isnull=False
                ).count()
            except Exception:
                pass

        return {
            'total_days_in_progress': total_days,
            'postponement_count': getattr(self.case, 'postponement_count', 0) or 0,
            'total_petitions': total_petitions,
            'resolved_petitions': resolved_petitions,
            'pending_petitions': total_petitions - resolved_petitions,
        }