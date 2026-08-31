from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AIConfigurationViewSet, AISessionViewSet, 
    AIAnalysisViewSet, CitizenAIAssistantViewSet,
    ChatSessionViewSet, ChatFileViewSet, UniversalAIViewSet
)

router = DefaultRouter()
router.register('config', AIConfigurationViewSet, basename='ai-config')
router.register('sessions', AISessionViewSet, basename='ai-session')
router.register('analysis', AIAnalysisViewSet, basename='ai-analysis')
router.register('citizen', CitizenAIAssistantViewSet, basename='ai-citizen')
router.register('chat', ChatSessionViewSet, basename='ai-chat')
router.register('files', ChatFileViewSet, basename='ai-files')
router.register('universal', UniversalAIViewSet, basename='ai-universal')

urlpatterns = [
    path('', include(router.urls)),
]