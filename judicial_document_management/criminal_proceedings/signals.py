# criminal_proceedings/signals.py
"""
Автоматическое заполнение справочного листа (форма № 19)
по значимым процессуальным действиям уголовного дела.

Логика:
- pre_save  — запоминаем предыдущее состояние полей в instance._previous_state
- post_save — сравниваем и создаём CaseProgressEntry при изменениях
"""

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import logging

from .models import (
    CriminalProceedings,
    Defendant,
    CriminalDecision,
    CriminalCaseMovement,
    CriminalExecution,
    CriminalRuling,
)
from case_management.models import CaseProgressEntry, ProgressActionType

logger = logging.getLogger(__name__)


# ============================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================================

def _get_action_type(code):
    """Возвращает ProgressActionType по коду или None."""
    return ProgressActionType.objects.filter(code=code, is_active=True).first()


def _create_progress(instance, code, description, action_date=None, author=None):
    """
    Универсальное создание записи справочного листа.
    instance — объект дела (CriminalProceedings) или объект, у которого есть
               criminal_proceedings (Defendant, CriminalDecision и т.д.)
    """
    try:
        action_type = _get_action_type(code)
        if not action_type:
            logger.warning(
                "ProgressActionType с кодом '%s' не найден — "
                "запись в справочном листе не создана.", code
            )
            return None

        # Определяем «дело» и объект для ContentType
        case_obj = getattr(instance, 'criminal_proceedings', instance)
        content_type = ContentType.objects.get_for_model(case_obj)

        entry = CaseProgressEntry.objects.create(
            case_content_type=content_type,
            case_object_id=case_obj.id,
            action_type=action_type,
            description=description or '',
            action_date=action_date or timezone.now().date(),
            author=author,
        )
        logger.info(
            "Справочный лист: [%s] %s (дело id=%s)",
            code, description, case_obj.id
        )
        return entry
    except Exception as e:
        logger.error("Ошибка создания записи справочного листа (%s): %s", code, e)
        return None


def _changed(prev, new):
    """Сравнение с учётом None/пустых значений."""
    return (prev or None) != (new or None)


# Поля, которые отслеживаем в pre_save (состояние «до»)
TRACKED_FIELDS = [
    # Раздел А
    'judge_acceptance_date',
    'judge_decision',
    'preliminary_hearing_date',
    'preliminary_hearing_result',
    'date_suspension_case',
    'suspension_reason_code',
    'resumption_date',  # если добавите поле — заработает
    # Раздел C
    'sentence_date',
    'sentence_result',
    'sentence_effective_date',
    'sentence_execution_date',
    'execution_sent_date',
    'execution_sent_to',
    # Раздел 18 (соединение/выделение, экспертиза, конфискация, штраф)
    'joined_with_case',
    'separated_to_case',
    'expertise_type',
    'expertise_sent_date',
    'expertise_received_date',
    'confiscation_applied',
    'court_fine_applied',
    'court_fine_amount',
    # Особые отметки / архив
    'case_result',
    'private_rulings_count',
    'case_to_office_date',
    'status',
    'archived_date',
]


# ============================================================
# 1. ПОСТУПЛЕНИЕ ДЕЛА (создание)
# ============================================================

@receiver(post_save, sender=CriminalProceedings)
def create_progress_on_criminal_creation(sender, instance, created, **kwargs):
    """Поступление дела в суд (п. 1 формы № 19)."""
    if not created:
        return
    description = f"Дело №{instance.case_number_criminal} поступило в суд"
    if instance.incoming_from:
        description += f" ({instance.incoming_from})"
    _create_progress(
        instance,
        code='case_received',
        description=description,
        action_date=instance.incoming_date or timezone.now().date(),
    )


# ============================================================
# 2. PRE_SAVE — запоминаем предыдущее состояние
# ============================================================

