from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from .admin_config_1 import admin_site



urlpatterns = [
    path('admin/', admin.site.urls), # Измените admin_site.urls на admin.site.urls или наоборот
    path('business_card/', include('business_card.urls')),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),
    path('auth/', include('social_django.urls', namespace='social')),
    path('api/', include('users.urls')),
    path('criminal_proceedings/', include('criminal_proceedings.urls')),
    path('notifications/', include('notifications.urls')),
    path('case-registry/', include('case_registry.urls')),
    path('civil_proceedings/', include('civil_proceedings.urls')),
    path('personnel/', include('personnel.urls')),
    path('administrative_code/', include('administrative_code.urls')),
    path('administrative_proceedings/', include('administrative_proceedings.urls')),
    path('legal-documents/', include('legal_documents.urls')),
    path('search/', include('search.urls')),
    path('case-documents/', include('case_documents.urls')),
    path('other-materials/', include('other_materials.urls')),
    path('case-management/', include('case_management.urls')),
    path('statistics/', include('statistics_app.urls')),
    path('side_case/', include('side_case_access.urls')),
    path('judge-assistant/', include('judge_assistant.urls')),
    path('legal-codes/', include('legal_codes.urls')),
    path('api/court-registry/', include('court_registry.urls')),
    path('api/communication/', include('communication.urls')),
    path('case-distribution/', include('case_distribution.urls')),
    path('audio-transcription/', include('audio_transcription.urls')),
]

# Обслуживание статических файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)