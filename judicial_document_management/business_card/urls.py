from django.urls import include, path
from rest_framework import routers
from .views import (FamiliarizationCaseViewSet, SidesCaseViewSet,
                    PetitionsViewSet, PetitionsInCaseViewSet,
                    ConsideredCaseViewSet, CategoryViewSet,
                    BusinessCardViewSet, AppealViewSet,
                    BusinessMovementViewSet, SidesCaseInCaseViewSet,
                    ExecutionCaseViewSet, DecisionsViewSet
                    )


app_name = 'business_card'

router = routers.DefaultRouter()

router.register(r'sides', SidesCaseViewSet, basename='sides')
router.register(r'petitions', PetitionsViewSet, basename='petitions')
router.register(r'category', CategoryViewSet, basename='category')
router.register(r'businesscard', BusinessCardViewSet, basename='businesscard')
router.register(r'decisions', DecisionsViewSet, basename='decisions')

router.register(
    r'businesscard/(?P<businesscard_id>\d+)/sidescaseincase',
    SidesCaseInCaseViewSet,
    basename='sidescaseincase'
    )
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/petitionsincase',
    PetitionsInCaseViewSet,
    basename='petitionsincase'
)
router.register(r'businesscard/(?P<businesscard_id>\d+)/familiarization',
    FamiliarizationCaseViewSet,
    basename='familiarization'
    )
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/businessmovement',
    BusinessMovementViewSet,
    basename='businessmovement'
    )
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/considered',
    ConsideredCaseViewSet, basename='considered'
    )
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/appeal',
    AppealViewSet, basename='appeal'
    )
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/executioncase',
    ExecutionCaseViewSet, basename='executioncase'
    )

urlpatterns = [
    path('', include(router.urls)),
]
