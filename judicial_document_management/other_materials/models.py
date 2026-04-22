from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_delete
from django.dispatch import receiver
from users.models import User
from business_card.models import (
    SidesCase, SidesCaseInCase, Lawyer
)
import logging

logger = logging.getLogger(__name__)


class OtherMaterialType(models.Model):
    """
    Справочник видов иных материалов (выгрузить в CSV)
    В соответствии с п. 3.10.7 Инструкции
    """
    code = models.CharField(max_length=30, unique=True, verbose_name="Код")
    name = models.CharField(max_length=255, verbose_name="Наименование вида иного материала")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок сортировки")

    class Meta:
        verbose_name = "Вид иного материала"
        verbose_name_plural = "Виды иных материалов"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class OtherMaterial(models.Model):
    """
    Карточка иных материалов (в строгом соответствии с Инструкцией, п. 3.10.7)
    Индекс 15 по инструкции по делопроизводству.
    """
    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('completed', 'Завершено'),
        ('archived', 'В архиве'),
    ]

    OUTCOME_CHOICES = [
        ('satisfied', 'Удовлетворено'),
        ('rejected', 'Отказано в удовлетворении'),
        ('dismissed', 'Прекращено производство'),
        ('left_without', 'Оставлено без рассмотрения'),
        ('transferred', 'Передано по подсудности/подведомственности'),
    ]

    # ------------------- Регистрационные сведения -------------------
    registration_number = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Регистрационный номер"
    )
    registration_date = models.DateField(
        verbose_name="Дата регистрации",
        null=True, blank=True
    )
    
    # ------------------- Вид материала -------------------
    material_type = models.ForeignKey(
        OtherMaterialType,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Вид иного материала"
    )
    title = models.CharField(
        max_length=500,
        verbose_name="Наименование материала"
    )
    description = models.TextField(
        verbose_name="Содержание материала",
        null=True, blank=True
    )
    
    # ------------------- Сведения о поступлении -------------------
    incoming_number = models.CharField(
        max_length=100,
        verbose_name="Входящий номер",
        null=True, blank=True
    )
    incoming_date = models.DateField(
        verbose_name="Дата поступления",
        null=True, blank=True
    )
    sender = models.CharField(
        max_length=500,
        verbose_name="Отправитель",
        null=True, blank=True,
        help_text="Наименование организации или ФИО отправителя"
    )
    
    # ------------------- Связь с основным делом (опционально) -------------------
    # Используем GenericForeignKey для связи с любым типом дела
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={
            'app_label__in': [
                'civil_proceedings', 'criminal_proceedings', 
                'administrative_proceedings', 'kas_proceedings'
            ],
            'model__in': ['civilproceedings', 'criminalproceedings', 
                         'administrativeproceedings', 'kasproceedings']
        },
        verbose_name="Тип связанного дела"
    )
    object_id = models.PositiveIntegerField(
        verbose_name="ID связанного дела",
        null=True, blank=True
    )
    related_case = GenericForeignKey('content_type', 'object_id')
    
    # Денормализованное поле для быстрого отображения
    related_case_number = models.CharField(
        max_length=100,
        verbose_name="Номер связанного дела",
        null=True, blank=True
    )
    
    # Для обратной совместимости (можно удалить после миграции)
    registered_case = models.OneToOneField(
        'case_registry.RegisteredCase',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='other_material_link_old',
        verbose_name="Зарегистрированное дело (устаревшее)"
    )
    
    # ------------------- Сведения о рассмотрении -------------------
    responsible_person = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={'role__in': ['judge', 'secretary', 'assistant']},
        verbose_name="Ответственный"
    )
    consideration_date = models.DateField(
        verbose_name="Дата рассмотрения",
        null=True, blank=True
    )
    outcome = models.CharField(
        max_length=20,
        choices=OUTCOME_CHOICES,
        verbose_name="Результат рассмотрения",
        null=True, blank=True
    )
    outcome_details = models.TextField(
        verbose_name="Детали результата",
        null=True, blank=True,
        help_text="Подробное описание результата рассмотрения"
    )
    
    # ------------------- Статус и архив -------------------
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name="Статус"
    )
    archived_date = models.DateField(
        verbose_name="Дата сдачи в архив",
        null=True, blank=True
    )
    archive_notes = models.TextField(
        verbose_name="Примечания по архивному делу",
        null=True, blank=True
    )
    special_notes = models.TextField(
        verbose_name="Особые отметки",
        null=True, blank=True
    )
    
    # Технические поля
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Иной материал"
        verbose_name_plural = "Иные материалы"
        ordering = ['-registration_date', '-created_at']
        indexes = [
            models.Index(fields=['registration_number']),
            models.Index(fields=['status']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['material_type']),
            models.Index(fields=['outcome']),
        ]

    def __str__(self):
        return f"{self.registration_number} - {self.title[:50]}"


