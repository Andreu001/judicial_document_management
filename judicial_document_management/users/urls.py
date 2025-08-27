from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='users')

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
] + router.urls