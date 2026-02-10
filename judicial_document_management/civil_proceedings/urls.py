# civil_proceedings/urls.py
from rest_framework import routers
from django.urls import path, include
from .views import (
    CivilProceedingsViewSet, 
    CivilDecisionViewSet,
    CivilSideViewSet,
    CivilProcedureActionViewSet,
    civil_proceedings_options,
    civil_decision_options
)

router = routers.DefaultRouter()

router.register(
    r"civil-proceedings",
    CivilProceedingsViewSet,
    basename="civil-proceedings"
)
router.register(
    r"civil-decisions",
    CivilDecisionViewSet,
    basename="civil-decisions"
)
router.register(
    r"civil-sides",
    CivilSideViewSet,
    basename="civil-sides"
)
router.register(
    r"civil-procedure-actions",
    CivilProcedureActionViewSet,
    basename="civil-procedure-actions"
)

"""
router.register(
    r"businesscard/(?P<businesscard_id>\d+)/civil",
    CivilProceedingsViewSet,
    basename="civil"
)

# Endpoints для связанных моделей
router.register(
    r"businesscard/(?P<businesscard_id>\d+)/civil-decisions",
    CivilDecisionViewSet,
    basename="civil-decisions"
)

router.register(
    r"businesscard/(?P<businesscard_id>\d+)/civil-sides",
    CivilSideViewSet,
    basename="civil-sides"
)

router.register(
    r"businesscard/(?P<businesscard_id>\d+)/civil-procedure-actions",
    CivilProcedureActionViewSet,
    basename="civil-procedure-actions"
)
"""
urlpatterns = [
    path("", include(router.urls)),
    # Endpoints для получения опций
    path("civil-options/", civil_proceedings_options, name="civil-options"),
    path("civil-decision-options/", 
         civil_decision_options, 
         name="civil-decision-options"),
]