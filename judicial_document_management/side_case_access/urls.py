# side_case_access/urls.py
from django.urls import path
from . import views

urlpatterns = [
     # Авторизация через соцсети
     path('auth/callback/', views.SocialAuthCallbackView.as_view(), name='social_callback'),
     path('auth/callback/yandex/', views.YandexAuthCallbackView.as_view(), name='yandex_callback'),

     # Профиль
     path('profile/', views.UserProfileView.as_view(), name='profile'),

     # Синхронизация
     path('sync/', views.SyncAccessView.as_view(), name='sync'),

     # Список дел
     path('cases/', views.UserCasesView.as_view(), name='cases'),

     # Детали дела
     path('cases/<str:case_type>/<int:case_id>/', views.CaseDetailAccessView.as_view(), name='case_detail'),

     # Ходатайства
     path('petition/', views.CreatePetitionView.as_view(), name='create_petition'),

     # Документы
     path('upload/', views.UploadDocumentView.as_view(), name='upload_document'),

     # Подача искового заявления
     path('civil-claim/', views.SubmitClaimView.as_view(), name='submit_claim'),

     path('user-courts/', views.UserCourtsView.as_view(), name='user-courts'),

     # ========== МАРШРУТЫ ДЛЯ СКАЧИВАНИЯ РЕШЕНИЙ (ИСПРАВЛЕНЫ) ==========
     path('decision/<str:case_type>/<int:case_id>/<int:decision_id>/download/', 
          views.DownloadDecisionView.as_view(), 
          name='download_decision'),

     path('decision/<str:case_type>/<int:case_id>/<int:decision_id>/export-pdf/', 
          views.ExportDecisionPDFView.as_view(), 
          name='export_decision_pdf'),

     path('decision/<str:case_type>/<int:case_id>/<int:decision_id>/export-word/', 
          views.ExportDecisionWordView.as_view(), 
          name='export_decision_word'),

     # PartyDocuments прокси
     path('party-documents/', views.PartyDocumentsProxyView.as_view(), name='party_documents'),
     path('party-documents/<int:doc_id>/', views.PartyDocumentDetailProxyView.as_view(), name='party_document_detail'),
     path('party-documents/<int:doc_id>/review/', views.PartyDocumentReviewProxyView.as_view(), name='party_document_review'),
     path('documents-history/', views.UserDocumentsHistoryView.as_view(), name='documents-history'),
     path('petitions-history/', views.UserPetitionsHistoryView.as_view(), name='petitions-history'),
     path('regions/', views.RegionsListView.as_view(), name='regions'),
     path('courts-by-region/', views.CourtsByRegionView.as_view(), name='courts_by_region'),
]