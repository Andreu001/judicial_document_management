from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from users.models import User
from business_card.models import (
    SidesCase, SidesCaseInCase, Lawyer,
    PetitionsInCase, BusinessMovement
)
import logging

logger = logging.getLogger(__name__)


class ReferringAuthorityCivil(models.Model):
    """Органы, направившие материалы (гражданские дела)"""
    name = models.CharField(max_length=255, verbose_name="Название органа")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)

    class Meta:
        verbose_name = "Орган, направивший материалы"
        verbose_name_plural = "Органы, направившие материалы"
        ordering = ['name']

    def __str__(self):
        return self.name


class CivilProceedings(models.Model):
    """
    Учетно-статистическая карточка гражданского дела.
    """
    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('completed', 'Рассмотрено'),
        ('execution', 'На исполнении'),
        ('archived', 'В архиве'),
    ]

    # ------------------- Раздел 1. Общие сведения -------------------
    case_number_civil = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Номер гражданского дела"
    )
    incoming_date = models.DateField(
        verbose_name="Дата поступления дела в суд",
        null=True, blank=True
    )
    incoming_from = models.CharField(
        max_length=255,
        verbose_name="Откуда поступило дело",
        null=True, blank=True
    )
    referring_authority = models.ForeignKey(
        ReferringAuthorityCivil,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Орган, направивший дело"
    )
    judge_acceptance_date = models.DateField(
        verbose_name="Дата принятия дела судьёй",
        null=True, blank=True
    )
    presiding_judge = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={'role': 'judge'},
        verbose_name="Судья (председательствующий)"
    )
    judge_code = models.CharField(
        max_length=50,
        verbose_name="Код судьи",
        null=True, blank=True
    )
    category = models.CharField(
        max_length=255,
        verbose_name="Категория дела",
        null=True, blank=True
    )
    case_type = models.CharField(
        max_length=255,
        verbose_name="Вид производства",
        choices=[
            ('1', 'Исковое производство'),
            ('2', 'Приказное производство'),
            ('3', 'Особое производство'),
            ('4', 'Упрощенное производство'),
        ],
        null=True, blank=True
    )

    # ------------------- Раздел 2. Исковые требования -------------------
    claim_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Цена иска (руб.)",
        null=True, blank=True
    )
    claim_subject = models.TextField(
        verbose_name="Предмет иска",
        null=True, blank=True
    )
    claim_basis = models.TextField(
        verbose_name="Основание иска",
        null=True, blank=True
    )
    claim_date = models.DateField(
        verbose_name="Дата предъявления иска",
        null=True, blank=True
    )
    state_duty = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Государственная пошлина (руб.)",
        null=True, blank=True
    )
    state_duty_paid = models.BooleanField(
        verbose_name="Госпошлина уплачена",
        default=False, null=True, blank=True
    )

    # ------------------- Раздел 3. Рассмотрение дела -------------------
    preliminary_hearing_date = models.DateField(
        verbose_name="Дата предварительного судебного заседания",
        null=True, blank=True
    )
    preliminary_hearing_result = models.CharField(
        max_length=255,
        verbose_name="Результат предварительного заседания",
        choices=[
            ('1', 'Назначено к судебному разбирательству'),
            ('2', 'Отложено'),
            ('3', 'Прекращено производство'),
            ('4', 'Оставлено без рассмотрения'),
            ('5', 'Передано по подсудности'),
        ],
        null=True, blank=True
    )
    first_hearing_date = models.DateField(
        verbose_name="Дата первого судебного заседания",
        null=True, blank=True
    )
    hearing_date = models.DateField(
        verbose_name="Дата рассмотрения (последнего заседания)",
        null=True, blank=True
    )
    hearing_compliance = models.CharField(
        max_length=1,
        verbose_name="Соблюдение сроков рассмотрения",
        choices=[
            ('1', 'С соблюдением сроков, установленных ГПК РФ'),
            ('2', 'С нарушением сроков'),
        ],
        null=True, blank=True
    )
    hearing_postponed = models.BooleanField(
        verbose_name="Дело откладывалось",
        default=False, null=True, blank=True
    )
    postponement_reason = models.TextField(
        verbose_name="Причины отложения",
        null=True, blank=True
    )
    case_suspended = models.BooleanField(
        verbose_name="Производство по делу приостанавливалось",
        default=False, null=True, blank=True
    )
    suspension_reason = models.CharField(
        max_length=255,
        verbose_name="Основание приостановления",
        choices=[
            ('1', 'Смерть гражданина, реорганизация юрлица'),
            ('2', 'Признание стороны недееспособной'),
            ('3', 'Пребывание стороны в лечебном учреждении'),
            ('4', 'Розыск ответчика'),
            ('5', 'Назначение экспертизы'),
            ('6', 'Иное'),
        ],
        null=True, blank=True
    )
    suspension_date = models.DateField(
        verbose_name="Дата приостановления",
        null=True, blank=True
    )
    resumption_date = models.DateField(
        verbose_name="Дата возобновления производства",
        null=True, blank=True
    )

    # ------------------- Раздел 7. Особые отметки и архив -------------------
    special_notes = models.TextField(
        verbose_name="Особые отметки",
        null=True, blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name="Статус дела"
    )
    archived_date = models.DateField(
        verbose_name="Дата сдачи в архив",
        null=True, blank=True
    )
    archive_notes = models.TextField(
        verbose_name="Примечания по архивному делу",
        null=True, blank=True
    )
    registered_case = models.OneToOneField(
        'case_registry.RegisteredCase',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='civil_proceedings_link',
        verbose_name="Зарегистрированное дело"
    )

    # Технические поля
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Гражданское производство"
        verbose_name_plural = "Гражданские производства"
        ordering = ['-incoming_date']

    def __str__(self):
        return f"Гражданское дело № {self.case_number}"


