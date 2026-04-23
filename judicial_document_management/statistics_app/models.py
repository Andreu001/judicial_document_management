# statistics_app/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType


class SavedQuery(models.Model):
    """Модель для сохранения пользовательских настроек фильтрации и отображения."""
    name = models.CharField(max_length=255, verbose_name="Название сохраненного запроса")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_queries', verbose_name="Пользователь")
    query_params = models.JSONField(default=dict, verbose_name="Параметры запроса")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Сохраненный запрос"
        verbose_name_plural = "Сохраненные запросы"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class StatisticsCache(models.Model):
    """Кэш для статистических агрегатов для ускорения работы"""
    cache_key = models.CharField(max_length=255, unique=True)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        verbose_name = "Кэш статистики"
        verbose_name_plural = "Кэши статистики"