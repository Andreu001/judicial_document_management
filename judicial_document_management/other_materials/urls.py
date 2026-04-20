from rest_framework import routers
from django.urls import path, include
from .views import (
    OtherMaterialViewSet, OtherMaterialSidesCaseInCaseViewSet,
    OtherMaterialLawyerViewSet, OtherMaterialMovementViewSet,
    OtherMaterialPetitionViewSet, other_material_options,
    responsible_persons_list, OtherMaterialDecisionViewSet,
    OtherMaterialExecutionViewSet
)

router = routers.DefaultRouter()
router.register(r'other-materials', OtherMaterialViewSet, basename='other-materials')

router.register(
    r'other-materials/(?P<other_material>\d+)/sides',
    OtherMaterialSidesCaseInCaseViewSet, basename='other-material-sides'
)
router.register(
    r'other-materials/(?P<other_material>\d+)/lawyers',
    OtherMaterialLawyerViewSet, basename='other-material-lawyers'
)
router.register(
    r'other-materials/(?P<other_material>\d+)/movements',
    OtherMaterialMovementViewSet, basename='other-material-movements'
)
router.register(
    r'other-materials/(?P<other_material>\d+)/petitions',
    OtherMaterialPetitionViewSet, basename='other-material-petitions'
)
router.register(
    r'other-materials/(?P<other_material>\d+)/decisions',
    OtherMaterialDecisionViewSet, basename='other-material-decisions'
)
router.register(
    r'other-materials/(?P<other_material>\d+)/executions',
    OtherMaterialExecutionViewSet, basename='other-material-executions'
)

urlpatterns = [
    path('', include(router.urls)),
    path('other-material-options/', other_material_options, name='other-material-options'),
    path('responsible-persons/', responsible_persons_list, name='responsible-persons-list'),
    path('other-materials/<int:pk>/archive/',
         OtherMaterialViewSet.as_view({'post': 'archive'}),
         name='other-materials-archive'),
    path('other-materials/<int:pk>/unarchive/',
         OtherMaterialViewSet.as_view({'post': 'unarchive'}),
         name='other-materials-unarchive'),
]
