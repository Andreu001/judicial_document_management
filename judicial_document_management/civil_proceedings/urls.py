from rest_framework import routers
from django.urls import path, include
from .views import (
    CivilProceedingsViewSet, CivilDecisionViewSet, CivilExecutionViewSet,
    CivilSidesCaseInCaseViewSet, CivilLawyerViewSet,
    CivilCaseMovementViewSet, CivilPetitionViewSet,
    ReferringAuthorityCivilViewSet, judges_list,
    civil_decision_options, civil_options
)

router = routers.DefaultRouter()
router.register(r'civil-proceedings', CivilProceedingsViewSet, basename='civil-proceedings')
router.register(r'referring-authorities-civil', ReferringAuthorityCivilViewSet)

# Nested маршруты для связанных моделей
router.register(
    r'civil-proceedings/(?P<civil_proceedings>\d+)/decisions',
    CivilDecisionViewSet, basename='civil-decisions'
)
router.register(
    r'civil-proceedings/(?P<civil_proceedings>\d+)/executions',
    CivilExecutionViewSet, basename='civil-executions'
)
router.register(
    r'civil-proceedings/(?P<civil_proceedings>\d+)/sides',
    CivilSidesCaseInCaseViewSet, basename='civil-sides'
)
router.register(
    r'civil-proceedings/(?P<civil_proceedings>\d+)/lawyers',
    CivilLawyerViewSet, basename='civil-lawyers'
)
router.register(
    r'civil-proceedings/(?P<civil_proceedings>\d+)/movements',
    CivilCaseMovementViewSet, basename='civil-movements'
)
router.register(
    r'civil-proceedings/(?P<civil_proceedings>\d+)/petitions',
    CivilPetitionViewSet, basename='civil-petitions'
)

urlpatterns = [
    path('', include(router.urls)),
    path('judges/', judges_list, name='judges-list'),
    path('civil-decision-options/', civil_decision_options, name='civil-decision-options'),
    path('judges/', judges_list, name='judges-list'),
    path('civil-proceedings/<int:pk>/archive/',
         CivilProceedingsViewSet.as_view({'post': 'archive'}),
         name='civil-proceedings-archive'),
    path('civil-proceedings/<int:pk>/unarchive/',
         CivilProceedingsViewSet.as_view({'post': 'unarchive'}),
         name='civil-proceedings-unarchive'),
    path('civil-options/', civil_options, name='civil-options'),
]
