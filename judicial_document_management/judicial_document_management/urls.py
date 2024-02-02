from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path('', include('djoser.urls')),
    path('admin/', admin.site.urls),
    path('business_card/', include('business_card.urls')),
]
