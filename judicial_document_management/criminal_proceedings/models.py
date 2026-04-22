from django.db import models
from business_card.models import (
                                SidesCase, Lawyer,
                                SidesCaseInCase, PetitionsInCase,
                                Petitions
                            )
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from django.db.models.signals import post_delete
from django.dispatch import receiver
import logging
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)


class ReferringAuthority(models.Model):
    """Органы, направившие материалы"""
    name = models.CharField(max_length=255, verbose_name="Название органа")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)

    class Meta:
        verbose_name = "Орган, направивший материалы"
        verbose_name_plural = "Органы, направившие материалы"
        ordering = ['name']

    def __str__(self):
        return self.name


class CriminalDecisions(models.Model):
    """Решения по уголовному делу"""
    name = models.CharField(max_length=255, verbose_name="Название решения")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)

    class Meta:
        verbose_name = "Решение по уголовному делу"
        verbose_name_plural = "Решения по уголовным делам"

    def __str__(self):
        return self.name


class CriminalAppeal(models.Model):
    """Апелляции по уголовному делу"""
    name = models.CharField(max_length=255, verbose_name="Название апелляции")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)

    class Meta:
        verbose_name = "Апелляция по уголовному делу"
        verbose_name_plural = "Апелляции по уголовным делам"

    def __str__(self):
        return self.name


