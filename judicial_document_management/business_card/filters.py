# business_card/filters.py (создайте новый файл)

from django_filters import rest_framework as filters
from .models import SidesCaseInCase


class SidesCaseInCaseFilter(filters.FilterSet):
    """Фильтры для поиска участников процесса"""
    
    # Общие поля
    name = filters.CharFilter(lookup_expr='icontains')
    phone = filters.CharFilter(lookup_expr='icontains')
    email = filters.CharFilter(lookup_expr='icontains')
    address = filters.CharFilter(lookup_expr='icontains')
    
    # Фильтры для физических лиц
    birth_date_from = filters.DateFilter(field_name='birth_date', lookup_expr='gte')
    birth_date_to = filters.DateFilter(field_name='birth_date', lookup_expr='lte')
    gender = filters.ChoiceFilter(choices=SidesCaseInCase.GENDER_CHOICES)
    document_type = filters.CharFilter(lookup_expr='icontains')
    document_number = filters.CharFilter(lookup_expr='icontains')
    document_series = filters.CharFilter(lookup_expr='icontains')
    
    # Фильтры для юридических лиц
    inn = filters.CharFilter(lookup_expr='icontains')
    kpp = filters.CharFilter(lookup_expr='icontains')
    ogrn = filters.CharFilter(lookup_expr='icontains')
    director_name = filters.CharFilter(lookup_expr='icontains')
    legal_address = filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = SidesCaseInCase
        fields = [
            'name', 'phone', 'email', 'address',
            'birth_date', 'gender', 'document_type', 
            'document_number', 'document_series',
            'inn', 'kpp', 'ogrn', 'director_name', 'legal_address'
        ]
