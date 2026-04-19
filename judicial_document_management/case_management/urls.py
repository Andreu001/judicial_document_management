from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r'progress-action-types', views.ProgressActionTypeViewSet)
router.register(r'notification-channels', views.NotificationChannelViewSet)
router.register(r'notification-statuses', views.NotificationStatusViewSet)
router.register(r'notification-templates', views.NotificationTemplateViewSet)
router.register(r'notifications', views.NotificationViewSet)
router.register(r'case-participants', views.CaseParticipantsViewSet, basename='case-participants')

urlpatterns = [
    path('', include(router.urls)),
    
    # Маршруты для progress entries по разным типам дел
    path('criminal/<int:case_id>/progress-entries/', 
         views.CriminalCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='criminal-progress-list'),
    path('criminal/<int:case_id>/progress-entries/<int:pk>/', 
         views.CriminalCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='criminal-progress-detail'),
    
    # Универсальные маршруты для progress entries по любому типу дела
    path('<str:case_type>/<int:case_id>/progress-entries/',
         views.GenericCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='generic-progress-list'),
    path('<str:case_type>/<int:case_id>/progress-entries/<int:pk>/',
         views.GenericCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='generic-progress-detail'),
]