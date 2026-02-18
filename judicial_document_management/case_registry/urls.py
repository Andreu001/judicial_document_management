from django.urls import path, include, re_path
from rest_framework import routers
from . import views
from .views import CorrespondenceViewSet

router = routers.DefaultRouter()
router.register(r'indexes', views.RegistryIndexViewSet)
router.register(r'cases', views.RegisteredCaseViewSet)
router.register(r'correspondence',
                CorrespondenceViewSet,
                basename='correspondence')

urlpatterns = [
     path('', include(router.urls)),
     path('adjust-numbering/', views.adjust_numbering, name='adjust-numbering'),
     re_path(r'^next-number/(?P<index_code>.+)/$', views.get_next_number, name='get-next-number'),
     path('correspondence/statistics/',
          views.CorrespondenceViewSet.as_view({'get': 'statistics'}),
          name='correspondence-statistics'),
]
