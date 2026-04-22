"""
Модели для апелляционного и кассационного рассмотрения уголовных дел
В соответствии с приказом Судебного департамента при Верховном Суде РФ от 26.12.2024 N 288
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class CriminalAppealInstance(models.Model):
    """
    Модель для хранения информации об апелляционном рассмотрении уголовного дела
    Раздел 8 инструкции (пункты 13-15)
    """
    
    APPEAL_TYPE_CHOICES = [
        ('appeal', 'Апелляционная жалоба'),
        ('representation', 'Апелляционное представление прокурора'),
    ]
    
    APPEAL_RESULT_CHOICES = [
        ('1', 'приговор суда первой инстанции оставлен без изменения'),
        ('2', 'обвинительный приговор отменен с оправданием лица'),
        ('3', 'обвинительный приговор отменен с прекращением дела'),
        ('4', 'обвинительный приговор отменен частично с оставлением менее тяжкого обвинения'),
        ('5', 'обвинительный приговор отменен с направлением дела на новое судебное рассмотрение'),
        ('6', 'обвинительный приговор изменен с переквалификацией обвинения без изменения наказания'),
        ('7', 'обвинительный приговор изменен с изменением наказания и переквалификацией обвинения'),
        ('8', 'обвинительный приговор изменен с изменением меры наказания без переквалификации обвинения'),
        ('9', 'апелляционное производство прекращено'),
        ('10', 'обвинительный приговор отменен с вынесением нового обвинительного приговора'),
        ('11', 'апелляционное постановление (определение) отменено с оставлением в силе постановления (приговора) суда первой инстанции'),
    ]
    
    COURT_COMPOSITION_CHOICES = [
        ('1', 'единолично судьей'),
        ('2', 'коллегией судей'),
        ('3', 'с участием присяжных заседателей'),
    ]
    
    # Связь с уголовным делом
    criminal_proceedings = models.ForeignKey(
        'CriminalProceedings',
        on_delete=models.CASCADE,
        related_name='appeal_instances',
        verbose_name="Уголовное производство"
    )
    
    # Пункт 13 - Обжалование приговора
    appeal_present = models.CharField(
        max_length=2,
        choices=[
            ('1', 'не обжалован'),
            ('2', 'обжалован осужденным (подсудимым)'),
            ('3', 'обжалован прокурором'),
            ('4', 'обжалован другими участниками процесса'),
        ],
        verbose_name="Обжалование приговора",
        null=True, blank=True
    )
    
    appeal_type = models.CharField(
        max_length=20,
        choices=APPEAL_TYPE_CHOICES,
        verbose_name="Тип обжалования",
        null=True, blank=True
    )
    
    appeal_date = models.DateField(
        verbose_name="Дата поступления апелляции",
        null=True, blank=True
    )
    
    appeal_applicant = models.CharField(
        max_length=500,
        verbose_name="ФИО заявителя апелляции",
        null=True, blank=True
    )
    
    appeal_applicant_status = models.ForeignKey(
        'CriminalAppealApplicantStatus',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Процессуальное положение заявителя"
    )
    
    # Пункт 14 - Направление в суд II инстанции
    court_sent_date = models.DateField(
        verbose_name="Дата направления в суд II инстанции",
        null=True, blank=True
    )
    
    court_return_date = models.DateField(
        verbose_name="Дата возвращения из суда II инстанции",
        null=True, blank=True
    )
    
    court_return_reason = models.TextField(
        verbose_name="Причина возвращения",
        null=True, blank=True
    )
    
    court_resend_date = models.DateField(
        verbose_name="Дата повторного направления",
        null=True, blank=True
    )
    
    # Пункт 15 - Рассмотрение во II инстанции
    court_consideration_date = models.DateField(
        verbose_name="Дата рассмотрения во II инстанции",
        null=True, blank=True
    )
    
    court_composition = models.CharField(
        max_length=2,
        choices=COURT_COMPOSITION_CHOICES,
        verbose_name="Состав суда II инстанции",
        null=True, blank=True
    )
    
    court_composition_details = models.TextField(
        verbose_name="Состав коллегии (судьи)",
        null=True, blank=True
    )
    
    # Результат рассмотрения
    appeal_result = models.CharField(
        max_length=3,
        choices=APPEAL_RESULT_CHOICES,
        verbose_name="Результат апелляционного рассмотрения",
        null=True, blank=True
    )
    
    # Сущность изменений (если приговор изменен)
    appeal_changes = models.TextField(
        verbose_name="Сущность изменений приговора",
        null=True, blank=True
    )
    
    # Дата поступления дела из вышестоящего суда
    higher_court_receipt_date = models.DateField(
        verbose_name="Дата поступления дела из вышестоящего суда",
        null=True, blank=True
    )
    
    # Дополнительные поля
    notes = models.TextField(
        verbose_name="Примечания по апелляционному рассмотрению",
        null=True, blank=True
    )
    
    class Meta:
        verbose_name = "Апелляционное рассмотрение"
        verbose_name_plural = "Апелляционные рассмотрения"
        ordering = ['-appeal_date']
    
    def __str__(self):
        return f"Апелляция по делу {self.criminal_proceedings.case_number_criminal} от {self.appeal_date}"


class CriminalCassationInstance(models.Model):
    """
    Модель для хранения информации о кассационном рассмотрении уголовного дела
    Раздел 8 инструкции
    """
    
    CASSATION_TYPE_CHOICES = [
        ('cassation', 'Кассационная жалоба'),
        ('representation', 'Кассационное представление прокурора'),
    ]
    
    CASSATION_RESULT_CHOICES = [
        ('1', 'судебное решение оставлено без изменения'),
        ('2', 'судебное решение отменено с передачей дела на новое судебное рассмотрение'),
        ('3', 'судебное решение отменено с прекращением дела'),
        ('4', 'судебное решение изменено'),
        ('5', 'судебное решение отменено с оставлением заявления без рассмотрения'),
        ('6', 'вынесено новое судебное решение'),
        ('7', 'производство по делу прекращено'),
        ('8', 'кассационное производство прекращено'),
    ]
    
    INSTANCE_CHOICES = [
        ('cassation_first', 'Кассационный суд общей юрисдикции (первая кассация)'),
        ('cassation_second', 'Судебная коллегия по уголовным делам ВС РФ (вторая кассация)'),
        ('supervisory', 'Надзорная инстанция'),
    ]
    
    # Связь с уголовным делом
    criminal_proceedings = models.ForeignKey(
        'CriminalProceedings',
        on_delete=models.CASCADE,
        related_name='cassation_instances',
        verbose_name="Уголовное производство"
    )
    
    # Тип кассации
    instance_type = models.CharField(
        max_length=20,
        choices=INSTANCE_CHOICES,
        verbose_name="Кассационная инстанция",
        default='cassation_first'
    )
    
    # Подача кассации
    cassation_filed = models.BooleanField(
        default=False,
        verbose_name="Подана кассационная жалоба/представление"
    )
    
    cassation_type = models.CharField(
        max_length=20,
        choices=CASSATION_TYPE_CHOICES,
        verbose_name="Тип кассационного обжалования",
        null=True, blank=True
    )
    
    cassation_date = models.DateField(
        verbose_name="Дата подачи кассационной жалобы",
        null=True, blank=True
    )
    
    cassation_applicant = models.CharField(
        max_length=500,
        verbose_name="Заявитель кассационной жалобы",
        null=True, blank=True
    )
    
    # Направление дела в кассацию
    court_sent_date = models.DateField(
        verbose_name="Дата направления дела в кассационную инстанцию",
        null=True, blank=True
    )
    
    court_receipt_date = models.DateField(
        verbose_name="Дата поступления дела в кассационную инстанцию",
        null=True, blank=True
    )
    
    court_return_date = models.DateField(
        verbose_name="Дата возвращения дела из кассационной инстанции",
        null=True, blank=True
    )
    
    # Рассмотрение в кассации
    consideration_date = models.DateField(
        verbose_name="Дата рассмотрения в кассационной инстанции",
        null=True, blank=True
    )
    
    cassation_result = models.CharField(
        max_length=3,
        choices=CASSATION_RESULT_CHOICES,
        verbose_name="Результат кассационного рассмотрения",
        null=True, blank=True
    )
    
    cassation_changes = models.TextField(
        verbose_name="Сущность изменений",
        null=True, blank=True
    )
    
    # Постановление кассационной инстанции
    ruling_number = models.CharField(
        max_length=100,
        verbose_name="Номер кассационного определения/постановления",
        null=True, blank=True
    )
    
    ruling_date = models.DateField(
        verbose_name="Дата вынесения кассационного определения/постановления",
        null=True, blank=True
    )
    
    # Надзорное производство (для второй кассации/надзора)
    supervisory_request = models.BooleanField(
        default=False,
        verbose_name="Подано заявление о пересмотре в порядке надзора"
    )
    
    supervisory_result = models.CharField(
        max_length=3,
        choices=[
            ('1', 'оставлено без изменения'),
            ('2', 'отменено с передачей дела на новое рассмотрение'),
            ('3', 'отменено с прекращением дела'),
            ('4', 'отменено с оставлением заявления без рассмотрения'),
            ('5', 'изменено'),
            ('6', 'вынесено новое судебное решение'),
        ],
        verbose_name="Результат надзорного рассмотрения",
        null=True, blank=True
    )
    
    # Дополнительные поля
    notes = models.TextField(
        verbose_name="Примечания по кассационному/надзорному рассмотрению",
        null=True, blank=True
    )
    
    class Meta:
        verbose_name = "Кассационное/надзорное рассмотрение"
        verbose_name_plural = "Кассационные/надзорные рассмотрения"
        ordering = ['-cassation_date']
    
    def __str__(self):
        return f"Кассация по делу {self.criminal_proceedings.case_number_criminal} от {self.cassation_date}"


class CriminalAppealApplicantStatus(models.Model):
    """Справочник: Процессуальное положение заявителя апелляции"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Код")
    name = models.CharField(max_length=200, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Процессуальное положение заявителя апелляции"
        verbose_name_plural = "Процессуальные положения заявителей апелляции"
    
    def __str__(self):
        return self.name


class CriminalCassationResult(models.Model):
    """Справочник: Результаты кассационного рассмотрения"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Код")
    name = models.CharField(max_length=200, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Результат кассационного рассмотрения"
        verbose_name_plural = "Результаты кассационного рассмотрения"
    
    def __str__(self):
        return self.name


class CriminalSupervisoryResult(models.Model):
    """Справочник: Результаты надзорного рассмотрения"""
    code = models.CharField(max_length=10, unique=True, verbose_name="Код")
    name = models.CharField(max_length=200, verbose_name="Наименование")
    
    class Meta:
        verbose_name = "Результат надзорного рассмотрения"
        verbose_name_plural = "Результаты надзорного рассмотрения"
    
    def __str__(self):
        return self.name