class CivilDecision(models.Model):
    """
    Решения по гражданскому делу (раздел 4 + обжалование).
    Одно дело может иметь несколько решений (первая инстанция, апелляция, кассация).
    """
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='civil_decisions',
        verbose_name="Гражданское производство"
    )

    # ------------------- Раздел 4. Результаты рассмотрения -------------------
    outcome = models.CharField(
        max_length=255,
        verbose_name="Результат рассмотрения дела",
        choices=[
            ('1', 'Иск удовлетворён полностью'),
            ('2', 'Иск удовлетворён частично'),
            ('3', 'В иске отказано'),
            ('4', 'Производство прекращено'),
            ('5', 'Заявление оставлено без рассмотрения'),
            ('6', 'Передано по подсудности'),
            ('7', 'Вынесено судебное решение (не иск)'),
            ('8', 'Судебный приказ'),
        ],
        null=True, blank=True
    )
    decision_date = models.DateField(
        verbose_name="Дата вынесения решения",
        null=True, blank=True
    )
    decision_motivated_date = models.DateField(
        verbose_name="Дата составления мотивированного решения",
        null=True, blank=True
    )
    decision_effective_date = models.DateField(
        verbose_name="Дата вступления решения в законную силу",
        null=True, blank=True
    )

    # ------------------- Апелляция -------------------
    appeal_filed = models.BooleanField(
        verbose_name="Подана апелляционная жалоба",
        default=False, null=True, blank=True
    )
    appeal_date = models.DateField(
        verbose_name="Дата поступления апелляционной жалобы",
        null=True, blank=True
    )
    appeal_result = models.CharField(
        max_length=255,
        verbose_name="Результат апелляционного рассмотрения",
        choices=[
            ('1', 'Оставлено без изменения'),
            ('2', 'Изменено'),
            ('3', 'Отменено с вынесением нового решения'),
            ('4', 'Отменено с прекращением производства'),
            ('5', 'Отменено с оставлением заявления без рассмотрения'),
            ('6', 'Возвращено на новое рассмотрение'),
        ],
        null=True, blank=True
    )
    appeal_decision_date = models.DateField(
        verbose_name="Дата апелляционного определения",
        null=True, blank=True
    )

    # ------------------- Кассация -------------------
    cassation_filed = models.BooleanField(
        verbose_name="Подана кассационная жалоба",
        default=False, null=True, blank=True
    )
    cassation_result = models.CharField(
        max_length=255,
        verbose_name="Результат кассационного рассмотрения",
        null=True, blank=True
    )

    class Meta:
        verbose_name = "Решение по гражданскому делу"
        verbose_name_plural = "Решения по гражданским делам"
        ordering = ['-decision_date']

    def __str__(self):
        return f"Решение по делу {self.civil_proceedings.case_number} от {self.decision_date}"


