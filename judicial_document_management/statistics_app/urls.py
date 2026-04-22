from django.urls import path, include
from rest_framework.routers import DefaultRouter
from statistics_app.api import views

urlpatterns = [
    # API endpoints
    path('api/available-models/', views.AvailableModelsView.as_view(), name='api-available-models'),
    path('api/model-fields/<int:ct_id>/', views.ModelFieldsView.as_view(), name='api-model-fields'),
    path('api/execute-query/', views.ExecuteQueryView.as_view(), name='api-execute-query'),
    path('api/drill-down/', views.DrillDownView.as_view(), name='api-drill-down'),
    path('api/saved-queries/', views.SavedQueryViewSet.as_view(), name='api-saved-queries'),
    path('api/saved-queries/<int:pk>/', views.SavedQueryViewSet.as_view(), name='api-saved-query-detail'),
    path('api/dashboards/', views.DashboardViewSet.as_view(), name='api-dashboards'),
    path('api/dashboards/<int:pk>/', views.DashboardViewSet.as_view(), name='api-dashboard-detail'),
]