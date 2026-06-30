from rest_framework import routers
from django.urls import path, include
from .views import CaseAdvisorViewSet

router = routers.DefaultRouter()

router.register(r'case-advisor', CaseAdvisorViewSet, basename='case-advisor')

urlpatterns = [
    path('', include(router.urls)),
]