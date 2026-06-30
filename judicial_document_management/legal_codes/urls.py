from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (CriminalCodeArticleViewSet, CivilCodeArticleViewSet,
    AdministrativeCodeArticleViewSet, KASCodeArticleViewSet
)

router = DefaultRouter()
router.register('articles', CriminalCodeArticleViewSet, basename='criminal-codes')
router.register('civil-articles', CivilCodeArticleViewSet, basename='civil-codes')
router.register('administrative-articles', AdministrativeCodeArticleViewSet, basename='administrative-codes')
router.register('kas-articles', KASCodeArticleViewSet, basename='kas-codes')

urlpatterns = [
    path('', include(router.urls)),
]