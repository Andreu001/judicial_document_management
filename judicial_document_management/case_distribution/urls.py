# case_distribution/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'settings', views.DistributionSettingsViewSet, basename='distribution-settings')
router.register(r'specializations', views.JudgeSpecializationViewSet, basename='judge-specializations')
router.register(r'departments', views.DepartmentDistributionViewSet, basename='departments')
router.register(r'loads', views.JudgeLoadViewSet, basename='judge-loads')
router.register(r'cases', views.CaseDistributionViewSet, basename='case-distribution')
router.register(r'logs', views.DistributionLogViewSet, basename='distribution-logs')
router.register(r'exclusions', views.JudgeExclusionViewSet, basename='judge-exclusions')
router.register(r'sanctions', views.SanctionJudgeViewSet, basename='sanction-judges')
router.register(r'rules', views.DistributionRuleViewSet, basename='distribution-rules')
router.register(r'complexity', views.ComplexitySettingViewSet, basename='complexity-settings')
router.register(r'reassignments', views.ReassignmentLogViewSet, basename='reassignment-logs')

app_name = 'case_distribution'

urlpatterns = [
    path('', include(router.urls)),
]
