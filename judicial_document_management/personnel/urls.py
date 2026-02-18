from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JudgeListView, AbsenceTypeViewSet, AbsenceRecordViewSet

router = DefaultRouter()
router.register(r'absence-types', AbsenceTypeViewSet)
router.register(r'absence-records', AbsenceRecordViewSet)

urlpatterns = [
    path('judges/', JudgeListView.as_view(), name='judge-list'),
    path('', include(router.urls)),
]
