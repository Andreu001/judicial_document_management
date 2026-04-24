from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    # path('', include('djoser.urls')),
    path('admin/', admin.site.urls),
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
    path('citizen/', include('citizen_access.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Добавьте для обслуживания медиа-файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)