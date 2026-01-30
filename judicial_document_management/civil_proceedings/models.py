from django.db import models
from business_card.models import BusinessCard


class CivilProceedings(models.Model):
    """Гражданское судопроизводство - основная модель"""
    
    business_card = models.OneToOneField(
        BusinessCard,
        on_delete=models.CASCADE,
        related_name='civil_proceedings',
        verbose_name='Карточка дела'
    )
    
    # I. ДОСУДЕБНАЯ ПОДГОТОВКА
    application_date = models.DateField(
        verbose_name='Заявление поступило в суд',
        null=True,
        blank=True
    )
    applicants_count = models.IntegerField(
        verbose_name='Количество истцов',
        default=1
    )
    
    admission_order = models.CharField(
        max_length=2,
        verbose_name='Порядок поступления (код)',
        null=True,
        blank=True
    )
    
    # Поля для различных вариантов порядка поступления
    criminal_case_number = models.CharField(
        max_length=100,
        verbose_name='Номер уголовного дела',
        null=True,
        blank=True
    )
    separated_from_case = models.CharField(
        max_length=100,
        verbose_name='Выделено из дела N',
        null=True,
        blank=True
    )
    previous_court_code = models.CharField(
        max_length=50,
        verbose_name='Код суда при повторном поступлении',
        null=True,
        blank=True
    )
    previous_registration_number = models.CharField(
        max_length=100,
        verbose_name='N пр-ва по первичной регистрации',
        null=True,
        blank=True
    )
    previous_application_date = models.DateField(
        verbose_name='Дата первичного поступления',
        null=True,
        blank=True
    )
    
    # Государственная пошлина
    duty_amount_main = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма госпошлины (осн. треб.)',
        null=True,
        blank=True
    )
    duty_payer_main = models.CharField(
        max_length=200,
        verbose_name='Кем уплачена госпошлина (осн.)',
        null=True,
        blank=True
    )
    duty_date_main = models.DateField(
        verbose_name='Дата уплаты (осн.)',
        null=True,
        blank=True
    )
    
    duty_amount_additional = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма госпошлины (доп. треб.)',
        null=True,
        blank=True
    )
    duty_payer_additional = models.CharField(
        max_length=200,
        verbose_name='Кем уплачена госпошлина (доп.)',
        null=True,
        blank=True
    )
    duty_date_additional = models.DateField(
        verbose_name='Дата уплаты (доп.)',
        null=True,
        blank=True
    )
    
    # Судья
    judge_name = models.CharField(
        max_length=200,
        verbose_name='Ф.И.О., код судьи',
        null=True,
        blank=True
    )
    accepted_for_production = models.DateField(
        verbose_name='Дело принято к производству',
        null=True,
        blank=True
    )
    transferred_date = models.DateField(
        verbose_name='Дело передано',
        null=True,
        blank=True
    )
    transferred_to_judge = models.CharField(
        max_length=200,
        verbose_name='Ф.И.О., код судьи (при передаче)',
        null=True,
        blank=True
    )
    
    # II. ДВИЖЕНИЕ ГРАЖДАНСКОГО ДЕЛА
    scheduled_date = models.DateField(
        verbose_name='Дело назначено к рассмотрению на',
        null=True,
        blank=True
    )
    scheduled_time = models.TimeField(
        verbose_name='Время рассмотрения',
        null=True,
        blank=True
    )
    vks_used = models.BooleanField(
        verbose_name='Использование ВКС',
        default=False
    )
    
    # Отложение дела
    postponed_date = models.DateField(
        verbose_name='Дело отложено на',
        null=True,
        blank=True
    )
    postponed_reason = models.CharField(
        max_length=2,
        verbose_name='Причина отложения (код)',
        null=True,
        blank=True
    )
    postponed_date_2 = models.DateField(
        verbose_name='Дата повторного отложения',
        null=True,
        blank=True
    )
    postponed_date_3 = models.DateField(
        verbose_name='Дата третьего отложения',
        null=True,
        blank=True
    )
    
    # Приостановление дела
    suspension_date = models.DateField(
        verbose_name='Дата приостановления',
        null=True,
        blank=True
    )
    suspension_basis_code = models.CharField(
        max_length=50,
        verbose_name='Основание приостановления (статья)',
        null=True,
        blank=True
    )
    suspension_basis_text = models.TextField(
        verbose_name='Основание приостановления (текст)',
        null=True,
        blank=True
    )
    suspension_date_2 = models.DateField(
        verbose_name='Дата второго приостановления',
        null=True,
        blank=True
    )
    suspension_basis_2 = models.TextField(
        verbose_name='Основание второго приостановления',
        null=True,
        blank=True
    )
    obstacle_removed_date = models.DateField(
        verbose_name='Поступило сообщение об устранении препятствий',
        null=True,
        blank=True
    )
    resumed_date = models.DateField(
        verbose_name='Дело возобновлено производством',
        null=True,
        blank=True
    )
    suspension_duration = models.IntegerField(
        verbose_name='Продолжительность приостановления (дней)',
        null=True,
        blank=True
    )
    reconciliation_period_date = models.DateField(
        verbose_name='Определение о предоставлении срока для примирения',
        null=True,
        blank=True
    )
    reconciliation_days = models.IntegerField(
        verbose_name='Срок для примирения (дней)',
        null=True,
        blank=True
    )
    
    # VII. ДРУГИЕ ОТМЕТКИ О ДВИЖЕНИИ ДЕЛА
    combined_with_case = models.CharField(
        max_length=100,
        verbose_name='Дело соединено с делом N',
        null=True,
        blank=True
    )
    combined_date = models.DateField(
        verbose_name='Дата соединения дел',
        null=True,
        blank=True
    )
    
    separated_case_number = models.CharField(
        max_length=100,
        verbose_name='Дело выделенное в отдельное производство N',
        null=True,
        blank=True
    )
    separated_date = models.DateField(
        verbose_name='Дата выделения дела',
        null=True,
        blank=True
    )
    
    # Сроки
    consideration_duration_months = models.IntegerField(
        verbose_name='Продолжительность рассмотрения дела (мес.)',
        null=True,
        blank=True
    )
    consideration_duration_days = models.IntegerField(
        verbose_name='Продолжительность рассмотрения дела (дн.)',
        null=True,
        blank=True
    )
    total_duration_months = models.IntegerField(
        verbose_name='Общая продолжительность рассмотрения дела в суде (мес.)',
        null=True,
        blank=True
    )
    total_duration_days = models.IntegerField(
        verbose_name='Общая продолжительность рассмотрения дела в суде (дн.)',
        null=True,
        blank=True
    )
    
    statutory_period_months = models.IntegerField(
        verbose_name='Срок рассмотрения для данного дела по ГПК (мес.)',
        null=True,
        blank=True
    )
    statutory_period_days = models.IntegerField(
        verbose_name='Срок рассмотрения для данного дела по ГПК (дн.)',
        null=True,
        blank=True
    )
    
    compliance_with_deadlines = models.CharField(
        max_length=2,
        verbose_name='Дело рассмотрено в сроки',
        null=True,
        blank=True
    )
    
    procedural_terms_start_date = models.DateField(
        verbose_name='Дата начала исчисления процессуальных сроков',
        null=True,
        blank=True
    )
    
    handed_to_office_date = models.DateField(
        verbose_name='Дело сдано в отдел делопроизводства',
        null=True,
        blank=True
    )
    
    copies_sent_date = models.DateField(
        verbose_name='Копии судебных постановлений направлены',
        null=True,
        blank=True
    )
    
    complex_case = models.BooleanField(
        verbose_name='Дело сложное',
        default=False
    )
    complex_prolonged = models.DateField(
        verbose_name='Продлено по сложному делу до',
        null=True,
        blank=True
    )
    
    protocol_comments_submitted = models.DateField(
        verbose_name='Принесены замечания на протокол с/заседания',
        null=True,
        blank=True
    )
    protocol_comments_considered = models.DateField(
        verbose_name='Замечания рассмотрены',
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Гражданское судопроизводство'
        verbose_name_plural = 'Гражданские судопроизводства'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Гражданское дело {self.business_card.original_name}'


class CivilDecision(models.Model):
    """Решение по гражданскому делу"""
    
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='decisions',
        verbose_name='Гражданское дело'
    )
    
    # III. РЕЗУЛЬТАТ РАССМОТРЕНИЯ ДЕЛА ПО I ИНСТАНЦИИ
    considered_date = models.DateField(
        verbose_name='Дело рассмотрено',
        null=True,
        blank=True
    )
    motivated_decision_date = models.DateField(
        verbose_name='Составлено мотивированное решение',
        null=True,
        blank=True
    )
    simplified_proceedings = models.BooleanField(
        verbose_name='Рассмотрено в упрощенном производстве',
        default=False
    )
    
    # Вид судебного постановления
    ruling_type = models.CharField(
        max_length=2,
        verbose_name='Вид судебного постановления (код)',
        null=True,
        blank=True
    )
    default_judgment_sent = models.DateField(
        verbose_name='Заочное решение направлено',
        null=True,
        blank=True
    )
    default_judgment_delivered = models.DateField(
        verbose_name='Заочное решение вручено',
        null=True,
        blank=True
    )
    court_order_sent = models.DateField(
        verbose_name='Судебный приказ направлен',
        null=True,
        blank=True
    )
    court_order_delivered = models.DateField(
        verbose_name='Судебный приказ вручен',
        null=True,
        blank=True
    )
    
    # Результат рассмотрения
    consideration_result_main = models.CharField(
        max_length=2,
        verbose_name='Результат рассмотрения (осн. треб.)',
        null=True,
        blank=True
    )
    consideration_result_additional = models.CharField(
        max_length=2,
        verbose_name='Результат по дополнительному требованию',
        null=True,
        blank=True
    )
    consideration_result_counter = models.CharField(
        max_length=2,
        verbose_name='Результат по встречному требованию',
        null=True,
        blank=True
    )
    
    # Примирительные процедуры
    mediation_used = models.BooleanField(
        verbose_name='Медиации в период суд. пр-ва',
        default=False
    )
    judicial_reconciliation = models.BooleanField(
        verbose_name='Судебное примирение',
        default=False
    )
    negotiations = models.BooleanField(
        verbose_name='Переговоры',
        default=False
    )
    dispute_settled = models.BooleanField(
        verbose_name='Урегулирован спор',
        default=False
    )
    amicable_agreement = models.BooleanField(
        verbose_name='Заключение мирового соглашения',
        default=False
    )
    dispute_not_settled = models.BooleanField(
        verbose_name='Не урегулирован',
        default=False
    )
    
    termination_basis = models.CharField(
        max_length=100,
        verbose_name='Основание прекращения дела',
        null=True,
        blank=True
    )
    termination_article = models.CharField(
        max_length=50,
        verbose_name='Статья прекращения',
        null=True,
        blank=True
    )
    left_without_consideration_basis = models.CharField(
        max_length=100,
        verbose_name='Основание оставления без рассмотрения',
        null=True,
        blank=True
    )
    left_without_consideration_article = models.CharField(
        max_length=50,
        verbose_name='Статья оставления без рассмотрения',
        null=True,
        blank=True
    )
    transferred_jurisdiction_date = models.DateField(
        verbose_name='Передано по подсудности',
        null=True,
        blank=True
    )
    transferred_to_court = models.CharField(
        max_length=200,
        verbose_name='Направлено в суд',
        null=True,
        blank=True
    )
    transferred_to_arbitration = models.CharField(
        max_length=200,
        verbose_name='В т.ч. в третейский суд',
        null=True,
        blank=True
    )
    
    # Отмена решений
    cancellation_application_date = models.DateField(
        verbose_name='Заявление об отмене',
        null=True,
        blank=True
    )
    cancellation_applicant = models.CharField(
        max_length=200,
        verbose_name='Кем подано заявление об отмене',
        null=True,
        blank=True
    )
    cancelled_by_judge_date = models.DateField(
        verbose_name='Отменено судьей',
        null=True,
        blank=True
    )
    new_case_number = models.CharField(
        max_length=100,
        verbose_name='N нового пр-ва по делу',
        null=True,
        blank=True
    )
    
    # Определения
    rejection_of_waiver = models.BooleanField(
        verbose_name='О непринятии отказа истца от иска',
        default=False
    )
    rejection_of_admission = models.BooleanField(
        verbose_name='О непринятии признания иска ответчиком',
        default=False
    )
    rejection_of_amicable_agreement = models.BooleanField(
        verbose_name='Об отказе в утверждении мирового соглашения',
        default=False
    )
    
    # IV. ОБЖАЛОВАНИЕ И РАССМОТРЕНИЕ ВО II ИНСТАНЦИИ
    appealed = models.BooleanField(
        verbose_name='Обжаловано',
        default=False
    )
    appeal_date = models.DateField(
        verbose_name='Дата обжалования',
        null=True,
        blank=True
    )
    appeal_applicant = models.CharField(
        max_length=200,
        verbose_name='Кем обжаловано',
        null=True,
        blank=True
    )
    
    appeal_complaint = models.BooleanField(
        verbose_name='Подана жалоба',
        default=False
    )
    prosecutor_representation = models.BooleanField(
        verbose_name='Подано представление прокурора',
        default=False
    )
    appeal_representation_date = models.DateField(
        verbose_name='Дата представления прокурора',
        null=True,
        blank=True
    )
    
    deficiency_elimination_date = models.DateField(
        verbose_name='Срок для устранения недостатков до',
        null=True,
        blank=True
    )
    
    second_instance_scheduled_date = models.DateField(
        verbose_name='Дело назначено к рассмотрению во II инстанции',
        null=True,
        blank=True
    )
    second_instance_repeat_date = models.DateField(
        verbose_name='Повторно назначено',
        null=True,
        blank=True
    )
    sent_to_higher_court_date = models.DateField(
        verbose_name='Направлено в вышестоящий суд',
        null=True,
        blank=True
    )
    sent_to_higher_court_name = models.CharField(
        max_length=200,
        verbose_name='Наименование вышестоящего суда',
        null=True,
        blank=True
    )
    sent_to_higher_court_repeat_date = models.DateField(
        verbose_name='Повторно направлено в вышестоящий суд',
        null=True,
        blank=True
    )
    
    returned_without_consideration_date = models.DateField(
        verbose_name='Возвращено без рассмотрения',
        null=True,
        blank=True
    )
    return_reason = models.TextField(
        verbose_name='Причина возврата (текстом)',
        null=True,
        blank=True
    )
    
    second_instance_considered_date = models.DateField(
        verbose_name='Рассмотрено во II инстанции',
        null=True,
        blank=True
    )
    second_instance_result = models.CharField(
        max_length=2,
        verbose_name='Результат рассмотрения во II инстанции',
        null=True,
        blank=True
    )
    
    # V. ИСПОЛНЕНИЕ СУДЕБНОГО ПОСТАНОВЛЕНИЯ
    effective_date = models.DateField(
        verbose_name='Решение вступило в законную силу',
        null=True,
        blank=True
    )
    
    enforcement_documents_sent = models.DateField(
        verbose_name='Исполнительные документы направлены с/приставу',
        null=True,
        blank=True
    )
    enforcement_documents_issued = models.DateField(
        verbose_name='Исполнительные документы выданы взыскателю',
        null=True,
        blank=True
    )
    enforcement_documents_sent_by_office = models.DateField(
        verbose_name='Направлены отделом делопроизводства для исполнения',
        null=True,
        blank=True
    )
    
    executed_date = models.DateField(
        verbose_name='Исполнено',
        null=True,
        blank=True
    )
    executed_type = models.CharField(
        max_length=100,
        verbose_name='Вид взыскания',
        null=True,
        blank=True
    )
    executed_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма исполнения',
        null=True,
        blank=True
    )
    
    returned_from_bailiff_date = models.DateField(
        verbose_name='Возвращено из подразделения ССП',
        null=True,
        blank=True
    )
    returned_type = models.CharField(
        max_length=100,
        verbose_name='Вид возвращенного взыскания',
        null=True,
        blank=True
    )
    returned_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма возвращенного взыскания',
        null=True,
        blank=True
    )
    
    not_collected = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Не взыскано',
        null=True,
        blank=True
    )
    not_collected_reason = models.TextField(
        verbose_name='Основание невзыскания',
        null=True,
        blank=True
    )
    
    archived_date = models.DateField(
        verbose_name='Дело передано в архив',
        null=True,
        blank=True
    )
    
    # VI. ДРУГИЕ СУДЕБНЫЕ ПОСТАНОВЛЕНИЯ
    additional_decision_date = models.DateField(
        verbose_name='Дополнительное решение',
        null=True,
        blank=True
    )
    clarification_decision_date = models.DateField(
        verbose_name='Определение о разъяснении решения',
        null=True,
        blank=True
    )
    execution_change_date = models.DateField(
        verbose_name='Определение об изменении порядка исполнения решения',
        null=True,
        blank=True
    )
    other_enforcement_date = models.DateField(
        verbose_name='Другие в порядке исполнения решения',
        null=True,
        blank=True
    )
    
    court_fines = models.BooleanField(
        verbose_name='Наложены судебные штрафы',
        default=False
    )
    court_fines_date = models.DateField(
        verbose_name='Дата наложения штрафа',
        null=True,
        blank=True
    )
    court_fines_registration = models.CharField(
        max_length=100,
        verbose_name='Регистрационный номер штрафа',
        null=True,
        blank=True
    )
    
    # Процессуальные издержки
    procedural_costs_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма процессуальных издержек',
        null=True,
        blank=True
    )
    procedural_costs_person = models.CharField(
        max_length=200,
        verbose_name='Кому начислены издержки',
        null=True,
        blank=True
    )
    procedural_costs_date = models.DateField(
        verbose_name='Дата постановления об издержках',
        null=True,
        blank=True
    )
    procedural_costs_days = models.IntegerField(
        verbose_name='Количество дней',
        null=True,
        blank=True
    )
    
    # Пересмотр по вновь открывшимся обстоятельствам
    review_new_circumstances_date = models.DateField(
        verbose_name='Определение о пересмотре дела по вновь открывшимся обстоятельствам',
        null=True,
        blank=True
    )
    
    # Кассация
    cassation_date = models.DateField(
        verbose_name='Кассационные постановления вынесенные по делу',
        null=True,
        blank=True
    )
    cassation_result = models.CharField(
        max_length=2,
        verbose_name='Результат кассации',
        null=True,
        blank=True
    )
    cassation_prolonged = models.BooleanField(
        verbose_name='Продлено по сложному делу',
        default=False
    )
    
    # 14. По делу с удовлетворением иска
    awarded_main = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Присуждено к взысканию (Осн. треб.)',
        null=True,
        blank=True
    )
    awarded_additional = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Присуждено к взысканию (Доп. треб.)',
        null=True,
        blank=True
    )
    duty_to_state = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='В доход государства госпошлина',
        null=True,
        blank=True
    )
    court_costs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Судебные издержки',
        null=True,
        blank=True
    )
    reinstatement_recovery = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Взыскано по делу о восстановлении на работе',
        null=True,
        blank=True
    )
    damage_card_opened = models.DateField(
        verbose_name='Карточка по учету сумм ущерба заведена',
        null=True,
        blank=True
    )
    
    # Частные определения
    private_decisions_count = models.IntegerField(
        verbose_name='Вынесено частных определений (количество)',
        default=0
    )
    private_decisions_messages_date = models.DateField(
        verbose_name='Поступило сообщений по частным определениям',
        null=True,
        blank=True
    )
    
    # Состав суда
    court_composition = models.CharField(
        max_length=2,
        verbose_name='Состав суда',
        null=True,
        blank=True
    )
    judge_name_1 = models.CharField(
        max_length=200,
        verbose_name='ФИО судьи 1',
        null=True,
        blank=True
    )
    judge_name_2 = models.CharField(
        max_length=200,
        verbose_name='ФИО судьи 2',
        null=True,
        blank=True
    )
    
    # Другие участники процесса
    prosecutor_as_state = models.BooleanField(
        verbose_name='Прокурор как представитель государства',
        default=False
    )
    prosecutor_for_plaintiff = models.BooleanField(
        verbose_name='Прокурор в интересах истца',
        default=False
    )
    state_org_representative = models.BooleanField(
        verbose_name='Представитель государственных органов',
        default=False
    )
    public_organizations = models.BooleanField(
        verbose_name='Общественные организации',
        default=False
    )
    mass_media = models.BooleanField(
        verbose_name='Средства массовой информации',
        default=False
    )
    expert = models.CharField(
        max_length=200,
        verbose_name='Эксперт',
        null=True,
        blank=True
    )
    specialist = models.CharField(
        max_length=200,
        verbose_name='Специалист',
        null=True,
        blank=True
    )
    interpreter = models.CharField(
        max_length=200,
        verbose_name='Переводчик',
        null=True,
        blank=True
    )
    minor_participation = models.CharField(
        max_length=200,
        verbose_name='Участие несовершеннолетнего',
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Решение по гражданскому делу'
        verbose_name_plural = 'Решения по гражданским делам'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Решение по делу {self.civil_proceedings.business_card.original_name} от {self.considered_date or self.created_at}'


class CivilSide(models.Model):
    """Стороны по гражданскому делу"""
    
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='sides',
        verbose_name='Гражданское дело'
    )
    
    # Истец
    plaintiff_name = models.TextField(
        verbose_name='ИСТЕЦ(ы)/заявитель',
        null=True,
        blank=True
    )
    main_claim = models.TextField(
        verbose_name='Требования (текстом) Основное',
        null=True,
        blank=True
    )
    main_claim_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма основного требования',
        null=True,
        blank=True
    )
    additional_claim = models.TextField(
        verbose_name='Дополнительное требование',
        null=True,
        blank=True
    )
    additional_claim_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма дополнительного требования',
        null=True,
        blank=True
    )
    
    # Ответчик
    defendant_name = models.TextField(
        verbose_name='ОТВЕТЧИК(и)',
        null=True,
        blank=True
    )
    counter_claim = models.TextField(
        verbose_name='Встречные требования (текстом)',
        null=True,
        blank=True
    )
    counter_claim_amount_main = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма встречного требования (осн.)',
        null=True,
        blank=True
    )
    counter_claim_amount_additional = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма встречного требования (доп.)',
        null=True,
        blank=True
    )
    
    # Третьи лица
    third_parties = models.TextField(
        verbose_name='Третьи лица',
        null=True,
        blank=True
    )
    
    independent_claims = models.BooleanField(
        verbose_name='С самостоятельными требованиями',
        default=False
    )
    independent_claims_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Сумма самостоятельных требований',
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Сторона по гражданскому делу'
        verbose_name_plural = 'Стороны по гражданскому делу'
    
    def __str__(self):
        return f'Стороны дела {self.civil_proceedings.business_card.original_name}'