# ----- Связки с business_card (оставлены для совместимости) -----

class OtherMaterialSidesCaseInCase(models.Model):
    """
    Стороны по иному материалу (оставлено для совместимости с существующими данными)
    """
    other_material = models.ForeignKey(
        OtherMaterial,
        on_delete=models.CASCADE,
        related_name='other_sides',
        verbose_name="Иной материал"
    )
    sides_case_incase = models.ForeignKey(
        SidesCaseInCase,
        on_delete=models.CASCADE,
        related_name='other_material_sides',
        verbose_name="Данные стороны (ФИО/наименование, контакты)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='other_material_sides',
        verbose_name="Роль стороны"
    )

    class Meta:
        verbose_name = "Сторона иного материала"
        verbose_name_plural = "Стороны иного материала"
        unique_together = ('other_material', 'sides_case_incase', 'sides_case_role')

    def __str__(self):
        return f"{self.sides_case_role} - {self.sides_case_incase}"


class OtherMaterialLawyer(models.Model):
    """
    Представители/защитники (оставлено для совместимости с существующими данными)
    """
    other_material = models.ForeignKey(
        OtherMaterial,
        on_delete=models.CASCADE,
        related_name='other_lawyers',
        verbose_name="Иной материал"
    )
    lawyer = models.ForeignKey(
        Lawyer,
        on_delete=models.CASCADE,
        related_name='other_material_lawyers',
        verbose_name="Представитель (данные из business_card)"
    )
    sides_case_role = models.ForeignKey(
        SidesCase,
        on_delete=models.CASCADE,
        related_name='other_material_lawyers',
        verbose_name="Представитель какой стороны"
    )

    class Meta:
        verbose_name = "Представитель в ином материале"
        verbose_name_plural = "Представители в иных материалах"

    def __str__(self):
        return f"{self.sides_case_role} - {self.lawyer}"


class OtherMaterialDecision(models.Model):
    """
    Решения по иному материалу (оставлено, но упрощено)
    """
    other_material = models.ForeignKey(
        OtherMaterial,
        on_delete=models.CASCADE,
        related_name='other_decisions',
        verbose_name="Иной материал"
    )

    # ------------------- Результаты рассмотрения -------------------
    outcome = models.CharField(
        max_length=255,
        verbose_name="Результат рассмотрения",
        choices=[
            ('1', 'Удовлетворено'),
            ('2', 'Отказано в удовлетворении'),
            ('3', 'Прекращено производство'),
            ('4', 'Оставлено без рассмотрения'),
            ('5', 'Передано по подведомственности'),
        ],
        null=True, blank=True
    )
    
    decision_date = models.DateField(
        verbose_name="Дата вынесения решения",
        null=True, blank=True
    )
    decision_effective_date = models.DateField(
        verbose_name="Дата вступления в силу",
        null=True, blank=True
    )
    
    # ------------------- Обжалование (упрощенно) -------------------
    complaint_filed = models.BooleanField(
        verbose_name="Подана жалоба",
        default=False, null=True, blank=True
    )
    complaint_result = models.CharField(
        max_length=255,
        verbose_name="Результат обжалования",
        choices=[
            ('1', 'Оставлено без изменения'),
            ('2', 'Отменено'),
            ('3', 'Изменено'),
        ],
        null=True, blank=True
    )
    
    class Meta:
        verbose_name = "Решение по иному материалу"
        verbose_name_plural = "Решения по иным материалам"
        ordering = ['-decision_date']

    def __str__(self):
        return f"Решение по материалу {self.other_material.registration_number} от {self.decision_date}"