from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class FamiliarizationCase(models.Model):
    '''1. Ознакомление с материалами дела'''
    petition = models.BooleanField(
        verbose_name='заявлено ходатайство об ознакомлении'
    )
    start_date = models.DateField(
        verbose_name='дата начала'
    )
    end_date = models.DateField(
        verbose_name='дата окончания'
    )
    number_days = models.IntegerField(
        verbose_name='количество дней'  # считает автоматически
    )
    amount_one_day = models.IntegerField(
        verbose_name='сумма за один день ознакомления'
    )
    total_amount = models.IntegerField(
        verbose_name='общая сумма вознаграждения по постановлению'
    )  # считает автоматически

    class Meta:
        ordering = ('-start_date',)
        verbose_name = 'Ознакомление с материаламми дела'

    def __str__(self):
        return f'Всего оплаченно {self.total_amount} за {self.number_days}'


class SidesCase(models.Model):
    '''2. Стороны по делу'''
    sides_case = models.CharField(
        max_length=100,
        verbose_name='Сторона по делу'
    )

    class Meta:
        ordering = ('sides_case',)
        verbose_name = 'Сторона по делу'
        verbose_name_plural = 'Стороны по делу'

    def __str__(self):
        return self.sides_case


class Petitions(models.Model):
    '''3. Модель заявленных ходатайств по делу'''
    name_petition = models.CharField(
        max_length=150,
        verbose_name='наименование ходатайства'
    )

    class Meta:
        ordering = ('name_petition',)
        verbose_name = 'Ходатайство'
        verbose_name_plural = 'Ходатайства'

    def __str__(self):
        return self.name_petition


class Decisions(models.Model):
    '''4. Модель вынесенных решений по делу'''
    name_case = models.CharField(
        max_length=200,
        verbose_name='Решение по поступившему делу'
    )
    date_consideration = models.DateField(
        null=True,
        verbose_name='Дата вынесения'
    )
    notation = models.TextField(
        max_length=300,
        verbose_name='примечания'
    )

    class Meta:
        ordering = ('date_consideration',)
        verbose_name = 'Вынесенное решение'
        verbose_name_plural = 'Вынесенные решения'

    def __str__(self):
        return self.name_case


class ConsideredCase(models.Model):
    '''5. Действия по рассмотренному делу'''
    date_consideration = models.DateField(
        verbose_name='Дата рассмотрения'
    )
    effective_date = models.DateField(
        verbose_name='дата вступления в законную силу'
    )
    notification_parties = models.ManyToManyField(
        SidesCase,
        verbose_name='Кому и когда направленны копии решений'
    )
    executive_lists = models.DateField(
        verbose_name='Дата исполнения дела'
    )

    class Meta:
        verbose_name = 'Дело рассмотренно'

    def __str__(self):
        return self.date_consideration


class Category(models.Model):
    '''6. Модель категорий дела'''
    title_category = models.CharField(
        max_length=200,
        verbose_name='Название категории'
        )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание'
        )
    slug = models.SlugField(
        max_length=255,
        unique=True
        )

    class Meta:
        ordering = ('title_category',)
        verbose_name = 'Категория дела'
        verbose_name_plural = 'Категория дела'

    def __str__(self) -> str:
        return self.title_category


class BusinessCard(models.Model):
    '''7. Модель карточки по делу'''
    original_name = models.CharField(
        unique=True,
        max_length=100,
        verbose_name='номер дела'
        )
    author = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name='cards',
        verbose_name='Автор карточки'
        )
    case_category = models.ForeignKey(
        Category,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name='cards',
        verbose_name='Категория дела'
    )
    article = models.PositiveSmallIntegerField(
        verbose_name='Статья УК РФ'
    )
    pub_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания/изменения карточки'
        )
    preliminary_hearing = models.DateField(
        verbose_name='Дата предварительного слушания/(с/з)'
    )

    class Meta:
        ordering = ('pub_date',)
        verbose_name = 'Карточка на дело'
        verbose_name_plural = 'карточка на дело'

    def __str__(self):
        return self.original_name


