# statistics_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Метаданные
    path('meta-data/', views.FullMetaDataView.as_view(), name='full-meta-data'),
    
    # Динамические данные
    path('dynamic-data/', views.DynamicDataView.as_view(), name='dynamic-data'),
    
    # Глобальная статистика
    path('global-stats/', views.GlobalStatisticsView.as_view(), name='global-stats'),
    
    # Значения полей для фильтров
    path('field-values/', views.FieldValuesView.as_view(), name='field-values'),
    
    # Расширенный поиск
    path('advanced-search/', views.AdvancedSearchView.as_view(), name='advanced-search'),
    
    # Сохраненные запросы
    path('saved-queries/', views.SavedQueryView.as_view(), name='saved-queries'),
    path('saved-queries/<int:pk>/', views.SavedQueryView.as_view(), name='saved-query-detail'),
    
    # Экспорт данных
    path('export/', views.ExportDataView.as_view(), name='export-data'),
]