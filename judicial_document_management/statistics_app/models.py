from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField  # или используйте models.JSONField для Django 3.1+

class SavedQueryView(models.Model):
    """
    Сохраненный пользовательский запрос (представление/отчет).
    """
    name = models.CharField(max_length=255, verbose_name="Название отчета")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")

    # Целевая модель, по которой строится отчет
    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            'app_label__in': [
                'criminal_proceedings', 'civil_proceedings',
                'administrative_code', 'administrative_proceedings',
                'case_registry', 'other_materials', 'business_card'
            ]
        },
        verbose_name="Целевая модель"
    )

    # Конфигурация запроса в формате JSON
    # Будет хранить: fields_to_group_by, aggregates, filters, ordering
    query_config = JSONField(default=dict, verbose_name="Конфигурация запроса")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='saved_queries',
        verbose_name="Создал"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False, verbose_name="Публичный отчет")
    last_run = models.DateTimeField(null=True, blank=True, verbose_name="Последний запуск")

    class Meta:
        verbose_name = "Сохраненный запрос"
        verbose_name_plural = "Сохраненные запросы"
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Dashboard(models.Model):
    """
    Модель для дашборда, объединяющего несколько сохраненных запросов.
    """
    name = models.CharField(max_length=255, verbose_name="Название дашборда")
    description = models.TextField(blank=True, null=True)
    views = models.ManyToManyField(SavedQueryView, through='DashboardWidget', related_name='dashboards')
    layout_config = JSONField(default=dict, verbose_name="Конфигурация расположения виджетов")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Дашборд"
        verbose_name_plural = "Дашборды"

    def __str__(self):
        return self.name


class DashboardWidget(models.Model):
    """
    Промежуточная модель для настройки виджета на дашборде.
    """
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE)
    saved_query = models.ForeignKey(SavedQueryView, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    chart_type = models.CharField(
        max_length=20,
        choices=[
            ('table', 'Таблица'),
            ('bar', 'Столбчатая диаграмма'),
            ('line', 'Линейная диаграмма'),
            ('pie', 'Круговая диаграмма'),
        ],
        default='table',
        verbose_name="Тип визуализации"
    )
    width = models.PositiveIntegerField(default=6, help_text="Ширина в колонках сетки (1-12)")
    height = models.PositiveIntegerField(default=400, help_text="Высота в пикселях")

    class Meta:
        ordering = ['order']


# statistics_app/models.py (добавить в конец файла)

class FavoriteReport(models.Model):
    """
    Избранные отчеты пользователя для быстрого доступа.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_reports'
    )
    saved_query = models.ForeignKey(
        'SavedQueryView',
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        unique_together = ['user', 'saved_query']
        verbose_name = "Избранный отчет"
        verbose_name_plural = "Избранные отчеты"

    def __str__(self):
        return f"{self.user.username} - {self.saved_query.name}"


class ReportExecutionLog(models.Model):
    """
    Лог выполнения отчетов для анализа производительности и популярности.
    """
    saved_query = models.ForeignKey('SavedQueryView', on_delete=models.CASCADE, related_name='execution_logs')
    executed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    execution_time = models.DateTimeField(auto_now_add=True)
    duration_ms = models.PositiveIntegerField(help_text="Время выполнения в миллисекундах")
    result_rows = models.PositiveIntegerField(default=0)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-execution_time']
        verbose_name = "Лог выполнения отчета"
        verbose_name_plural = "Логи выполнения отчетов"

    def __str__(self):
        return f"{self.saved_query.name} - {self.execution_time}"