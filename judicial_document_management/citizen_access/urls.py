# citizen_access/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('cases', views.CitizenCaseAccessViewSet, basename='citizen-cases')
router.register('petitions', views.CitizenPetitionViewSet, basename='citizen-petitions')
router.register('documents', views.CitizenDocumentUploadViewSet, basename='citizen-documents')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth-complete/', views.auth_complete, name='auth-complete'),
    path('api/logout/', views.citizen_logout, name='citizen-logout'),
    path('api/profile/', views.CitizenProfileView.as_view(), name='citizen-profile'),
    path('api/dashboard-data/', views.citizen_dashboard_data, name='citizen-dashboard-data'),
    path('dashboard/', views.citizen_dashboard_page, name='citizen-dashboard-page'),
    path('oauth-callback/', views.oauth_callback_view, name='oauth-callback'),
    path('api/yandex-info/', views.get_yandex_user_info, name='yandex-info'),
]