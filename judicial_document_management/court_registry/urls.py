"""
Маршруты приложения court_registry.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    InterCourtReceiveTransferView,
    InterCourtPingView,
    InterCourtSendTransferView
)

router = DefaultRouter()

# Справочники
router.register(r'regions', views.RegionViewSet, basename='region')
router.register(r'court-levels', views.CourtLevelViewSet, basename='court-level')
router.register(r'transfer-types', views.CaseTransferTypeViewSet, basename='transfer-type')
router.register(r'transfer-statuses', views.CaseTransferStatusViewSet, basename='transfer-status')

# Справочник судов РФ
router.register(r'court-directory', views.CourtDirectoryViewSet, basename='court-directory')

# Основные модели (текущий суд)
router.register(r'courts', views.CourtViewSet, basename='court')
router.register(r'departments', views.CourtDepartmentViewSet, basename='department')
router.register(r'employees', views.CourtEmployeeViewSet, basename='employee')

# Передача дел
router.register(r'transfers', views.CaseTransferViewSet, basename='transfer')

# Уведомления
router.register(r'notifications', views.IncomingCaseNotificationViewSet, basename='notification')

# Дела, ожидающие передачи
router.register(r'pending-transfers', views.PendingTransferCaseViewSet, basename='pending-transfer')

# ВКС
router.register(r'vcs', views.VCSRequestViewSet, basename='vcs-request')

# Журнал аудита
router.register(r'audit', views.CourtInteractionAuditLogViewSet, basename='audit-log')

# Регистрация мессенджера
messenger_router = DefaultRouter()
messenger_router.register(r'', views.CourtMessengerRegistrationViewSet, basename='messenger')

urlpatterns = [
    path('', include(router.urls)),
    path('messenger/', include(messenger_router.urls)),
        path('intercourt/receive-transfer/',
         InterCourtReceiveTransferView.as_view(),
         name='intercourt-receive'),
    path('intercourt/ping/',
         InterCourtPingView.as_view(),
         name='intercourt-ping'),
    path('intercourt/send-transfer/<int:transfer_id>/',
         InterCourtSendTransferView.as_view(),
         name='intercourt-send'),
]
