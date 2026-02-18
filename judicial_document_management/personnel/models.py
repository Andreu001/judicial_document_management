from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
from datetime import timedelta

class AbsenceType(models.Model):
    """Тип отсутствия: отпуск, больничный, командировка и т.п."""
    name = models.CharField(max_length=50, verbose_name='Название')
    code = models.CharField(max_length=20, unique=True, verbose_name='Код')
    color = models.CharField(max_length=7, default='#3498db', verbose_name='Цвет в календаре')
    block_before_days = models.PositiveIntegerField(
        default=0,
        verbose_name='Дней до начала для блокировки'
    )
    block_after_days = models.PositiveIntegerField(
        default=0,
        verbose_name='Дней после окончания для блокировки'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')

    class Meta:
        verbose_name = 'Тип отсутствия'
        verbose_name_plural = 'Типы отсутствий'

    def __str__(self):
        return self.name


class AbsenceRecord(models.Model):
    """Запись отсутствия судьи / период блокировки распределения."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='absence_records',
        verbose_name='Судья',
        limit_choices_to={'role': 'judge'}   # только судьи
    )
    absence_type = models.ForeignKey(
        AbsenceType,
        on_delete=models.PROTECT,
        verbose_name='Тип отсутствия'
    )
    start_date = models.DateField(verbose_name='Дата начала отсутствия')
    end_date = models.DateField(verbose_name='Дата окончания отсутствия')
    block_start_date = models.DateField(
        verbose_name='Начало блокировки распределения'
    )
    block_end_date = models.DateField(
        verbose_name='Окончание блокировки распределения'
    )
    reason = models.TextField(blank=True, verbose_name='Примечание')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Запись отсутствия'
        verbose_name_plural = 'Записи отсутствий'
        ordering = ['-block_start_date']

    def __str__(self):
        return f'{self.user} — {self.absence_type} ({self.block_start_date} – {self.block_end_date})'

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError('Дата начала отсутствия не может быть позже даты окончания.')
        if self.block_start_date > self.block_end_date:
            raise ValidationError('Дата начала блокировки не может быть позже даты окончания.')

    def save(self, *args, **kwargs):
        # Автоматический расчёт периода блокировки, если поля не заполнены вручную
        if not self.block_start_date:
            self.block_start_date = self.start_date - timedelta(days=self.absence_type.block_before_days)
        if not self.block_end_date:
            self.block_end_date = self.end_date + timedelta(days=self.absence_type.block_after_days)
        super().save(*args, **kwargs)
