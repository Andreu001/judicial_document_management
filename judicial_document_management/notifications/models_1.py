# notifications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone

User = get_user_model()


class UserRole(models.Model):
    ROLE_TYPES = [
        ('judge', 'Судья'),
        ('judge_assistant', 'Помощник судьи'),
        ('court_secretary', 'Секретарь судебного заседания'),
        ('clerk', 'Делопроизводитель'),
        ('admin', 'Администратор'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=ROLE_TYPES)
    court_department = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

class CaseReceipt(models.Model):
    """1. Стадия. Модель потсупление дела в суд"""
    jurisdiction_criminal_case = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Подсудность уголовного дела'
    )
    jurisdiction_civil_case = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Подсудность гражданского дела'
    )
    jurisdiction_administrative_code = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Подведомственность КоАП'
    )
    Jurisdiction_of_the_CAS = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Подведомственность административных дел'
    )
    decision_on_acceptance_for_production = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Принятие/отказ к производству'
    )

    class Meta:
        ordering = ('decision_on_acceptance_for_production',)
        verbose_name = 'Принять/отказать к производству'
        verbose_name_plural = 'Принять/отказать к производству'

    def __str__(self):
        return self.decision_on_acceptance_for_production


class PreparationSession(models.Model):
    """2. Стадия. Модель подготовки к с/з (предварительная стадия)"""
    general_terms_of_consideration = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Общий срок рассмотрения'
    )
    petitions = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Рассмотрение ходатайств'
    )
    sending_copies = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Подведомственность КоАП'
    )
    preliminary_hearing = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Предварительное слушание/заседание'
    )
    making_decision_case = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Принятие к производству, иное решение'
    )

    class Meta:
        ordering = ('making_decision_case',)
        verbose_name = 'Принять/отказать к производству'
        verbose_name_plural = 'Принять/отказать к производству'

    def __str__(self):
        return self.making_decision_case


class AppointmentCourtSession(models.Model):
    """3. Стадия. Назначение седубного заседания"""
    date_appointment_meeting = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Сроки назначения заседания'
    )
    actions_appointing_meeting = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Действия при назначении заседания'
    )

    class Meta:
        ordering = ('actions_appointing_meeting',)
        verbose_name = 'Действия при назначении заседания'
        verbose_name_plural = 'Действия при назначении заседания'

    def __str__(self):
        return self.actions_appointing_meeting


class Judicial_Proceedings(models.Model):
    """4. Стадия. Судебное разбирательство"""
    expertise = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Действия при назначении заседания'
    )

    class Meta:
        ordering = ('expertise',)
        verbose_name = 'Экспертиза'
        verbose_name_plural = 'Экпертиза'

    def __str__(self):
        return self.expertise


class ProclamationDecision(models.Model):
    """5. Стадия. Модель провозглашения решения"""
    production_time = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Срок изготовления полного решения'
    )
    handing_copies_parties = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Вручение копий решения сторонам'
    )
    entry_legal_force = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Вступление в законную силу'
    )
    appeal_to_execution = models.CharField(
        null=True,
        blank=True,
        max_length=100,
        verbose_name='Обращение к исполнению'
    )

    class Meta:
        ordering = ('production_time',)
        verbose_name = 'Срок изготовления полного решения'
        verbose_name_plural = 'Срок изготовления полного решения'

    def __str__(self):
        return self.production_time


class LegalReference(models.Model):
    """Справочник: Постановления Пленума / решения ВС / выдержки и т.п."""
    TYPE_CHOICES = (
        ('plenum', 'Постановление Пленума'),
        ('vs_decision', 'Решение ВС РФ'),
        ('excerpt', 'Выдержка практики'),
        ('other', 'Другое'),
    )

    ref_type = models.CharField(max_length=32, choices=TYPE_CHOICES, default='other')
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='legal_references/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_ref_type_display()} — {self.title}"


class Notification(models.Model):
    """Основная модель уведомления, связанная с любым объектом через GenericForeignKey."""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    # опционально можно хранить бизнес-карточку если есть
    business_card_id = models.IntegerField(null=True, blank=True, help_text="Опционально: id BusinessCard")

    # generic relation to any model (delа/ходатайство/решение и т.д.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    title = models.CharField(max_length=512)
    message = models.TextField(blank=True)
    deadline = models.DateTimeField(null=True, blank=True)  # дата/время на которую ссылается уведомление
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    legal_references = models.ManyToManyField(LegalReference, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def mark_read(self):
        self.is_read = True
        self.save(update_fields=["is_read"])

    def __str__(self):
        return f"[{self.pk}] {self.title}"
