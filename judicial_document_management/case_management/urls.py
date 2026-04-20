# case_management/urls.py
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
    
    # Универсальные маршруты для progress entries по всем типам дел
    path('criminal/<int:case_id>/progress-entries/', 
         views.CriminalCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='criminal-progress-list'),
    path('criminal/<int:case_id>/progress-entries/<int:pk>/', 
         views.CriminalCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='criminal-progress-detail'),
    
    # Гражданские дела
    path('civil/<int:case_id>/progress-entries/', 
         views.CivilCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='civil-progress-list'),
    path('civil/<int:case_id>/progress-entries/<int:pk>/', 
         views.CivilCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='civil-progress-detail'),
    
    # КАС дела
    path('kas/<int:case_id>/progress-entries/', 
         views.KasCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='kas-progress-list'),
    path('kas/<int:case_id>/progress-entries/<int:pk>/', 
         views.KasCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='kas-progress-detail'),
    
    # КоАП дела
    path('coap/<int:case_id>/progress-entries/', 
         views.CoapCaseProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='coap-progress-list'),
    path('coap/<int:case_id>/progress-entries/<int:pk>/', 
         views.CoapCaseProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='coap-progress-detail'),
    
    # Иные материалы
    path('other/<int:case_id>/progress-entries/', 
         views.OtherMaterialProgressViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='other-progress-list'),
    path('other/<int:case_id>/progress-entries/<int:pk>/', 
         views.OtherMaterialProgressViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='other-progress-detail'),
    
    # Настройки сроков
    path('deadline-settings/', views.deadline_settings_list, name='deadline-settings'),
    path('deadline-settings/<str:category>/', views.deadline_settings_detail, name='deadline-settings-detail'),
]