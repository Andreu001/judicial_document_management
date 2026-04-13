"""
Модели для статистической карточки на подсудимого
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Defendant, CriminalProceedings
from .person_card_constants import *


class PreviousConviction(models.Model):
    """
    Раздел 2. Неснятые и непогашенные судимости (на момент судебного рассмотрения)
    """
    person_card = models.ForeignKey(
        'CriminalPersonCard',
        on_delete=models.CASCADE,
        related_name='previous_convictions',
        verbose_name="Карточка подсудимого"
    )
    
    # 2.1 Дата приговора
    sentence_date = models.DateField(
        verbose_name="Дата приговора",
        null=True, blank=True
    )
    
    # 2.2 Статьи приговора
    article = models.CharField(
        max_length=50,
        verbose_name="Статья",
        null=True, blank=True
    )
    article_part = models.CharField(
        max_length=10,
        verbose_name="Часть",
        null=True, blank=True
    )
    article_paragraph = models.CharField(
        max_length=10,
        verbose_name="Пункт",
        null=True, blank=True
    )
    
    # Стадия совершения преступления
    crime_stage = models.CharField(
        max_length=10,
        choices=CRIME_STAGE_CHOICES,
        verbose_name="Стадия",
        null=True, blank=True
    )
    
    # 2.3 Тип наказания
    punishment_type = models.CharField(
        max_length=10,
        choices=PUNISHMENT_TYPE_CHOICES,
        verbose_name="Тип наказания",
        null=True, blank=True
    )
    
    # 2.4 Вид наказания (детализация)
    punishment_kind = models.CharField(
        max_length=255,
        verbose_name="Вид наказания",
        null=True, blank=True
    )
    
    # 2.5 Размер, единицы измерения
    punishment_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Размер наказания",
        null=True, blank=True
    )
    punishment_unit = models.CharField(
        max_length=20,
        verbose_name="Единицы измерения (лет, месяцев, часов, руб.)",
        null=True, blank=True
    )
    
    # 2.5.1 Размер испытательного срока/отсрочки
    probation_period = models.CharField(
        max_length=50,
        verbose_name="Испытательный срок/отсрочка",
        null=True, blank=True
    )
    
    # 2.6 Особенности назначения
    assignment_features = models.CharField(
        max_length=255,
        verbose_name="Особенности назначения",
        null=True, blank=True
    )
    
    # 2.7 Основания освобождения
    release_basis = models.CharField(
        max_length=255,
        verbose_name="Основания освобождения",
        null=True, blank=True
    )
    
    # 2.8 Отбытие наказания
    punishment_served = models.CharField(
        max_length=10,
        choices=[
            ('1', 'отбыл наказание полностью (в т.ч. истек испытательный срок)'),
            ('2', 'освобожден условно-досрочно (ст. 79 УК РФ)'),
            ('3', 'освобожден в порядке замены более мягким видом (ст. 80 УК РФ)'),
            ('4', 'освобожден по амнистии (помилованию)'),
            ('5', 'освобожден по болезни (ст. 81 УК РФ)'),
            ('6', 'освобожден в связи с истечением срока давности (ст. 83 УК РФ)'),
            ('9', 'условное осуждение, исполняется самостоятельно'),
            ('10', 'условное осуждение отменено с отбытием реального наказания'),
            ('11', 'условное осуждение отменено без отбытия реального наказания'),
        ],
        verbose_name="Отбытие наказания",
        null=True, blank=True
    )
    
    class Meta:
        verbose_name = "Предыдущая судимость"
        verbose_name_plural = "Предыдущие судимости"
        ordering = ['-sentence_date']
    
    def __str__(self):
        return f"Судимость от {self.sentence_date or 'не указана'} - {self.article or ''}"


class CrimeComposition(models.Model):
    """
    Раздел 4. Составы преступлений
    """
    person_card = models.ForeignKey(
        'CriminalPersonCard',
        on_delete=models.CASCADE,
        related_name='crime_compositions',
        verbose_name="Карточка подсудимого"
    )
    
    # 4.0 Тип статьи
    article_type = models.CharField(
        max_length=10,
        choices=ARTICLE_TYPE_CHOICES,
        verbose_name="Тип статьи",
        default='2'
    )
    
    # 4.0.1 Уникальный номер преступления (автоматически)
    unique_crime_number = models.CharField(
        max_length=100,
        verbose_name="Уникальный номер преступления",
        null=True, blank=True
    )
    
    # 4.0.2 Дата преступления
    crime_date = models.DateField(
        verbose_name="Дата преступления",
        null=True, blank=True
    )
    
    # Инстанция рассмотрения
    instance = models.CharField(
        max_length=10,
        choices=COURT_INSTANCE_CHOICES,
        verbose_name="Инстанция",
        default='first'
    )
    
    # 4.1, 4.6 Статья УК РФ
    article = models.CharField(
        max_length=50,
        verbose_name="Статья УК РФ",
        db_index=True,
        null=True,
        blank=True
    )
    article_part = models.CharField(
        max_length=10,
        verbose_name="Часть",
        null=True, blank=True
    )
    article_paragraphs = models.CharField(
        max_length=100,
        verbose_name="Пункты",
        null=True, blank=True
    )
    
    # Редакция ФЗ
    federal_law_edition = models.CharField(
        max_length=50,
        verbose_name="Редакция ФЗ",
        null=True, blank=True
    )
    
    # 4.2, 4.7 Стадия совершения преступления
    crime_stage = models.CharField(
        max_length=10,
        choices=CRIME_STAGE_CHOICES,
        verbose_name="Стадия совершения преступления",
        null=True, blank=True
    )
    
    # 4.3, 4.8 Категория (вид) соучастника
    accomplice_type = models.CharField(
        max_length=10,
        choices=[
            ('0', 'нет признака группы'),
            ('1', 'исполнитель (соисполнитель)'),
            ('2', 'организатор'),
            ('3', 'подстрекатель'),
            ('4', 'пособник'),
        ],
        verbose_name="Вид соучастника",
        null=True, blank=True
    )
    
    # 4.4, 4.9 Форма соучастия
    complicity_form = models.CharField(
        max_length=10,
        choices=[
            ('0', 'одним лицом'),
            ('1', 'группа лиц без предварительного сговора'),
            ('2', 'группа лиц по предварительному сговору'),
            ('3', 'организованная группа'),
            ('4', 'преступное сообщество (преступная организация)'),
        ],
        verbose_name="Форма соучастия",
        null=True, blank=True
    )
    
    # 4.5 Результат судебного рассмотрения
    court_result = models.CharField(
        max_length=10,
        choices=COURT_RESULT_CHOICES,
        verbose_name="Результат судебного рассмотрения",
        null=True, blank=True
    )
    
    # 4.5.1 Переквалификация
    requalification = models.BooleanField(
        default=False,
        verbose_name="Переквалификация составов обвинения"
    )
    requalification_details = models.CharField(
        max_length=255,
        verbose_name="Детали переквалификации",
        null=True, blank=True
    )
    
    # 4.5.2 Редакция состава преступления
    composition_edition = models.CharField(
        max_length=10,
        choices=[
            ('0', 'текущая редакция УК РФ'),
            ('1', 'старая редакция (на момент совершения)'),
        ],
        verbose_name="Редакция состава преступления",
        null=True, blank=True
    )
    
    # 4.7.1 Форма вины
    guilt_form = models.CharField(
        max_length=10,
        choices=[
            ('0', 'вина не установлена (оправдание/прекращение по реабилитирующим основаниям)'),
            ('1', 'умышленное преступление'),
            ('2', 'неосторожное преступление'),
        ],
        verbose_name="Форма вины",
        null=True, blank=True
    )
    
    # 4.10 Состав преступной группы
    crime_group_composition = models.CharField(
        max_length=10,
        choices=[
            ('0', 'одним лицом'),
            ('1', 'группа несовершеннолетних'),
            ('2', 'группа взрослых'),
            ('3', 'смешанная (по возрасту) группа'),
        ],
        verbose_name="Состав преступной группы",
        null=True, blank=True
    )
    
    # 4.11 Рецидив
    recidivism = models.CharField(
        max_length=10,
        choices=RECIDIVISM_CHOICES,
        verbose_name="Рецидив",
        null=True, blank=True
    )
    
    # 4.12 Состояние опьянения (множественный выбор)
    intoxication_state = models.CharField(
        max_length=100,
        choices=INTOXICATION_CHOICES,
        verbose_name="Состояние опьянения",
        null=True, blank=True
    )
    
    # 4.13 Место совершения преступления
    crime_place = models.CharField(
        max_length=10,
        choices=CRIME_PLACE_CHOICES,
        verbose_name="Место совершения преступления",
        null=True, blank=True
    )
    
    # 4.14 Отрасль хозяйства
    economic_sector = models.CharField(
        max_length=10,
        choices=[(str(i), name) for i, name in [
            ('1', 'топливно-энергетический комплекс'),
            ('2', 'иные добывающие отрасли'),
            ('3', 'легкая промышленность'),
            ('4', 'пищевая промышленность'),
            ('5', 'иные обрабатывающие отрасли'),
            ('6', 'фермерские хозяйства'),
            ('7', 'хозяйства иных организационно-правовых форм'),
            ('8', 'автомобильный транспорт'),
            ('10', 'железнодорожный транспорт'),
            ('14', 'связь'),
            ('15', 'строительство'),
            ('18', 'финансы, кредит, страхование'),
            ('20', 'жилищно-коммунальное хозяйство'),
            ('22', 'торговля и общественное питание'),
            ('23', 'здравоохранение, соцобеспечение'),
            ('24', 'культура'),
            ('25', 'образование'),
            ('27', 'правоохранительные органы'),
            ('28', 'суды, учреждения, органы юстиции'),
            ('30', 'преступления, не связанные с конкретной отраслью'),
        ]],
        verbose_name="Отрасль хозяйства",
        null=True, blank=True
    )
    
    # 4.15 Отношение к предприятию
    relation_to_enterprise = models.CharField(
        max_length=10,
        choices=[
            ('0', 'состав преступления не входит в перечень ст. 158-168 УК РФ'),
            ('1', 'работником данного предприятия, учреждения, организации'),
            ('2', 'посторонним лицом'),
        ],
        verbose_name="Отношение к предприятию",
        null=True, blank=True
    )
    
    # 4.15.1 Связь с предпринимательской деятельностью
    business_activity_connection = models.BooleanField(
        default=False,
        verbose_name="Связь с предпринимательской деятельностью"
    )
    
    # 4.18 Коррупционный мотив
    corruption_motive = models.CharField(
        max_length=10,
        choices=[
            ('0', 'нет указанных признаков'),
            ('1', 'незаконное использование своего служебного положения в целях получения выгоды'),
            ('2', 'в целях подкупа должностного лица'),
            ('3', 'при наличии совокупности с коррупционным преступлением'),
        ],
        verbose_name="Коррупционный мотив",
        null=True, blank=True
    )
    
    # 4.19 Экстремистский мотив
    extremist_motive = models.BooleanField(
        default=False,
        verbose_name="Экстремистский мотив преступления"
    )
    
    # 4.20 Размер незаконной выгоды/ущерба
    illegal_gain_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name="Размер незаконной выгоды/ущерба (руб.)",
        null=True, blank=True
    )
    
    # 4.21 Корыстный мотив
    selfish_motive = models.BooleanField(
        default=False,
        verbose_name="Корыстный мотив"
    )
    
    # 4.23 Изменение категории тяжести
    severity_category_changed = models.BooleanField(
        default=False,
        verbose_name="Изменение судом категории тяжести преступления"
    )
    new_severity_category = models.CharField(
        max_length=50,
        verbose_name="Новая категория тяжести",
        null=True, blank=True
    )
    
    # 4.24 Связь с террористической деятельностью
    terrorism_connection = models.CharField(
        max_length=10,
        choices=[
            ('0', 'не связано'),
            ('1', 'связано с террористической деятельностью'),
            ('2', 'с финансированием терроризма'),
        ],
        verbose_name="Связь с террористической деятельностью",
        null=True, blank=True
    )
    
    # 4.27 Преступление совершено в отношении несовершеннолетнего
    against_minor = models.CharField(
        max_length=10,
        choices=[
            ('0', 'нет'),
            ('1', 'в возрасте до 14 лет'),
            ('2', 'в возрасте от 14 до 17 лет'),
        ],
        verbose_name="В отношении несовершеннолетнего",
        null=True, blank=True
    )
    
    # 4.27.1 В отношении женщин
    against_woman = models.CharField(
        max_length=10,
        choices=[
            ('0', 'нет'),
            ('1', 'женщины, заведомо для виновного находящейся в состоянии беременности'),
            ('2', 'лица женского пола (за исключением беременности)'),
        ],
        verbose_name="В отношении женщин",
        null=True, blank=True
    )
    
    # 4.27.2 С использованием интернета
    used_internet = models.BooleanField(
        default=False,
        verbose_name="С использованием информационно-телекоммуникационных сетей (включая сеть 'Интернет')"
    )
    
    # 4.27.3 Совершено близким родственником
    committed_by_relative = models.BooleanField(
        default=False,
        verbose_name="Совершено близким родственником, родственником, близким лицом потерпевшего"
    )
    
    # 4.28 С использованием служебного положения
    used_official_position = models.BooleanField(
        default=False,
        verbose_name="С использованием своего служебного положения"
    )
    
    class Meta:
        verbose_name = "Состав преступления"
        verbose_name_plural = "Составы преступлений"
        ordering = ['-crime_date']
    
    def __str__(self):
        return f"Ст. {self.article}{f' ч.{self.article_part}' if self.article_part else ''} - {self.get_instance_display()}"


class SentencedPunishment(models.Model):
    """
    Раздел 6-7. Назначенное наказание
    """
    person_card = models.ForeignKey(
        'CriminalPersonCard',
        on_delete=models.CASCADE,
        related_name='sentences',
        verbose_name="Карточка подсудимого"
    )
    
    # Инстанция
    instance = models.CharField(
        max_length=10,
        choices=COURT_INSTANCE_CHOICES,
        verbose_name="Инстанция",
        default='first'
    )
    
    # Тип (основное / основное исполняемое самостоятельно / дополнительное)
    punishment_category = models.CharField(
        max_length=255,
        choices=[
            ('main', 'основное наказание'),
            ('main_separate', 'основное наказание, исполняемое самостоятельно'),
            ('additional', 'дополнительное наказание'),
        ],
        verbose_name="Категория наказания"
    )
    
    # 6.1, 7.1 Вид наказания
    punishment_type = models.CharField(
        max_length=10,
        choices=PUNISHMENT_TYPE_CHOICES,
        verbose_name="Вид наказания"
    )
    
    # 6.1.1, 7.1.1 Тип штрафа (способ исчисления)
    fine_type = models.CharField(
        max_length=10,
        choices=[
            ('0', 'не назначался'),
            ('1', 'определенная денежная сумма'),
            ('2', 'кратный сумме'),
            ('3', 'от заработка, иного дохода'),
        ],
        verbose_name="Тип штрафа",
        null=True, blank=True
    )
    
    # 6.2, 7.2 Размер, единицы
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Размер",
        null=True, blank=True
    )
    unit = models.CharField(
        max_length=20,
        verbose_name="Единицы измерения",
        null=True, blank=True
    )
    
    # 6.5, 7.7 Особенности назначения
    assignment_features = models.CharField(
        max_length=10,
        choices=SENTENCING_FEATURE_CHOICES,
        verbose_name="Особенности назначения",
        null=True, blank=True
    )
    
    # 6.6, 7.8 Основания освобождения
    release_basis = models.CharField(
        max_length=10,
        choices=[
            ('0', 'не освобождался'),
            ('1', 'амнистия (ст. 84 УК РФ)'),
            ('2', 'изменение обстановки (ст. 80.1 УК РФ)'),
            ('3', 'болезнь (ст. 81 УК РФ)'),
            ('4', 'помещение в спец. учебно-воспитательное учреждение'),
            ('5', 'принудительные меры воспитательного воздействия'),
            ('6', 'истечение срока давности (ст. 78, 83 УК РФ)'),
        ],
        verbose_name="Основания освобождения",
        null=True, blank=True
    )
    
    class Meta:
        verbose_name = "Назначенное наказание"
        verbose_name_plural = "Назначенные наказания"


class CriminalPersonCard(models.Model):
    """
    Статистическая карточка на подсудимого
    Приказ Судебного департамента при Верховном Суде РФ от 26.12.2024 N 288
    """
    
    # Связь с подсудимым (One-to-One)
    defendant = models.OneToOneField(
        Defendant,
        on_delete=models.CASCADE,
        related_name='person_card',
        verbose_name="Подсудимый"
    )
    
    criminal_proceedings = models.ForeignKey(
        CriminalProceedings,
        on_delete=models.CASCADE,
        related_name='person_cards',
        verbose_name="Уголовное производство"
    )
    
    # Дата создания и обновления
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    # ==================== Раздел 1. Сведения о подсудимом ====================
    
    # 1.1 Дата рождения (берется из Defendant, дублируем для карточки)
    birth_date = models.DateField(verbose_name="Дата рождения", null=True, blank=True)
    
    # 1.2 Возраст на дату совершения преступления
    age_at_crime = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(14), MaxValueValidator(99)],
        verbose_name="Возраст на дату совершения преступления",
        null=True, blank=True
    )
    
    # 1.3 Пол
    sex = models.CharField(max_length=10, choices=SEX_CHOICES, verbose_name="Пол", null=True, blank=True)
    
    # 1.4 Семейное положение
    family_status = models.CharField(max_length=10, choices=FAMILY_STATUS_CHOICES, verbose_name="Семейное положение", null=True, blank=True)
    
    # 1.5 Наличие иждивенцев
    dependents = models.CharField(max_length=10, choices=DEPENDENTS_CHOICES, verbose_name="Наличие иждивенцев", null=True, blank=True)
    
    # 1.6 Гражданство
    citizenship = models.CharField(max_length=10, choices=CITIZENSHIP_CHOICES, verbose_name="Гражданство", null=True, blank=True)
    
    # 1.7 Место жительства
    residence = models.CharField(max_length=10, choices=RESIDENCE_CHOICES, verbose_name="Место жительства", null=True, blank=True)
    
    # 1.8 Образование
    education = models.CharField(max_length=10, choices=EDUCATION_CHOICES, verbose_name="Образование", null=True, blank=True)
    
    # 1.9 Род занятий (социальное положение)
    occupation = models.CharField(max_length=10, choices=OCCUPATION_CHOICES, verbose_name="Род занятий", null=True, blank=True)
    
    # 1.9.1 Профиль специальности
    profession_profile = models.CharField(max_length=10, choices=PROFESSION_PROFILE_CHOICES, verbose_name="Профиль специальности", null=True, blank=True)
    
    # 1.9.2 Следователь каких органов
    investigator_org = models.CharField(max_length=10, choices=[
        ('0', 'нет признака'),
        ('1', 'СКР'),
        ('2', 'ОВД'),
        ('3', 'ФСБ'),
        ('4', 'иных органов'),
    ], verbose_name="Следователь органов", null=True, blank=True)
    
    # 1.10.1 Занимаемая должность
    position = models.CharField(max_length=10, choices=POSITION_CHOICES, verbose_name="Занимаемая должность", null=True, blank=True)
    
    # 1.10.1.1 Должностное лицо
    official = models.CharField(max_length=10, choices=OFFICIAL_CHOICES, verbose_name="Должностное лицо", null=True, blank=True)
    
    # 1.10.2 Совершено преступление (период)
    crime_period = models.CharField(max_length=10, choices=[
        ('0', 'нет указанных признаков'),
        ('1', 'в период осуществления депутатских полномочий'),
        ('2.1', 'кандидат в депутаты'),
        ('2.2', 'член избирательной комиссии'),
        ('3', 'в период исполнения обязанностей присяжного или арбитражного заседателя'),
    ], verbose_name="Период совершения преступления", null=True, blank=True)
    
    # 1.11 Несовершеннолетний не судим, но
    minor_not_convicted = models.CharField(max_length=10, choices=[
        ('0', 'взрослый или признаки отсутствуют'),
        ('1', 'направлялся в спец. учебно-воспитательное учреждение закрытого типа'),
        ('2', 'подвергался иным принудительным мерам воспитательного воздействия'),
        ('3', 'состоял на учете в специализированном органе'),
    ], verbose_name="Несовершеннолетний не судим, но", null=True, blank=True)
    
    # 1.12 Несовершеннолетний воспитывался
    minor_upbringing = models.CharField(max_length=10, choices=[
        ('0', 'взрослый'),
        ('1', 'в семье с обоими родителями'),
        ('2', 'в семье с одним родителем'),
        ('3', 'вне семьи'),
    ], verbose_name="Несовершеннолетний воспитывался", null=True, blank=True)
    
    # 1.13 Подсудимый, юридически не судимый
    legally_not_convicted = models.CharField(max_length=10, choices=[
        ('0', 'судим на момент совершения преступления'),
        ('1', 'имел снятые, погашенные судимости'),
        ('2', 'освобождался от уголовной ответственности по нереабилитирующим основаниям'),
        ('3', 'совершил впервые одно преступление'),
        ('4', 'совершил впервые два и более преступлений'),
    ], verbose_name="Подсудимый, юридически не судимый", null=True, blank=True)
    
    # 1.14 Количество неснятых и непогашенных судимостей
    prior_convictions_count = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Количество неснятых и непогашенных судимостей"
    )
    
    # ==================== Раздел 5. Сведения о приговоре ====================
    
    # 5.1 Дата рассмотрения дела судом первой инстанции
    first_instance_date = models.DateField(verbose_name="Дата рассмотрения дела судом I инстанции", null=True, blank=True)
    
    # 5.1.1 Дата вступления приговора в законную силу
    effective_date = models.DateField(verbose_name="Дата вступления приговора в законную силу", null=True, blank=True)
    
    # 5.2 Результат рассмотрения дела в отношении лица в целом
    court_result = models.CharField(max_length=10, choices=COURT_RESULT_CHOICES, verbose_name="Результат рассмотрения", null=True, blank=True)
    
    # 5.2.1 Переквалификация
    requalification = models.BooleanField(default=False, verbose_name="Переквалификация составов обвинения")
    
    # 5.2.2 Отказ/изменение обвинения прокурором
    prosecutor_refusal = models.CharField(max_length=10, choices=[
        ('0', 'не заявлено'),
        ('1', 'полный отказ (с прекращением дела)'),
        ('2', 'с переквалификацией обвинения'),
        ('3', 'частичный отказ'),
        ('4', 'исключение отягчающих признаков'),
        ('5', 'исключение ссылки на норму УК РФ'),
    ], verbose_name="Отказ/изменение обвинения прокурором", null=True, blank=True)
    
    # 5.2.3 Сокращенная форма дознания
    shortened_inquiry = models.BooleanField(default=False, verbose_name="Дознание в сокращенной форме (ст. 226.9 УПК РФ)")
    
    # 5.2.4 Повторно рассмотрено
    reconsidered = models.CharField(max_length=10, choices=[
        ('0', 'нет'),
        ('1', 'после отмены прекращения дела с назначением судебного штрафа'),
        ('2', 'после отмены принудительных мер медицинского характера'),
        ('3', 'после отмены принудительных мер воспитательного воздействия'),
    ], verbose_name="Повторно рассмотрено", null=True, blank=True)
    
    # 5.3 Особенности рассмотрения дела
    hearing_features = models.CharField(max_length=10, choices=[
        ('0', 'без особенностей'),
        ('1', 'особый порядок при согласии с обвинением (гл. 40 УПК РФ)'),
        ('2', 'с участием присяжных заседателей'),
        ('3', 'вердикт присяжных о снисхождении'),
        ('4', 'особый порядок при досудебном соглашении о сотрудничестве'),
        ('5', 'приговор вынесен заочно'),
    ], verbose_name="Особенности рассмотрения дела", null=True, blank=True)
    
    # 5.4 Вид исправительного учреждения
    correctional_institution = models.CharField(max_length=10, choices=CORRECTIONAL_INSTITUTION_CHOICES, verbose_name="Вид исправительного учреждения", null=True, blank=True)
    
    # 5.5 Лечение осужденному
    treatment_assigned = models.CharField(max_length=10, choices=[
        ('0', 'не определено'),
        ('1', 'от алкоголизма'),
        ('2', 'от наркомании (ст. 72.1 УК РФ)'),
        ('2.1', 'от наркомании (при условном осуждении)'),
        ('3', 'от токсикомании'),
        ('4', 'у врача-психиатра'),
    ], verbose_name="Лечение осужденному", null=True, blank=True)
    
    # 5.6 Отсрочка исполнения приговора
    sentence_suspension = models.CharField(max_length=10, choices=[
        ('0', 'не применялась'),
        ('1', 'до выздоровления'),
        ('2', 'до достижения ребенком 14 лет'),
        ('3', 'исключительные обстоятельства'),
        ('4', 'уплата штрафа'),
        ('5', 'до окончания лечения от наркомании'),
    ], verbose_name="Отсрочка исполнения приговора", null=True, blank=True)
    
    # 5.7 Иные меры уголовно-правового характера
    other_measures = models.CharField(max_length=10, choices=[
        ('0', 'не применялись'),
        ('1.1', 'конфискация денег, ценностей, имущества'),
        ('1.2', 'конфискация орудия, оборудования, транспортного средства'),
        ('2', 'судебный штраф'),
    ], verbose_name="Иные меры уголовно-правового характера", null=True, blank=True)
    
    # 5.7.1 Штраф назначен (способ исчисления)
    fine_type = models.CharField(max_length=10, choices=[
        ('0', 'не назначался'),
        ('1', 'определенная денежная сумма'),
        ('2', 'кратный сумме'),
        ('3', 'от заработка, иного дохода'),
    ], verbose_name="Тип штрафа", null=True, blank=True)
    
    # 5.7.2 Сумма судебного штрафа
    court_fine_amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Сумма судебного штрафа (руб.)", null=True, blank=True)
    
    # 5.8 Категория субъекта (инвалидность)
    disability = models.CharField(max_length=10, choices=[
        ('0', 'нет'),
        ('1', 'инвалид I группы'),
        ('2', 'инвалид II группы'),
    ], verbose_name="Инвалидность", null=True, blank=True)
    
    # 5.8.1 Беременность
    pregnant = models.BooleanField(default=False, verbose_name="Беременная женщина")
    
    # 5.8.2 Наличие детей до 3 лет
    has_child_under_3 = models.BooleanField(default=False, verbose_name="Женщина, имеющая ребенка в возрасте до трех лет")
    
    # ==================== Раздел 7. Окончательное наказание ====================
    
    # 7.9 Условное осуждение с испытательным сроком
    probation_sentence = models.BooleanField(default=False, verbose_name="Назначение основного наказания условно")
    probation_period_years = models.PositiveSmallIntegerField(verbose_name="Испытательный срок (лет)", null=True, blank=True)
    probation_period_months = models.PositiveSmallIntegerField(verbose_name="Испытательный срок (месяцев)", null=True, blank=True)
    
    # 7.7.2 Смягчающие обстоятельства (можно выбрать несколько)
    mitigating_circumstances = models.CharField(max_length=10, choices=MITIGATING_CIRCUMSTANCES_CHOICES, verbose_name="Смягчающие обстоятельства", null=True, blank=True)
    
    # 7.7.3 Отягчающие обстоятельства
    aggravating_circumstances = models.CharField(max_length=10, choices=AGGRAVATING_CIRCUMSTANCES_CHOICES, verbose_name="Отягчающие обстоятельства", null=True, blank=True)
    
    # ==================== Раздел 8. Апелляция ====================
    
    # 8.1 Дата апелляционного рассмотрения
    appeal_date = models.DateField(verbose_name="Дата апелляционного рассмотрения", null=True, blank=True)
    
    # 8.3 Результат апелляционного рассмотрения
    appeal_result = models.CharField(max_length=10, choices=APPEAL_RESULT_CHOICES, verbose_name="Результат апелляции", null=True, blank=True)
    
    # ==================== Раздел 9. Сведения о преступлениях военнослужащих ====================
    
    # 9.1 Воинское звание
    military_rank = models.CharField(max_length=10, choices=MILITARY_RANK_CHOICES, verbose_name="Воинское звание", null=True, blank=True)
    
    # 9.2 Срок службы
    service_years = models.PositiveSmallIntegerField(verbose_name="Срок службы (лет)", null=True, blank=True)
    service_months = models.PositiveSmallIntegerField(verbose_name="Срок службы (месяцев)", null=True, blank=True)
    
    # 9.3 Годность к военной службе
    fitness_for_service = models.CharField(max_length=255, verbose_name="Годность к военной службе", null=True, blank=True)
    
    # 9.4 Время совершения преступления
    crime_time_military = models.CharField(max_length=10, choices=[
        ('1', 'во время несения боевого дежурства'),
        ('2', 'во время суточного наряда'),
        ('3', 'при исполнении служебных обязанностей'),
        ('4', 'во внеслужебное время'),
        ('5', 'во время самовольного нахождения вне части'),
    ], verbose_name="Время совершения преступления (военнослужащие)", null=True, blank=True)
    
    # 9.6 Наличие оружия
    had_weapon = models.BooleanField(default=False, verbose_name="С оружием")
    
    # 9.7 Особенности статуса
    military_status = models.CharField(max_length=10, choices=[
        ('0', 'без особенностей'),
        ('1', 'курсант'),
        ('2', 'проходящий военные сборы'),
    ], verbose_name="Особенности статуса", null=True, blank=True)
    
    # 9.7.1 Подсудимый на момент вынесения приговора
    military_at_sentence = models.CharField(max_length=10, choices=[
        ('1', 'проходит военную службу'),
        ('2', 'уволен с военной службы'),
    ], verbose_name="На момент вынесения приговора", null=True, blank=True)
    
    # ==================== Раздел 10. Дополнительные сведения ====================
    
    # 10.1 Примечания
    notes = models.TextField(verbose_name="Примечания", null=True, blank=True)
    
    # 10.2 Дата поступления дела в суд I инстанции
    case_receipt_date = models.DateField(verbose_name="Дата поступления дела в суд I инстанции", null=True, blank=True)
    
    # 10.6 Срок содержания под стражей (дней)
    detention_days_total = models.PositiveIntegerField(verbose_name="Срок содержания под стражей (всего дней)", null=True, blank=True)
    detention_days_before_court = models.PositiveIntegerField(verbose_name="До поступления в суд (дней)", null=True, blank=True)
    detention_days_during_trial = models.PositiveIntegerField(verbose_name="После поступления в суд до вынесения приговора (дней)", null=True, blank=True)
    detention_days_until_effective = models.PositiveIntegerField(verbose_name="До вступления в законную силу (дней)", null=True, blank=True)
    
    # Статус заполнения
    is_completed = models.BooleanField(default=False, verbose_name="Карточка заполнена полностью")
    
    class Meta:
        verbose_name = "Статистическая карточка на подсудимого"
        verbose_name_plural = "Статистические карточки на подсудимого"
        unique_together = ['defendant', 'criminal_proceedings']
    
    def __str__(self):
        defendant_name = self.defendant.full_name_criminal if self.defendant else "Не указан"
        return f"Карточка на подсудимого: {defendant_name}"
    
    def get_defendant_full_name(self):
        return self.defendant.full_name_criminal if self.defendant else None