class CriminalExpertiseType(models.Model):
    """Справочник видов экспертиз по уголовным делам"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Код")
    name = models.CharField(max_length=200, verbose_name="Наименование экспертизы")
    
    class Meta:
        verbose_name = "Вид экспертизы"
        verbose_name_plural = "Виды экспертиз"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class CriminalProceedings(models.Model):
    """
    Учетно-статистическая карточка уголовного дела (общие сведения).
    """

    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('completed', 'Рассмотрено'),
        ('execution', 'На исполнении'),
        ('archived', 'В архиве'),
    ]

    case_number_criminal = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name="Номер уголовного дела"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания",
        null=True,
        blank=True
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
        null=True,
        blank=True
    )
    # --- Раздел А. Сведения по делу ---
    number_of_persons = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Число лиц по делу"
    )
    evidence_present = models.BooleanField(
        null=True, blank=True, verbose_name="Наличие вещдоков"
    )
    evidence_reg_number = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="Рег. номер вещдок"
    )
    incoming_date = models.DateField(
        null=True, blank=True, verbose_name="Дата поступления дела в суд"
    )
    incoming_from = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Откуда поступило"
    )
    volume_count = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Количество томов"
    )
    referring_authority = models.ForeignKey(
        'ReferringAuthority',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Орган, направивший материалы"
    )
    # Пункт 2 - Порядок поступления дела (обновленный)
    case_order = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'с обвинительным заключением'),
            ('2', 'с обвинительным актом'),
            ('2.1', 'с обвинительным постановлением'),
            ('2.2', 'с ходатайством о прекращении дела и назначении судебного штрафа'),
            ('12', 'для применения мер медицинского характера в отношении невменяемого'),
            ('3', 'заявление в порядке частного обвинения'),
            ('8', 'материал в порядке частного обвинения (по подведомственности)'),
            ('4', 'выделено в отдельное производство'),
            ('5', 'по подсудности из другого суда'),
            ('6', 'после розыска обвиняемого'),
            ('7', 'после отмены судебного постановления вышестоящим судом'),
            ('9', 'после возвращения дела прокурору'),
            ('11', 'после отмены суд. постановления по новым или вновь открывшимся обстоятельствам'),
            ('11.1', 'в связи с правовой позицией Европейского Суда по правам человека'),
            ('11.2', 'в связи с постановлением Конституционного Суда РФ'),
            ('11.3', 'в связи с постановлением Президиума ВС РФ'),
            ('11.4', 'в связи с постановлением Пленума ВС РФ'),
            ('13', 'после отказа в удовлетворении ходатайства о прекращении уг. дела с назначением суд. штрафа'),
            ('13.1', 'после отказа в принятии к производству ходатайства о прекращении уг. дела с назначением суд. штрафа'),
            ('14', 'после отмены прекращения дела с назначением суд. штрафа'),
            ('15', 'после отмены принудительных мер медицинского характера'),
            ('16', 'после отмены принудительных мер воспитательного воздействия'),
        ],
        verbose_name="Порядок поступления дела"
    )

    # Дополнительные поля для пункта 2
    separated_case_number = models.CharField(
        max_length=100, null=True, blank=True,
        verbose_name="Номер дела, из которого выделено"
    )
    separated_case_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата выделения дела"
    )
    repeated_court_code = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name="Код суда при повторном поступлении"
    )
    repeated_primary_reg_number = models.CharField(
        max_length=100, null=True, blank=True,
        verbose_name="№ производства по первичной регистрации"
    )

    repeat_case = models.BooleanField(
        null=True, blank=True, verbose_name="Повторное поступление дела"
    )
    repeat_case_date = models.DateField(
        null=True, blank=True, verbose_name="Дата повторного поступления"
    )

    # Пункт 3 - Категория дела
    case_category_criminal = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'с участием лица, содержащегося под стражей'),
            ('2', 'с участием несовершеннолетнего'),
            ('3', 'с представлением прокурора об особом порядке проведения судебного заседания'),
        ],
        verbose_name="Категория дела"
    )

    judge_acceptance_date = models.DateField(
        null=True, blank=True, verbose_name="Дата принятия дела судьей"
    )

    # Пункт 5 - Решение судьи при назначении дела
    judge_decision = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'о направлении уголовного дела по подсудности'),
            ('2', 'о назначении предварительного слушания'),
            ('3', 'о назначении судебного заседания'),
            ('4', 'о назначении закрытого судебного заседания в соответствии со ст. 241 УПК РФ'),
        ],
        verbose_name="Решение судьи при назначении дела"
    )

    preliminary_hearing_grounds = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('229.2.1', 'Ходатайство об исключении доказательства (ч. 3 ст. 229 УПК РФ)'),
            ('229.2.2', 'Основания для возвращения дела прокурору (ст. 237 УПК РФ)'),
            ('229.2.3', 'Основания для приостановления или прекращения дела'),
            ('229.2.4.1', 'Ходатайство о проведении заседания без участия подсудимого (ч. 5 ст. 247 УПК РФ)'),
            ('229.2.5', 'Решение вопроса о рассмотрении дела с участием присяжных заседателей'),
            ('229.2.6', 'Наличие приговора с условным осуждением за ранее совершенное преступление'),
            ('229.2.7', 'Основания для выделения уголовного дела'),
            ('229.2.8', 'Ходатайство о соединении уголовных дел'),
            ('other', 'Иные основания по решению судьи'),
        ],
        verbose_name="Основания проведения предварительного слушания"
    )
    # Пункт 9 - Результат рассмотрения дела в целом
    case_result = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'вынесен приговор'),
            ('2', 'прекращено'),
            ('3', 'принудительные меры медицинского характера'),
            ('4', 'направлено по подсудности'),
            ('5', 'направлено по подведомственности прокурору, в орган следствия, дознания'),
            ('6', 'возвращено прокурору в порядке ст. 237 УПК РФ'),
            ('7', 'возвращено в связи с отказом в удовлетворении ходатайства о прекращении в порядке ст. 446.2 УПК РФ'),
            ('8', 'роспуск коллегии присяжных'),
        ],
        verbose_name="Результат рассмотрения дела в целом"
    )

    total_duration_days = models.IntegerField(
        null=True, blank=True, verbose_name="Общая продолжительность (дни)"
    )

    # Длительность рассмотрения дела
    case_duration_category = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        choices=[
            ('1', 'свыше 1,5 мес. до 3 мес. включительно'),
            ('2', 'свыше 3 мес. до 1 г. включительно'),
            ('3', 'свыше 1 г. до 2 л. включительно'),
            ('4', 'свыше 2 л. до 3 л. включительно'),
            ('5', 'свыше 3 л.'),
        ],
        verbose_name="Категория длительности рассмотрения"
    )
    judge_code = models.CharField(
        max_length=50, null=True, blank=True, verbose_name="Код судьи"
    )
    presiding_judge = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Председательствующий",
        limit_choices_to={'role': 'judge'}
    )
    # Пункт 10 - Состав суда
    composition_court = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'единолично судьей'),
            ('2', 'коллегией судей'),
            ('3', 'с участием присяжных заседателей'),
        ],
        verbose_name="Состав суда"
    )
    consideration_date = models.DateField(
        null=True, blank=True, verbose_name="Дата рассмотрения"
    )

    # Пункт 10.1 - Участие в процессе
    participation_prosecutor = models.BooleanField(
        null=True, blank=True, verbose_name="Участие прокурора"
    )
    participation_translator = models.BooleanField(
        null=True, blank=True, verbose_name="Участие переводчика"
    )
    participation_expert = models.BooleanField(
        null=True, blank=True, verbose_name="Участие эксперта"
    )
    participation_specialist = models.BooleanField(
        null=True, blank=True, verbose_name="Участие специалиста"
    )

    # Пункт 10.2 - Отсутствие участия
    absence_defendant = models.BooleanField(
        null=True, blank=True,
        verbose_name="Без участия подсудимого (ч. 5 ст. 247 УПК РФ)"
    )
    absence_lawyer = models.BooleanField(
        null=True, blank=True,
        verbose_name="Без участия адвоката у подсудимого"
    )
    absence_pmmh_person = models.BooleanField(
        null=True, blank=True,
        verbose_name="Без участия лица по делам о ПММХ (ч. 1 ст. 437 УПК РФ)"
    )

    # Пункт 10.3 - Закрытое заседание
    closed_hearing = models.BooleanField(
        null=True, blank=True,
        verbose_name="Рассмотрено в закрытом судебном заседании"
    )

    # Пункт 10.4 - Использование технологий
    vks_technology = models.BooleanField(
        null=True, blank=True, verbose_name="Использование ВКС"
        )
    audio_recording = models.BooleanField(
        null=True, blank=True, verbose_name="Использование аудиозаписи"
    )
    video_recording = models.BooleanField(
        null=True, blank=True, verbose_name="Использование видеозаписи"
    )

    # Особый порядок
    special_procedure_consent = models.BooleanField(
        null=True, blank=True,
        verbose_name="Особый порядок при согласии обвиняемого"
    )
    special_procedure_agreement = models.BooleanField(
        null=True, blank=True,
        verbose_name="Особый порядок при заключении досудебного соглашения"
    )

    # Пункт 11 - Частные определения
    private_rulings_count = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Количество частных определений (постановлений)"
    )

    # Пункт 12 - Сдача в делопроизводство
    case_to_office_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата сдачи дела в отдел делопроизводства"
    )

    # --- Раздел C. Приговор и исполнение (общие) ---
    sentence_date = models.DateField(
        null=True, blank=True, verbose_name="Дата вынесения приговора"
    )
    sentence_result = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Результат рассмотрения (приговор, прекращение и др.)"
    )
    appeal_date = models.DateField(
        null=True, blank=True, verbose_name="Дата обжалования"
    )
    appeal_result = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Результат обжалования"
    )
    cassation_date = models.DateField(
        null=True, blank=True, verbose_name="Дата кассации/надзора"
    )
    cassation_result = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Результат кассации/надзора"
        )

    # --- Особые отметки ---
    special_notes = models.TextField(
        null=True, blank=True, verbose_name="Особые отметки"
    )
    # ==================== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ РАЗДЕЛА А ====================
    
    # Пункт 6 - Результат предварительного слушания (расширенный)
    preliminary_hearing_result = models.CharField(
        max_length=255,
        null=True, blank=True,
        choices=[
            ('1', 'о направлении уголовного дела по подсудности'),
            ('2', 'о возвращении уголовного дела прокурору'),
            ('3', 'о приостановлении производства по делу'),
            ('4', 'о прекращении уголовного дела'),
            ('5', 'о назначении судебного заседания'),
            ('6', 'о назначении закрытого судебного заседания'),
        ],
        verbose_name="Результат предварительного слушания"
    )
    
    # Пункт 7 - Дата первого заседания
    first_hearing_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата первого судебного заседания"
    )
    
    # Пункт 8 - Соблюдение сроков рассмотрения
    hearing_compliance = models.CharField(
        max_length=2,
        null=True, blank=True,
        choices=[
            ('1', 'с соблюдением сроков, установленных УПК РФ'),
            ('2', 'с нарушением сроков'),
        ],
        verbose_name="Соблюдение сроков рассмотрения"
    )
    
    # Пункт 8 - Причина отложения (детализированная)
    postponement_reason_code = models.CharField(
        max_length=10,
        null=True, blank=True,
        choices=[
            ('1', 'неявка подсудимого'),
            ('2', 'неявка защитника'),
            ('3', 'неявка прокурора'),
            ('4', 'неявка потерпевшего'),
            ('5', 'неявка других участников процесса'),
            ('6', 'неявка свидетелей'),
            ('7', 'необходимость истребования новых доказательств'),
            ('8', 'недоставление подсудимого'),
            ('9', 'назначение экспертизы'),
            ('10', 'другие основания'),
        ],
        verbose_name="Код причины отложения дела"
    )
    
    postponement_reason_text = models.TextField(
        null=True, blank=True,
        verbose_name="Текст причины отложения (при выборе 'другие основания')"
    )
    
    # Количество отложений
    postponement_count = models.PositiveIntegerField(
        default=0,
        null=True, blank=True,
        verbose_name="Количество отложений рассмотрения дела"
    )
    
    # Пункт 8 - Основания приостановления (детализированные)
    suspension_reason_code = models.CharField(
        max_length=10,
        null=True, blank=True,
        choices=[
            ('1', 'розыск подсудимого'),
            ('2', 'психическое заболевание подсудимого'),
            ('3', 'иное тяжелое заболевание подсудимого'),
            ('4', 'запрос в Конституционный Суд РФ'),
            ('5', 'невозможность участия обвиняемого в судебном разбирательстве'),
            ('6', 'невозможность раздельного судебного разбирательства'),
            ('7', 'назначение экспертизы'),
            ('8', 'розыск потерпевшего или свидетеля'),
        ],
        verbose_name="Код причины приостановления производства"
    )
    
    suspension_reason_text = models.TextField(
        null=True, blank=True,
        verbose_name="Текст причины приостановления (при выборе 'иное')"
    )
    
    # Продолжительность приостановления
    suspension_duration_days = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Продолжительность приостановления (дней)"
    )
    
    # Пункт 9 - Результат рассмотрения дела в целом (расширенный)
    case_result_detailed = models.CharField(
        max_length=255,
        null=True, blank=True,
        choices=[
            ('1', 'вынесен приговор'),
            ('2', 'прекращено'),
            ('3', 'принудительные меры медицинского характера'),
            ('4', 'направлено по подсудности'),
            ('5', 'направлено по подведомственности прокурору, в орган следствия, дознания'),
            ('6', 'возвращено прокурору в порядке ст. 237 УПК РФ'),
            ('7', 'возвращено в связи с отказом в удовлетворении ходатайства о прекращении в порядке ст. 446.2 УПК РФ'),
            ('8', 'роспуск коллегии присяжных'),
        ],
        verbose_name="Результат рассмотрения дела в целом (детализированный)"
    )
    
    # ==================== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ РАЗДЕЛА B ====================
    
    # Количество лиц, в отношении которых дело прекращено по нереабилитирующим основаниям
    persons_non_rehabilitated = models.PositiveIntegerField(
        default=0,
        null=True, blank=True,
        verbose_name="Количество лиц, в отношении которых дело прекращено по нереабилитирующим основаниям"
    )
    
    # Количество лиц, в отношении которых дело прекращено по реабилитирующим основаниям
    persons_rehabilitated = models.PositiveIntegerField(
        default=0,
        null=True, blank=True,
        verbose_name="Количество лиц, в отношении которых дело прекращено по реабилитирующим основаниям"
    )
    
    # ==================== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ РАЗДЕЛА C ====================
    
    # Пункт 16 - Дата вступления приговора в законную силу
    sentence_effective_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата вступления приговора в законную силу"
    )
    
    # Пункт 17 - Дата обращения приговора к исполнению
    sentence_execution_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата обращения приговора к исполнению"
    )
    
    # Пункт 17 - Исполнение приговора
    execution_sent_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата направления приговора для исполнения"
    )
    
    execution_sent_to = models.CharField(
        max_length=500,
        null=True, blank=True,
        verbose_name="Куда направлен приговор для исполнения"
    )
    
    # ==================== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ РАЗДЕЛА 18 ====================
    
    # Пункт 18 - Соединение/выделение дел
    joined_with_case = models.CharField(
        max_length=100,
        null=True, blank=True,
        verbose_name="Соединено с делом №"
    )
    
    separated_to_case = models.CharField(
        max_length=100,
        null=True, blank=True,
        verbose_name="Выделено в дело №"
    )
    
    # Экспертиза
    expertise_type = models.ForeignKey(
        'CriminalExpertiseType',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Вид экспертизы"
    )
    
    expertise_sent_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата направления на экспертизу"
    )
    
    expertise_received_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата поступления экспертизы"
    )
    
    expertise_institution = models.CharField(
        max_length=500,
        null=True, blank=True,
        verbose_name="Экспертное учреждение"
    )
    
    # Конфискация
    confiscation_applied = models.BooleanField(
        default=False,
        verbose_name="Применена конфискация имущества"
    )
    
    confiscation_article = models.CharField(
        max_length=50,
        null=True, blank=True,
        verbose_name="Статья УК РФ о конфискации"
    )
    
    # Судебный штраф
    court_fine_applied = models.BooleanField(
        default=False,
        verbose_name="Назначен судебный штраф"
    )
    
    court_fine_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Сумма судебного штрафа (руб.)"
    )
    
    court_fine_article = models.CharField(
        max_length=50,
        null=True, blank=True,
        verbose_name="Статья УК РФ о судебном штрафе"
    )
    
    # Меры процессуального принуждения
    procedural_coercion = models.TextField(
        null=True, blank=True,
        verbose_name="Меры процессуального принуждения"
    )
    
    procedural_coercion_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата применения мер процессуального принуждения"
    )
    
    # Процессуальные издержки
    procedural_costs = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Процессуальные издержки (руб.)"
    )
    
    # ==================== ПОЛЯ РАЗДЕЛА 20 ====================
    
    # Пункт 20 - Другие отметки
    other_notes = models.TextField(
        null=True, blank=True,
        verbose_name="Другие отметки"
    )
    
    # ==================== ПОЛЯ ДЛЯ СТАТИСТИКИ ====================
    
    # Продолжительность рассмотрения (в днях)
    consideration_duration_days = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Продолжительность рассмотрения дела (дней)"
    )
    
    # Категория длительности
    consideration_duration_category = models.CharField(
        max_length=2,
        null=True, blank=True,
        choices=[
            ('1', 'до 1 месяца'),
            ('2', 'от 1 до 3 месяцев'),
            ('3', 'от 3 до 6 месяцев'),
            ('4', 'от 6 месяцев до 1 года'),
            ('5', 'свыше 1 года'),
        ],
        verbose_name="Категория длительности рассмотрения"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name="Статус дела"
    )

    archived_date = models.DateField(
        null=True, blank=True,
        verbose_name="Дата сдачи в архив"
    )

    archive_notes = models.TextField(
        null=True, blank=True,
        verbose_name="Примечания по архивному делу"
    )
    registered_case = models.OneToOneField(
        'case_registry.RegisteredCase',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='criminal_proceedings_link',
        verbose_name="Зарегистрированное дело"
    )

    class Meta:
        verbose_name = "Уголовное производство"
        verbose_name_plural = "Уголовные производства"

    def __str__(self):
        return f"Уголовное дело {self.case_number_criminal}"


class Defendant(models.Model):
    """
    Раздел Б. Сведения о лице (много на одно дело).
    """
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name="defendants",
        verbose_name="Уголовное производство"
    )
    full_name_criminal = models.CharField(
        max_length=255, verbose_name="ФИО обвиняемого"
    )
    sides_case_defendant = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='criminal_defendants',
        verbose_name='Подсудимый по делу'
    )
    article = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Статья'
    )

    maximum_penalty_article = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Максимальное наказание по статье'
    )
    address = models.CharField(
        max_length=500, null=True, blank=True, verbose_name="Адрес проживания"
    )
    birth_date = models.DateField(
        null=True, blank=True, verbose_name="Дата рождения"
    )

    # Пункт 1 - Пол
    sex = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        choices=[
            ('1', 'мужской'),
            ('2', 'женский'),
        ],
        verbose_name="Пол"
    )

    # Пункт 1 - Гражданство
    citizenship = models.CharField(
        max_length=50, null=True, blank=True, verbose_name="Гражданство",
        choices = [
            ('1', 'Российская Федерация'),
            ('2', 'другие государства СНГ'),
            ('3', 'иные государства'),
            ('4', 'без гражданства'),
        ]
    )

    # Пункт 2 - Результат рассмотрения дела (будет из CSV)
    trial_result = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Результат рассмотрения по данному лицу"
    )

    # Пункт 3 - Мера пресечения
    restraint_measure = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('0', 'не избиралась'),
            ('1', 'подписка о невыезде'),
            ('2', 'личное поручительство'),
            ('3', 'наблюдение командования воинской части'),
            ('4', 'присмотр за несовершеннолетним подозреваемым (обвиняемым)'),
            ('5', 'залог'),
            ('6', 'домашний арест'),
            ('7', 'заключение под стражу'),
            ('8', 'запрет определенных действий'),
        ],
        verbose_name="Мера пресечения"
    )

    restraint_date = models.DateField(
        null=True, blank=True, verbose_name="Дата избрания меры пресечения"
        )

    # Применение меры пресечения
    restraint_application = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        choices=[
            ('1', 'при поступлении дела в суд'),
            ('2', 'при назначении предварительного слушания'),
            ('3', 'при назначении судебного заседания'),
            ('4', 'после рассмотрения дела'),
        ],
        verbose_name="Мера пресечения применена"
    )

    restraint_change = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        choices=[
            ('1', 'изменена'),
            ('2', 'не изменена'),
        ],
        verbose_name="Изменение меры пресечения"
    )

    restraint_change_date = models.DateField(
        null=True, blank=True, verbose_name="Дата изменения меры пресечения"
    )
    restraint_change_to = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Изменена на меру"
    )

    conviction_article = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Статья по приговору"
    )
    punishment_type = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Вид наказания"
    )
    punishment_term = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Срок наказания"
    )
    additional_punishment = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Дополнительное наказание"
    )
    parole_info = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Условно-досрочное освобождение / испытательный срок"
    )
    property_damage = models.DecimalField(
        max_digits=12, decimal_places=2, null=True,
        blank=True, verbose_name="Сумма ущерба"
    )
    moral_damage = models.DecimalField(
        max_digits=12, decimal_places=2, null=True,
        blank=True, verbose_name="Сумма морального вреда"
    )

    # Пункт 5 - Исполнение приговора (будет из CSV)
    detention_institution = models.CharField(
        max_length=500, null=True, blank=True,
        verbose_name="Содержится в учреждении"
    )
    detention_address = models.CharField(
        max_length=500, null=True, blank=True,
        verbose_name="Адрес учреждения"
        )

    special_notes = models.TextField(
        null=True, blank=True, verbose_name="Особые отметки по лицу"
    )

    # ==================== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ДЛЯ ПОДСУДИМОГО ====================
    
    # Полный адрес с индексом
    postal_code = models.CharField(
        max_length=20,
        null=True, blank=True,
        verbose_name="Почтовый индекс"
    )
    
    # Место работы/учебы
    place_of_work = models.CharField(
        max_length=500,
        null=True, blank=True,
        verbose_name="Место работы/учебы"
    )
    
    work_position = models.CharField(
        max_length=255,
        null=True, blank=True,
        verbose_name="Должность/специальность"
    )
    
    # Характеристика
    character_reference = models.TextField(
        null=True, blank=True,
        verbose_name="Характеристика"
    )
    
    # Состоит на учете
    registered_with_psychiatrist = models.BooleanField(
        default=False,
        verbose_name="Состоит на учете у психиатра"
    )
    
    registered_with_narcologist = models.BooleanField(
        default=False,
        verbose_name="Состоит на учете у нарколога"
    )
    
    # Инвалидность
    has_disability = models.BooleanField(
        default=False,
        verbose_name="Имеет инвалидность"
    )
    
    disability_group = models.CharField(
        max_length=10,
        null=True, blank=True,
        choices=[
            ('1', 'I группа'),
            ('2', 'II группа'),
            ('3', 'III группа'),
        ],
        verbose_name="Группа инвалидности"
    )
    
    # Беременность (для женщин)
    is_pregnant = models.BooleanField(
        default=False,
        verbose_name="Беременная женщина"
    )
    
    has_child_under_3 = models.BooleanField(
        default=False,
        verbose_name="Имеет ребенка в возрасте до трех лет"
    )
    
    # Несовершеннолетний
    is_minor = models.BooleanField(
        default=False,
        verbose_name="Несовершеннолетний"
    )
    
    age_at_crime = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(14), MaxValueValidator(120)],
        verbose_name="Возраст на момент совершения преступления"
    )
    
    # Рецидив
    recidivism_type = models.CharField(
        max_length=10,
        null=True, blank=True,
        choices=[
            ('0', 'отсутствует'),
            ('1', 'простой рецидив'),
            ('2', 'опасный рецидив'),
            ('3', 'особо опасный рецидив'),
        ],
        verbose_name="Вид рецидива"
    )
    
    # Отбытие наказания
    correctional_institution = models.CharField(
        max_length=500,
        null=True, blank=True,
        verbose_name="Исправительное учреждение"
    )
    
    detention_days_total = models.PositiveIntegerField(
        default=0,
        null=True, blank=True,
        verbose_name="Всего дней содержания под стражей"
    )
    
    detention_days_before_court = models.PositiveIntegerField(
        default=0,
        null=True, blank=True,
        verbose_name="Дней содержания под стражей до суда"
    )
    
    detention_days_during_trial = models.PositiveIntegerField(
        default=0,
        null=True, blank=True,
        verbose_name="Дней содержания под стражей в суде"
    )

    class Meta:
        verbose_name = "Обвиняемый"
        verbose_name_plural = "Обвиняемые"


class LawyerCriminal(models.Model):
    '''Модель для адвокатов в уголовных делах'''
    
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name='criminal_lawyers',
        verbose_name="Уголовное производство"
    )
    
    lawyer = models.ForeignKey(
        'business_card.Lawyer',
        on_delete=models.CASCADE,
        related_name='criminal_lawyers',
        verbose_name="Адвокат",
        null=True,
        blank=True
    )
    
    sides_case_role = models.ForeignKey(
        'business_card.SidesCase',
        on_delete=models.CASCADE,
        related_name='criminal_lawyers',
        verbose_name="Роль в деле",
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = "Адвокат в уголовном деле"
        verbose_name_plural = "Адвокаты в уголовных делах"

    def __str__(self):
        if self.lawyer:
            return f"Адвокат: {self.lawyer.law_firm_name}"
        return f"Адвокат по делу {self.criminal_proceedings.case_number_criminal}"


class CriminalSidesCaseInCase(models.Model):
    """
    Стороны по уголовному судопроизводству
    """

    sides_case_criminal = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='criminal_SidesCase',
        verbose_name='Сторона по делу'
    )
    criminal_side_case = models.ForeignKey(
        SidesCaseInCase,
        on_delete=models.CASCADE,
        related_name="criminal_sides",
        verbose_name="Стороны Уголовного производства",
        blank=True,
        null=True
    )
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name="criminal_sides",
        verbose_name="Уголовное производство",
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = 'Сторона уголовного дела'
        verbose_name_plural = 'Стороны уголовного дела'

    def __str__(self):
        return f'Адвокат: {self.criminal_side_case.name}'


# criminal_case/models.py - исправленная модель PetitionCriminal

class PetitionCriminal(models.Model):
    '''Модель для ходатайств в уголовном деле'''

    PETITIONER_TYPES = [
        ('criminal_defendant', 'Обвиняемый'),
        ('criminal_lawyer', 'Адвокат'),
        ('criminal_side', 'Сторона по делу'),
    ]

    petitions_criminal = models.ManyToManyField(
        Petitions,
        verbose_name='ходатайства по делу',
        related_name='criminal_petitions'
    )
    date_application = models.DateField(
        verbose_name='Дата ходатайства',
        null=True,
        blank=True
    )
    date_decision = models.DateField(
        verbose_name='Дата решения по ходатайству',
        null=True,
        blank=True
    )
    notation = models.TextField(
        max_length=300,
        verbose_name='примечания',
        null=True,
        blank=True
    )
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        verbose_name="Уголовное производство",
        related_name='petitions',
        null=True,
        blank=True
    )
    
    petitions_incase = models.ForeignKey(
        'business_card.PetitionsInCase',
        on_delete=models.CASCADE,
        verbose_name="Ходатайство в деле",
        related_name='criminal_petitions',
        null=True,
        blank=True
    )
    
    # ДОБАВИТЬ ЭТИ ПОЛЯ:
    petitioner_type = models.CharField(
        max_length=30,
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
        verbose_name = 'Ходатайство уголовного дела'
        verbose_name_plural = 'Ходатайства уголовного дела'
        indexes = [
            models.Index(fields=['petitioner_type', 'petitioner_id']),
        ]
    
    def __str__(self):
        if self.petitions_criminal:
            return f'Ходатайство: {self.petitions_criminal}'
        return 'Ходатайство'
    
    @property
    def petitioner(self):
        """Получение объекта заявителя"""
        if not self.petitioner_type or not self.petitioner_id:
            return None
        
        if self.petitioner_type == 'criminal_defendant':
            try:
                return Defendant.objects.get(id=self.petitioner_id, criminal_proceedings=self.criminal_proceedings)
            except Defendant.DoesNotExist:
                return None
        elif self.petitioner_type == 'criminal_lawyer':
            try:
                return LawyerCriminal.objects.get(id=self.petitioner_id, criminal_proceedings=self.criminal_proceedings)
            except LawyerCriminal.DoesNotExist:
                return None
        elif self.petitioner_type == 'criminal_side':
            try:
                return CriminalSidesCaseInCase.objects.get(id=self.petitioner_id, criminal_proceedings=self.criminal_proceedings)
            except CriminalSidesCaseInCase.DoesNotExist:
                return None
        return None
    
    @property
    def petitioner_info(self):
        """Получение информации о заявителе для отображения"""
        petitioner = self.petitioner
        if not petitioner:
            return None
        
        if self.petitioner_type == 'criminal_defendant':
            return {
                'id': petitioner.id,
                'type': 'criminal_defendant',
                'type_label': 'Обвиняемый',
                'name': petitioner.full_name_criminal or 'Неизвестно',
                'role': 'Обвиняемый',
                'detail': {
                    'full_name': petitioner.full_name_criminal,
                    'birth_date': petitioner.birth_date,
                    'address': petitioner.address,
                }
            }
        elif self.petitioner_type == 'criminal_lawyer':
            lawyer_detail = petitioner.lawyer
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'criminal_lawyer',
                'type_label': 'Адвокат',
                'name': lawyer_detail.law_firm_name if lawyer_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Адвокат',
                'detail': {
                    'law_firm_name': lawyer_detail.law_firm_name if lawyer_detail else None,
                    'phone': lawyer_detail.law_firm_phone if lawyer_detail else None,
                }
            }
        elif self.petitioner_type == 'criminal_side':
            side_detail = petitioner.criminal_side_case
            role_detail = petitioner.sides_case_criminal
            return {
                'id': petitioner.id,
                'type': 'criminal_side',
                'type_label': 'Сторона',
                'name': side_detail.name if side_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Сторона',
                'detail': {
                    'name': side_detail.name if side_detail else None,
                    'phone': side_detail.phone if side_detail else None,
                    'address': side_detail.address if side_detail else None,
                }
            }
        return None


class CriminalDecision(models.Model):
    """
    Решения по уголовному делу (раздел "Продолжение р. А. Сведения по делу")
    """
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name="criminal_decisions",
        verbose_name="Уголовное производство"
    )

    name_case = models.ForeignKey(
        CriminalDecisions,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Решение по поступившему делу'
    )


    appeal_date = models.DateField(
        null=True, blank=True, verbose_name="Дата поступления апелляции"
    )
    appeal_applicant = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="ФИО заявителя апелляции"
    )
    appeal_applicant_status = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Процессуальное положение заявителя"
    )

    # Пункт 14 - Направление в суд II инстанции
    court_instance = models.CharField(
        max_length=1,
        choices=[
            ('1', 'апелляционной'),
            ('2', 'кассационной')
        ],
        null=True,
        blank=True,
        verbose_name="Суд II инстанции"
    )

    # Результат рассмотрения во II инстанции
    appeal_consideration_result = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        choices=[
            ('1', 'оставлен без изменения'),
            ('2', 'отменен с возвращением на новое рассмотрение'),
            ('3', 'изменен'),
            ('4', 'с вынесением нового приговора (апелляцией)'),
            ('5', 'отменен с прекращением'),
            ('6', 'отменено апелляционное постановление с оставлением в силе постановления I инстанции'),
            ('7', 'отменен с возвращением дела прокурору'),
            ('8', 'иные результаты рассмотрения'),
        ],
        verbose_name="Результат рассмотрения во II инстанции"
    )

    consideration_changes = models.TextField(
        null=True, blank=True, verbose_name="Сущность изменений"
    )
    higher_court_receipt_date = models.DateField(
        null=True, blank=True, verbose_name="Дата поступления из вышестоящего суда"
    )

    # Пункт 16 - Вступление в силу
    sentence_effective_date = models.DateField(
        null=True, blank=True, verbose_name="Дата вступления в силу"
    )

    # Пункт 17 - Обращение к исполнению
    sentence_execution_date = models.DateField(
        null=True, blank=True, verbose_name="Дата обращения к исполнению"
    )

    # Пункт 15.1 - Результаты рассмотрения гражданского иска
    civil_claim_result = models.CharField(
        max_length=1,
        choices=[
            ('1', 'удовлетворен полностью'),
            ('2', 'удовлетворен частично'),
            ('3', 'оставлен без рассмотрения'),
            ('4', 'отказано в удовлетворении'),
            ('5', 'производство прекращено')
        ],
        null=True,
        blank=True,
        verbose_name="Результат гражданского иска"
    )

    civil_claim_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True,
        blank=True, verbose_name="Сумма иска"
    )
    state_duty_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True,
        blank=True, verbose_name="Сумма госпошлины"
    )
    theft_damage_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name="Сумма ущерба от хищения"
    )
    other_damage_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name="Сумма ущерба от др. преступлений"
    )
    moral_damage_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name="Сумма морального вреда"
    )
    moral_damage_article = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name="Статья УК РФ по моральному вреду"
    )

    # Копии приговора
    copy_sent_to_1 = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Копия направлена 1"
    )
    copy_sent_date_1 = models.DateField(
        null=True, blank=True, verbose_name="Дата направления 1"
    )
    copy_sent_to_2 = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Копия направлена 2"
    )
    copy_sent_date_2 = models.DateField(
        null=True, blank=True, verbose_name="Дата направления 2"
    )
    copy_sent_to_3 = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Копия направлена 3"
    )
    copy_sent_date_3 = models.DateField(
        null=True, blank=True, verbose_name="Дата направления 3"
    )

    # Пункт 18 - Особые отметки
    joined_with_case = models.CharField(
        max_length=100, null=True, blank=True,
        verbose_name="Соединено с делом №"
    )
    separated_to_case = models.CharField(
        max_length=100, null=True, blank=True,
        verbose_name="Выделено в дело №"
    )
    expertise_type = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="Вид экспертизы"
    )
    expertise_sent_date = models.DateField(
        null=True, blank=True, verbose_name="Дата направления экспертизы"
    )
    expertise_received_date = models.DateField(
        null=True, blank=True, verbose_name="Дата поступления экспертизы"
    )
    confiscation_article = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name="Статья УК РФ о конфискации"
    )
    court_fine_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name="Сумма судебного штрафа"
    )
    court_fine_article = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name="Статья УК РФ о штрафе"
    )
    procedural_coercion = models.TextField(
        null=True, blank=True, verbose_name="Меры процессуального принуждения"
    )
    procedural_coercion_date = models.DateField(
        null=True, blank=True, verbose_name="Дата применения мер"
    )
    procedural_costs = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name="Процессуальные издержки"
    )

    # Пункт 20 - Другие отметки
    other_notes = models.TextField(
        null=True, blank=True, verbose_name="Другие отметки"
    )

    class Meta:
        verbose_name = "Решение по уголовному делу"
        verbose_name_plural = "Решения по уголовным делам"
        ordering = ['-appeal_date']

    def __str__(self):
        return f"Решение по делу {self.criminal_proceedings.case_number_criminal} - {self.get_court_instance_display()}"


class CriminalCaseMovement(models.Model):
    """
    Модель для отслеживания движения уголовного дела (пункты 6-9 раздела А)
    """
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name="case_movement",
        verbose_name="Уголовное производство"
    )

    # Пункт 6 - Результат предварительного слушания
    preliminary_hearing_result = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'о направлении уголовного дела по подсудности'),
            ('2', 'о возвращении уголовного дела прокурору'),
            ('3', 'о приостановлении производства по делу'),
            ('4', 'о прекращении уголовного дела'),
            ('5', 'о назначении судебного заседания'),
            ('6', 'о назначении закрытого судебного заседания'),
        ],
        verbose_name="Результат предварительного слушания"
    )

    first_hearing_date = models.DateField(
        null=True, blank=True, verbose_name="Дата первого заседания"
    )
    meeting_time = models.TimeField(
        verbose_name='Время заседания',
        null=True,
        blank=True,
    )
    hearing_compliance = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        choices=[
            ('1', 'с соблюдением сроков, установленных УПК РФ'),
            ('2', 'по делам с нарушением сроков'),
        ],
        verbose_name="Соблюдение сроков"
    )

    # Пункт 8 - Причины отложения дела
    hearing_postponed_reason = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'неявка подсудимого'),
            ('2', 'неявка защитника'),
            ('3', 'неявка прокурора'),
            ('4', 'неявка потерпевшего'),
            ('5', 'неявка других участников процесса'),
            ('6', 'неявка свидетелей'),
            ('7', 'необходимость истребования новых доказательств'),
            ('8', 'недоставление подсудимого'),
            ('9', 'назначение экспертизы'),
            ('10', 'другие основания'),
        ],
        verbose_name="Причина отложения"
    )

    # Дополнительное поле для текстового описания причины
    hearing_postponed_reason_text = models.TextField(
        null=True, blank=True,
        verbose_name="Текст причины отложения"
    )

    suspension_date = models.DateField(
        null=True, blank=True, verbose_name="Дата приостановления производства"
    )

    # Пункт 8 - Основания приостановления
    suspension_reason = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=[
            ('1', 'розыск подсудимого'),
            ('2', 'психическое заболевание'),
            ('3', 'другое тяжкое заболевание'),
            ('4', 'запрос в Конституционный Суд РФ'),
            ('5', 'невозможность участия обвиняемого в судебном разбирательстве'),
            ('6', 'невозможность раздельного судебного разбирательства'),
        ],
        verbose_name="Причина приостановления"
    )

    resumption_date = models.DateField(
        null=True, blank=True, verbose_name="Дата возобновления производства"
    )

    class Meta:
        verbose_name = "Движение дела"
        verbose_name_plural = "Движения дел"

    def __str__(self):
        return f"Движение дела {self.criminal_proceedings.case_number_criminal}"


class CriminalCivilClaim(models.Model):
    """
    Модель для хранения информации о гражданском иске в уголовном деле
    Раздел 15.1 инструкции
    """
    
    RESULT_CHOICES = [
        ('1', 'удовлетворен полностью'),
        ('2', 'удовлетворен частично'),
        ('3', 'оставлен без рассмотрения'),
        ('4', 'отказано в удовлетворении'),
        ('5', 'производство прекращено'),
    ]
    
    # Связь с уголовным делом
    criminal_proceedings = models.ForeignKey(
        'CriminalProceedings',
        on_delete=models.CASCADE,
        related_name='civil_claims',
        verbose_name="Уголовное производство"
    )
    
    # Связь с потерпевшим (опционально)
    victim = models.ForeignKey(
        'Defendant',  # или отдельная модель для потерпевших
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='civil_claims',
        verbose_name="Потерпевший (истец)"
    )
    
    # Истец (текстовое поле, если не из справочника)
    plaintiff_name = models.CharField(
        max_length=500,
        verbose_name="Истец (гражданский истец)",
        null=True, blank=True
    )
    
    # Ответчик
    defendant_name = models.CharField(
        max_length=500,
        verbose_name="Ответчик (гражданский ответчик)",
        null=True, blank=True
    )
    
    # Сумма иска
    claim_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Сумма иска (руб.)",
        null=True, blank=True
    )
    
    # Сумма ущерба от хищения (если применимо)
    theft_damage_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Сумма ущерба от хищения (руб.)",
        null=True, blank=True
    )
    
    # Сумма ущерба от других преступлений
    other_damage_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Сумма ущерба от других преступлений (руб.)",
        null=True, blank=True
    )
    
    # Сумма морального вреда
    moral_damage_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Сумма морального вреда (руб.)",
        null=True, blank=True
    )
    
    # Статья УК РФ по моральному вреду
    moral_damage_article = models.CharField(
        max_length=50,
        verbose_name="Статья УК РФ по моральному вреду",
        null=True, blank=True
    )
    
    # Сумма госпошлины
    state_duty_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Сумма госпошлины (руб.)",
        null=True, blank=True
    )
    
    # Результат рассмотрения
    result = models.CharField(
        max_length=2,
        choices=RESULT_CHOICES,
        verbose_name="Результат рассмотрения гражданского иска",
        null=True, blank=True
    )
    
    # Присужденная сумма
    awarded_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Присужденная сумма (руб.)",
        null=True, blank=True
    )
    
    # Дата решения
    decision_date = models.DateField(
        verbose_name="Дата решения по гражданскому иску",
        null=True, blank=True
    )
    
    # Исполнение
    execution_date = models.DateField(
        verbose_name="Дата фактического исполнения",
        null=True, blank=True
    )
    
    execution_notes = models.TextField(
        verbose_name="Примечания по исполнению",
        null=True, blank=True
    )
    
    class Meta:
        verbose_name = "Гражданский иск в уголовном деле"
        verbose_name_plural = "Гражданские иски в уголовных делах"
        ordering = ['-claim_amount']
    
    def __str__(self):
        return f"Гражданский иск по делу {self.criminal_proceedings.case_number_criminal} на сумму {self.claim_amount} руб."


@property
def registered_case_number(self):
    if hasattr(self, 'registered_case'):
        return self.registered_case.full_number
    return None


def get_registered_case_info(self):
    if hasattr(self, 'registered_case'):
        case = self.registered_case
        return {
            'full_number': case.full_number,
            'registration_date': case.registration_date,
            'status': case.get_status_display()
        }
    return None


class CriminalExecution(models.Model):
    """
    Исполнение приговора/решения по уголовному делу.
    Соответствует разделу "Исполнение приговора" в учетно-статистической карточке.
    Одно дело может иметь несколько записей об исполнении.
    """
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name='criminal_executions',
        verbose_name="Уголовное производство"
    )

    criminal_side_case_execution = models.ForeignKey(
        SidesCaseInCase,
        on_delete=models.CASCADE,
        verbose_name="Приговор вступивший в законную силу вручен",
        blank=True,
        null=True
    )
    criminal_defendant_execution = models.ForeignKey(
        Defendant,
        on_delete=models.CASCADE,
        verbose_name="Приговор вступивший в законную силу вручен",
        blank=True,
        null=True
    )
    sides_case_lawyer_execution = models.ForeignKey(
        Lawyer,
        on_delete=models.CASCADE,
        verbose_name="Приговор вступивший в законную силу вручен",
        blank=True,
        null=True
    )

    # ------------------- Раздел "Обращение к исполнению" -------------------
    sentence_execution_date = models.DateField(
        verbose_name="Дата обращения приговора к исполнению",
        null=True, blank=True
    )
    execution_sent_date = models.DateField(
        verbose_name="Дата направления для исполнения",
        null=True, blank=True
    )
    execution_sent_to = models.CharField(
        max_length=500,
        verbose_name="Куда направлено для исполнения",
        null=True, blank=True
    )
    execution_sent_document = models.CharField(
        max_length=255,
        verbose_name="Направленный документ",
        choices=[
            ('1', 'Копия приговора'),
            ('2', 'Исполнительный лист'),
            ('3', 'Распоряжение об исполнении'),
            ('4', 'Копия апелляционного определения'),
            ('5', 'Иное'),
        ],
        null=True, blank=True
    )

    # ------------------- Раздел "Контроль исполнения" -------------------
    control_return_date = models.DateField(
        verbose_name="Дата поступления контрольной карточки",
        null=True, blank=True
    )
    control_result = models.CharField(
        max_length=500,
        verbose_name="Результат контроля исполнения",
        null=True, blank=True
    )

    # ------------------- Раздел "Отметки об исполнении" -------------------
    execution_mark_date = models.DateField(
        verbose_name="Дата отметки об исполнении",
        null=True, blank=True
    )
    execution_mark_content = models.TextField(
        verbose_name="Содержание отметки об исполнении",
        null=True, blank=True
    )
    execution_mark_author = models.CharField(
        max_length=255,
        verbose_name="Кто поставил отметку об исполнении",
        null=True, blank=True
    )

    # ------------------- Раздел "Особые отметки по исполнению" -------------------
    special_execution_notes = models.TextField(
        verbose_name="Особые отметки по исполнению",
        null=True, blank=True
    )

    # ------------------- Раздел "Снятие с контроля" -------------------
    removal_from_control_date = models.DateField(
        verbose_name="Дата снятия с контроля",
        null=True, blank=True
    )
    removal_from_control_reason = models.CharField(
        max_length=500,
        verbose_name="Основание снятия с контроля",
        null=True, blank=True
    )

    # ------------------- Раздел "Информация о рассылке" -------------------
    copies_sent_info = models.TextField(
        verbose_name="Информация о рассылке копий приговора",
        null=True, blank=True
    )

    class Meta:
        verbose_name = "Исполнение по уголовному делу"
        verbose_name_plural = "Исполнения по уголовным делам"
        ordering = ['-execution_sent_date']

    def __str__(self):
        return f"Исполнение по делу {self.criminal_proceedings.case_number_criminal}"


class CriminalRuling(models.Model):
    """Модель для хранения постановлений по уголовным делам"""

    RULING_TYPES = [
        ('preliminary_hearing', 'О назначении предварительного слушания'),
        ('court_session', 'О назначении судебного заседания'),
        ('case_appointment', 'О назначении дела'),
        ('other', 'Иное постановление'),
    ]

    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name="rulings",
        verbose_name="Уголовное производство"
    )

    ruling_type = models.CharField(
        max_length=50,
        choices=RULING_TYPES,
        verbose_name="Тип постановления"
    )

    title = models.CharField(
        max_length=500, verbose_name="Заголовок постановления"
    )
    content = models.TextField(
        verbose_name="Содержание постановления (HTML)"
    )
    content_raw = models.TextField(verbose_name="Сырое содержимое (Draft.js)")

    # Метаданные
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Дата обновления"
    )
    created_by = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Кем создано"
    )

    # Статус
    is_draft = models.BooleanField(default=True, verbose_name="Черновик")
    signed_date = models.DateField(
        null=True, blank=True, verbose_name="Дата подписания"
    )

    class Meta:
        verbose_name = "Постановление по уголовному делу"
        verbose_name_plural = "Постановления по уголовным делам"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.criminal_proceedings.case_number_criminal}"


@receiver(post_delete, sender=CriminalSidesCaseInCase)
def delete_related_sidescaseincase(sender, instance, **kwargs):
    """Удалить связанный SidesCaseInCase при удалении связи"""
    if instance.criminal_side_case:
        try:
            instance.criminal_side_case.delete()
            logger.info(f"Deleted related SidesCaseInCase {instance.criminal_side_case.id}")
        except Exception as e:
            logger.error(f"Error deleting SidesCaseInCase: {e}")


@receiver(post_delete, sender=LawyerCriminal)
def delete_related_lawyer(sender, instance, **kwargs):
    """Удалить связанного Lawyer при удалении связи, если он не используется в других делах"""
    if instance.lawyer:
        other_usages = LawyerCriminal.objects.filter(lawyer=instance.lawyer).exclude(id=instance.id).count()
        if other_usages == 0:
            try:
                instance.lawyer.delete()
                logger.info(f"Deleted related Lawyer {instance.lawyer.id}")
            except Exception as e:
                logger.error(f"Error deleting Lawyer: {e}")


@receiver(post_delete, sender=PetitionCriminal)
def delete_related_petitions_incase(sender, instance, **kwargs):
    """Удалить связанный PetitionsInCase при удалении PetitionCriminal"""
    if instance.petitions_incase:
        try:
            petitions_incase_id = instance.petitions_incase.id
            instance.petitions_incase.delete()
            logger.info(f"Deleted related PetitionsInCase {petitions_incase_id} for PetitionCriminal {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting PetitionsInCase: {e}")
