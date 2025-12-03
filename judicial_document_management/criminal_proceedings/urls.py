from rest_framework import routers
from django.urls import path, include
from .views import (CriminalProceedingsViewSet, DefendantViewSet, CriminalDecisionViewSet,
                    criminal_options, defendant_options, criminal_decision_options,
                    CriminalRulingViewSet, CriminalCaseMovementViewSet, criminal_case_movement_options)

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
router.register(
    r"businesscard/(?P<businesscard_id>\d+)/criminal-case-movement",
    CriminalCaseMovementViewSet,
    basename="criminal-case-movement"
)

urlpatterns = [
    path("", include(router.urls)),
    path("criminal-options/", criminal_options, name="criminal-options"),
    path("defendant-options/", defendant_options, name="defendant-options"),
    path("criminal-decision-options/", criminal_decision_options, name="criminal-decision-options"),
    path("criminal-case-movement-options/", criminal_case_movement_options, name="criminal-case-movement-options"),
]