class CivilProcedureAction(models.Model):
    """Действия на стадии приема заявления и подготовки дела"""
    
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='procedure_actions',
        verbose_name='Гражданское дело'
    )
    
    # Вынесенные определения
    preparation_order_date = models.DateField(
        verbose_name='Определение о подготовке дела к судебному разбирательству',
        null=True,
        blank=True
    )
    simplified_proceedings_prep = models.BooleanField(
        verbose_name='В т.ч. в упрощенном пр-ве',
        default=False
    )
    control_date = models.DateField(
        verbose_name='Контрольный срок',
        null=True,
        blank=True
    )
    
    preliminary_hearing_order_date = models.DateField(
        verbose_name='Определение о назначении предварительного с/заседания',
        null=True,
        blank=True
    )
    preliminary_hearing_date = models.DateField(
        verbose_name='Дата предварительного с/заседания',
        null=True,
        blank=True
    )
    
    closed_hearing_order_date = models.DateField(
        verbose_name='Определение о назначении закрытого судебного заседания',
        null=True,
        blank=True
    )
    
    court_order_date = models.DateField(
        verbose_name='Определение о направлении с/поручения',
        null=True,
        blank=True
    )
    court_order_received = models.DateField(
        verbose_name='С/поручение поступило исполненное',
        null=True,
        blank=True
    )
    
    examination_order_date = models.DateField(
        verbose_name='Определение о назначении экспертизы',
        null=True,
        blank=True
    )
    examination_type = models.CharField(
        max_length=200,
        verbose_name='Вид экспертизы',
        null=True,
        blank=True
    )
    examination_institution = models.CharField(
        max_length=300,
        verbose_name='Учреждение для экспертизы',
        null=True,
        blank=True
    )
    examination_sent_date = models.DateField(
        verbose_name='Экспертиза направлена',
        null=True,
        blank=True
    )
    examination_returned_date = models.DateField(
        verbose_name='Экспертиза возвращена',
        null=True,
        blank=True
    )
    
    claim_security_order_date = models.DateField(
        verbose_name='Определение об обеспечении иска',
        null=True,
        blank=True
    )
    
    # Меры обеспечения
    property_arrest = models.BooleanField(
        verbose_name='Наложение ареста на имущество',
        default=False
    )
    defendant_prohibition = models.BooleanField(
        verbose_name='Запрет ответчику совершать определенные действия',
        default=False
    )
    others_prohibition = models.BooleanField(
        verbose_name='Запрещение другим лицам совершать определенные действия',
        default=False
    )
    defendant_obligation = models.BooleanField(
        verbose_name='Возложение на ответчика обязанности совершить определенные действия',
        default=False
    )
    others_obligation = models.BooleanField(
        verbose_name='Возложение на других лиц обязанности совершить определенные действия',
        default=False
    )
    property_sale_suspension = models.BooleanField(
        verbose_name='Приостановление реализации имущества',
        default=False
    )
    property_release = models.BooleanField(
        verbose_name='Освобождение имущества от ареста',
        default=False
    )
    enforcement_suspension = models.BooleanField(
        verbose_name='Приостановление взыскания по исполнительному документу',
        default=False
    )
    other_security_measures = models.TextField(
        verbose_name='Иные меры обеспечения',
        null=True,
        blank=True
    )
    
    transition_to_general_order_date = models.DateField(
        verbose_name='Определение о переходе к общему порядку судебного разбирательства',
        null=True,
        blank=True
    )
    
    hearing_schedule_order_date = models.DateField(
        verbose_name='Определение о назначении дела к судебному разбирательству',
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Действие по подготовке дела'
        verbose_name_plural = 'Действия по подготовке дела'
    
    def __str__(self):
        return f'Действия по делу {self.civil_proceedings.business_card.original_name}'