@receiver(pre_save, sender=CriminalProceedings)
def cache_previous_criminal_state(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_state = None
        return
    try:
        prev = sender.objects.get(pk=instance.pk)
        instance._previous_state = {
            field: getattr(prev, field, None) for field in TRACKED_FIELDS
        }
    except sender.DoesNotExist:
        instance._previous_state = None


# ============================================================
# 3. POST_SAVE — сравнение и создание записей по изменениям
# ============================================================

@receiver(post_save, sender=CriminalProceedings)
def track_criminal_changes(sender, instance, created, **kwargs):
    """Отслеживание изменений значимых полей дела."""
    if created:
        return  # поступление обработано выше

    prev = getattr(instance, '_previous_state', None)
    if not prev:
        return

    today = timezone.now().date()
    case_no = instance.case_number_criminal

    # --- Принятие дела судьёй ---
    if _changed(prev.get('judge_acceptance_date'), instance.judge_acceptance_date):
        _create_progress(
            instance,
            code='judge_acceptance',
            description=f"Дело №{case_no} принято судьёй к производству",
            action_date=instance.judge_acceptance_date or today,
        )

    # --- Решение судьи при назначении ---
    if _changed(prev.get('judge_decision'), instance.judge_decision):
        decision_display = instance.get_judge_decision_display() if instance.judge_decision else 'решение отменено'
        _create_progress(
            instance,
            code='judge_decision',
            description=f"Решение судьи: {decision_display}",
            action_date=today,
        )

    # --- Предварительное слушание ---
    if _changed(prev.get('preliminary_hearing_date'), instance.preliminary_hearing_date):
        _create_progress(
            instance,
            code='preliminary_hearing',
            description=f"Назначено предварительное слушание на "
                        f"{instance.preliminary_hearing_date or '—'}",
            action_date=today,
        )

    if _changed(prev.get('preliminary_hearing_result'), instance.preliminary_hearing_result):
        result_display = instance.get_preliminary_hearing_result_display() \
            if instance.preliminary_hearing_result else ''
        _create_progress(
            instance,
            code='preliminary_hearing_result',
            description=f"Результат предварительного слушания: {result_display}",
            action_date=instance.preliminary_hearing_date or today,
        )

    # --- Приостановление производства ---
    if _changed(prev.get('date_suspension_case'), instance.date_suspension_case) \
            and instance.date_suspension_case:
        reason = instance.get_suspension_reason_code_display() \
            if instance.suspension_reason_code else ''
        _create_progress(
            instance,
            code='case_suspended',
            description=f"Производство приостановлено. Причина: {reason}",
            action_date=instance.date_suspension_case,
        )

    # --- Приговор ---
    if _changed(prev.get('sentence_date'), instance.sentence_date) and instance.sentence_date:
        _create_progress(
            instance,
            code='sentence',
            description=f"Вынесен приговор от {instance.sentence_date}",
            action_date=instance.sentence_date,
        )

    if _changed(prev.get('sentence_result'), instance.sentence_result):
        _create_progress(
            instance,
            code='sentence_result',
            description=f"Результат: {instance.sentence_result}",
            action_date=today,
        )

    # --- Вступление в силу ---
    if _changed(prev.get('sentence_effective_date'), instance.sentence_effective_date) \
            and instance.sentence_effective_date:
        _create_progress(
            instance,
            code='sentence_effective',
            description=f"Приговор вступил в законную силу {instance.sentence_effective_date}",
            action_date=instance.sentence_effective_date,
        )

    # --- Обращение к исполнению ---
    if _changed(prev.get('sentence_execution_date'), instance.sentence_execution_date) \
            and instance.sentence_execution_date:
        _create_progress(
            instance,
            code='sentence_execution',
            description=f"Приговор обращён к исполнению {instance.sentence_execution_date}",
            action_date=instance.sentence_execution_date,
        )

    # --- Направление для исполнения ---
    if _changed(prev.get('execution_sent_date'), instance.execution_sent_date) \
            and instance.execution_sent_date:
        to = instance.execution_sent_to or ''
        _create_progress(
            instance,
            code='execution_sent',
            description=f"Приговор направлен для исполнения: {to}".strip(': '),
            action_date=instance.execution_sent_date,
        )

    # --- Экспертиза ---
    if _changed(prev.get('expertise_sent_date'), instance.expertise_sent_date) \
            and instance.expertise_sent_date:
        exp_type = instance.expertise_type.name if instance.expertise_type else ''
        _create_progress(
            instance,
            code='expertise_sent',
            description=f"Дело направлено на экспертизу. Вид: {exp_type}",
            action_date=instance.expertise_sent_date,
        )

    if _changed(prev.get('expertise_received_date'), instance.expertise_received_date) \
            and instance.expertise_received_date:
        _create_progress(
            instance,
            code='expertise_received',
            description="Поступило заключение эксперта",
            action_date=instance.expertise_received_date,
        )

    # --- Соединение/выделение дел ---
    if _changed(prev.get('joined_with_case'), instance.joined_with_case) \
            and instance.joined_with_case:
        _create_progress(
            instance,
            code='case_joined',
            description=f"Дело соединено с делом №{instance.joined_with_case}",
            action_date=today,
        )

    if _changed(prev.get('separated_to_case'), instance.separated_to_case) \
            and instance.separated_to_case:
        _create_progress(
            instance,
            code='case_separated',
            description=f"Из дела выделено дело №{instance.separated_to_case}",
            action_date=today,
        )

    # --- Конфискация ---
    if _changed(prev.get('confiscation_applied'), instance.confiscation_applied) \
            and instance.confiscation_applied:
        _create_progress(
            instance,
            code='confiscation',
            description="Применена конфискация имущества",
            action_date=today,
        )

    # --- Судебный штраф ---
    if _changed(prev.get('court_fine_applied'), instance.court_fine_applied) \
            and instance.court_fine_applied:
        _create_progress(
            instance,
            code='court_fine',
            description=f"Назначен судебный штраф на сумму {instance.court_fine_amount or '—'} руб.",
            action_date=today,
        )

    # --- Частные определения ---
    if _changed(prev.get('private_rulings_count'), instance.private_rulings_count) \
            and instance.private_rulings_count:
        _create_progress(
            instance,
            code='private_ruling',
            description=f"Вынесено частных определений: {instance.private_rulings_count}",
            action_date=instance.private_rulings_date or today,
        )

    # --- Сдача в делопроизводство ---
    if _changed(prev.get('case_to_office_date'), instance.case_to_office_date) \
            and instance.case_to_office_date:
        _create_progress(
            instance,
            code='case_to_office',
            description="Дело сдано в отдел делопроизводства",
            action_date=instance.case_to_office_date,
        )

    # --- Результат рассмотрения дела ---
    if _changed(prev.get('case_result'), instance.case_result) and instance.case_result:
        result_display = instance.get_case_result_display() if instance.case_result else ''
        _create_progress(
            instance,
            code='case_result',
            description=f"Результат рассмотрения дела: {result_display}",
            action_date=instance.consideration_date or today,
        )

    # --- Архив ---
    if _changed(prev.get('status'), instance.status):
        if instance.status == 'archived':
            _create_progress(
                instance,
                code='case_archived',
                description="Дело сдано в архив",
                action_date=instance.archived_date or today,
            )
        elif prev.get('status') == 'archived':
            _create_progress(
                instance,
                code='case_unarchived',
                description="Дело возвращено из архива",
                action_date=today,
            )


# ============================================================
# 4. ОБВИНЯЕМЫЕ (Defendant) — меры пресечения и результат
# ============================================================

@receiver(pre_save, sender=Defendant)
def cache_previous_defendant_state(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_state = None
        return
    try:
        prev = sender.objects.get(pk=instance.pk)
        instance._previous_state = {
            'restraint_measure': prev.restraint_measure,
            'restraint_change': prev.restraint_change,
            'trial_result': prev.trial_result,
        }
    except sender.DoesNotExist:
        instance._previous_state = None


@receiver(post_save, sender=Defendant)
def track_defendant_changes(sender, instance, created, **kwargs):
    if created:
        # факт включения лица в дело — можно зафиксировать
        _create_progress(
            instance,
            code='defendant_added',
            description=f"В дело включён обвиняемый: {instance.full_name_criminal}",
        )
        return

    prev = getattr(instance, '_previous_state', None)
    if not prev:
        return

    if _changed(prev.get('restraint_measure'), instance.restraint_measure) \
            and instance.restraint_measure:
        measure = instance.get_restraint_measure_display()
        _create_progress(
            instance,
            code='restraint_measure',
            description=f"Мера пресечения ({instance.full_name_criminal}): {measure}",
            action_date=instance.restraint_date or timezone.now().date(),
        )

    if _changed(prev.get('restraint_change'), instance.restraint_change) \
            and instance.restraint_change == '1':
        _create_progress(
            instance,
            code='restraint_changed',
            description=f"Изменена мера пресечения ({instance.full_name_criminal}) "
                        f"на: {instance.restraint_change_to or '—'}",
            action_date=instance.restraint_change_date or timezone.now().date(),
        )

    if _changed(prev.get('trial_result'), instance.trial_result) \
            and instance.trial_result:
        _create_progress(
            instance,
            code='defendant_result',
            description=f"Результат по лицу ({instance.full_name_criminal}): "
                        f"{instance.trial_result}",
        )


# ============================================================
# 5. СУДЕБНЫЕ РЕШЕНИЯ (CriminalDecision)
# ============================================================

@receiver(post_save, sender=CriminalDecision)
def track_criminal_decision_creation(sender, instance, created, **kwargs):
    if not created:
        return
    name = instance.name_case.name if instance.name_case else 'Решение'
    _create_progress(
        instance,
        code='decision_created',
        description=f"Вынесено решение: {name}",
        action_date=instance.appeal_date or timezone.now().date(),
    )


# ============================================================
# 6. ДВИЖЕНИЕ ДЕЛА (CriminalCaseMovement)
# ============================================================

@receiver(post_save, sender=CriminalCaseMovement)
def track_criminal_movement(sender, instance, created, **kwargs):
    if not created:
        return
    bm = instance.business_movement
    if not bm:
        return
    result = ''
    if bm.court_session_result:
        result = f" — {bm.court_session_result.name}"
    _create_progress(
        instance,
        code='court_session',
        description=f"Судебное заседание {bm.date_meeting} {bm.meeting_time}{result}",
        action_date=bm.date_meeting,
    )


# ============================================================
# 7. ИСПОЛНЕНИЕ (CriminalExecution)
# ============================================================

@receiver(post_save, sender=CriminalExecution)
def track_criminal_execution(sender, instance, created, **kwargs):
    if not created:
        return
    to = instance.execution_sent_to or ''
    doc = instance.get_execution_sent_document_display() \
        if instance.execution_sent_document else ''
    desc = "Создана запись об исполнении"
    if to:
        desc += f": направлено в {to}"
    if doc:
        desc += f" ({doc})"
    _create_progress(
        instance,
        code='execution_record',
        description=desc,
        action_date=instance.execution_sent_date or timezone.now().date(),
    )


# ============================================================
# 8. ПОСТАНОВЛЕНИЯ (CriminalRuling)
# ============================================================

@receiver(post_save, sender=CriminalRuling)
def track_criminal_ruling(sender, instance, created, **kwargs):
    if not created:
        return
    _create_progress(
        instance,
        code='ruling_created',
        description=f"Вынесено постановление: {instance.title}",
        action_date=timezone.now().date(),
    )
