from django.db import models
from business_card.models import BusinessCard
from users.models import User


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


class CriminalSidesCase(models.Model):
    """Стороны по уголовному делу"""
    name = models.CharField(max_length=255, verbose_name="Название стороны")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)
    
    class Meta:
        verbose_name = "Сторона по уголовному делу"
        verbose_name_plural = "Стороны по уголовным делам"
    
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


class CriminalProceedings(models.Model):
    """
    Учетно-статистическая карточка уголовного дела (общие сведения).
    """
    business_card = models.OneToOneField(
        BusinessCard,
        on_delete=models.CASCADE,
        related_name="criminal_proceedings",
        verbose_name="Базовая карточка"
    )

    # --- Раздел А. Сведения по делу ---
    number_of_persons = models.PositiveIntegerField(null=True, blank=True, verbose_name="Число лиц по делу")
    evidence_present = models.BooleanField(null=True, blank=True, verbose_name="Наличие вещдоков")
    evidence_reg_number = models.CharField(max_length=100, null=True, blank=True, verbose_name="Рег. номер вещдока")
    incoming_date = models.DateField(null=True, blank=True, verbose_name="Дата поступления дела в суд")
    incoming_from = models.CharField(max_length=255, null=True, blank=True, verbose_name="Откуда поступило")
    volume_count = models.PositiveIntegerField(null=True, blank=True, verbose_name="Количество томов")
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
    separated_case_number = models.CharField(max_length=100, null=True, blank=True, 
                                           verbose_name="Номер дела, из которого выделено")
    separated_case_date = models.DateField(null=True, blank=True, 
                                         verbose_name="Дата выделения дела")
    repeated_court_code = models.CharField(max_length=50, null=True, blank=True, 
                                         verbose_name="Код суда при повторном поступлении")
    repeated_primary_reg_number = models.CharField(max_length=100, null=True, blank=True, 
                                                 verbose_name="№ производства по первичной регистрации")
    
    repeat_case = models.BooleanField(null=True, blank=True, verbose_name="Повторное поступление дела")
    repeat_case_date = models.DateField(null=True, blank=True, verbose_name="Дата повторного поступления")
    
    # Пункт 3 - Категория дела
    case_category = models.CharField(
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

    judge_acceptance_date = models.DateField(null=True, blank=True, verbose_name="Дата принятия дела судьей")

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
    
    total_duration_days = models.IntegerField(null=True, blank=True, verbose_name="Общая продолжительность (дни)")
    
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
    judge_code = models.CharField(max_length=50, null=True, blank=True, verbose_name="Код судьи")
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
    consideration_date = models.DateField(null=True, blank=True, verbose_name="Дата рассмотрения")

    # Пункт 10.1 - Участие в процессе
    participation_prosecutor = models.BooleanField(null=True, blank=True, verbose_name="Участие прокурора")
    participation_translator = models.BooleanField(null=True, blank=True, verbose_name="Участие переводчика")
    participation_expert = models.BooleanField(null=True, blank=True, verbose_name="Участие эксперта")
    participation_specialist = models.BooleanField(null=True, blank=True, verbose_name="Участие специалиста")

    # Пункт 10.2 - Отсутствие участия
    absence_defendant = models.BooleanField(null=True, blank=True, 
                                          verbose_name="Без участия подсудимого (ч. 5 ст. 247 УПК РФ)")
    absence_lawyer = models.BooleanField(null=True, blank=True, 
                                       verbose_name="Без участия адвоката у подсудимого")
    absence_pmmh_person = models.BooleanField(null=True, blank=True, 
                                            verbose_name="Без участия лица по делам о ПММХ (ч. 1 ст. 437 УПК РФ)")
    
    # Пункт 10.3 - Закрытое заседание
    closed_hearing = models.BooleanField(null=True, blank=True, 
                                       verbose_name="Рассмотрено в закрытом судебном заседании")
    
    # Пункт 10.4 - Использование технологий
    vks_technology = models.BooleanField(null=True, blank=True, verbose_name="Использование ВКС")
    audio_recording = models.BooleanField(null=True, blank=True, verbose_name="Использование аудиозаписи")
    video_recording = models.BooleanField(null=True, blank=True, verbose_name="Использование видеозаписи")
    
    # Особый порядок
    special_procedure_consent = models.BooleanField(null=True, blank=True, 
                                                  verbose_name="Особый порядок при согласии обвиняемого")
    special_procedure_agreement = models.BooleanField(null=True, blank=True, 
                                                    verbose_name="Особый порядок при заключении досудебного соглашения")
    
    # Пункт 11 - Частные определения
    private_rulings_count = models.PositiveIntegerField(null=True, blank=True, 
                                                      verbose_name="Количество частных определений (постановлений)")
    
    # Пункт 12 - Сдача в делопроизводство
    case_to_office_date = models.DateField(null=True, blank=True, 
                                         verbose_name="Дата сдачи дела в отдел делопроизводства")
    
    # --- Раздел C. Приговор и исполнение (общие) ---
    sentence_date = models.DateField(null=True, blank=True, verbose_name="Дата вынесения приговора")
    sentence_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат рассмотрения (приговор, прекращение и др.)")
    appeal_date = models.DateField(null=True, blank=True, verbose_name="Дата обжалования")
    appeal_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат обжалования")
    cassation_date = models.DateField(null=True, blank=True, verbose_name="Дата кассации/надзора")
    cassation_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат кассации/надзора")
    case_to_archive_date = models.DateField(null=True, blank=True, verbose_name="Дата сдачи дела в архив")

    # --- Особые отметки ---
    special_notes = models.TextField(null=True, blank=True, verbose_name="Особые отметки")

    class Meta:
        verbose_name = "Уголовное производство"
        verbose_name_plural = "Уголовные производства"

    def __str__(self):
        return f"Уголовное дело {self.business_card.original_name}"


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

    full_name = models.CharField(max_length=255, verbose_name="ФИО обвиняемого")
    side_case = models.ForeignKey(
        CriminalSidesCase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Сторона по делу'
    )
    address = models.CharField(max_length=500, null=True, blank=True, verbose_name="Адрес проживания")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Дата рождения")
    
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
    citizenship = models.CharField(max_length=50, null=True, blank=True, verbose_name="Гражданство")
    
    # Пункт 2 - Результат рассмотрения дела (будет из CSV)
    trial_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат рассмотрения по данному лицу")
    
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
    
    restraint_date = models.DateField(null=True, blank=True, verbose_name="Дата избрания меры пресечения")
    
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
    
    # Изменение меры пресечения
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

    restraint_change_date = models.DateField(null=True, blank=True, verbose_name="Дата изменения меры пресечения")
    restraint_change_to = models.CharField(max_length=255, null=True, blank=True,
                                         verbose_name="Изменена на меру")

    conviction_article = models.CharField(max_length=255, null=True, blank=True, verbose_name="Статья по приговору")
    punishment_type = models.CharField(max_length=255, null=True, blank=True, verbose_name="Вид наказания")
    punishment_term = models.CharField(max_length=255, null=True, blank=True, verbose_name="Срок наказания")
    additional_punishment = models.CharField(max_length=255, null=True, blank=True, verbose_name="Дополнительное наказание")
    parole_info = models.CharField(max_length=255, null=True, blank=True, verbose_name="Условно-досрочное освобождение / испытательный срок")
    property_damage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма ущерба")
    moral_damage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма морального вреда")
    
    # Пункт 5 - Исполнение приговора (будет из CSV)
    detention_institution = models.CharField(max_length=500, null=True, blank=True, 
                                           verbose_name="Содержится в учреждении")
    detention_address = models.CharField(max_length=500, null=True, blank=True, 
                                       verbose_name="Адрес учреждения")
    
    special_notes = models.TextField(null=True, blank=True, verbose_name="Особые отметки по лицу")

    class Meta:
        verbose_name = "Обвиняемый"
        verbose_name_plural = "Обвиняемые"

    def __str__(self):
        return self.full_name


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
    
    # Пункт 13 - Обжалование приговора
    appeal_present = models.CharField(
        max_length=1,
        null=True,
        blank=True,
        choices=[
            ('1', 'не обжалован'),
            ('2', 'обжалован осужденным (подсудимым)'),
            ('3', 'обжалован прокурором'),
            ('4', 'обжалован другими участниками процесса'),
        ],
        verbose_name="Обжалование приговора"
    )
    
    appeal_date = models.DateField(null=True, blank=True, verbose_name="Дата поступления апелляции")
    appeal_applicant = models.CharField(max_length=255, null=True, blank=True, verbose_name="ФИО заявителя апелляции")
    appeal_applicant_status = models.CharField(max_length=255, null=True, blank=True, verbose_name="Процессуальное положение заявителя")
    
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
    
    court_sent_date = models.DateField(null=True, blank=True, verbose_name="Дата направления в суд II инстанции")
    court_return_date = models.DateField(null=True, blank=True, verbose_name="Дата возвращения из суда II инстанции")
    court_return_reason = models.TextField(null=True, blank=True, verbose_name="Причина возвращения")
    court_resend_date = models.DateField(null=True, blank=True, verbose_name="Дата повторного направления")
    
    # Пункт 15 - Рассмотрение во II инстанции
    court_consideration_date = models.DateField(null=True, blank=True, verbose_name="Дата рассмотрения во II инстанции")
    
    decision_appeal_criminal = models.ForeignKey(
        CriminalAppeal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Результат рассмотрения во II инстанции"
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
    
    consideration_changes = models.TextField(null=True, blank=True, verbose_name="Сущность изменений")
    higher_court_receipt_date = models.DateField(null=True, blank=True, verbose_name="Дата поступления из вышестоящего суда")
    
    # Пункт 16 - Вступление в силу
    sentence_effective_date = models.DateField(null=True, blank=True, verbose_name="Дата вступления в силу")
    
    # Пункт 17 - Обращение к исполнению
    sentence_execution_date = models.DateField(null=True, blank=True, verbose_name="Дата обращения к исполнению")
    
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
    
    civil_claim_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма иска")
    state_duty_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма госпошлины")
    theft_damage_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма ущерба от хищения")
    other_damage_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма ущерба от др. преступлений")
    moral_damage_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма морального вреда")
    moral_damage_article = models.CharField(max_length=50, null=True, blank=True, verbose_name="Статья УК РФ по моральному вреду")
    
    # Копии приговора
    copy_sent_to_1 = models.CharField(max_length=255, null=True, blank=True, verbose_name="Копия направлена 1")
    copy_sent_date_1 = models.DateField(null=True, blank=True, verbose_name="Дата направления 1")
    copy_sent_to_2 = models.CharField(max_length=255, null=True, blank=True, verbose_name="Копия направлена 2")
    copy_sent_date_2 = models.DateField(null=True, blank=True, verbose_name="Дата направления 2")
    copy_sent_to_3 = models.CharField(max_length=255, null=True, blank=True, verbose_name="Копия направлена 3")
    copy_sent_date_3 = models.DateField(null=True, blank=True, verbose_name="Дата направления 3")
    
    # Пункт 18 - Особые отметки
    joined_with_case = models.CharField(max_length=100, null=True, blank=True, verbose_name="Соединено с делом №")
    separated_to_case = models.CharField(max_length=100, null=True, blank=True, verbose_name="Выделено в дело №")
    expertise_type = models.CharField(max_length=255, null=True, blank=True, verbose_name="Вид экспертизы")
    expertise_sent_date = models.DateField(null=True, blank=True, verbose_name="Дата направления экспертизы")
    expertise_received_date = models.DateField(null=True, blank=True, verbose_name="Дата поступления экспертизы")
    confiscation_article = models.CharField(max_length=50, null=True, blank=True, verbose_name="Статья УК РФ о конфискации")
    court_fine_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма судебного штрафа")
    court_fine_article = models.CharField(max_length=50, null=True, blank=True, verbose_name="Статья УК РФ о штрафе")
    procedural_coercion = models.TextField(null=True, blank=True, verbose_name="Меры процессуального принуждения")
    procedural_coercion_date = models.DateField(null=True, blank=True, verbose_name="Дата применения мер")
    procedural_costs = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Процессуальные издержки")
    
    # Пункт 19 - Ходатайства
    petitions_info = models.TextField(null=True, blank=True, verbose_name="Информация о ходатайствах")
    petitions_withdrawal_date = models.DateField(null=True, blank=True, verbose_name="Дата отзыва ходатайства")
    
    # Пункт 20 - Другие отметки
    other_notes = models.TextField(null=True, blank=True, verbose_name="Другие отметки")
    
    archive_date = models.DateField(null=True, blank=True, verbose_name="Дата сдачи в архив")
    
    class Meta:
        verbose_name = "Решение по уголовному делу"
        verbose_name_plural = "Решения по уголовным делам"
        ordering = ['-appeal_date']
    
    def __str__(self):
        return f"Решение по делу {self.criminal_proceedings.business_card.original_name} - {self.get_court_instance_display()}"


class CriminalCaseMovement(models.Model):
    """
    Модель для отслеживания движения уголовного дела (пункты 6-9 раздела А)
    """
    criminal_proceedings = models.OneToOneField(
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
    
    first_hearing_date = models.DateField(null=True, blank=True, verbose_name="Дата первого заседания")

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
    hearing_postponed_reason_text = models.TextField(null=True, blank=True, 
                                                   verbose_name="Текст причины отложения")
    
    suspension_date = models.DateField(null=True, blank=True, verbose_name="Дата приостановления производства")
    
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

    resumption_date = models.DateField(null=True, blank=True, verbose_name="Дата возобновления производства")

    class Meta:
        verbose_name = "Движение дела"
        verbose_name_plural = "Движения дел"

    def __str__(self):
        return f"Движение дела {self.criminal_proceedings.business_card.original_name}"


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
    
    title = models.CharField(max_length=500, verbose_name="Заголовок постановления")
    content = models.TextField(verbose_name="Содержание постановления (HTML)")
    content_raw = models.TextField(verbose_name="Сырое содержимое (Draft.js)")
    
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    created_by = models.CharField(max_length=255, null=True, blank=True, verbose_name="Кем создано")
    
    # Статус
    is_draft = models.BooleanField(default=True, verbose_name="Черновик")
    signed_date = models.DateField(null=True, blank=True, verbose_name="Дата подписания")
    
    class Meta:
        verbose_name = "Постановление по уголовному делу"
        verbose_name_plural = "Постановления по уголовным делам"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.criminal_proceedings.business_card.original_name}"