class SidesCaseInCase(models.Model):
    '''9. Модель добавления сторон по делу сторон по делу'''
    name = models.CharField(
        max_length=150,
        verbose_name='ФИО'
    )
    sides_case = models.ManyToManyField(
        SidesCase,
        verbose_name='Стороны по делу',
    )
    under_arrest = models.BooleanField(
        blank=True,
        null=True,
        verbose_name='под стражей'
        )
    date_sending_agenda = models.DateField(
        blank=True,
        null=True,
        verbose_name='Дата направления повестки'
    )
    business_card = models.ForeignKey(
        BusinessCard,
        on_delete=models.DO_NOTHING,
        related_name='sidescaseincase',
        verbose_name='Карточка на дело',
    )

    class Meta:
        verbose_name = 'Новое дело'
        verbose_name_plural = 'Новое дело'

    def __str__(self):
        return f'{self.sides_case} {self.name}'


class PetitionsInCase(models.Model):
    '''8. Промежуточная таблица для ходатайств'''
    petitions = models.ForeignKey(
        Petitions,
        on_delete=models.DO_NOTHING,
        verbose_name='ходатайства по делу',
        related_name='sidescaseincase',
        null=True,
        blank=True,
    )
    sides_case = models.ManyToManyField(
        SidesCaseInCase,
        verbose_name='Кто заявил ходатайство'
    )
    date_application = models.DateField(
        verbose_name='Дата ходатайства'
        )
    decision_rendered = models.CharField(
        max_length=150,
        verbose_name='наименование вынесенного решения',
        null=True,
    )
    date_decision = models.DateField(
        verbose_name='Дата решения по ходатайству',
        null=True,
    )
    notation = models.TextField(
        max_length=300,
        verbose_name='примечания',
        null=True,
    )
    business_card = models.ForeignKey(
        BusinessCard,
        on_delete=models.DO_NOTHING,
        verbose_name='Карточка на дело',
    )

    class Meta:
        ordering = ('date_application',)
        verbose_name = 'Ходатайство'
        verbose_name_plural = 'Ходатайства'

    def __str__(self):
        return (
            f'{self.sides_case} {self.date_application} '
            f'заявил ходатайство о {self.sides_case}'
            )


class Appeal(models.Model):
    '''10. Апелляция по делу'''
    date_appeal = models.DateField(
        verbose_name='дата апелляции'
    )
    # Кто подал апелляцию
    filed_appeal = models.ManyToManyField(
        SidesCase,
        verbose_name='SidesCase',
    )
    decision_appeal = models.CharField(
        max_length=20,
        verbose_name='в апелляции отказано/удовлетворенно'
    )
    # Уведомление сторон об апелляции
    notification_parties = models.ManyToManyField(
        SidesCaseInCase,
        verbose_name='Уведомление сторон об апелляции'
    )
    meeting_requirements = models.CharField(
        max_length=50,
        verbose_name='выполнение требований УПК, перед направлением дела'
    )

    class Meta:
        verbose_name = 'Апелляция'
        verbose_name_plural = 'Апелляции'

    def __str__(self):
        return self.date_appeal


class BusinessMovement(models.Model):
    '''11. Движение дела'''
    date_meeting = models.DateField(
        verbose_name='Дата заседания'
        )
    meeting_time = models.TimeField(
        verbose_name='Время заседания'
    )
    decision_case = models.CharField(
        max_length=50,  # Так же в дальнейшем выбор из мэнитумэни
        verbose_name='Решение по поступившему делу'
    )
    composition_colleges = models.CharField(
        max_length=50,
        verbose_name='Состав коллегии'  # далее сделать мэнитумэни
    )
    result_court_session = models.CharField(
        blank=True,
        null=True,
        max_length=200,  # В дальнейшем выбор из мэнитумэни
        verbose_name='Результат судебного заседания'
    )
    reason_deposition = models.CharField(
        blank=True,
        null=True,
        max_length=200,  # В дальнейшем выбор из мэнитумэни
        verbose_name='причина отложения'
    )
    sides_case = models.ManyToManyField(
        SidesCase,  # класс стороны по делу
        verbose_name='Стороны по делу',
    )
    business_card = models.ForeignKey(
        BusinessCard,
        on_delete=models.DO_NOTHING,
        verbose_name='Карточка на дело',
    )
    notation = models.TextField(
        blank=True,
        null=True,
        max_length=300,
        verbose_name='примечания'
    )

    class Meta:
        ordering = ('date_meeting',)
        verbose_name = 'Новое дело'
        verbose_name_plural = 'Новое дело'

    def __str__(self):
        return f'{self.decision_case} {self.date_meeting}'
