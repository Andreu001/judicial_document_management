# administrative_code/urls.py
from rest_framework import routers
from django.urls import path, include
from .views import (
    KasProceedingsViewSet, KasDecisionViewSet, KasExecutionViewSet,
    KasSidesCaseInCaseViewSet, KasLawyerViewSet,
    KasCaseMovementViewSet, KasPetitionViewSet,
    ReferringAuthorityKasViewSet, judges_list,
    kas_decision_options, kas_options, kas_all_options
)

router = routers.DefaultRouter()
router.register(r'kas-proceedings', KasProceedingsViewSet, basename='kas-proceedings')
router.register(r'referring-authorities-kas', ReferringAuthorityKasViewSet)

router.register(r'kas-proceedings/(?P<kas_proceedings>\d+)/decisions', KasDecisionViewSet, basename='kas-decisions')
router.register(r'kas-proceedings/(?P<kas_proceedings>\d+)/executions', KasExecutionViewSet, basename='kas-executions')
router.register(r'kas-proceedings/(?P<kas_proceedings>\d+)/sides', KasSidesCaseInCaseViewSet, basename='kas-sides')
router.register(r'kas-proceedings/(?P<kas_proceedings>\d+)/lawyers', KasLawyerViewSet, basename='kas-lawyers')
router.register(r'kas-proceedings/(?P<kas_proceedings>\d+)/movements', KasCaseMovementViewSet, basename='kas-movements')
router.register(r'kas-proceedings/(?P<kas_proceedings>\d+)/petitions', KasPetitionViewSet, basename='kas-petitions')

urlpatterns = [
    path('', include(router.urls)),
    path('judges/', judges_list, name='judges-list'),
    path('kas-decision-options/', kas_decision_options, name='kas-decision-options'),
    path('kas-proceedings/<int:pk>/archive/', KasProceedingsViewSet.as_view({'post': 'archive'}), name='kas-proceedings-archive'),
    path('kas-proceedings/<int:pk>/unarchive/', KasProceedingsViewSet.as_view({'post': 'unarchive'}), name='kas-proceedings-unarchive'),
    path('kas-options/', kas_options, name='kas-options'),
    path('kas-all-options/', kas_all_options, name='kas-all-options'),  # НОВЫЙ ЭНДПОИНТ
]