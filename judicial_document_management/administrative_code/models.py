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


class ReferringAuthorityAdmin(models.Model):
    """Органы, составившие протокол (административные дела)"""
    name = models.CharField(max_length=255, verbose_name="Название органа")
    code = models.CharField(max_length=50, verbose_name="Код", unique=True)

    class Meta:
        verbose_name = "Орган, составивший протокол"
        verbose_name_plural = "Органы, составившие протокол"
        ordering = ['name']

    def __str__(self):
        return self.name


class AdministrativeProceedings(models.Model):
    """
    Карточка дела об административном правонарушении.
    """
    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('completed', 'Рассмотрено'),
        ('execution', 'На исполнении'),
        ('archived', 'В архиве'),
    ]

    # ------------------- Раздел 1. Общие сведения -------------------
    case_number_admin = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Номер дела об АП"
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
        ReferringAuthorityAdmin,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Орган, составивший протокол"
    )
    protocol_number = models.CharField(
        max_length=100,
        verbose_name="Номер протокола об АП",
        null=True, blank=True
    )
    protocol_date = models.DateField(
        verbose_name="Дата составления протокола",
        null=True, blank=True
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
    article_number = models.CharField(
        max_length=50,
        verbose_name="Статья КоАП РФ",
        null=True, blank=True
    )
    article_part = models.CharField(
        max_length=50,
        verbose_name="Часть статьи",
        null=True, blank=True
    )
    offense_description = models.TextField(
        verbose_name="Описание правонарушения",
        null=True, blank=True
    )
    offense_date = models.DateField(
        verbose_name="Дата совершения правонарушения",
        null=True, blank=True
    )
    offense_time = models.TimeField(
        verbose_name="Время совершения правонарушения",
        null=True, blank=True
    )
    offense_place = models.CharField(
        max_length=255,
        verbose_name="Место совершения правонарушения",
        null=True, blank=True
    )

    # ------------------- Раздел 2. Рассмотрение дела -------------------
    consideration_type = models.CharField(
        max_length=255,
        verbose_name="Вид рассмотрения",
        choices=[
            ('1', 'Единолично судьёй'),
            ('2', 'Коллегиально'),
            ('3', 'С участием прокурора'),
        ],
        null=True, blank=True
    )
    hearing_date = models.DateField(
        verbose_name="Дата рассмотрения дела",
        null=True, blank=True
    )
    hearing_time = models.TimeField(
        verbose_name="Время рассмотрения дела",
        null=True, blank=True
    )
    hearing_postponed = models.BooleanField(
        verbose_name="Рассмотрение откладывалось",
        default=False, null=True, blank=True
    )
    postponement_reason = models.TextField(
        verbose_name="Причины отложения",
        null=True, blank=True
    )
    postponement_count = models.IntegerField(
        verbose_name="Количество отложений",
        default=0, null=True, blank=True
    )
    case_suspended = models.BooleanField(
        verbose_name="Производство по делу приостанавливалось",
        default=False, null=True, blank=True
    )
    suspension_reason = models.CharField(
        max_length=255,
        verbose_name="Основание приостановления",
        choices=[
            ('1', 'Розыск лица, в отношении которого ведётся производство'),
            ('2', 'Назначение экспертизы'),
            ('3', 'Направление запроса в Конституционный Суд РФ'),
            ('4', 'Иное'),
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
        related_name='admin_proceedings_link',
        verbose_name="Зарегистрированное дело"
    )

    # Технические поля
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Дело об административном правонарушении"
        verbose_name_plural = "Дела об административных правонарушениях"
        ordering = ['-incoming_date']

    def __str__(self):
        return f"Дело об АП № {self.case_number_admin}"


class AdministrativeDecision(models.Model):
    """
    Решения по делу об административном правонарушении.
    """
    administrative_proceedings = models.ForeignKey(
        AdministrativeProceedings,
        on_delete=models.CASCADE,
        related_name='admin_decisions',
        verbose_name="Дело об АП"
    )

    # ------------------- Результаты рассмотрения -------------------
    outcome = models.CharField(
        max_length=255,
        verbose_name="Результат рассмотрения дела",
        choices=[
            ('1', 'Назначено административное наказание'),
            ('2', 'Прекращено производство по делу'),
            ('3', 'Возвращено для устранения недостатков'),
            ('4', 'Передано по подведомственности'),
            ('5', 'Вынесено предупреждение'),
        ],
        null=True, blank=True
    )
    punishment_type = models.CharField(
        max_length=255,
        verbose_name="Вид наказания",
        choices=[
            ('1', 'Предупреждение'),
            ('2', 'Административный штраф'),
            ('3', 'Конфискация орудия или предмета'),
            ('4', 'Лишение специального права'),
            ('5', 'Административный арест'),
            ('6', 'Дисквалификация'),
            ('7', 'Административное приостановление деятельности'),
            ('8', 'Обязательные работы'),
            ('9', 'Административное выдворение'),
        ],
        null=True, blank=True
    )
    fine_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Сумма штрафа (руб.)",
        null=True, blank=True
    )
    deprivation_period = models.CharField(
        max_length=100,
        verbose_name="Срок лишения специального права",
        null=True, blank=True
    )
    arrest_period = models.CharField(
        max_length=100,
        verbose_name="Срок административного ареста",
        null=True, blank=True
    )
    suspension_period = models.CharField(
        max_length=100,
        verbose_name="Срок приостановления деятельности",
        null=True, blank=True
    )
    decision_date = models.DateField(
        verbose_name="Дата вынесения постановления",
        null=True, blank=True
    )
    decision_motivated_date = models.DateField(
        verbose_name="Дата составления мотивированного постановления",
        null=True, blank=True
    )
    decision_effective_date = models.DateField(
        verbose_name="Дата вступления постановления в законную силу",
        null=True, blank=True
    )

    # ------------------- Обжалование -------------------
    complaint_filed = models.BooleanField(
        verbose_name="Подана жалоба",
        default=False, null=True, blank=True
    )
    complaint_date = models.DateField(
        verbose_name="Дата поступления жалобы",
        null=True, blank=True
    )
    complaint_result = models.CharField(
        max_length=255,
        verbose_name="Результат рассмотрения жалобы",
        choices=[
            ('1', 'Постановление оставлено без изменения'),
            ('2', 'Постановление изменено'),
            ('3', 'Постановление отменено, дело прекращено'),
            ('4', 'Постановление отменено, дело возвращено на новое рассмотрение'),
            ('5', 'Постановление отменено, дело направлено по подведомственности'),
        ],
        null=True, blank=True
    )
    complaint_decision_date = models.DateField(
        verbose_name="Дата решения по жалобе",
        null=True, blank=True
    )

    class Meta:
        verbose_name = "Постановление по делу об АП"
        verbose_name_plural = "Постановления по делам об АП"
        ordering = ['-decision_date']

    def __str__(self):
        return f"Постановление по делу {self.administrative_proceedings.case_number_admin} от {self.decision_date}"


class AdministrativeExecution(models.Model):
    """
    Исполнение постановления по делу об административном правонарушении.
    """
    administrative_proceedings = models.ForeignKey(
        AdministrativeProceedings,
        on_delete=models.CASCADE,
        related_name='admin_executions',
        verbose_name="Дело об АП"
    )

    # ------------------- Исполнение постановления -------------------
    execution_document_date = models.DateField(
        verbose_name="Дата выдачи исполнительного документа",
        null=True, blank=True
    )
    execution_document_number = models.CharField(
        max_length=100,
        verbose_name="Номер исполнительного документа",
        null=True, blank=True
    )
    execution_document_received_by = models.CharField(
        max_length=255,
        verbose_name="Кому направлен исполнительный документ",
        null=True, blank=True
    )
    fine_paid = models.BooleanField(
        verbose_name="Штраф уплачен",
        default=False, null=True, blank=True
    )
    fine_paid_date = models.DateField(
        verbose_name="Дата уплаты штрафа",
        null=True, blank=True
    )
    fine_paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="Уплаченная сумма (руб.)",
        null=True, blank=True
    )
    confiscation_executed = models.BooleanField(
        verbose_name="Конфискация исполнена",
        default=False, null=True, blank=True
    )
    confiscation_executed_date = models.DateField(
        verbose_name="Дата исполнения конфискации",
        null=True, blank=True
    )
    deprivation_executed = models.BooleanField(
        verbose_name="Лишение спецправа исполнено",
        default=False, null=True, blank=True
    )
    deprivation_start_date = models.DateField(
        verbose_name="Дата начала срока лишения",
        null=True, blank=True
    )
    deprivation_end_date = models.DateField(
        verbose_name="Дата окончания срока лишения",
        null=True, blank=True
    )
    arrest_executed = models.BooleanField(
        verbose_name="Административный арест исполнен",
        default=False, null=True, blank=True
    )
    arrest_period_served = models.CharField(
        max_length=100,
        verbose_name="Отбытый срок ареста",
        null=True, blank=True
    )
    suspension_executed = models.BooleanField(
        verbose_name="Приостановление деятельности исполнено",
        default=False, null=True, blank=True
    )
    suspension_start_date = models.DateField(
        verbose_name="Дата начала приостановления",
        null=True, blank=True
    )
    suspension_end_date = models.DateField(
        verbose_name="Дата окончания приостановления",
        null=True, blank=True
    )
    execution_result = models.CharField(
        max_length=255,
        verbose_name="Результат исполнения",
        choices=[
            ('1', 'Исполнено'),
            ('2', 'Не исполнено'),
            ('3', 'Возвращено без исполнения'),
            ('4', 'Частично исполнено'),
        ],
        null=True, blank=True
    )
    execution_date = models.DateField(
        verbose_name="Дата фактического исполнения",
        null=True, blank=True
    )
    bailiff_department = models.CharField(
        max_length=255,
        verbose_name="Отдел судебных приставов",
        null=True, blank=True
    )
    bailiff_name = models.CharField(
        max_length=255,
        verbose_name="Судебный пристав-исполнитель",
        null=True, blank=True
    )
    enforcement_proceedings_number = models.CharField(
        max_length=100,
        verbose_name="Номер исполнительного производства",
        null=True, blank=True
    )

    class Meta:
        verbose_name = "Исполнение по делу об АП"
        verbose_name_plural = "Исполнения по делам об АП"
        ordering = ['-execution_document_date']

    def __str__(self):
        return f"Исполнение по делу {self.administrative_proceedings.case_number_admin}"


