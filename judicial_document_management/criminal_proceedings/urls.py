from rest_framework import routers
from django.urls import path, include
from .views import CriminalProceedingsViewSet, DefendantViewSet, CriminalDecisionViewSet

router = routers.DefaultRouter()
router.register(
    r"businesscard/(?P<businesscard_id>\d+)/criminal",
    CriminalProceedingsViewSet,
    basename="criminal"
)
router.register(
    r"businesscard/(?P<businesscard_id>\d+)/defendants",
    DefendantViewSet,
    basename="defendants"
)
router.register(
    r"businesscard/(?P<businesscard_id>\d+)/criminal-decisions",
    CriminalDecisionViewSet,
    basename="criminal-decisions"
)

urlpatterns = [
    path("", include(router.urls)),
]
