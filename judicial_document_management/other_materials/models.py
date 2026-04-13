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


class OtherMaterial(models.Model):
    """
    Карточка иных материалов (индекс 15 по инструкции по делопроизводству).
    """
    STATUS_CHOICES = [
        ('active', 'Активное'),
        ('completed', 'Завершено'),
        ('archived', 'В архиве'),
    ]

    # ------------------- Общие сведения -------------------
    registration_number = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Регистрационный номер"
    )
    registration_date = models.DateField(
        verbose_name="Дата регистрации",
        null=True, blank=True
    )
    title = models.CharField(
        max_length=500,
        verbose_name="Наименование материала"
    )
    description = models.TextField(
        verbose_name="Описание/содержание",
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
        max_length=255,
        verbose_name="Отправитель",
        null=True, blank=True
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
    consideration_result = models.TextField(
        verbose_name="Результат рассмотрения",
        null=True, blank=True
    )
    
    # ------------------- Связи -------------------
    registered_case = models.OneToOneField(
        'case_registry.RegisteredCase',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='other_material_link',
        verbose_name="Зарегистрированное дело"
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

    def __str__(self):
        return f"{self.registration_number} - {self.title[:50]}"


# ----- Связки с business_card -----

class OtherMaterialSidesCaseInCase(models.Model):
    """Стороны по иному материалу"""
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
    """Представители/защитники"""
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


class OtherMaterialMovement(models.Model):
    """Движение материала (готовые записи из BusinessMovement)"""
    other_material = models.ForeignKey(
        OtherMaterial,
        on_delete=models.CASCADE,
        related_name='other_movements',
        verbose_name="Иной материал"
    )
    business_movement = models.ForeignKey(
        BusinessMovement,
        on_delete=models.CASCADE,
        related_name='other_material_movements',
        verbose_name="Движение (из business_card)"
    )

    class Meta:
        verbose_name = "Движение иного материала"
        verbose_name_plural = "Движения иных материалов"
        ordering = ['-business_movement__date_meeting', '-business_movement__meeting_time']

    def __str__(self):
        return f"Движение по материалу {self.other_material.registration_number} от {self.business_movement.date_meeting}"


class OtherMaterialPetition(models.Model):
    """Ходатайства/заявления"""
    
    PETITIONER_TYPES = [
        ('other_sides', 'Сторона'),
        ('other_lawyer', 'Представитель'),
    ]
    
    other_material = models.ForeignKey(
        OtherMaterial,
        on_delete=models.CASCADE,
        related_name='other_petitions',
        verbose_name="Иной материал"
    )
    petitions_incase = models.ForeignKey(
        PetitionsInCase,
        on_delete=models.CASCADE,
        related_name='other_material_petitions',
        verbose_name="Ходатайство/заявление"
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
        verbose_name = "Ходатайство/заявление в ином материале"
        verbose_name_plural = "Ходатайства/заявления в иных материалах"
        indexes = [
            models.Index(fields=['petitioner_type', 'petitioner_id']),
        ]

    def __str__(self):
        return f"Ходатайство по материалу {self.other_material.registration_number}"
    
    @property
    def petitioner(self):
        """Получение объекта заявителя"""
        if not self.petitioner_type or not self.petitioner_id:
            return None
        
        if self.petitioner_type == 'other_sides':
            try:
                return OtherMaterialSidesCaseInCase.objects.get(id=self.petitioner_id)
            except OtherMaterialSidesCaseInCase.DoesNotExist:
                return None
        elif self.petitioner_type == 'other_lawyer':
            try:
                return OtherMaterialLawyer.objects.get(id=self.petitioner_id)
            except OtherMaterialLawyer.DoesNotExist:
                return None
        return None
    
    @property
    def petitioner_info(self):
        """Получение информации о заявителе для отображения"""
        petitioner = self.petitioner
        if not petitioner:
            return None
        
        if self.petitioner_type == 'other_sides':
            side_detail = petitioner.sides_case_incase
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'other_sides',
                'type_label': 'Сторона',
                'name': side_detail.name if side_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Сторона',
                'detail': {
                    'name': side_detail.name if side_detail else None,
                    'phone': side_detail.phone if side_detail else None,
                    'address': side_detail.address if side_detail else None,
                }
            }
        elif self.petitioner_type == 'other_lawyer':
            lawyer_detail = petitioner.lawyer
            role_detail = petitioner.sides_case_role
            return {
                'id': petitioner.id,
                'type': 'other_lawyer',
                'type_label': 'Представитель',
                'name': lawyer_detail.law_firm_name if lawyer_detail else 'Неизвестно',
                'role': role_detail.sides_case if role_detail else 'Представитель',
                'detail': {
                    'law_firm_name': lawyer_detail.law_firm_name if lawyer_detail else None,
                    'phone': lawyer_detail.law_firm_phone if lawyer_detail else None,
                }
            }
        return None


@receiver(post_delete, sender=OtherMaterialMovement)
def delete_related_business_movement(sender, instance, **kwargs):
    """Удалить связанный BusinessMovement при удалении OtherMaterialMovement"""
    if hasattr(instance, 'business_movement') and instance.business_movement:
        try:
            business_movement_id = instance.business_movement.id
            instance.business_movement.delete()
            logger.info(f"Deleted related BusinessMovement {business_movement_id} for OtherMaterialMovement {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting BusinessMovement: {e}")


@receiver(post_delete, sender=OtherMaterialPetition)
def delete_related_petitions_incase(sender, instance, **kwargs):
    """Удалить связанный PetitionsInCase при удалении OtherMaterialPetition"""
    if hasattr(instance, 'petitions_incase') and instance.petitions_incase:
        try:
            petitions_incase_id = instance.petitions_incase.id
            instance.petitions_incase.delete()
            logger.info(f"Deleted related PetitionsInCase {petitions_incase_id} for OtherMaterialPetition {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting PetitionsInCase: {e}")