# ----- Связки с business_card -----

class AdministrativeSidesCaseInCase(models.Model):
    """Стороны по делу (лицо, привлекаемое к ответственности, потерпевшие и т.д.)"""
    administrative_proceedings = models.ForeignKey(
        AdministrativeProceedings,
        on_delete=models.CASCADE,
        related_name='admin_sides',
        verbose_name="Дело об АП"
    )
    sides_case_incase = models.ForeignKey(
        SidesCaseInCase,
        on_delete=models.CASCADE,
        related_name='admin_sides',
        verbose_name="Данные стороны (ФИО/наименование, контакты)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='admin_sides',
        verbose_name="Роль стороны (лицо, потерпевший, защитник и т.д.)"
    )

    class Meta:
        verbose_name = "Сторона дела об АП"
        verbose_name_plural = "Стороны дела об АП"
        unique_together = ('administrative_proceedings', 'sides_case_incase', 'sides_case_role')

    def __str__(self):
        return f"{self.sides_case_role} - {self.sides_case_incase}"


class AdministrativeLawyer(models.Model):
    """Защитники/представители"""
    administrative_proceedings = models.ForeignKey(
        AdministrativeProceedings,
        on_delete=models.CASCADE,
        related_name='admin_lawyers',
        verbose_name="Дело об АП"
    )
    lawyer = models.ForeignKey(
        Lawyer,
        on_delete=models.CASCADE,
        related_name='admin_lawyers',
        verbose_name="Защитник (данные из business_card)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='admin_lawyers',
        verbose_name="Представитель какой стороны"
    )

    class Meta:
        verbose_name = "Защитник в деле об АП"
        verbose_name_plural = "Защитники в делах об АП"

    def __str__(self):
        return f"{self.sides_case_role} - {self.lawyer}"


