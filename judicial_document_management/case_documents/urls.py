# case_documents/urls.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.DocumentTemplateViewSet, basename='document-template')
router.register(r'documents', views.DocumentViewSet, basename='case-documents')
router.register(r'party-documents', views.PartyDocumentViewSet, basename='party-documents')
router.register(r'signed-download', views.SignedCourtDocumentDownloadView, basename='signed-download')

urlpatterns = [
    path('', include(router.urls)),
]