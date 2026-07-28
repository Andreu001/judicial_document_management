# audio_transcription/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'transcriptions', views.AudioTranscriptionViewSet, basename='audio-transcription')

urlpatterns = [
    path('', include(router.urls)),
]