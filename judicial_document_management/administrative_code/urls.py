from rest_framework import routers
from django.urls import path, include
from .views import (
    AdministrativeProceedingsViewSet, AdministrativeDecisionViewSet, AdministrativeExecutionViewSet,
    AdministrativeSidesCaseInCaseViewSet, AdministrativeLawyerViewSet,
    AdministrativeCaseMovementViewSet, AdministrativePetitionViewSet,
    ReferringAuthorityAdminViewSet, judges_list,
    admin_decision_options, admin_options
)

router = routers.DefaultRouter()
router.register(r'administrative-proceedings', AdministrativeProceedingsViewSet, basename='administrative-proceedings')
router.register(r'referring-authorities-admin', ReferringAuthorityAdminViewSet)

router.register(
    r'administrative-proceedings/(?P<administrative_proceedings>\d+)/decisions',
    AdministrativeDecisionViewSet, basename='administrative-decisions'
)
router.register(
    r'administrative-proceedings/(?P<administrative_proceedings>\d+)/executions',
    AdministrativeExecutionViewSet, basename='administrative-executions'
)
router.register(
    r'administrative-proceedings/(?P<administrative_proceedings>\d+)/sides',
    AdministrativeSidesCaseInCaseViewSet, basename='administrative-sides'
)
router.register(
    r'administrative-proceedings/(?P<administrative_proceedings>\d+)/lawyers',
    AdministrativeLawyerViewSet, basename='administrative-lawyers'
)
router.register(
    r'administrative-proceedings/(?P<administrative_proceedings>\d+)/movements',
    AdministrativeCaseMovementViewSet, basename='administrative-movements'
)
router.register(
    r'administrative-proceedings/(?P<administrative_proceedings>\d+)/petitions',
    AdministrativePetitionViewSet, basename='administrative-petitions'
)

urlpatterns = [
    path('', include(router.urls)),
    path('judges/', judges_list, name='judges-list'),
    path('admin-decision-options/', admin_decision_options, name='admin-decision-options'),
    path('administrative-proceedings/<int:pk>/archive/',
         AdministrativeProceedingsViewSet.as_view({'post': 'archive'}),
         name='administrative-proceedings-archive'),
    path('administrative-proceedings/<int:pk>/unarchive/',
         AdministrativeProceedingsViewSet.as_view({'post': 'unarchive'}),
         name='administrative-proceedings-unarchive'),
    path('admin-options/', admin_options, name='admin-options'),
]
