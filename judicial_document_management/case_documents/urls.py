# case_documents/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.DocumentTemplateViewSet, basename='document-template')
router.register(r'documents', views.DocumentViewSet, basename='case-documents')

urlpatterns = [
    path('', include(router.urls)),
]
