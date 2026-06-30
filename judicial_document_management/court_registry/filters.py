"""
Фильтры для Django-Filters приложения court_registry.
"""
import django_filters
from .models import (
    Court, CourtDepartment, CourtEmployee,
    CaseTransfer, PendingTransferCase,
    VCSRequest,
)


class CourtFilter(django_filters.FilterSet):
    """Фильтры для судов"""
    name = django_filters.CharFilter(lookup_expr='icontains')
    code = django_filters.CharFilter(lookup_expr='exact')
    region = django_filters.NumberFilter(field_name='region__id')
    region_code = django_filters.CharFilter(field_name='region__code')
    level = django_filters.NumberFilter(field_name='level__id')
    level_code = django_filters.CharFilter(field_name='level__code')
    is_active = django_filters.BooleanFilter()
    is_registered_in_network = django_filters.BooleanFilter()

    class Meta:
        model = Court
        fields = ['region', 'level', 'is_active', 'is_registered_in_network']


class CaseTransferFilter(django_filters.FilterSet):
    """Фильтры для передач дел"""
    source_court = django_filters.NumberFilter()
    destination_court = django_filters.NumberFilter()
    transfer_type = django_filters.NumberFilter()
    status = django_filters.NumberFilter()
    case_category = django_filters.CharFilter(field_name='items__case_category', distinct=True)
    created_at_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    is_batch = django_filters.BooleanFilter()

    class Meta:
        model = CaseTransfer
        fields = []


class PendingTransferCaseFilter(django_filters.FilterSet):
    """Фильтры для дел, ожидающих передачи"""
    court = django_filters.NumberFilter()
    case_category = django_filters.CharFilter()
    transfer_reason = django_filters.CharFilter()
    status = django_filters.CharFilter()
    is_overdue = django_filters.BooleanFilter(method='filter_is_overdue')

    class Meta:
        model = PendingTransferCase
        fields = ['court', 'case_category', 'transfer_reason', 'status']

    def filter_is_overdue(self, queryset, name, value):
        if value:
            return queryset.filter(
                transfer_reason__in=['appeal', 'cassation'],
                relevant_date__isnull=False
            ) # В реальном запросе нужна логика дат, здесь упрощено
        return queryset


class VCSRequestFilter(django_filters.FilterSet):
    """Фильтры для запросов ВКС"""
    initiator_court = django_filters.NumberFilter()
    status = django_filters.CharFilter()
    scheduled_at_from = django_filters.DateTimeFilter(field_name='scheduled_at', lookup_expr='gte')
    scheduled_at_to = django_filters.DateTimeFilter(field_name='scheduled_at', lookup_expr='lte')

    class Meta:
        model = VCSRequest
        fields = ['initiator_court', 'status']