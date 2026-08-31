from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.DocumentTemplateViewSet, basename='document-template')
router.register(r'documents', views.DocumentViewSet, basename='case-documents')
router.register(r'party-documents', views.PartyDocumentViewSet, basename='party-documents')

urlpatterns = [
    path('', include(router.urls)),
    # ДОБАВЛЯЕМ ПРЯМЫЕ ЭНДПОИНТЫ ДЛЯ СКАЧИВАНИЯ
    path('documents/<int:pk>/download-signed/', views.SignedDocumentDownloadView.as_view(), name='download-signed'),
    path('party-documents/<int:pk>/download/', views.PartyDocumentDownloadView.as_view(), name='party-document-download'),
    path('content-types/', views.get_content_types, name='content-types'),
]