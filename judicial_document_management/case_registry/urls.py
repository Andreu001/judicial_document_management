# case_registry/urls.py
from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'indexes', views.RegistryIndexViewSet)
router.register(r'cases', views.RegisteredCaseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('adjust-numbering/', views.adjust_numbering, name='adjust-numbering'),
    path('next-number/<str:index_code>/', views.get_next_number, name='get-next-number'),
]