class CivilExecution(models.Model):
    """
    Исполнение решения по гражданскому делу (разделы 5 и 6).
    Одно дело может иметь несколько записей об исполнении (например, несколько исполнительных листов).
    """
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='civil_executions',
        verbose_name="Гражданское производство"
    )

    # ------------------- Раздел 5. Исполнение решения -------------------
    writ_execution_date = models.DateField(
        verbose_name="Дата выдачи исполнительного листа",
        null=True, blank=True
    )
    writ_received_by = models.CharField(
        max_length=255,
        verbose_name="Кому выдан исполнительный лист",
        null=True, blank=True
    )
    execution_deadline = models.DateField(
        verbose_name="Срок предъявления к исполнению",
        null=True, blank=True
    )
    execution_result = models.CharField(
        max_length=255,
        verbose_name="Результат исполнения",
        choices=[
            ('1', 'Исполнено'),
            ('2', 'Не исполнено'),
            ('3', 'Возвращён без исполнения'),
            ('4', 'Частично исполнено'),
        ],
        null=True, blank=True
    )
    execution_date = models.DateField(
        verbose_name="Дата фактического исполнения",
        null=True, blank=True
    )

    # ------------------- Раздел 6. Судебные издержки -------------------
    legal_costs = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Судебные издержки (руб.)",
        null=True, blank=True
    )
    legal_costs_awarded = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Присуждённые издержки (руб.)",
        null=True, blank=True
    )

    class Meta:
        verbose_name = "Исполнение по гражданскому делу"
        verbose_name_plural = "Исполнения по гражданским делам"
        ordering = ['-writ_execution_date']

    def __str__(self):
        return f"Исполнение по делу {self.civil_proceedings.case_number} от {self.writ_execution_date}"


# ----- Связки с business_card (без изменений, только уточнены related_name) -----

class CivilSidesCaseInCase(models.Model):
    """Стороны по делу (истцы, ответчики, третьи лица)"""
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='civil_sides',
        verbose_name="Гражданское производство"
    )
    sides_case_incase = models.ForeignKey(
        SidesCaseInCase,
        on_delete=models.CASCADE,
        related_name='civil_sides',
        verbose_name="Данные стороны (ФИО/наименование, контакты)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='civil_sides',
        verbose_name="Роль стороны (истец, ответчик, третье лицо и т.д.)"
    )

    class Meta:
        verbose_name = "Сторона гражданского дела"
        verbose_name_plural = "Стороны гражданского дела"
        unique_together = ('civil_proceedings', 'sides_case_incase', 'sides_case_role')

    def __str__(self):
        return f"{self.sides_case_role} - {self.sides_case_incase}"


class CivilLawyer(models.Model):
    """Адвокаты-представители"""
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='civil_lawyers',
        verbose_name="Гражданское производство"
    )
    lawyer = models.ForeignKey(
        Lawyer,
        on_delete=models.CASCADE,
        related_name='civil_lawyers',
        verbose_name="Адвокат (данные из business_card)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='civil_lawyers',
        verbose_name="Представитель какой стороны"
    )

    class Meta:
        verbose_name = "Адвокат в гражданском деле"
        verbose_name_plural = "Адвокаты в гражданских делах"

    def __str__(self):
        return f"{self.sides_case_role} - {self.lawyer}"


class CivilCaseMovement(models.Model):
    """Движение дела (готовые записи из BusinessMovement)"""
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='civil_movements',
        verbose_name="Гражданское производство"
    )
    business_movement = models.ForeignKey(
        BusinessMovement,
        on_delete=models.CASCADE,
        related_name='civil_movements',
        verbose_name="Движение дела (из business_card)"
    )

    class Meta:
        verbose_name = "Движение дела (гражданское)"
        verbose_name_plural = "Движения дела (гражданские)"
        ordering = ['-business_movement__date_meeting', '-business_movement__meeting_time']

    def __str__(self):
        return f"Движение по делу {self.civil_proceedings.case_number} от {self.business_movement.date_meeting}"


