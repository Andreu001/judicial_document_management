from django.urls import path
from .views import (
    CaseSearchView, 
    UpdateCaseStatusView,
    BulkUpdateCaseStatusesView,
    PersonDetailView
)

urlpatterns = [
    path('search/', CaseSearchView.as_view(), name='case-search'),
    path('update-status/', UpdateCaseStatusView.as_view(), name='update-case-status'),
    path('bulk-update-status/', BulkUpdateCaseStatusesView.as_view(), name='bulk-update-status'),
        path('person/<int:person_id>/', PersonDetailView.as_view(), name='person-detail'),
]