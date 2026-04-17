# case_management/urls.py

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r'notification-types', views.NotificationTypeViewSet)
router.register(r'notification-templates', views.NotificationTemplateViewSet)
router.register(r'progress-action-types', views.ProgressActionTypeViewSet)
# Явно указываем basename для ViewSet без queryset
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    
    # Маршруты для progress entries по разным типам дел
    path('criminal/<int:case_id>/progress-entries/', 
         views.CriminalCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='criminal-progress-list'),
    path('criminal/<int:case_id>/progress-entries/<int:pk>/', 
         views.CriminalCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='criminal-progress-detail'),
    
    # Эндпоинт для предпросмотра шаблона
    path('notification-templates/<int:pk>/preview/', 
         views.NotificationTemplateViewSet.as_view({'post': 'preview'}), 
         name='notification-template-preview'),
]