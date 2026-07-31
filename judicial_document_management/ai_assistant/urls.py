# ai_assistant/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AIConfigurationViewSet, AISessionViewSet, 
    AIAnalysisViewSet, CitizenAIAssistantViewSet
)

router = DefaultRouter()
router.register('config', AIConfigurationViewSet, basename='ai-config')
router.register('sessions', AISessionViewSet, basename='ai-session')
router.register('analysis', AIAnalysisViewSet, basename='ai-analysis')
router.register('citizen', CitizenAIAssistantViewSet, basename='ai-citizen')

urlpatterns = [
    path('', include(router.urls)),
]