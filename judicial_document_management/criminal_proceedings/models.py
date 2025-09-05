# criminal_proceedings/models.py
from django.db import models
from business_card.models import BusinessCard, SidesCase


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
    case_order = models.CharField(max_length=255, null=True, blank=True, verbose_name="Порядок поступления дела")
    repeat_case = models.BooleanField(null=True, blank=True, verbose_name="Повторное поступление дела")
    repeat_case_date = models.DateField(null=True, blank=True, verbose_name="Дата повторного поступления")
    case_category_detail = models.CharField(max_length=255, null=True, blank=True, verbose_name="Категория дела")
    judge_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="ФИО судьи")
    judge_code = models.CharField(max_length=50, null=True, blank=True, verbose_name="Код судьи")
    judge_acceptance_date = models.DateField(null=True, blank=True, verbose_name="Дата принятия дела судьей")
    preliminary_hearing_date = models.DateField(null=True, blank=True, verbose_name="Дата предварительного слушания")
    preliminary_hearing_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат слушания")
    first_hearing_date = models.DateField(null=True, blank=True, verbose_name="Дата первого заседания")
    hearing_postponed_reason = models.TextField(null=True, blank=True, verbose_name="Причина отложения")
    suspension_date = models.DateField(null=True, blank=True, verbose_name="Дата приостановления производства")
    resumption_date = models.DateField(null=True, blank=True, verbose_name="Дата возобновления производства")
    case_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат рассмотрения дела в целом")
    total_duration_days = models.IntegerField(null=True, blank=True, verbose_name="Общая продолжительность (дни)")
    composition_court = models.CharField(max_length=255, null=True, blank=True, verbose_name="Состав суда")
    participation_details = models.TextField(null=True, blank=True, verbose_name="Особенности участия (прокурор, переводчик и др.)")

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
    Раздел Б. Сведения об обвиняемом лице (много на одно дело).
    """
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name="defendants",
        verbose_name="Уголовное производство"
    )

    full_name = models.CharField(max_length=255, verbose_name="ФИО обвиняемого")
    side_case = models.ForeignKey(
        SidesCase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Сторона по делу'
    )
    address = models.CharField(max_length=500, null=True, blank=True, verbose_name="Адрес проживания")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Дата рождения")
    sex = models.CharField(max_length=10, null=True, blank=True, verbose_name="Пол")
    citizenship = models.CharField(max_length=50, null=True, blank=True, verbose_name="Гражданство")
    restraint_measure = models.CharField(max_length=255, null=True, blank=True, verbose_name="Мера пресечения")
    restraint_date = models.DateField(null=True, blank=True, verbose_name="Дата избрания меры пресечения")
    trial_result = models.CharField(max_length=255, null=True, blank=True, verbose_name="Результат рассмотрения по данному лицу")
    conviction_article = models.CharField(max_length=255, null=True, blank=True, verbose_name="Статья по приговору")
    punishment_type = models.CharField(max_length=255, null=True, blank=True, verbose_name="Вид наказания")
    punishment_term = models.CharField(max_length=255, null=True, blank=True, verbose_name="Срок наказания")
    additional_punishment = models.CharField(max_length=255, null=True, blank=True, verbose_name="Дополнительное наказание")
    parole_info = models.CharField(max_length=255, null=True, blank=True, verbose_name="Условно-досрочное освобождение / испытательный срок")
    property_damage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма ущерба")
    moral_damage = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Сумма морального вреда")
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
        related_name="decisions",
        verbose_name="Уголовное производство"
    )
    
    # 13. Приговор (постановление)
    sentence_appealed = models.CharField(
        max_length=1,
        choices=[
            ('1', 'не обжалован'),
            ('2', 'обжалован осужденным'),
            ('3', 'обжалован прокурором'),
            ('4', 'обжалован др. участниками процесса')
        ],
        null=True,
        blank=True,
        verbose_name="Обжалование приговора"
    )
    
    appeal_date = models.DateField(null=True, blank=True, verbose_name="Дата поступления апелляции")
    appeal_applicant = models.CharField(max_length=255, null=True, blank=True, verbose_name="ФИО заявителя апелляции")
    appeal_applicant_status = models.CharField(max_length=255, null=True, blank=True, verbose_name="Процессуальное положение заявителя")
    
    # 14. Дело направлено в суд II инстанции
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
    
    # 15. Рассмотрено
    court_consideration_date = models.DateField(null=True, blank=True, verbose_name="Дата рассмотрения во II инстанции")
    
    consideration_result = models.CharField(
        max_length=1,
        choices=[
            ('1', 'оставлен без изменения'),
            ('2', 'отменен с возвращением на новое рассмотрение'),
            ('3', 'изменен'),
            ('4', 'вынесен новый приговор (апелляцией)'),
            ('5', 'отменен с прекращением'),
            ('6', 'отменено апелляционное постановление'),
            ('7', 'отменено с возвращением дела прокурору'),
            ('8', 'иные результаты рассмотрения')
        ],
        null=True,
        blank=True,
        verbose_name="Результат рассмотрения во II инстанции"
    )
    
    consideration_changes = models.TextField(null=True, blank=True, verbose_name="Сущность изменений")
    higher_court_receipt_date = models.DateField(null=True, blank=True, verbose_name="Дата поступления из вышестоящего суда")
    
    # 16. Приговор вступил в силу
    sentence_effective_date = models.DateField(null=True, blank=True, verbose_name="Дата вступления в силу")
    
    # 17. Обращен к исполнению
    sentence_execution_date = models.DateField(null=True, blank=True, verbose_name="Дата обращения к исполнению")
    
    # 15.1 Результаты рассмотрения гражданского иска
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
    
    # 18. Особые отметки
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
    
    # 19. Ходатайства
    petitions_info = models.TextField(null=True, blank=True, verbose_name="Информация о ходатайствах")
    petitions_withdrawal_date = models.DateField(null=True, blank=True, verbose_name="Дата отзыва ходатайства")
    
    # 20. Другие отметки
    other_notes = models.TextField(null=True, blank=True, verbose_name="Другие отметки")
    
    archive_date = models.DateField(null=True, blank=True, verbose_name="Дата сдачи в архив")
    
    class Meta:
        verbose_name = "Решение по уголовному делу"
        verbose_name_plural = "Решения по уголовным делам"
    
    def __str__(self):
        return f"Решение по делу {self.criminal_proceedings.business_card.original_name}"