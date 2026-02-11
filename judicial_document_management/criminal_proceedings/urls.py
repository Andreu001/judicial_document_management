from rest_framework import routers
from django.urls import path, include
from .views import (CriminalProceedingsViewSet, DefendantViewSet,
                    CriminalDecisionViewSet, ArchivedCriminalProceedingsViewSet,
                    criminal_options, defendant_options,
                    criminal_decision_options,
                    CriminalRulingViewSet, CriminalCaseMovementViewSet,
                    criminal_case_movement_options, LawyerCriminalViewSet,
                    referring_authorities_list, judges_list,
                    lawyer_criminal_options, SidesCaseInCaseViewSet,
                    PetitionCriminalViewSet, petition_criminal_options)

router = routers.DefaultRouter()

router.register(
    r"archived-criminal-proceedings", ArchivedCriminalProceedingsViewSet,
    basename="archived-criminal-proceedings"
)
router.register(
    r"criminal-proceedings",
    CriminalProceedingsViewSet,
    basename="criminal-proceedings"
)
router.register(
    r"criminal-proceedings/(?P<criminal_proceedings>\d+)/defendants",
    DefendantViewSet, basename="defendants"
)
router.register(
    r"criminal-proceedings/(?P<criminal_proceedings>\d+)/criminal-decisions",
    CriminalDecisionViewSet,
    basename="criminal-decisions"
)
router.register(
    r"criminal-proceedings/(?P<criminal_proceedings>\d+)/criminal-case-movement",
    CriminalCaseMovementViewSet,
    basename="criminal-case-movement"
)
router.register(
    r"criminal-proceedings/(?P<criminal_proceedings>\d+)/lawyers-criminal",
    LawyerCriminalViewSet,
    basename="lawyers-criminal"
)
router.register(
    r"criminal-proceedings/(?P<criminal_proceedings>\d+)/sides-case-in-case",
    SidesCaseInCaseViewSet,
    basename="sides-case-in-case"
)
router.register(
    r"criminal-proceedings/(?P<criminal_proceedings>\d+)/petitions-criminal",
    PetitionCriminalViewSet,
    basename="petitions-criminal"
)

urlpatterns = [
    path("", include(router.urls)),
    path("criminal-options/", criminal_options, name="criminal-options"),
    path("defendant-options/", defendant_options, name="defendant-options"),
    path("criminal-decision-options/", criminal_decision_options, name="criminal-decision-options"),
    path("criminal-case-movement-options/", criminal_case_movement_options, name="criminal-case-movement-options"),
    path("lawyer-criminal-options/", lawyer_criminal_options, name="lawyer-criminal-options"),
    path("referring-authorities/", referring_authorities_list, name="referring-authorities"),
    path("petition-criminal-options/", petition_criminal_options, name="petition-criminal-options"),
    path("judges/", judges_list, name="judges"),
    path("criminal-proceedings/<int:proceeding_id>/archive/", 
         CriminalProceedingsViewSet.as_view({'post': 'archive'}), 
         name="criminal-proceedings-archive"),
    path("criminal-proceedings/<int:proceeding_id>/unarchive/",
         CriminalProceedingsViewSet.as_view({'post': 'unarchive'}),
         name="criminal-proceedings-unarchive"),
    path("criminal-proceedings/<int:proceeding_id>/all-sides/", 
         CriminalProceedingsViewSet.all_sides, 
         name="all-sides"),
]