class CivilPetition(models.Model):
    """Ходатайства (готовые записи из PetitionsInCase) + заявитель (сторона или адвокат)"""
    
    # Типы заявителей
    PETITIONER_TYPES = [
        ('civil_sides', 'Сторона по делу'),
        ('civil_lawyer', 'Адвокат'),
    ]
    
    civil_proceedings = models.ForeignKey(
        CivilProceedings,
        on_delete=models.CASCADE,
        related_name='civil_petitions',
        verbose_name="Гражданское производство"
    )
    petitions_incase = models.ForeignKey(
        PetitionsInCase,
        on_delete=models.CASCADE,
        related_name='civil_petitions',
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
    
    # Для GenericForeignKey или можно использовать прямые связи
    # Но для простоты будем хранить type и id, а получать данные через свойства

    class Meta:
        verbose_name = "Ходатайство в гражданском деле"
        verbose_name_plural = "Ходатайства в гражданских делах"
        indexes = [
            models.Index(fields=['petitioner_type', 'petitioner_id']),
        ]

    def __str__(self):
        return f"Ходатайство по делу {self.civil_proceedings.case_number_civil}"
    
    @property
    def petitioner(self):
        """Получение объекта заявителя"""
        if not self.petitioner_type or not self.petitioner_id:
            return None
        
        if self.petitioner_type == 'civil_sides':
            try:
                return CivilSidesCaseInCase.objects.get(id=self.petitioner_id)
            except CivilSidesCaseInCase.DoesNotExist:
                return None
        elif self.petitioner_type == 'civil_lawyer':
            try:
                return CivilLawyer.objects.get(id=self.petitioner_id)
            except CivilLawyer.DoesNotExist:
                return None
        return None
    
    @property
    def petitioner_info(self):
        """Получение информации о заявителе для отображения"""
        petitioner = self.petitioner
        if not petitioner:
            return None
        
        if self.petitioner_type == 'civil_sides':
            side_detail = petitioner.sides_case_incase
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'civil_sides',
                'type_label': 'Сторона',
                'name': side_detail.name if side_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Сторона',
                'detail': {
                    'name': side_detail.name if side_detail else None,
                    'phone': side_detail.phone if side_detail else None,
                    'address': side_detail.address if side_detail else None,
                }
            }
        elif self.petitioner_type == 'civil_lawyer':
            lawyer_detail = petitioner.lawyer
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'civil_lawyer',
                'type_label': 'Адвокат',
                'name': lawyer_detail.law_firm_name if lawyer_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Представитель',
                'detail': {
                    'law_firm_name': lawyer_detail.law_firm_name if lawyer_detail else None,
                    'phone': lawyer_detail.law_firm_phone if lawyer_detail else None,
                }
            }
        return None


@receiver(post_delete, sender=CivilCaseMovement)
def delete_related_business_movement(sender, instance, **kwargs):
    """Удалить связанный BusinessMovement при удалении CivilCaseMovement"""
    if hasattr(instance, 'business_movement') and instance.business_movement:
        try:
            business_movement_id = instance.business_movement.id
            instance.business_movement.delete()
            logger.info(f"Deleted related BusinessMovement {business_movement_id} for CivilCaseMovement {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting BusinessMovement: {e}")


@receiver(post_delete, sender=CivilPetition)
def delete_related_petitions_incase(sender, instance, **kwargs):
    """Удалить связанный PetitionsInCase при удалении CivilPetition"""
    if hasattr(instance, 'petitions_incase') and instance.petitions_incase:
        try:
            petitions_incase_id = instance.petitions_incase.id
            instance.petitions_incase.delete()
            logger.info(f"Deleted related PetitionsInCase {petitions_incase_id} for CivilPetition {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting PetitionsInCase: {e}")
