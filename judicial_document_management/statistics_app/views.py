# statistics_app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.apps import apps
from django.db.models import Q, Count, Sum, Avg, Max, Min, F, Value, CharField, OuterRef, Subquery, Case, When, IntegerField, DecimalField, DateField
from django.db.models.functions import Coalesce, TruncMonth, TruncYear, TruncDate, ExtractYear, ExtractMonth
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict
import json
import logging

from .models import SavedQuery, StatisticsCache

logger = logging.getLogger(__name__)


class FullMetaDataView(APIView):
    """Полная мета-информация о всех моделях, полях и связях"""
    
    TARGET_MODELS = {
        # Уголовные дела
        'criminal_proceedings': {
            'CriminalProceedings': {'category': 'criminal', 'name': 'Уголовные дела', 'order': 1},
            'Defendant': {'category': 'criminal', 'name': 'Подсудимые', 'order': 2},
            'CriminalDecision': {'category': 'criminal', 'name': 'Решения по уголовным делам', 'order': 3},
            'CriminalExecution': {'category': 'criminal', 'name': 'Исполнение приговоров', 'order': 4},
            'CriminalPersonCard': {'category': 'criminal', 'name': 'Статистические карточки на подсудимых', 'order': 5},
            'CriminalAppealInstance': {'category': 'criminal', 'name': 'Апелляционное обжалование', 'order': 6},
            'CriminalCassationInstance': {'category': 'criminal', 'name': 'Кассационное обжалование', 'order': 7},
            'CriminalCivilClaim': {'category': 'criminal', 'name': 'Гражданские иски в уголовных делах', 'order': 8},
            'PetitionCriminal': {'category': 'criminal', 'name': 'Ходатайства по уголовным делам', 'order': 9},
            'CriminalCaseMovement': {'category': 'criminal', 'name': 'Движение уголовных дел', 'order': 10},
        },
        # Гражданские дела
        'civil_proceedings': {
            'CivilProceedings': {'category': 'civil', 'name': 'Гражданские дела', 'order': 11},
            'CivilDecision': {'category': 'civil', 'name': 'Решения по гражданским делам', 'order': 12},
            'CivilExecution': {'category': 'civil', 'name': 'Исполнение по гражданским делам', 'order': 13},
            'CivilSidesCaseInCase': {'category': 'civil', 'name': 'Стороны гражданских дел', 'order': 14},
            'CivilLawyer': {'category': 'civil', 'name': 'Представители в гражданских делах', 'order': 15},
            'CivilPetition': {'category': 'civil', 'name': 'Ходатайства по гражданским делам', 'order': 16},
            'CivilCaseMovement': {'category': 'civil', 'name': 'Движение гражданских дел', 'order': 17},
        },
        # Административные дела (КоАП)
        'administrative_code': {
            'AdministrativeProceedings': {'category': 'admin', 'name': 'Дела об АП (КоАП)', 'order': 18},
            'AdministrativeDecision': {'category': 'admin', 'name': 'Постановления по делам об АП', 'order': 19},
            'AdministrativeExecution': {'category': 'admin', 'name': 'Исполнение по делам об АП', 'order': 20},
            'AdministrativeSubject': {'category': 'admin', 'name': 'Субъекты АП', 'order': 21},
            'AdministrativeAppeal': {'category': 'admin', 'name': 'Апелляция по делам об АП', 'order': 22},
            'AdministrativeCassation': {'category': 'admin', 'name': 'Кассация по делам об АП', 'order': 23},
        },
        # Дела КАС - ИСПРАВЛЕНО (добавлены все модели)
        'administrative_proceedings': {
            'KasProceedings': {'category': 'kas', 'name': 'Дела КАС', 'order': 24},
            'KasDecision': {'category': 'kas', 'name': 'Решения по делам КАС', 'order': 25},
            'KasExecution': {'category': 'kas', 'name': 'Исполнение по делам КАС', 'order': 26},
            'KasSidesCaseInCase': {'category': 'kas', 'name': 'Стороны в делах КАС', 'order': 27},
            'KasLawyer': {'category': 'kas', 'name': 'Представители в делах КАС', 'order': 28},
            'KasCaseMovement': {'category': 'kas', 'name': 'Движение дел КАС', 'order': 29},
            'KasPetition': {'category': 'kas', 'name': 'Ходатайства по делам КАС', 'order': 30},
        },
        # Иные материалы
        'other_materials': {
            'OtherMaterial': {'category': 'other', 'name': 'Иные материалы', 'order': 31},
            'OtherMaterialDecision': {'category': 'other', 'name': 'Решения по иным материалам', 'order': 32},
        },
        # Общие справочники
        'business_card': {
            'SidesCaseInCase': {'category': 'common', 'name': 'Стороны (общая информация)', 'order': 33},
            'Lawyer': {'category': 'common', 'name': 'Адвокаты/представители', 'order': 34},
            'PetitionsInCase': {'category': 'common', 'name': 'Ходатайства', 'order': 35},
            'BusinessMovement': {'category': 'common', 'name': 'Движение дел', 'order': 36},
        },
    }
    
    # Связи между моделями для получения связанных данных
    RELATION_FIELDS = {
        'criminal_proceedings.CriminalProceedings': {
            'defendants': ('defendants', 'criminal_proceedings', 'Подсудимые'),
            'decisions': ('criminal_decisions', 'criminal_proceedings', 'Решения'),
            'executions': ('criminal_executions', 'criminal_proceedings', 'Исполнения'),
            'person_cards': ('person_cards', 'criminal_proceedings', 'Стат. карточки'),
            'appeal_instances': ('appeal_instances', 'criminal_proceedings', 'Апелляции'),
            'cassation_instances': ('cassation_instances', 'criminal_proceedings', 'Кассации'),
            'civil_claims': ('civil_claims', 'criminal_proceedings', 'Гражданские иски'),
            'petitions': ('petitions', 'criminal_proceedings', 'Ходатайства'),
            'case_movement': ('case_movement', 'criminal_proceedings', 'Движение дела'),
        },
        'civil_proceedings.CivilProceedings': {
            'sides': ('civil_sides', 'civil_proceedings', 'Стороны'),
            'lawyers': ('civil_lawyers', 'civil_proceedings', 'Представители'),
            'decisions': ('civil_decisions', 'civil_proceedings', 'Решения'),
            'executions': ('civil_executions', 'civil_proceedings', 'Исполнения'),
            'petitions': ('civil_petitions', 'civil_proceedings', 'Ходатайства'),
            'movements': ('civil_movements', 'civil_proceedings', 'Движение дела'),
        },
        'administrative_proceedings': {
            'KasProceedings': {'category': 'kas', 'name': 'Дела КАС', 'order': 24},
            'KasDecision': {'category': 'kas', 'name': 'Решения по делам КАС', 'order': 25},
            'KasExecution': {'category': 'kas', 'name': 'Исполнение по делам КАС', 'order': 26},
            'KasSidesCaseInCase': {'category': 'kas', 'name': 'Стороны в делах КАС', 'order': 27},
            'KasLawyer': {'category': 'kas', 'name': 'Представители в делах КАС', 'order': 28},
            'KasCaseMovement': {'category': 'kas', 'name': 'Движение дел КАС', 'order': 29},
            'KasPetition': {'category': 'kas', 'name': 'Ходатайства по делам КАС', 'order': 30},
        },
    }
    
    def get(self, request):
        """Возвращает полную мета-информацию"""
        result = {
            'models': {},
            'relations': self.RELATION_FIELDS,
            'categories': {
                'criminal': {'name': 'Уголовные дела', 'color': '#dc2626'},
                'civil': {'name': 'Гражданские дела', 'color': '#2563eb'},
                'admin': {'name': 'Административные дела (КоАП)', 'color': '#16a34a'},
                'kas': {'name': 'Дела КАС', 'color': '#7c3aed'},
                'other': {'name': 'Иные материалы', 'color': '#ea580c'},
                'common': {'name': 'Общие справочники', 'color': '#6b7280'},
            }
        }
        
        for app_label, models_dict in self.TARGET_MODELS.items():
            for model_name, model_info in models_dict.items():
                try:
                    model = apps.get_model(app_label=app_label, model_name=model_name)
                    
                    # Получаем все поля модели
                    fields = []
                    choice_fields = []
                    
                    for field in model._meta.get_fields():
                        if field.auto_created and not field.concrete:
                            continue
                        
                        field_data = {
                            'name': field.name,
                            'verbose_name': getattr(field, 'verbose_name', field.name.replace('_', ' ').capitalize()),
                            'type': field.get_internal_type(),
                            'null': field.null if hasattr(field, 'null') else False,
                            'blank': field.blank if hasattr(field, 'blank') else False,
                        }
                        
                        # Получаем выборы если есть
                        if hasattr(field, 'choices') and field.choices:
                            choices_list = []
                            for choice_value, choice_label in field.choices:
                                choices_list.append({'value': choice_value, 'label': str(choice_label)})
                            field_data['choices'] = choices_list
                            choice_fields.append(field_data)
                        
                        # Определяем категорию поля
                        field_category = 'other'
                        field_name_lower = field.name.lower()
                        field_type = field.get_internal_type()
                        
                        if 'date' in field_name_lower or field_type in ['DateField', 'DateTimeField']:
                            field_category = 'dates'
                        elif 'amount' in field_name_lower or 'sum' in field_name_lower or 'fine' in field_name_lower or field_type in ['DecimalField', 'IntegerField', 'FloatField', 'PositiveIntegerField']:
                            field_category = 'numbers'
                        elif 'name' in field_name_lower or 'title' in field_name_lower or 'number' in field_name_lower:
                            field_category = 'text'
                        elif 'status' in field_name_lower:
                            field_category = 'status'
                        elif 'result' in field_name_lower or 'outcome' in field_name_lower:
                            field_category = 'results'
                        elif 'judge' in field_name_lower:
                            field_category = 'judges'
                        elif field.is_relation and not hasattr(field, 'field'):
                            field_category = 'relations'
                            field_data['related_model'] = f"{field.related_model._meta.app_label}.{field.related_model.__name__}" if field.related_model else None
                        
                        field_data['category'] = field_category
                        fields.append(field_data)
                    
                    # Сортируем поля по категориям
                    fields_by_category = defaultdict(list)
                    for field in fields:
                        fields_by_category[field['category']].append(field)
                    
                    result['models'][f"{app_label}.{model_name}"] = {
                        'app_label': app_label,
                        'model_name': model_name,
                        'verbose_name': str(model_info['name']),
                        'verbose_name_plural': str(model._meta.verbose_name_plural),
                        'category': model_info['category'],
                        'order': model_info['order'],
                        'fields': fields,
                        'fields_by_category': dict(fields_by_category),
                        'choice_fields': choice_fields,
                        'count': model.objects.count(),
                    }
                    
                except LookupError as e:
                    logger.error(f"Model {app_label}.{model_name} not found: {e}")
        
        return Response(result)


