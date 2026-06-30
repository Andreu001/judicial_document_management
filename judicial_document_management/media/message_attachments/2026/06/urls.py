"""
URL-маршруты API коммуникационной платформы.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from communication import views

router = DefaultRouter()
router.register(r'chats', views.ChatViewSet, basename='chat')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'attachments', views.MessageAttachmentViewSet, basename='attachment')
router.register(r'broadcasts', views.BroadcastViewSet, basename='broadcast')
router.register(r'broadcast-recipients', views.BroadcastRecipientViewSet, basename='broadcast-recipient')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'document-exchanges', views.DocumentExchangeViewSet, basename='document-exchange')
router.register(r'routes', views.IntercourtRouteViewSet, basename='intercourt-route')
router.register(r'auto-notifications', views.AutoNotificationRuleViewSet, basename='auto-notification')
router.register(r'analytics', views.MessageAnalyticsViewSet, basename='analytics')
router.register(r'video-conferences', views.VideoConferenceViewSet, basename='video-conference')

urlpatterns = [
    path('', include(router.urls)),
    path('courts/search/', views.CourtDirectorySearchView.as_view(), name='court-search'),
    path('departments/search/', views.DepartmentSearchView.as_view(), name='department-search'),
    path('employees/search/', views.EmployeeSearchView.as_view(), name='employee-search'),
    path('dashboard/', views.MessengerDashboardView.as_view(), name='dashboard'),
]
