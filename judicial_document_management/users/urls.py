# urls.py

from django.urls import path
from . import views

urlpatterns = [
    # ... другие URL-адреса вашего приложения ...
    path('auth/login/', views.login_view, name='login'),
    # ... другие маршруты ...
]
