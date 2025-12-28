import django_filters
from django.db.models import Q
from .models import RegisteredCase, Correspondence


class CorrespondenceFilter(django_filters.FilterSet):
    """Фильтры для корреспонденции"""

    # Основные фильтры
    correspondence_type = django_filters.ChoiceFilter(
        choices=Correspondence.TYPE_CHOICES,
        label='Тип корреспонденции'
    )

    status = django_filters.ChoiceFilter(
        choices=Correspondence.STATUS_CHOICES,
        label='Статус'
    )

    method_of_receipt = django_filters.ChoiceFilter(
        choices=Correspondence.ADMISSION_METOD,
        label='Способ получения/отправки'
    )

    # Фильтры по датам
    registration_date = django_filters.DateFilter(
        field_name='registration_date',
        lookup_expr='exact',
        label='Дата регистрации'
    )

    registration_date_gte = django_filters.DateFilter(
        field_name='registration_date',
        lookup_expr='gte',
        label='Дата регистрации от'
    )

    registration_date_lte = django_filters.DateFilter(
        field_name='registration_date',
        lookup_expr='lte',
        label='Дата регистрации до'
    )

    execution_deadline = django_filters.DateFilter(
        field_name='execution_deadline',
        lookup_expr='exact',
        label='Срок исполнения'
    )

    execution_deadline_gte = django_filters.DateFilter(
        field_name='execution_deadline',
        lookup_expr='gte',
        label='Срок исполнения от'
    )

    execution_deadline_lte = django_filters.DateFilter(
        field_name='execution_deadline',
        lookup_expr='lte',
        label='Срок исполнения до'
    )

    actual_execution_date = django_filters.DateFilter(
        field_name='actual_execution_date',
        lookup_expr='exact',
        label='Дата исполнения'
    )

    actual_execution_date_gte = django_filters.DateFilter(
        field_name='actual_execution_date',
        lookup_expr='gte',
        label='Дата исполнения от'
    )

    actual_execution_date_lte = django_filters.DateFilter(
        field_name='actual_execution_date',
        lookup_expr='lte',
        label='Дата исполнения до'
    )

    # Фильтры по текстовым полям
    sender = django_filters.CharFilter(
        field_name='sender',
        lookup_expr='icontains',
        label='Отправитель'
    )

    recipient = django_filters.CharFilter(
        field_name='recipient',
        lookup_expr='icontains',
        label='Получатель'
    )

    executor = django_filters.CharFilter(
        field_name='executor',
        lookup_expr='icontains',
        label='Исполнитель'
    )

    document_type = django_filters.CharFilter(
        field_name='document_type',
        lookup_expr='icontains',
        label='Тип документа'
    )

    registration_number = django_filters.CharFilter(
        field_name='registration_number',
        lookup_expr='icontains',
        label='Регистрационный номер'
    )

    number_sender_document = django_filters.CharFilter(
        field_name='number_sender_document',
        lookup_expr='icontains',
        label='Исх. номер отправителя'
    )

    # Фильтр по связанной модели
    business_card = django_filters.NumberFilter(
        field_name='business_card_id',
        label='ID связанной карточки'
    )

    # Универсальный поиск
    search = django_filters.CharFilter(
        method='filter_search',
        label='Поиск'
    )

    # Фильтр по диапазону количества страниц
    pages_count_min = django_filters.NumberFilter(
        field_name='pages_count',
        lookup_expr='gte',
        label='Минимальное количество страниц'
    )

    pages_count_max = django_filters.NumberFilter(
        field_name='pages_count',
        lookup_expr='lte',
        label='Максимальное количество страниц'
    )

    class Meta:
        model = Correspondence
        fields = [
            'correspondence_type',
            'status',
            'method_of_receipt',
            'registration_date',
            'execution_deadline',
            'actual_execution_date',
            'sender',
            'recipient',
            'executor',
            'document_type',
            'registration_number',
            'number_sender_document',
            'business_card',
        ]

    def filter_search(self, queryset, name, value):
        """Поиск по нескольким полям"""
        return queryset.filter(
            Q(registration_number__icontains=value) |
            Q(document_type__icontains=value) |
            Q(summary__icontains=value) |
            Q(sender__icontains=value) |
            Q(recipient__icontains=value) |
            Q(executor__icontains=value) |
            Q(number_sender_document__icontains=value) |
            Q(outgoing_date_document__icontains=value) |
            Q(notes__icontains=value)
        )


class RegistryIndexFilter(django_filters.FilterSet):
    """Фильтры для индексов регистрации"""

    index = django_filters.CharFilter(
        field_name='index',
        lookup_expr='icontains',
        label='Индекс'
    )

    name = django_filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        label='Наименование'
    )

    search = django_filters.CharFilter(
        method='filter_search',
        label='Поиск'
    )

    class Meta:
        model = RegisteredCase
        fields = ['index', 'name']

    def filter_search(self, queryset, name, value):
        """Поиск по индексу и наименованию"""
        return queryset.filter(
            Q(index__icontains=value) |
            Q(name__icontains=value)
        )