class AdministrativeCaseMovement(models.Model):
    """Движение дела (готовые записи из BusinessMovement)"""
    administrative_proceedings = models.ForeignKey(
        AdministrativeProceedings,
        on_delete=models.CASCADE,
        related_name='admin_movements',
        verbose_name="Дело об АП"
    )
    business_movement = models.ForeignKey(
        BusinessMovement,
        on_delete=models.CASCADE,
        related_name='admin_movements',
        verbose_name="Движение дела (из business_card)"
    )

    class Meta:
        verbose_name = "Движение дела (административное)"
        verbose_name_plural = "Движения дела (административные)"
        ordering = ['-business_movement__date_meeting', '-business_movement__meeting_time']

    def __str__(self):
        return f"Движение по делу {self.administrative_proceedings.case_number_admin} от {self.business_movement.date_meeting}"


class AdministrativePetition(models.Model):
    """Ходатайства"""
    
    PETITIONER_TYPES = [
        ('admin_sides', 'Сторона по делу'),
        ('admin_lawyer', 'Защитник'),
    ]
    
    administrative_proceedings = models.ForeignKey(
        AdministrativeProceedings,
        on_delete=models.CASCADE,
        related_name='admin_petitions',
        verbose_name="Дело об АП"
    )
    petitions_incase = models.ForeignKey(
        PetitionsInCase,
        on_delete=models.CASCADE,
        related_name='admin_petitions',
        verbose_name="Ходатайство"
    )
    
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
        verbose_name = "Ходатайство в деле об АП"
        verbose_name_plural = "Ходатайства в делах об АП"
        indexes = [
            models.Index(fields=['petitioner_type', 'petitioner_id']),
        ]

    def __str__(self):
        return f"Ходатайство по делу {self.administrative_proceedings.case_number_admin}"
    
    @property
    def petitioner(self):
        """Получение объекта заявителя"""
        if not self.petitioner_type or not self.petitioner_id:
            return None
        
        if self.petitioner_type == 'admin_sides':
            try:
                return AdministrativeSidesCaseInCase.objects.get(id=self.petitioner_id)
            except AdministrativeSidesCaseInCase.DoesNotExist:
                return None
        elif self.petitioner_type == 'admin_lawyer':
            try:
                return AdministrativeLawyer.objects.get(id=self.petitioner_id)
            except AdministrativeLawyer.DoesNotExist:
                return None
        return None
    
    @property
    def petitioner_info(self):
        """Получение информации о заявителе для отображения"""
        petitioner = self.petitioner
        if not petitioner:
            return None
        
        if self.petitioner_type == 'admin_sides':
            side_detail = petitioner.sides_case_incase
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'admin_sides',
                'type_label': 'Сторона',
                'name': side_detail.name if side_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Сторона',
                'detail': {
                    'name': side_detail.name if side_detail else None,
                    'phone': side_detail.phone if side_detail else None,
                    'address': side_detail.address if side_detail else None,
                }
            }
        elif self.petitioner_type == 'admin_lawyer':
            lawyer_detail = petitioner.lawyer
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'admin_lawyer',
                'type_label': 'Защитник',
                'name': lawyer_detail.law_firm_name if lawyer_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Представитель',
                'detail': {
                    'law_firm_name': lawyer_detail.law_firm_name if lawyer_detail else None,
                    'phone': lawyer_detail.law_firm_phone if lawyer_detail else None,
                }
            }
        return None


@receiver(post_delete, sender=AdministrativeCaseMovement)
def delete_related_business_movement(sender, instance, **kwargs):
    """Удалить связанный BusinessMovement при удалении AdministrativeCaseMovement"""
    if hasattr(instance, 'business_movement') and instance.business_movement:
        try:
            business_movement_id = instance.business_movement.id
            instance.business_movement.delete()
            logger.info(f"Deleted related BusinessMovement {business_movement_id} for AdministrativeCaseMovement {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting BusinessMovement: {e}")


@receiver(post_delete, sender=AdministrativePetition)
def delete_related_petitions_incase(sender, instance, **kwargs):
    """Удалить связанный PetitionsInCase при удалении AdministrativePetition"""
    if hasattr(instance, 'petitions_incase') and instance.petitions_incase:
        try:
            petitions_incase_id = instance.petitions_incase.id
            instance.petitions_incase.delete()
            logger.info(f"Deleted related PetitionsInCase {petitions_incase_id} for AdministrativePetition {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting PetitionsInCase: {e}")
