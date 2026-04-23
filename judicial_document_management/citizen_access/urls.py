from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('cases', views.CitizenCaseAccessViewSet, basename='citizen-cases')
router.register('petitions', views.CitizenPetitionViewSet, basename='citizen-petitions')
router.register('documents', views.CitizenDocumentUploadViewSet, basename='citizen-documents')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/verify/', views.CitizenVerificationView.as_view(), name='citizen-verify'),
    path('api/profile/', views.CitizenProfileView.as_view(), name='citizen-profile'),
    path('api/petitions/<int:pk>/submit/', views.CitizenPetitionViewSet.as_view({'post': 'submit'}), name='submit-petition'),
]