class DynamicDataView(APIView):
    """Универсальный API для получения данных из любой модели с полной фильтрацией"""
    
    def post(self, request):
        app_label = request.data.get('app_label')
        model_name = request.data.get('model_name')
        selected_fields = request.data.get('selected_fields', [])
        filters = request.data.get('filters', [])
        date_range = request.data.get('date_range', {})
        ordering = request.data.get('ordering', [])
        page = request.data.get('page', 1)
        page_size = request.data.get('page_size', 50)
        include_related = request.data.get('include_related', False)
        related_depth = request.data.get('related_depth', 1)
        
        if not app_label or not model_name:
            return Response({"error": "app_label and model_name are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            model_class = apps.get_model(app_label=app_label, model_name=model_name)
        except LookupError:
            return Response({"error": f"Model {app_label}.{model_name} not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Базовый queryset с оптимизацией связанных запросов
        queryset = model_class.objects.all()
        
        # Добавляем select_related для оптимизации (глубина 1)
        if include_related and related_depth >= 1:
            select_related_fields = []
            for field in model_class._meta.get_fields():
                if field.is_relation and not field.auto_created and field.concrete:
                    if not field.many_to_many and not field.one_to_many:
                        select_related_fields.append(field.name)
            if select_related_fields:
                queryset = queryset.select_related(*select_related_fields)
        
        # Применяем фильтры
        filter_kwargs = {}
        for filter_item in filters:
            field = filter_item.get('field')
            operator = filter_item.get('operator', 'exact')
            value = filter_item.get('value')
            
            if not field or value is None or value == '':
                continue
            
            # Обработка разных операторов
            if operator == 'exact':
                filter_kwargs[f"{field}"] = value
            elif operator == 'iexact':
                filter_kwargs[f"{field}__iexact"] = value
            elif operator == 'contains':
                filter_kwargs[f"{field}__contains"] = value
            elif operator == 'icontains':
                filter_kwargs[f"{field}__icontains"] = value
            elif operator == 'startswith':
                filter_kwargs[f"{field}__startswith"] = value
            elif operator == 'istartswith':
                filter_kwargs[f"{field}__istartswith"] = value
            elif operator == 'gt':
                filter_kwargs[f"{field}__gt"] = value
            elif operator == 'gte':
                filter_kwargs[f"{field}__gte"] = value
            elif operator == 'lt':
                filter_kwargs[f"{field}__lt"] = value
            elif operator == 'lte':
                filter_kwargs[f"{field}__lte"] = value
            elif operator == 'in':
                if isinstance(value, list):
                    filter_kwargs[f"{field}__in"] = value
                else:
                    filter_kwargs[f"{field}__in"] = [v.strip() for v in value.split(',')]
            elif operator == 'isnull':
                filter_kwargs[f"{field}__isnull"] = value.lower() == 'true'
        
        if filter_kwargs:
            queryset = queryset.filter(**filter_kwargs)
        
        # Применяем фильтрацию по диапазону дат
        if date_range.get('field'):
            date_field = date_range.get('field')
            date_from = date_range.get('from')
            date_to = date_range.get('to')
            
            if date_from:
                queryset = queryset.filter(**{f"{date_field}__gte": date_from})
            if date_to:
                queryset = queryset.filter(**{f"{date_field}__lte": date_to})
        
        # Применяем сортировку
        if ordering:
            order_by = []
            for order_item in ordering:
                field = order_item.get('field')
                direction = order_item.get('direction', 'asc')
                if field:
                    order_field = f"-{field}" if direction == 'desc' else field
                    order_by.append(order_field)
            if order_by:
                queryset = queryset.order_by(*order_by)
        
        # Получаем общее количество для пагинации
        total_count = queryset.count()
        
        # Пагинация
        paginator = Paginator(queryset, page_size)
        try:
            paginated_queryset = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            paginated_queryset = paginator.page(1)
        
        # Сериализация результатов
        results = []
        for obj in paginated_queryset:
            row = self._serialize_object(obj, selected_fields, related_depth if include_related else 0)
            results.append(row)
        
        # Мета-информация о полях
        field_verbose_names = {}
        for field_name in selected_fields:
            verbose_name = self._get_field_verbose_name(model_class, field_name)
            field_verbose_names[field_name] = verbose_name
        
        return Response({
            'meta': {
                'total_count': total_count,
                'total_pages': paginator.num_pages,
                'current_page': paginated_queryset.number,
                'page_size': page_size,
                'field_verbose_names': field_verbose_names,
            },
            'results': results,
        })
    
    def _serialize_object(self, obj, fields, depth=0):
        """Сериализация объекта с поддержкой вложенных связей"""
        result = {}
        
        for field_path in fields:
            value = self._get_nested_value(obj, field_path)
            result[field_path] = self._serialize_value(value, depth - 1 if depth > 0 else 0)
        
        return result
    
    def _get_nested_value(self, obj, path):
        """Получение значения по пути с поддержкой __"""
        parts = path.split('__')
        current = obj
        
        for part in parts:
            if current is None:
                return None
            
            if hasattr(current, part):
                current = getattr(current, part)
                if callable(current):
                    current = current()
            else:
                return None
        
        return current
    
    def _serialize_value(self, value, depth=0):
        """Сериализация значения для JSON"""
        if value is None:
            return None
        
        # Даты
        if hasattr(value, 'strftime'):
            if hasattr(value, 'hour'):  # datetime
                return value.strftime('%Y-%m-%d %H:%M:%S')
            return value.strftime('%Y-%m-%d')
        
        # Объекты модели
        if hasattr(value, '_meta'):
            if depth <= 0:
                # Возвращаем только ID и строковое представление
                return {'id': value.id, 'str': str(value)}
            else:
                # Рекурсивно сериализуем основные поля
                return self._serialize_model_object(value, depth)
        
        # Списки QuerySet
        if hasattr(value, 'all'):
            if depth <= 0:
                return [{'id': item.id, 'str': str(item)} for item in value.all()[:10]]
            else:
                return [self._serialize_model_object(item, depth - 1) for item in value.all()[:10]]
        
        # Десятичные числа
        if hasattr(value, 'quantize'):
            return float(value)
        
        # Обычные типы
        return value
    
    def _serialize_model_object(self, obj, depth):
        """Сериализация объекта модели"""
        result = {'id': obj.id, '__str__': str(obj)}
        
        # Берем основные поля
        for field in obj._meta.get_fields():
            if field.auto_created:
                continue
            if field.name in ['id', 'password']:
                continue
            
            try:
                value = getattr(obj, field.name)
                if callable(value):
                    continue
                result[field.name] = self._serialize_value(value, depth - 1)
            except Exception:
                pass
        
        return result
    
    def _get_field_verbose_name(self, model_class, field_path):
        """Получение verbose_name поля"""
        parts = field_path.split('__')
        current_model = model_class
        
        for i, part in enumerate(parts):
            try:
                field = current_model._meta.get_field(part)
                if i == len(parts) - 1:
                    return getattr(field, 'verbose_name', part.replace('_', ' ').capitalize())
                
                if field.is_relation and field.related_model:
                    current_model = field.related_model
                else:
                    return part.replace('_', ' ').capitalize()
            except Exception:
                return part.replace('_', ' ').capitalize()
        
        return field_path.replace('_', ' ').capitalize()


class GlobalStatisticsView(APIView):
    """Глобальная статистика по всем делам"""
    
    def get(self, request):
        """Получение общей статистики"""
        from datetime import datetime, timedelta
        
        result = {
            'overview': {},
            'by_category': {},
            'by_status': {},
            'by_judge': {},
            'timeline': {},
            'criminal_stats': {},
            'civil_stats': {},
            'admin_stats': {},
        }
        
        # Общая статистика по уголовным делам
        try:
            CriminalProceedings = apps.get_model('criminal_proceedings', 'CriminalProceedings')
            Defendant = apps.get_model('criminal_proceedings', 'Defendant')
            CriminalDecision = apps.get_model('criminal_proceedings', 'CriminalDecision')
            CriminalPersonCard = apps.get_model('criminal_proceedings', 'CriminalPersonCard')
            
            criminal_qs = CriminalProceedings.objects.all()
            result['overview']['criminal_total'] = criminal_qs.count()
            result['overview']['defendants_total'] = Defendant.objects.count()
            result['overview']['criminal_decisions_total'] = CriminalDecision.objects.count()
            result['overview']['person_cards_total'] = CriminalPersonCard.objects.filter(is_completed=True).count()
            
            # Распределение по статусам
            status_distribution = {}
            for status, count in criminal_qs.values('status').annotate(cnt=Count('id')):
                status_distribution[status] = count
            result['by_status']['criminal'] = status_distribution
            
            # Статистика по приговорам
            result['criminal_stats']['conviction_rate'] = criminal_qs.filter(case_result__in=['1', '2', '3', '4', '5']).count()
            result['criminal_stats']['acquittal_rate'] = criminal_qs.filter(case_result__in=['3.1', '3.2']).count()
            
            # Сроки рассмотрения
            duration_stats = criminal_qs.aggregate(
                avg_duration=Avg('consideration_duration_days'),
                max_duration=Max('consideration_duration_days'),
                min_duration=Min('consideration_duration_days')
            )
            result['criminal_stats']['avg_duration_days'] = duration_stats['avg_duration'] or 0
            result['criminal_stats']['max_duration_days'] = duration_stats['max_duration'] or 0
            result['criminal_stats']['min_duration_days'] = duration_stats['min_duration'] or 0
            
        except Exception as e:
            logger.error(f"Error getting criminal stats: {e}")
        
        # Общая статистика по гражданским делам
        try:
            CivilProceedings = apps.get_model('civil_proceedings', 'CivilProceedings')
            civil_qs = CivilProceedings.objects.all()
            result['overview']['civil_total'] = civil_qs.count()
            
            # Статистика по ценам исков
            claim_stats = civil_qs.aggregate(
                avg_claim=Avg('claim_amount'),
                max_claim=Max('claim_amount'),
                total_claim=Sum('claim_amount')
            )
            result['civil_stats']['avg_claim_amount'] = float(claim_stats['avg_claim'] or 0)
            result['civil_stats']['max_claim_amount'] = float(claim_stats['max_claim'] or 0)
            result['civil_stats']['total_claim_amount'] = float(claim_stats['total_claim'] or 0)
            
            # Распределение по видам производств
            type_distribution = {}
            for ct_id, count in civil_qs.values('case_type').annotate(cnt=Count('id')):
                type_distribution[ct_id] = count
            result['civil_stats']['by_case_type'] = type_distribution
            
        except Exception as e:
            logger.error(f"Error getting civil stats: {e}")
        
        # Общая статистика по административным делам (КоАП)
        try:
            AdministrativeProceedings = apps.get_model('administrative_proceedings', 'AdministrativeProceedings')
            admin_qs = AdministrativeProceedings.objects.all()
            result['overview']['admin_total'] = admin_qs.count()
            
            # Статистика по штрафам
            fine_stats = admin_qs.aggregate(
                avg_fine=Avg('fine_amount'),
                max_fine=Max('fine_amount'),
                total_fine=Sum('fine_amount')
            )
            result['admin_stats']['avg_fine_amount'] = float(fine_stats['avg_fine'] or 0)
            result['admin_stats']['max_fine_amount'] = float(fine_stats['max_fine'] or 0)
            result['admin_stats']['total_fine_amount'] = float(fine_stats['total_fine'] or 0)
            
        except Exception as e:
            logger.error(f"Error getting admin stats: {e}")
        
        # Общая статистика по делам КАС
        try:
            KasProceedings = apps.get_model('kas_proceedings', 'KasProceedings')
            result['overview']['kas_total'] = KasProceedings.objects.count()
        except Exception as e:
            logger.error(f"Error getting kas stats: {e}")
        
        # Общая статистика по иным материалам
        try:
            OtherMaterial = apps.get_model('other_materials', 'OtherMaterial')
            result['overview']['other_total'] = OtherMaterial.objects.count()
        except Exception as e:
            logger.error(f"Error getting other stats: {e}")
        
        # Статистика по судьям
        try:
            User = apps.get_model('users', 'User')
            judges = User.objects.filter(role='judge')
            
            judge_stats = []
            for judge in judges:
                judge_data = {
                    'id': judge.id,
                    'full_name': f"{judge.last_name} {judge.first_name}" if judge.last_name else judge.username,
                    'criminal_count': 0,
                    'civil_count': 0,
                    'admin_count': 0,
                }
                
                try:
                    judge_data['criminal_count'] = CriminalProceedings.objects.filter(presiding_judge=judge).count()
                except:
                    pass
                try:
                    judge_data['civil_count'] = CivilProceedings.objects.filter(presiding_judge=judge).count()
                except:
                    pass
                try:
                    judge_data['admin_count'] = AdministrativeProceedings.objects.filter(presiding_judge=judge).count()
                except:
                    pass
                
                if judge_data['criminal_count'] > 0 or judge_data['civil_count'] > 0 or judge_data['admin_count'] > 0:
                    judge_stats.append(judge_data)
            
            result['by_judge'] = judge_stats
        except Exception as e:
            logger.error(f"Error getting judge stats: {e}")
        
        # Временная шкала поступления дел
        timeline = {
            'by_month': [],
            'by_year': [],
        }
        
        # По месяцам за последние 12 месяцев
        today = timezone.now().date()
        for i in range(12):
            month_date = today.replace(day=1) - timedelta(days=30 * i)
            month_start = month_date.replace(day=1)
            if month_start.month == 12:
                next_month = month_start.replace(year=month_start.year + 1, month=1, day=1)
            else:
                next_month = month_start.replace(month=month_start.month + 1, day=1)
            
            month_data = {
                'year': month_start.year,
                'month': month_start.month,
                'month_name': month_start.strftime('%B %Y'),
                'criminal': 0,
                'civil': 0,
                'admin': 0,
                'kas': 0,
                'other': 0,
            }
            
            try:
                month_data['criminal'] = CriminalProceedings.objects.filter(incoming_date__gte=month_start, incoming_date__lt=next_month).count()
            except:
                pass
            try:
                month_data['civil'] = CivilProceedings.objects.filter(incoming_date__gte=month_start, incoming_date__lt=next_month).count()
            except:
                pass
            try:
                month_data['admin'] = AdministrativeProceedings.objects.filter(incoming_date__gte=month_start, incoming_date__lt=next_month).count()
            except:
                pass
            try:
                month_data['kas'] = KasProceedings.objects.filter(incoming_date__gte=month_start, incoming_date__lt=next_month).count()
            except:
                pass
            
            timeline['by_month'].append(month_data)
        
        timeline['by_month'].reverse()
        result['timeline'] = timeline
        
        return Response(result)


class FieldValuesView(APIView):
    """Получение уникальных значений для поля (для фильтров)"""
    
    def post(self, request):
        app_label = request.data.get('app_label')
        model_name = request.data.get('model_name')
        field_name = request.data.get('field_name')
        search = request.data.get('search', '')
        limit = request.data.get('limit', 100)
        
        if not all([app_label, model_name, field_name]):
            return Response({"error": "app_label, model_name, and field_name are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            model_class = apps.get_model(app_label=app_label, model_name=model_name)
        except LookupError:
            return Response({"error": f"Model {app_label}.{model_name} not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем поле
        try:
            field = model_class._meta.get_field(field_name)
        except Exception:
            return Response({"error": f"Field {field_name} not found in model"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Если у поля есть choices, возвращаем их
        if hasattr(field, 'choices') and field.choices:
            choices = []
            for value, label in field.choices:
                if not search or search.lower() in str(label).lower() or search.lower() in str(value).lower():
                    choices.append({'value': value, 'label': str(label)})
            return Response({'type': 'choices', 'values': choices[:limit]})
        
        # Иначе получаем уникальные значения из БД
        queryset = model_class.objects.all()
        
        # Фильтрация по поиску
        if search:
            queryset = queryset.filter(**{f"{field_name}__icontains": search})
        
        # Получаем уникальные значения
        values = queryset.values_list(field_name, flat=True).distinct()[:limit]
        
        # Форматируем результат
        formatted_values = []
        for value in values:
            if value is None:
                continue
            formatted_values.append({
                'value': value,
                'label': str(value)
            })
        
        return Response({'type': 'database', 'values': formatted_values})


class AdvancedSearchView(APIView):
    """Расширенный поиск по всем моделям"""
    
    def post(self, request):
        search_term = request.data.get('search_term', '')
        model_filter = request.data.get('model_filter', [])
        date_range = request.data.get('date_range', {})
        field_filters = request.data.get('field_filters', {})
        page = request.data.get('page', 1)
        page_size = request.data.get('page_size', 50)
        
        if not search_term:
            return Response({"error": "search_term is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        
        # Модели для поиска
        search_models = [
            ('criminal_proceedings', 'CriminalProceedings', 'case_number_criminal', 'Уголовное дело'),
            ('criminal_proceedings', 'Defendant', 'full_name_criminal', 'Подсудимый'),
            ('civil_proceedings', 'CivilProceedings', 'case_number_civil', 'Гражданское дело'),
            ('administrative_proceedings', 'AdministrativeProceedings', 'case_number_admin', 'Дело об АП'),
            ('kas_proceedings', 'KasProceedings', 'case_number_kas', 'Дело КАС'),
            ('other_materials', 'OtherMaterial', 'registration_number', 'Иной материал'),
            ('business_card', 'SidesCaseInCase', 'name', 'Сторона'),
            ('business_card', 'Lawyer', 'law_firm_name', 'Адвокат/представитель'),
        ]
        
        for app_label, model_name, search_field, verbose_name in search_models:
            try:
                model = apps.get_model(app_label, model_name)
                queryset = model.objects.filter(**{f"{search_field}__icontains": search_term})
                
                # Применяем дополнительные фильтры если есть
                if app_label in field_filters:
                    for field, value in field_filters[app_label].items():
                        if value:
                            queryset = queryset.filter(**{field: value})
                
                for obj in queryset[:10]:
                    results.append({
                        'type': verbose_name,
                        'model_key': f"{app_label}.{model_name}",
                        'id': obj.id,
                        'title': str(obj),
                        'details': self._get_object_details(obj),
                    })
            except Exception as e:
                logger.error(f"Error searching {app_label}.{model_name}: {e}")
        
        # Пагинация результатов
        total = len(results)
        start = (page - 1) * page_size
        end = start + page_size
        
        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'results': results[start:end],
        })
    
    def _get_object_details(self, obj):
        """Получение деталей объекта для отображения в результатах поиска"""
        details = {}
        
        # Пытаемся получить основные поля
        important_fields = ['case_number_criminal', 'case_number_civil', 'case_number_admin', 'case_number_kas', 'registration_number', 'name', 'full_name_criminal']
        
        for field_name in important_fields:
            if hasattr(obj, field_name):
                value = getattr(obj, field_name)
                if value:
                    details[field_name] = str(value)
        
        return details


class SavedQueryView(APIView):
    """API для работы с сохраненными запросами"""
    
    def get(self, request):
        queries = SavedQuery.objects.filter(user=request.user).order_by('-created_at')
        return Response([{
            'id': q.id,
            'name': q.name,
            'params': q.query_params,
            'created_at': q.created_at.isoformat(),
        } for q in queries])
    
    def post(self, request):
        name = request.data.get('name')
        params = request.data.get('params', {})
        
        if not name:
            return Response({"error": "Query name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        saved_query = SavedQuery.objects.create(
            name=name,
            user=request.user,
            query_params=params
        )
        
        return Response({
            'id': saved_query.id,
            'name': saved_query.name,
            'params': saved_query.query_params,
            'created_at': saved_query.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk):
        try:
            query = SavedQuery.objects.get(pk=pk, user=request.user)
            query.name = request.data.get('name', query.name)
            query.query_params = request.data.get('params', query.query_params)
            query.save()
            
            return Response({
                'id': query.id,
                'name': query.name,
                'params': query.query_params,
                'created_at': query.created_at.isoformat(),
            })
        except SavedQuery.DoesNotExist:
            return Response({"error": "Query not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            query = SavedQuery.objects.get(pk=pk, user=request.user)
            query.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedQuery.DoesNotExist:
            return Response({"error": "Query not found"}, status=status.HTTP_404_NOT_FOUND)


class ExportDataView(APIView):
    """Экспорт данных в различные форматы"""
    
    def post(self, request):
        export_format = request.data.get('format', 'json')  # json, csv, excel
        app_label = request.data.get('app_label')
        model_name = request.data.get('model_name')
        fields = request.data.get('fields', [])
        filters = request.data.get('filters', [])
        date_range = request.data.get('date_range', {})
        
        if not app_label or not model_name:
            return Response({"error": "app_label and model_name are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            model_class = apps.get_model(app_label=app_label, model_name=model_name)
        except LookupError:
            return Response({"error": f"Model {app_label}.{model_name} not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем данные
        queryset = model_class.objects.all()
        
        # Применяем фильтры
        for filter_item in filters:
            field = filter_item.get('field')
            operator = filter_item.get('operator', 'exact')
            value = filter_item.get('value')
            
            if field and value:
                if operator == 'exact':
                    queryset = queryset.filter(**{field: value})
                elif operator == 'icontains':
                    queryset = queryset.filter(**{f"{field}__icontains": value})
                elif operator == 'gt':
                    queryset = queryset.filter(**{f"{field}__gt": value})
                elif operator == 'lt':
                    queryset = queryset.filter(**{f"{field}__lt": value})
        
        # Фильтр по дате
        if date_range.get('field'):
            date_field = date_range['field']
            if date_range.get('from'):
                queryset = queryset.filter(**{f"{date_field}__gte": date_range['from']})
            if date_range.get('to'):
                queryset = queryset.filter(**{f"{date_field}__lte": date_range['to']})
        
        # Получаем поля для экспорта
        if not fields:
            fields = [field.name for field in model_class._meta.get_fields() if not field.auto_created]
        
        # Сериализуем данные
        data = []
        for obj in queryset:
            row = {}
            for field_name in fields:
                value = self._get_field_value(obj, field_name)
                row[field_name] = self._format_export_value(value)
            data.append(row)
        
        # Возвращаем в зависимости от формата
        if export_format == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="export_{app_label}_{model_name}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            if data:
                writer = csv.DictWriter(response, fieldnames=fields)
                writer.writeheader()
                writer.writerows(data)
            
            return response
        
        elif export_format == 'json':
            from django.http import JsonResponse
            return JsonResponse(data, safe=False)
        
        else:
            return Response(data)
    
    def _get_field_value(self, obj, field_path):
        """Получение значения поля по пути"""
        parts = field_path.split('__')
        value = obj
        for part in parts:
            if value is None:
                return None
            if hasattr(value, part):
                value = getattr(value, part)
                if callable(value):
                    value = value()
            else:
                return None
        return value
    
    def _format_export_value(self, value):
        """Форматирование значения для экспорта"""
        if value is None:
            return ''
        if hasattr(value, 'strftime'):
            if hasattr(value, 'hour'):
                return value.strftime('%Y-%m-%d %H:%M:%S')
            return value.strftime('%Y-%m-%d')
        if hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool)):
            return str(value)
        return value