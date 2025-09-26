# notifications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'jurisdiction-checks', views.JurisdictionCheckViewSet, basename='jurisdictioncheck')
router.register(r'deadline-warnings', views.DeadlineWarningViewSet, basename='deadlinewarning')

urlpatterns = [
    path('', include(router.urls)),
]