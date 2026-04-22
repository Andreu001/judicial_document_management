from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from users.models import User
from business_card.models import (
    SidesCase, SidesCaseInCase, Lawyer,
    PetitionsInCase, BusinessMovement
)
import logging

logger = logging.getLogger(__name__)


# administrative_code/models.py (добавить в начало файла, после импортов)

class AdmissionOrder(models.Model):
    """Справочник: Порядок поступления дела"""
    code = models.CharField(max_length=5, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Порядок поступления"
        verbose_name_plural = "Порядок поступления"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class PostponementReason(models.Model):
    """Справочник: Причины отложения дела"""
    code = models.CharField(max_length=5, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Причина отложения"
        verbose_name_plural = "Причины отложения"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class SuspensionReason(models.Model):
    """Справочник: Причины приостановления производства"""
    code = models.CharField(max_length=2, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Причина приостановления"
        verbose_name_plural = "Причины приостановления"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class PreliminaryProtection(models.Model):
    """Справочник: Меры предварительной защиты"""
    code = models.CharField(max_length=2, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Мера предварительной защиты"
        verbose_name_plural = "Меры предварительной защиты"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class ExpertiseType(models.Model):
    """Справочник: Виды экспертиз"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Вид экспертизы"
        verbose_name_plural = "Виды экспертиз"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class AppealResult(models.Model):
    """Справочник: Результаты апелляционного рассмотрения"""
    code = models.CharField(max_length=2, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Результат апелляции"
        verbose_name_plural = "Результаты апелляции"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class CassationResult(models.Model):
    """Справочник: Результаты кассационного рассмотрения"""
    code = models.CharField(max_length=2, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Результат кассации"
        verbose_name_plural = "Результаты кассации"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class TermCompliance(models.Model):
    """Справочник: Соблюдение сроков рассмотрения"""
    code = models.CharField(max_length=5, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Соблюдение сроков"
        verbose_name_plural = "Соблюдение сроков"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class Outcome(models.Model):
    """Справочник: Результаты рассмотрения дела"""
    code = models.CharField(max_length=5, unique=True, verbose_name="Код")
    label = models.CharField(max_length=255, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Результат рассмотрения"
        verbose_name_plural = "Результаты рассмотрения"
        ordering = ['id']
    
    def __str__(self):
        return self.label


class ReferringAuthorityKas(models.Model):
    """Органы, составившие протокол (для КАС)"""
    name = models.CharField(max_length=255, verbose_name="Название органа")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)

    class Meta:
        verbose_name = "Орган, составивший протокол (КАС)"
        verbose_name_plural = "Органы, составившие протокол (КАС)"
        ordering = ['name']

    def __str__(self):
        return self.name


class KasProceedings(models.Model):
    """
    Учетно-статистическая карточка дела административного судопроизводства (КАС РФ).
    Полная версия в соответствии с Инструкцией по ведению судебной статистики.
    """
    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('completed', 'Рассмотрено'),
        ('execution', 'На исполнении'),
        ('archived', 'В архиве'),
    ]

    # ------------------- I. ДОСУДЕБНАЯ ПОДГОТОВКА -------------------
    case_number_kas = models.CharField(max_length=100, unique=True, verbose_name="Номер дела (КАС)")
    incoming_date = models.DateField(verbose_name="Дата поступления дела в суд", null=True, blank=True)
    incoming_from = models.CharField(max_length=255, verbose_name="Откуда поступило дело", null=True, blank=True)
    is_collective_claim = models.BooleanField(verbose_name="Коллективное исковое заявление", default=False, null=True, blank=True)
    number_of_plaintiffs = models.PositiveIntegerField(verbose_name="Количество истцов", null=True, blank=True)
    admission_order = models.CharField(max_length=5, verbose_name="Порядок поступления", null=True, blank=True) # Справочник admission_order.csv
    related_case_number = models.CharField(max_length=100, verbose_name="№ связанного/первичного дела", null=True, blank=True)
    previous_court_code = models.CharField(max_length=50, verbose_name="Код суда (для повторных/из др. суда)", null=True, blank=True)
    state_duty_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Сумма госпошлины (руб.)", null=True, blank=True)
    state_duty_payer = models.CharField(max_length=255, verbose_name="Кем уплачена госпошлина", null=True, blank=True)
    presiding_judge = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role': 'judge'}, verbose_name="Судья (председательствующий)")
    judge_code = models.CharField(max_length=50, verbose_name="Код судьи", null=True, blank=True)
    acceptance_date = models.DateField(verbose_name="Дата принятия дела к производству", null=True, blank=True)
    transfer_date = models.DateField(verbose_name="Дата передачи дела другому судье", null=True, blank=True)
    ruling_preparation = models.BooleanField(verbose_name="Определение о подготовке дела", default=False, null=True, blank=True)
    ruling_preparation_date = models.DateField(verbose_name="Дата определения о подготовке", null=True, blank=True)
    is_simplified_procedure = models.BooleanField(verbose_name="Рассмотрение в упрощенном производстве", default=False, null=True, blank=True)
    control_date = models.DateField(verbose_name="Контрольный срок", null=True, blank=True)
    ruling_preliminary_hearing = models.BooleanField(verbose_name="Определение о назначении предварительного заседания", default=False, null=True, blank=True)
    preliminary_hearing_date = models.DateField(verbose_name="Дата предварительного заседания", null=True, blank=True)
    ruling_closed_hearing = models.BooleanField(verbose_name="Определение о назначении закрытого заседания (ст. 11 КАС РФ)", default=False, null=True, blank=True)
    ruling_court_order = models.BooleanField(verbose_name="Определение о направлении судебного поручения", default=False, null=True, blank=True)
    court_order_sent_date = models.DateField(verbose_name="Дата направления суд. поручения", null=True, blank=True)
    court_order_received_date = models.DateField(verbose_name="Дата поступления исполненного поручения", null=True, blank=True)
    ruling_expertise = models.BooleanField(verbose_name="Определение о назначении экспертизы", default=False, null=True, blank=True)
    expertise_sent_date = models.DateField(verbose_name="Дата направления на экспертизу", null=True, blank=True)
    expertise_received_date = models.DateField(verbose_name="Дата возвращения с экспертизы", null=True, blank=True)
    expertise_institution = models.CharField(max_length=255, verbose_name="Экспертное учреждение", null=True, blank=True)
    expertise_type = models.CharField(max_length=255, verbose_name="Вид экспертизы", null=True, blank=True) # Справочник expertise_types.csv
    
    # Меры предварительной защиты (справочник preliminary_protection.csv)
    preliminary_protection = models.CharField(max_length=2, verbose_name="Меры предварительной защиты", null=True, blank=True)
    preliminary_protection_date = models.DateField(verbose_name="Дата назначения мер предварительной защиты", null=True, blank=True)
    
    ruling_transition_to_general = models.BooleanField(verbose_name="Определение о переходе к общему порядку", default=False, null=True, blank=True)
    ruling_transition_date = models.DateField(verbose_name="Дата перехода к общему порядку", null=True, blank=True)
    ruling_scheduled_trial = models.BooleanField(verbose_name="Определение о назначении дела к судебному разбирательству", default=False, null=True, blank=True)
    scheduled_trial_date = models.DateField(verbose_name="Дата назначения дела к разбирательству", null=True, blank=True)
    case_category = models.CharField(max_length=255, verbose_name="Категория дела (по классификатору)", null=True, blank=True)
    legal_relationship_sphere = models.CharField(max_length=255, verbose_name="Сфера правоотношений (по гл. 22 КАС РФ)", null=True, blank=True)
    is_state_secret = models.BooleanField(verbose_name="Связано с государственной тайной", default=False, null=True, blank=True)
    is_election_period = models.BooleanField(verbose_name="В период избирательной кампании", default=False, null=True, blank=True)
    election_case_deadline_days = models.PositiveIntegerField(verbose_name="Срок для доп. проверки по изб. делам (дней)", null=True, blank=True)
    
    # ------------------- II. ДВИЖЕНИЕ ДЕЛА -------------------
    hearing_date = models.DateField(verbose_name="Дата рассмотрения (последнего заседания)", null=True, blank=True)
    is_vcs_used = models.BooleanField(verbose_name="С использованием ВКС", default=False, null=True, blank=True)
    is_audio_recorded = models.BooleanField(verbose_name="Аудиозапись", default=False, null=True, blank=True)
    is_video_recorded = models.BooleanField(verbose_name="Видеозапись", default=False, null=True, blank=True)
    hearing_postponed = models.BooleanField(verbose_name="Дело откладывалось", default=False, null=True, blank=True)
    postponement_count = models.PositiveIntegerField(verbose_name="Количество отложений", default=0, null=True, blank=True)
    
    # Причина отложения (справочник kas_postponement_reason.csv)
    postponement_reason = models.CharField(max_length=5, verbose_name="Причина отложения", null=True, blank=True)
    postponement_reason_text = models.TextField(verbose_name="Иная причина отложения (текстом)", null=True, blank=True)
    
    case_suspended = models.BooleanField(verbose_name="Производство по делу приостанавливалось", default=False, null=True, blank=True)
    suspension_date = models.DateField(verbose_name="Дата приостановления", null=True, blank=True)
    # Причина приостановления (справочник suspension_reason.csv)
    suspension_reason = models.CharField(max_length=2, verbose_name="Основание приостановления", null=True, blank=True)
    suspension_reason_text = models.TextField(verbose_name="Иное основание приостановления", null=True, blank=True)
    suspension_clause = models.CharField(max_length=10, verbose_name="Пункт, часть, статья", null=True, blank=True)
    suspension_article = models.CharField(max_length=50, verbose_name="Статья (190, 191 КАС РФ)", null=True, blank=True)
    resumption_date = models.DateField(verbose_name="Дата возобновления производства", null=True, blank=True)
    suspension_duration_days = models.PositiveIntegerField(verbose_name="Продолжительность приостановления (дней)", null=True, blank=True)
    reconciliation_deadline_date = models.DateField(verbose_name="Срок для примирения до", null=True, blank=True)
    
    # ------------------- IV. ОБЖАЛОВАНИЕ (Апелляция) -------------------
    # Эти поля теперь в основной модели, так как относятся к движению дела
    is_appealed = models.BooleanField(verbose_name="Обжаловано (апелляция)", default=False, null=True, blank=True)
    appealed_by = models.TextField(verbose_name="Кем обжаловано (апелляция)", null=True, blank=True)
    appeal_date = models.DateField(verbose_name="Дата подачи апелляционной жалобы/представления", null=True, blank=True)
    appeal_type = models.CharField(max_length=2, choices=[('1', 'Жалоба'), ('2', 'Представление прокурора')], verbose_name="Тип обжалования (апелляция)", null=True, blank=True)
    appeal_deadline_for_corrections = models.DateField(verbose_name="Срок для устранения недостатков апелляционной жалобы до", null=True, blank=True)
    appeal_scheduled_date = models.DateField(verbose_name="Дело назначено к рассмотрению в апелляции на", null=True, blank=True)
    appeal_scheduled_date_repeated = models.DateField(verbose_name="Повторно назначено в апелляции на", null=True, blank=True)
    appeal_sent_to_higher_court_date = models.DateField(verbose_name="Дата направления дела в апелляционный суд", null=True, blank=True)
    appeal_sent_to_higher_court_repeated = models.DateField(verbose_name="Дата повторного направления в апелляционный суд", null=True, blank=True)
    appeal_returned_without_review_date = models.DateField(verbose_name="Дата возврата апелляционной жалобы без рассмотрения", null=True, blank=True)
    appeal_return_reason = models.TextField(verbose_name="Причина возврата апелляционной жалобы", null=True, blank=True)
    appeal_review_date = models.DateField(verbose_name="Дата рассмотрения дела в апелляционной инстанции", null=True, blank=True)
    # Результат апелляции (справочник kas_appeal_result.csv)
    appeal_result = models.CharField(max_length=2, verbose_name="Результат апелляционного рассмотрения", null=True, blank=True)
    
    # ------------------- IV. ОБЖАЛОВАНИЕ (Кассация) -------------------
    is_cassation_filed = models.BooleanField(verbose_name="Подана кассационная жалоба/представление", default=False, null=True, blank=True)
    cassation_filed_by = models.TextField(verbose_name="Кем подана кассационная жалоба/представление", null=True, blank=True)
    cassation_date = models.DateField(verbose_name="Дата подачи кассационной жалобы/представления", null=True, blank=True)
    cassation_type = models.CharField(max_length=2, choices=[('1', 'Жалоба'), ('2', 'Представление прокурора')], verbose_name="Тип обжалования (кассация)", null=True, blank=True)
    cassation_deadline_for_corrections = models.DateField(verbose_name="Срок для устранения недостатков кассационной жалобы до", null=True, blank=True)
    cassation_scheduled_date = models.DateField(verbose_name="Дело назначено к рассмотрению в кассации на", null=True, blank=True)
    cassation_sent_to_higher_court_date = models.DateField(verbose_name="Дата направления дела в кассационный суд", null=True, blank=True)
    cassation_returned_without_review_date = models.DateField(verbose_name="Дата возврата кассационной жалобы без рассмотрения", null=True, blank=True)
    cassation_return_reason = models.TextField(verbose_name="Причина возврата кассационной жалобы", null=True, blank=True)
    cassation_review_date = models.DateField(verbose_name="Дата рассмотрения дела в кассационной инстанции", null=True, blank=True)
    # Результат кассации (справочник kas_cassation_result.csv)
    cassation_result = models.CharField(max_length=2, verbose_name="Результат кассационного рассмотрения", null=True, blank=True)
    
    # ------------------- VII. ОСОБЫЕ ОТМЕТКИ И АРХИВ -------------------
    special_notes = models.TextField(verbose_name="Особые отметки", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Статус дела")
    archived_date = models.DateField(verbose_name="Дата сдачи в архив", null=True, blank=True)
    archive_notes = models.TextField(verbose_name="Примечания по архивному делу", null=True, blank=True)
    registered_case = models.OneToOneField('case_registry.RegisteredCase', on_delete=models.SET_NULL, null=True, blank=True, related_name='kas_proceedings_link', verbose_name="Зарегистрированное дело")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Административное судопроизводство (КАС)"
        verbose_name_plural = "Административные судопроизводства (КАС)"
        ordering = ['-incoming_date']

    def __str__(self):
        return f"Дело КАС № {self.case_number_kas}"


class KasDecision(models.Model):
    """
    Решения по делу КАС (раздел III + обжалование).
    """
    kas_proceedings = models.ForeignKey(KasProceedings, on_delete=models.CASCADE, related_name='kas_decisions', verbose_name="Производство КАС")

    # ------------------- III. РЕЗУЛЬТАТ РАССМОТРЕНИЯ -------------------
    decision_date = models.DateField(verbose_name="Дата рассмотрения дела", null=True, blank=True)
    motivated_decision_date = models.DateField(verbose_name="Дата составления мотивированного решения", null=True, blank=True)
    is_simplified_procedure = models.BooleanField(verbose_name="Рассмотрено в упрощенном производстве", default=False, null=True, blank=True)
    decision_type = models.CharField(max_length=2, choices=[('1', 'Решение (постановление, определение судьи)')], verbose_name="Вид судебного постановления", default='1')
    is_default_judgment = models.BooleanField(verbose_name="Рассмотрено без участия адм. ответчика", default=False, null=True, blank=True)
    outcome = models.CharField(max_length=5, verbose_name="Результат рассмотрения (основное требование)", null=True, blank=True) # Справочник kas_outcome.csv
    outcome_clause = models.CharField(max_length=10, verbose_name="Пункт, часть, статья прекращения/оставления", null=True, blank=True)
    outcome_article = models.CharField(max_length=50, verbose_name="Статья (194, 196 КАС РФ)", null=True, blank=True)
    transferred_to_court = models.CharField(max_length=255, verbose_name="Суд, в который передано дело", null=True, blank=True)
    conciliation_procedure = models.BooleanField(verbose_name="Примирительные процедуры", default=False, null=True, blank=True)
    conciliation_type = models.CharField(max_length=2, choices=[('1', 'Медиация'), ('2', 'Судебное примирение'), ('3', 'Переговоры')], verbose_name="Вид примирительной процедуры", null=True, blank=True)
    conciliation_result = models.CharField(max_length=5, choices=[('1', 'Спор урегулирован'), ('1.1', ' - с заключением мирового соглашения'), ('2', 'Не урегулирован')], verbose_name="Результат примирения", null=True, blank=True)
    ruling_refusal_of_claim = models.BooleanField(verbose_name="Определение о непринятии отказа истца от иска", default=False, null=True, blank=True)
    ruling_refusal_of_recognition = models.BooleanField(verbose_name="Определение о непринятии признания иска ответчиком", default=False, null=True, blank=True)
    ruling_refusal_of_settlement = models.BooleanField(verbose_name="Определение об отказе в утверждении соглашения о примирении", default=False, null=True, blank=True)
    awarded_amount_main = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Присуждено к взысканию по осн. треб. (руб.)", null=True, blank=True)
    awarded_amount_additional = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Присуждено к взысканию по доп. треб. (руб.)", null=True, blank=True)
    state_duty_to_state = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Госпошлина в доход государства (руб.)", null=True, blank=True)
    legal_costs = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Судебные издержки (руб.)", null=True, blank=True)
    special_rulings_count = models.PositiveIntegerField(verbose_name="Количество вынесенных частных определений", default=0, null=True, blank=True)
    special_rulings_reports_received = models.PositiveIntegerField(verbose_name="Поступило сообщений по частным определениям", default=0, null=True, blank=True)
    court_composition = models.CharField(max_length=2, choices=[('1', 'Единолично судьей'), ('2', 'Коллегиально')], verbose_name="Состав суда, вынесший решение", null=True, blank=True)
    judges_list = models.TextField(verbose_name="Судьи (Ф.И.О.) при коллегиальном рассмотрении", null=True, blank=True)
    participant_prosecutor_state = models.BooleanField(verbose_name="Прокурор как представитель государства", default=False, null=True, blank=True)
    participant_prosecutor_plaintiff = models.BooleanField(verbose_name="Прокурор в интересах истца", default=False, null=True, blank=True)
    participant_gov_agency = models.BooleanField(verbose_name="Представитель гос. органов, организаций", default=False, null=True, blank=True)
    participant_public_org = models.BooleanField(verbose_name="Общественные организации", default=False, null=True, blank=True)
    participant_mass_media = models.BooleanField(verbose_name="СМИ", default=False, null=True, blank=True)
    participant_expert = models.BooleanField(verbose_name="Эксперт", default=False, null=True, blank=True)
    participant_specialist = models.BooleanField(verbose_name="Специалист", default=False, null=True, blank=True)
    participant_translator = models.BooleanField(verbose_name="Переводчик", default=False, null=True, blank=True)
    participant_minor = models.BooleanField(verbose_name="Несовершеннолетний", default=False, null=True, blank=True)
    consideration_duration_months = models.PositiveIntegerField(verbose_name="Продолжительность рассмотрения (мес.)", null=True, blank=True)
    consideration_duration_days = models.PositiveIntegerField(verbose_name="Продолжительность рассмотрения (дни)", null=True, blank=True)
    total_duration_months = models.PositiveIntegerField(verbose_name="Общая продолжительность (мес.)", null=True, blank=True)
    total_duration_days = models.PositiveIntegerField(verbose_name="Общая продолжительность (дни)", null=True, blank=True)
    term_compliance = models.CharField(max_length=5, verbose_name="Дело рассмотрено в сроки", null=True, blank=True) # Справочник term_compliance.csv
    deadline_start_date = models.DateField(verbose_name="Дата начала исчисления процесс. срока", null=True, blank=True)
    is_complex_case = models.BooleanField(verbose_name="Дело сложное", default=False, null=True, blank=True)
    submitted_to_department_date = models.DateField(verbose_name="Дата сдачи дела в отдел делопроизводства", null=True, blank=True)
    copies_sent_to_absentees_date = models.DateField(verbose_name="Копии направлены не явившимся лицам", null=True, blank=True)
    protocol_objections_filed = models.BooleanField(verbose_name="Принесены замечания на протокол", default=False, null=True, blank=True)
    protocol_objections_filed_date = models.DateField(verbose_name="Дата принесения замечаний", null=True, blank=True)
    protocol_objections_extended_deadline = models.BooleanField(verbose_name="Продлено по сложным делам", default=False, null=True, blank=True)
    protocol_objections_reviewed_date = models.DateField(verbose_name="Дата рассмотрения замечаний", null=True, blank=True)

    # ------------------- IV. ОБЖАЛОВАНИЕ РЕШЕНИЯ (Апелляция) -------------------
    decision_is_appealed = models.BooleanField(verbose_name="Решение обжаловано в апелляции", default=False, null=True, blank=True)
    decision_appeal_date = models.DateField(verbose_name="Дата подачи апелляционной жалобы на решение", null=True, blank=True)
    decision_appeal_review_date = models.DateField(verbose_name="Дата рассмотрения апелляции на решение", null=True, blank=True)
    decision_appeal_result = models.CharField(max_length=2, verbose_name="Результат апелляционного обжалования решения", null=True, blank=True) # Справочник kas_appeal_result.csv

    # ------------------- IV. ОБЖАЛОВАНИЕ РЕШЕНИЯ (Кассация) -------------------
    decision_is_cassation_filed = models.BooleanField(verbose_name="Решение обжаловано в кассации", default=False, null=True, blank=True)
    decision_cassation_date = models.DateField(verbose_name="Дата подачи кассационной жалобы на решение", null=True, blank=True)
    decision_cassation_review_date = models.DateField(verbose_name="Дата рассмотрения кассации на решение", null=True, blank=True)
    decision_cassation_result = models.CharField(max_length=2, verbose_name="Результат кассационного обжалования решения", null=True, blank=True) # Справочник kas_cassation_result.csv

    # ------------------- VI. ДРУГИЕ СУДЕБНЫЕ ПОСТАНОВЛЕНИЯ -------------------
    additional_decision_date = models.DateField(verbose_name="Дата дополнительного решения", null=True, blank=True)
    clarification_ruling_date = models.DateField(verbose_name="Дата определения о разъяснении решения", null=True, blank=True)
    execution_order_change_date = models.DateField(verbose_name="Дата определения об изменении порядка исполнения", null=True, blank=True)
    other_execution_ruling_date = models.DateField(verbose_name="Дата другого определения в порядке исполнения", null=True, blank=True)
    court_fines_imposed = models.BooleanField(verbose_name="Наложены судебные штрафы", default=False, null=True, blank=True)
    court_fines_details = models.TextField(verbose_name="Детали штрафов (определение от, №, сумма и т.д.)", null=True, blank=True)
    procedural_costs_details = models.TextField(verbose_name="Процессуальные издержки (кому, дата, сумма, дни)", null=True, blank=True)
    review_ruling_date = models.DateField(verbose_name="Дата определения о пересмотре по вновь открывшимся обстоятельствам", null=True, blank=True)

    class Meta:
        verbose_name = "Решение по делу КАС"
        verbose_name_plural = "Решения по делам КАС"
        ordering = ['-decision_date']

    def __str__(self):
        return f"Решение по делу {self.kas_proceedings.case_number_kas} от {self.decision_date}"


class KasExecution(models.Model):
    """
    Исполнение решения по делу КАС (раздел V).
    """
    kas_proceedings = models.ForeignKey(
        KasProceedings,
        on_delete=models.CASCADE,
        related_name='kas_executions',
        verbose_name="Производство КАС"
    )

    # ------------------- V. ИСПОЛНЕНИЕ -------------------
    decision_effective_date = models.DateField(
        verbose_name="Дата вступления решения в законную силу",
        null=True, blank=True
    )

    writ_sent_to_bailiff_date = models.DateField(
        verbose_name="Дата направления исп. листа суд. приставу",
        null=True, blank=True
    )
    writ_issued_to_claimant_date = models.DateField(
        verbose_name="Дата выдачи исп. листа взыскателю",
        null=True, blank=True
    )
    writ_sent_by_department_date = models.DateField(
        verbose_name="Дата направления отделом делопроизводства для исполнения",
        null=True, blank=True
    )

    execution_date = models.DateField(
        verbose_name="Дата исполнения",
        null=True, blank=True
    )
    execution_type = models.CharField(
        max_length=255,
        verbose_name="Вид взыскания",
        null=True, blank=True
    )
    execution_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Сумма взыскания (руб.)",
        null=True, blank=True
    )

    returned_from_bailiff_date = models.DateField(
        verbose_name="Дата возврата из подразделения ССП",
        null=True, blank=True
    )
    returned_type = models.CharField(
        max_length=255,
        verbose_name="Вид взыскания (при возврате)",
        null=True, blank=True
    )
    returned_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Сумма (при возврате)",
        null=True, blank=True
    )

    not_collected_reason = models.TextField(
        verbose_name="Основание не взыскания",
        null=True, blank=True
    )

    class Meta:
        verbose_name = "Исполнение по делу КАС"
        verbose_name_plural = "Исполнения по делам КАС"
        ordering = ['-decision_effective_date']

    def __str__(self):
        return f"Исполнение по делу {self.kas_proceedings.case_number_kas}"


# ----- Связки с business_card (аналогично гражданским) -----

class KasSidesCaseInCase(models.Model):
    """Стороны по делу КАС (истцы, ответчики, заинтересованные лица)"""
    kas_proceedings = models.ForeignKey(
        KasProceedings,
        on_delete=models.CASCADE,
        related_name='kas_sides',
        verbose_name="Производство КАС"
    )
    sides_case_incase = models.ForeignKey(
        SidesCaseInCase,
        on_delete=models.CASCADE,
        related_name='kas_sides',
        verbose_name="Данные стороны (ФИО/наименование, контакты)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='kas_sides',
        verbose_name="Роль стороны (адм. истец, адм. ответчик, заинтересованное лицо и т.д.)"
    )

    class Meta:
        verbose_name = "Сторона дела КАС"
        verbose_name_plural = "Стороны дела КАС"
        unique_together = ('kas_proceedings', 'sides_case_incase', 'sides_case_role')

    def __str__(self):
        return f"{self.sides_case_role} - {self.sides_case_incase}"


class KasLawyer(models.Model):
    """Представители в деле КАС"""
    kas_proceedings = models.ForeignKey(
        KasProceedings,
        on_delete=models.CASCADE,
        related_name='kas_lawyers',
        verbose_name="Производство КАС"
    )
    lawyer = models.ForeignKey(
        Lawyer,
        on_delete=models.CASCADE,
        related_name='kas_lawyers',
        verbose_name="Представитель (данные из business_card)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='kas_lawyers',
        verbose_name="Представитель какой стороны"
    )

    class Meta:
        verbose_name = "Представитель в деле КАС"
        verbose_name_plural = "Представители в делах КАС"

    def __str__(self):
        return f"{self.sides_case_role} - {self.lawyer}"


class KasCaseMovement(models.Model):
    """Движение дела (готовые записи из BusinessMovement)"""
    kas_proceedings = models.ForeignKey(
        KasProceedings,
        on_delete=models.CASCADE,
        related_name='kas_movements',
        verbose_name="Производство КАС"
    )
    business_movement = models.ForeignKey(
        BusinessMovement,
        on_delete=models.CASCADE,
        related_name='kas_movements',
        verbose_name="Движение дела (из business_card)"
    )

    class Meta:
        verbose_name = "Движение дела (КАС)"
        verbose_name_plural = "Движения дела (КАС)"
        ordering = ['-business_movement__date_meeting', '-business_movement__meeting_time']

    def __str__(self):
        return f"Движение по делу {self.kas_proceedings.case_number_kas} от {self.business_movement.date_meeting}"


class KasPetition(models.Model):
    """Ходатайства в деле КАС"""

    PETITIONER_TYPES = [
        ('kas_sides', 'Сторона по делу'),
        ('kas_lawyer', 'Представитель'),
    ]

    kas_proceedings = models.ForeignKey(
        KasProceedings,
        on_delete=models.CASCADE,
        related_name='kas_petitions',
        verbose_name="Производство КАС"
    )
    petitions_incase = models.ForeignKey(
        PetitionsInCase,
        on_delete=models.CASCADE,
        related_name='kas_petitions',
        verbose_name="Ходатайство"
    )

    # Поля для хранения информации о заявителе
    petitioner_type = models.CharField(
        max_length=20,
        choices=PETITIONER_TYPES,
        verbose_name="Тип заявителя",
        null=True,
        blank=True
    )
    petitioner_id = models.PositiveIntegerField(
        verbose_name="ID заявителя",
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = "Ходатайство в деле КАС"
        verbose_name_plural = "Ходатайства в делах КАС"
        indexes = [
            models.Index(fields=['petitioner_type', 'petitioner_id']),
        ]

    def __str__(self):
        return f"Ходатайство по делу {self.kas_proceedings.case_number_kas}"

    @property
    def petitioner(self):
        """Получение объекта заявителя"""
        if not self.petitioner_type or not self.petitioner_id:
            return None

        if self.petitioner_type == 'kas_sides':
            try:
                return KasSidesCaseInCase.objects.get(id=self.petitioner_id)
            except KasSidesCaseInCase.DoesNotExist:
                return None
        elif self.petitioner_type == 'kas_lawyer':
            try:
                return KasLawyer.objects.get(id=self.petitioner_id)
            except KasLawyer.DoesNotExist:
                return None
        return None

    @property
    def petitioner_info(self):
        """Получение информации о заявителе для отображения"""
        petitioner = self.petitioner
        if not petitioner:
            return None

        if self.petitioner_type == 'kas_sides':
            side_detail = petitioner.sides_case_incase
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'kas_sides',
                'type_label': 'Сторона',
                'name': side_detail.name if side_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Сторона',
                'detail': {
                    'name': side_detail.name if side_detail else None,
                    'phone': side_detail.phone if side_detail else None,
                    'address': side_detail.address if side_detail else None,
                }
            }
        elif self.petitioner_type == 'kas_lawyer':
            lawyer_detail = petitioner.lawyer
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'kas_lawyer',
                'type_label': 'Представитель',
                'name': lawyer_detail.law_firm_name if lawyer_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Представитель',
                'detail': {
                    'law_firm_name': lawyer_detail.law_firm_name if lawyer_detail else None,
                    'phone': lawyer_detail.law_firm_phone if lawyer_detail else None,
                }
            }
        return None


@receiver(post_delete, sender=KasCaseMovement)
def delete_related_business_movement(sender, instance, **kwargs):
    """Удалить связанный BusinessMovement при удалении KasCaseMovement"""
    if hasattr(instance, 'business_movement') and instance.business_movement:
        try:
            business_movement_id = instance.business_movement.id
            instance.business_movement.delete()
            logger.info(f"Deleted related BusinessMovement {business_movement_id} for KasCaseMovement {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting BusinessMovement: {e}")


@receiver(post_delete, sender=KasPetition)
def delete_related_petitions_incase(sender, instance, **kwargs):
    """Удалить связанный PetitionsInCase при удалении KasPetition"""
    if hasattr(instance, 'petitions_incase') and instance.petitions_incase:
        try:
            petitions_incase_id = instance.petitions_incase.id
            instance.petitions_incase.delete()
            logger.info(f"Deleted related PetitionsInCase {petitions_incase_id} for KasPetition {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting PetitionsInCase: {e}")