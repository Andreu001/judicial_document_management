from django.db.models import Count, Sum, Avg, Max, Min, Q, F
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import FieldError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class StatisticsQueryService:
    """
    Сервис для построения и выполнения динамических статистических запросов.
    """

    # Маппинг агрегатных функций
    AGGREGATE_MAP = {
        'count': Count,
        'sum': Sum,
        'avg': Avg,
        'max': Max,
        'min': Min,
    }

    @classmethod
    def execute_query(cls, target_ct, query_config):
        """
        Выполняет динамический запрос к модели.
        """
        model_class = target_ct.model_class()
        if not model_class:
            return None, "Модель не найдена."

        fields_to_group_by = query_config.get('fields_to_group_by', [])
        aggregates = query_config.get('aggregates', [])
        filters = query_config.get('filters', {})
        ordering = query_config.get('ordering', [])
        limit = query_config.get('limit')

        # Базовый QuerySet
        queryset = model_class.objects.all()

        # 1. Применяем фильтры
        try:
            queryset = cls._apply_filters(queryset, filters)
        except FieldError as e:
            logger.error(f"Ошибка в фильтрах: {e}")
            return None, f"Ошибка в фильтрах: {e}"

        # 2. Применяем агрегацию и группировку
        try:
            if fields_to_group_by:
                # .values() перед .annotate() для группировки
                queryset = queryset.values(*fields_to_group_by)
                # Добавляем аннотации
                aggregate_annotations = {}
                for agg in aggregates:
                    field_name = agg.get('field')
                    agg_func = agg.get('function')
                    alias = agg.get('alias', f"{field_name}_{agg_func}")
                    if agg_func in cls.AGGREGATE_MAP:
                        aggregate_annotations[alias] = cls.AGGREGATE_MAP[agg_func](field_name)
                if aggregate_annotations:
                    queryset = queryset.annotate(**aggregate_annotations)
                # Применяем сортировку
                if ordering:
                    queryset = queryset.order_by(*ordering)
                else:
                    # Сортируем по первому полю группировки по умолчанию
                    if fields_to_group_by:
                        queryset = queryset.order_by(fields_to_group_by[0])
                if limit:
                    queryset = queryset[:limit]
                result_data = list(queryset)
                return result_data, None
            else:
                # Простая агрегация без группировки (одна строка результата)
                aggregate_annotations = {}
                for agg in aggregates:
                    field_name = agg.get('field')
                    agg_func = agg.get('function')
                    alias = agg.get('alias', f"{field_name}_{agg_func}")
                    if agg_func in cls.AGGREGATE_MAP:
                        aggregate_annotations[alias] = cls.AGGREGATE_MAP[agg_func](field_name)
                if aggregate_annotations:
                    result = queryset.aggregate(**aggregate_annotations)
                    # Преобразуем в список словарей для единообразия
                    return [result], None
                else:
                    # Если нет агрегаций, просто возвращаем записи (список объектов)
                    if limit:
                        queryset = queryset[:limit]
                    # Возвращаем список словарей для сериализации
                    return list(queryset.values()), None

        except FieldError as e:
            logger.error(f"Ошибка в агрегации/группировке: {e}")
            return None, f"Ошибка в построении запроса: {e}"
        except Exception as e:
            logger.exception(f"Непредвиденная ошибка при выполнении запроса: {e}")
            return None, f"Внутренняя ошибка сервера: {e}"

    @classmethod
    def _apply_filters(cls, queryset, filters):
        """
        Рекурсивно применяет фильтры к queryset.
        filters: [{'field': 'status', 'lookup': 'exact', 'value': 'completed'}, ...]
        """
        if not filters:
            return queryset

        q_objects = Q()
        for filter_item in filters:
            field = filter_item.get('field')
            lookup = filter_item.get('lookup', 'exact')
            value = filter_item.get('value')

            if not field:
                continue

            lookup_expr = f"{field}__{lookup}" if lookup != 'exact' else field
            try:
                # Поддержка сложных значений (списки для 'in' и т.д.)
                if lookup == 'in' and not isinstance(value, list):
                    value = [value]
                q_objects &= Q(**{lookup_expr: value})
            except Exception as e:
                logger.warning(f"Не удалось применить фильтр {field}__{lookup}: {e}")
                continue
        return queryset.filter(q_objects)


    @classmethod
    def get_drill_down_data(cls, target_ct, query_config, group_by_values):
        """
        Получает список "исходных" записей для детализации агрегированного результата.
        group_by_values - словарь {поле_группировки: значение, ...}
        """
        model_class = target_ct.model_class()
        if not model_class:
            return None

        filters = query_config.get('filters', [])
        fields_to_group_by = query_config.get('fields_to_group_by', [])

        # Добавляем фильтры на основе значений группировки
        for field in fields_to_group_by:
            if field in group_by_values:
                filters.append({
                    'field': field,
                    'lookup': 'exact',
                    'value': group_by_values[field]
                })

        # Выполняем запрос без агрегации, просто получаем записи
        queryset = model_class.objects.all()
        try:
            queryset = cls._apply_filters(queryset, filters)
        except FieldError as e:
            logger.error(f"Ошибка в фильтрах детализации: {e}")
            return None

        # Возвращаем список объектов (или словарей) для детализации
        return list(queryset.values()[:100])  # Ограничим 100 записей для детализации