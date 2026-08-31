from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid
from django.utils import timezone
import requests
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser

from .models import ExternalUser, CaseAccessGrant, SyncLog
from .serializers import (
    ExternalUserSerializer, CaseAccessGrantSerializer,
    CaseInfoSerializer, PetitionInputSerializer, DocumentUploadSerializer
)
from .services import CaseAccessSyncService

from case_documents.models import PartyDocument
from side_case_access.serializers import PetitionHistorySerializer
from case_documents.serializers import PartyDocumentHistoryListSerializer


class SocialAuthCallbackView(APIView):
    """Обработка callback от соцсетей (Yandex/VK)"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        provider = request.data.get('provider')
        social_id = request.data.get('social_id')
        email = request.data.get('email', '').lower()  # Приводим к нижнему регистру
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        full_name = request.data.get('full_name', f"{first_name} {last_name}".strip())
        birth_date = request.data.get('birth_date')
        
        print(f"=== SocialAuthCallbackView ===")
        print(f"Provider: {provider}, Social ID: {social_id}")
        print(f"Email: {email}, Full name: {full_name}")
        
        if not provider or not social_id:
            return Response({'error': 'Missing provider or social_id'}, status=400)
        
        # Находим или создаем внешнего пользователя
        user, created = ExternalUser.objects.get_or_create(
            social_id=social_id,
            social_provider=provider,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'full_name': full_name or f"{first_name} {last_name}".strip(),
                'birth_date': birth_date,
            }
        )
        
        if not created:
            user.last_login = timezone.now()
            if email and not user.email:
                user.email = email
            # Обновляем имя, если изменилось
            if full_name and user.full_name != full_name:
                user.full_name = full_name
            user.save()
        
        # Генерируем токен
        auth_token = user.generate_auth_token()
        
        # СИНХРОНИЗИРУЕМ ДОСТУПЫ (ВАЖНО!)
        sync_result = CaseAccessSyncService.sync_user_access(user, triggered_by='user')
        
        print(f"User {user.id} synced: cases_found={sync_result.get('cases_found', 0)}, added={sync_result.get('cases_added', 0)}")
        
        return Response({
            'token': auth_token,
            'user': ExternalUserSerializer(user).data,
            'sync_result': sync_result,
        })


class UserProfileView(APIView):
    """Получение профиля текущего пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # request.user - это ExternalUser (см. настройки аутентификации ниже)
        user = request.user
        return Response(ExternalUserSerializer(user).data)
    
    def patch(self, request):
        user = request.user
        # Обновление паспортных данных для более точной синхронизации
        if 'passport_series' in request.data:
            user.passport_series = request.data['passport_series']
        if 'passport_number' in request.data:
            user.passport_number = request.data['passport_number']
        if 'phone' in request.data:
            user.phone = request.data['phone']
        user.save()
        return Response(ExternalUserSerializer(user).data)


class UserCasesView(APIView):
    """Список дел, доступных пользователю"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        grants = CaseAccessGrant.objects.filter(
            external_user=request.user,
            is_active=True
        ).select_related('content_type')
        
        # Группируем по типу дела
        cases_by_type = {}
        for grant in grants:
            case_info = grant.get_case_display()
            case_type = case_info['type']
            if case_type not in cases_by_type:
                cases_by_type[case_type] = []
            cases_by_type[case_type].append({
                'grant_id': grant.id,
                'case_number': case_info['number'],
                'case_id': case_info['id'],
                'status': case_info['status'],
                'access_level': grant.access_level,
                'side_name': grant.side_name,
                'granted_at': grant.granted_at,
            })
        
        return Response(cases_by_type)


class CaseDetailAccessView(APIView):
    """Детальный просмотр дела (только если есть доступ)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, case_type, case_id):
        # Проверяем доступ
        grant = self._check_access(request.user, case_type, case_id)
        if not grant:
            return Response({'error': 'Access denied'}, status=403)
        
        # Получаем дело
        case = grant.case
        if not case:
            return Response({'error': 'Case not found'}, status=404)
        
        # Возвращаем данные дела в зависимости от типа
        case_data = self._serialize_case(case, case_type)
        
        return Response({
            'case_info': grant.get_case_display(),
            'case_data': case_data,
            'access_level': grant.access_level,
            'side_name': grant.side_name,
        })
    
    def _check_access(self, user, case_type, case_id):
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return None
        
        app_label, model_name = type_mapping[case_type]
        ct = ContentType.objects.get(app_label=app_label, model=model_name)
        
        try:
            return CaseAccessGrant.objects.get(
                external_user=user,
                content_type=ct,
                object_id=case_id,
                is_active=True
            )
        except CaseAccessGrant.DoesNotExist:
            return None
    
    def _serialize_case(self, case, case_type):
        """Сериализует дело в зависимости от типа"""
        if case_type == 'criminal':
            return {
                'case_number': case.case_number_criminal,
                'status': case.status,
                'incoming_date': case.incoming_date,
                'judge': str(case.presiding_judge) if case.presiding_judge else None,
                'case_result': case.case_result,
                'sentence_date': case.sentence_date,
                'sentence_effective_date': case.sentence_effective_date,
                'special_notes': case.special_notes,
            }
        elif case_type == 'civil':
            return {
                'case_number': case.case_number_civil,
                'status': case.status,
                'incoming_date': case.incoming_date,
                'judge': str(case.presiding_judge) if case.presiding_judge else None,
                'hearing_date': case.hearing_date,
                'special_notes': case.special_notes,
            }
        elif case_type == 'kas':
            return {
                'case_number': case.case_number_kas,
                'status': case.status,
                'incoming_date': case.incoming_date,
                'judge': str(case.presiding_judge) if case.presiding_judge else None,
                'hearing_date': case.hearing_date,
                'special_notes': case.special_notes,
            }
        elif case_type == 'administrative':
            return {
                'case_number': case.case_number_admin,
                'status': case.status,
                'incoming_date': case.incoming_date,
                'judge': str(case.presiding_judge) if case.presiding_judge else None,
                'article_number': case.article_number,
                'hearing_date': case.hearing_date,
                'special_notes': case.special_notes,
            }
        return {}


class SyncAccessView(APIView):
    """Ручная синхронизация доступа"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        result = CaseAccessSyncService.sync_user_access(request.user, triggered_by='user')
        return Response(result)


class CreatePetitionView(APIView):
    """Подача ходатайства по делу"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PetitionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        data = serializer.validated_data
        case_type = data['case_type']
        case_id = data['case_id']
        
        # Проверяем доступ
        grant = self._check_access(request.user, case_type, case_id)
        if not grant:
            return Response({'error': 'Access denied'}, status=403)
        
        if grant.access_level not in ['petition', 'full']:
            return Response({'error': 'You do not have permission to submit petitions'}, status=403)
        
        # Создаем ходатайство в соответствующем приложении
        petition_result = self._create_petition(grant.case, case_type, data, request.user)
        
        return Response(petition_result)
    
    def _check_access(self, user, case_type, case_id):
        # Аналогично CaseDetailAccessView._check_access
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return None
        
        app_label, model_name = type_mapping[case_type]
        ct = ContentType.objects.get(app_label=app_label, model=model_name)
        
        try:
            return CaseAccessGrant.objects.get(
                external_user=user,
                content_type=ct,
                object_id=case_id,
                is_active=True
            )
        except CaseAccessGrant.DoesNotExist:
            return None


    def _create_petition(self, case, case_type, data, user):
        """Создает ходатайство в зависимости от типа дела"""
        from django.utils import timezone
        from business_card.models import PetitionsInCase, Decisions
        
        # Формируем petitioner_info
        petitioner_info = {
            'name': data.get('petitioner_info', user.full_name or user.email or 'Участник процесса'),
            'source': 'side_user',
            'user_email': user.email,
            'user_id': user.id,
            'user_full_name': user.full_name,
        }
        
        # Если есть side_name из grant, добавляем его
        if hasattr(self, '_current_side_name') and self._current_side_name:
            petitioner_info['side_name'] = self._current_side_name
        
        # Создаем запись в PetitionsInCase
        petitions_incase = PetitionsInCase.objects.create(
            date_application=timezone.now().date(),
            notation=data.get('petition_text', ''),
            petitioner_info=petitioner_info,
        )
        
        # Добавляем типы ходатайств если есть
        if data.get('petition_type_id'):
            try:
                from business_card.models import Petitions
                petition_type = Petitions.objects.get(id=data['petition_type_id'])
                petitions_incase.petitions_name.add(petition_type)
            except Exception as e:
                logger.warning(f"Не удалось добавить тип ходатайства: {e}")
        
        # Создаем ходатайство в зависимости от типа дела
        if case_type == 'criminal':
            from criminal_proceedings.models import PetitionCriminal, Defendant
            
            defendant = Defendant.objects.filter(
                criminal_proceedings=case,
                full_name_criminal__icontains=user.full_name
            ).first()
            
            petition = PetitionCriminal.objects.create(
                criminal_proceedings=case,
                petitions_incase=petitions_incase,
                petitioner_type='criminal_defendant',
                petitioner_id=defendant.id if defendant else None,
            )
            return {'id': petition.id, 'message': 'Ходатайство подано', 'case_type': 'criminal'}
        
        elif case_type == 'civil':
            from civil_proceedings.models import CivilPetition, CivilSidesCaseInCase
            
            side = CivilSidesCaseInCase.objects.filter(
                civil_proceedings=case,
                sides_case_incase__name__icontains=user.full_name
            ).first()
            
            petition = CivilPetition.objects.create(
                civil_proceedings=case,
                petitions_incase=petitions_incase,
                petitioner_type='civil_sides',
                petitioner_id=side.id if side else None,
            )
            return {'id': petition.id, 'message': 'Ходатайство подано', 'case_type': 'civil'}
        
        elif case_type == 'kas':
            from administrative_proceedings.models import KasPetition, KasSidesCaseInCase
            
            side = KasSidesCaseInCase.objects.filter(
                kas_proceedings=case,
                sides_case_incase__name__icontains=user.full_name
            ).first()
            
            petition = KasPetition.objects.create(
                kas_proceedings=case,
                petitions_incase=petitions_incase,
                petitioner_type='kas_sides',
                petitioner_id=side.id if side else None,
            )
            return {'id': petition.id, 'message': 'Ходатайство подано', 'case_type': 'kas'}
        
        elif case_type == 'administrative':
            from administrative_code.models import AdministrativePetition, AdministrativeSidesCaseInCase
            
            side = AdministrativeSidesCaseInCase.objects.filter(
                administrative_proceedings=case,
                sides_case_incase__name__icontains=user.full_name
            ).first()
            
            petition = AdministrativePetition.objects.create(
                administrative_proceedings=case,
                petitions_incase=petitions_incase,
                petitioner_type='admin_sides',
                petitioner_id=side.id if side else None,
            )
            return {'id': petition.id, 'message': 'Ходатайство подано', 'case_type': 'administrative'}
        
        return {'message': 'Ходатайство подано', 'case_type': case_type}


class UploadDocumentView(APIView):
    """Досылка документов по делу"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        data = serializer.validated_data
        case_type = data['case_type']
        case_id = data['case_id']
        
        # Проверяем доступ
        grant = self._check_access(request.user, case_type, case_id)
        if not grant:
            return Response({'error': 'Access denied'}, status=403)
        
        if grant.access_level not in ['document', 'full']:
            return Response({'error': 'You do not have permission to upload documents'}, status=403)
        
        # Сохраняем файл
        file = data['document_file']
        filename = f"side_docs/{uuid.uuid4()}_{file.name}"
        saved_path = default_storage.save(filename, ContentFile(file.read()))
        
        # Создаем запись документа (используем CaseDocument из legal_documents или отдельную модель)
        # Здесь можно использовать существующую модель CaseDocument
        from legal_documents.models import CaseDocument
        
        doc = CaseDocument.objects.create(
            title=data['document_title'],
            content=data.get('description', ''),
            generated_file=saved_path,
            status='draft',
            case_content_type=ContentType.objects.get_for_model(grant.case),
            case_object_id=grant.case.id,
            created_by_email=request.user.email,
            created_by_name=request.user.full_name,
        )
        
        return Response({
            'message': 'Документ загружен',
            'document_id': doc.id,
            'filename': file.name,
        })
    
    def _check_access(self, user, case_type, case_id):
        # Аналогично предыдущим методам
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return None
        
        app_label, model_name = type_mapping[case_type]
        ct = ContentType.objects.get(app_label=app_label, model=model_name)
        
        try:
            return CaseAccessGrant.objects.get(
                external_user=user,
                content_type=ct,
                object_id=case_id,
                is_active=True
            )
        except CaseAccessGrant.DoesNotExist:
            return None


class DownloadDecisionView(APIView):
    """Скачивание решения по делу"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, case_type, case_id):
        grant = self._check_access(request.user, case_type, case_id)
        if not grant:
            return Response({'error': 'Access denied'}, status=403)
        
        # Получаем решение/приговор по делу
        file_path = self._get_decision_file(grant.case, case_type)
        
        if not file_path:
            return Response({'error': 'Decision file not found'}, status=404)
        
        from django.http import FileResponse
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=f"decision_{case_id}.pdf")
    
    def _check_access(self, user, case_type, case_id):
        # Аналогично
        ...
    
    def _get_decision_file(self, case, case_type):
        """Возвращает путь к файлу решения"""
        # Реализуйте в зависимости от того, где хранятся решения
        # Например, из CaseDocument с типом 'decision'
        from legal_documents.models import CaseDocument
        
        doc = CaseDocument.objects.filter(
            case_content_type=ContentType.objects.get_for_model(case),
            case_object_id=case.id,
            title__icontains='решение'
        ).first()
        
        if doc and doc.generated_file:
            return doc.generated_file.path
        return None


class YandexAuthCallbackView(APIView):
    """Обработка callback от Яндекс OAuth"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=400)
        
        # Обмениваем код на токен
        import requests
        
        token_url = 'https://oauth.yandex.ru/token'
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': '7ae23a1626884d3e8fb7399c3f1dc630',
            'client_secret': 'e70c4567a8db4a53945610e0873688c4',
        }
        
        response = requests.post(token_url, data=data)
        if response.status_code != 200:
            return Response({'error': 'Failed to get token'}, status=400)
        
        token_data = response.json()
        access_token = token_data.get('access_token')
        
        # Получаем информацию о пользователе
        user_info_response = requests.get(
            'https://login.yandex.ru/info?format=json',
            headers={'Authorization': f'OAuth {access_token}'}
        )
        user_info = user_info_response.json()
        
        # Создаем или находим пользователя
        user, created = ExternalUser.objects.get_or_create(
            social_id=str(user_info.get('id')),
            social_provider='yandex',
            defaults={
                'email': user_info.get('default_email', '').lower(),
                'first_name': user_info.get('first_name', ''),
                'last_name': user_info.get('last_name', ''),
                'full_name': f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
                'birth_date': user_info.get('birthday'),
            }
        )
        
        if not created:
            user.last_login = timezone.now()
            user.save()
        
        # Генерируем токен
        auth_token = user.generate_auth_token()
        
        # Синхронизируем доступы
        sync_result = CaseAccessSyncService.sync_user_access(user, triggered_by='user')
        
        return Response({
            'token': auth_token,
            'user': ExternalUserSerializer(user).data,
            'sync_result': sync_result,
        })


class PartyDocumentsProxyView(APIView):
    """
    Прокси для работы с документами сторон через case_documents приложение.
    Позволяет внешним пользователям работать с документами через единый API.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """Получить список документов сторон по делу"""
        case_type = request.query_params.get('case_type')
        case_id = request.query_params.get('case_id')
        
        # Формируем URL к internal API
        internal_url = f"{settings.INTERNAL_API_URL}/case_documents/party-documents/"
        
        params = {}
        if case_type and case_id:
            params['case_type'] = case_type
            params['case_id'] = case_id
        
        # Добавляем токен для internal API
        headers = {'Authorization': f'Bearer {request.auth}' if hasattr(request, 'auth') else ''}
        
        try:
            response = requests.get(internal_url, params=params, headers=headers)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def post(self, request):
        """Создать новый документ стороны"""
        internal_url = f"{settings.INTERNAL_API_URL}/case_documents/party-documents/"
        
        # Передаём файлы и данные
        files = {}
        if 'document_file' in request.FILES:
            files['document_file'] = request.FILES['document_file']
        
        data = {
            'content_type': request.data.get('content_type'),
            'object_id': request.data.get('object_id'),
            'document_type': request.data.get('document_type'),
            'title': request.data.get('title'),
            'description': request.data.get('description', ''),
            'submitter_name': request.data.get('submitter_name', request.user.full_name),
            'submitter_role': request.data.get('submitter_role', ''),
            'submission_method': request.data.get('submission_method', 'online'),
        }
        
        headers = {'Authorization': f'Bearer {request.auth}' if hasattr(request, 'auth') else ''}
        
        try:
            response = requests.post(internal_url, data=data, files=files, headers=headers)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PartyDocumentDetailProxyView(APIView):
    """Прокси для работы с конкретным документом стороны"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, doc_id):
        internal_url = f"{settings.INTERNAL_API_URL}/case_documents/party-documents/{doc_id}/"
        headers = {'Authorization': f'Bearer {request.auth}' if hasattr(request, 'auth') else ''}
        
        try:
            response = requests.get(internal_url, headers=headers)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def delete(self, request, doc_id):
        internal_url = f"{settings.INTERNAL_API_URL}/case_documents/party-documents/{doc_id}/"
        headers = {'Authorization': f'Bearer {request.auth}' if hasattr(request, 'auth') else ''}
        
        try:
            response = requests.delete(internal_url, headers=headers)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PartyDocumentReviewProxyView(APIView):
    """Прокси для принятия решения по документу стороны (только для сотрудников)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, doc_id):
        internal_url = f"{settings.INTERNAL_API_URL}/case_documents/party-documents/{doc_id}/review/"
        headers = {'Authorization': f'Bearer {request.auth}' if hasattr(request, 'auth') else ''}
        
        data = {
            'action': request.data.get('action'),
            'decision_text': request.data.get('decision_text', ''),
            'registration_number': request.data.get('registration_number', ''),
        }
        
        try:
            response = requests.post(internal_url, json=data, headers=headers)
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# side_case_access/views.py - исправленные методы для получения решения

class ExportDecisionPDFView(APIView):
    """Экспорт решения в PDF"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, case_type, case_id, decision_id):
        # Проверяем доступ
        grant = self._check_access(request.user, case_type, case_id)
        if not grant:
            return Response({'error': 'Access denied'}, status=403)
        
        # Получаем решение
        decision, case = self._get_decision(case_type, case_id, decision_id)
        if not decision:
            return Response({'error': 'Decision not found'}, status=404)
        
        # Генерируем PDF
        return self._generate_pdf(decision, case, case_type)
    
    def _check_access(self, user, case_type, case_id):
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return None
        
        app_label, model_name = type_mapping[case_type]
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            return CaseAccessGrant.objects.get(
                external_user=user,
                content_type=ct,
                object_id=case_id,
                is_active=True
            )
        except (ContentType.DoesNotExist, CaseAccessGrant.DoesNotExist):
            return None
    
    def _get_decision(self, case_type, case_id, decision_id):
        """Получает решение в зависимости от типа дела - ИСПРАВЛЕНО с правильными полями"""
        try:
            if case_type == 'criminal':
                from criminal_proceedings.models import CriminalProceedings, DecisionCriminal
                case = CriminalProceedings.objects.get(id=case_id)
                decision = DecisionCriminal.objects.get(id=decision_id, criminal_proceedings=case)
                return decision, case
                    
            elif case_type == 'civil':
                from civil_proceedings.models import CivilProceedings, Decisions
                case = CivilProceedings.objects.get(id=case_id)
                decision = Decisions.objects.get(id=decision_id, civil_proceedings=case)
                return decision, case
                    
            elif case_type == 'kas':
                from administrative_proceedings.models import KasProceedings, KasDecision
                case = KasProceedings.objects.get(id=case_id)
                decision = KasDecision.objects.get(id=decision_id, kas_proceedings=case)
                return decision, case
                    
            elif case_type == 'administrative':
                from administrative_code.models import AdministrativeProceedings, DecisionAdmin
                case = AdministrativeProceedings.objects.get(id=case_id)
                decision = DecisionAdmin.objects.get(id=decision_id, administrative_proceedings=case)
                return decision, case
            
        except Exception as e:
            print(f"Error getting decision: {e}")
            return None, None
        
        return None, None
    
    def _get_decision_data(self, decision, case_type):
        """Безопасно получает данные из решения"""
        data = {
            'decision_date': None,
            'outcome': None,
            'effective_date': None,
            'fine_amount': 0,
            'notation': '',
            'case_result': None,
        }
        
        # Пытаемся получить дату решения
        if hasattr(decision, 'decision_date'):
            data['decision_date'] = decision.decision_date
        elif hasattr(decision, 'court_consideration_date'):
            data['decision_date'] = decision.court_consideration_date
        elif hasattr(decision, 'created_at'):
            data['decision_date'] = decision.created_at
        
        # Пытаемся получить результат
        if hasattr(decision, 'outcome'):
            data['outcome'] = decision.outcome
        elif hasattr(decision, 'case_result'):
            data['outcome'] = decision.case_result
        elif hasattr(decision, 'result'):
            data['outcome'] = decision.result
        
        # Дата вступления в силу
        if hasattr(decision, 'decision_effective_date'):
            data['effective_date'] = decision.decision_effective_date
        
        # Штраф
        if hasattr(decision, 'fine_amount'):
            data['fine_amount'] = decision.fine_amount or 0
        
        # Текст решения/приговора - проверяем разные возможные имена полей
        if hasattr(decision, 'notation'):
            data['notation'] = decision.notation or ''
        elif hasattr(decision, 'content'):
            data['notation'] = decision.content or ''
        elif hasattr(decision, 'text'):
            data['notation'] = decision.text or ''
        elif hasattr(decision, 'description'):
            data['notation'] = decision.description or ''
        elif hasattr(decision, 'sentence_text'):
            data['notation'] = decision.sentence_text or ''
        elif hasattr(decision, 'decision_text'):
            data['notation'] = decision.decision_text or ''
        
        # Дополнительно
        if hasattr(decision, 'case_result') and not data['outcome']:
            data['outcome'] = decision.case_result
        
        return data
    
    def _generate_pdf(self, decision, case, case_type):
        """Генерирует PDF из решения"""
        try:
            from weasyprint import HTML
            from django.http import FileResponse
            import tempfile
            import os
            import atexit
            
            # Получаем номер дела
            case_number = ''
            if case_type == 'criminal':
                case_number = getattr(case, 'case_number_criminal', '')
            elif case_type == 'civil':
                case_number = getattr(case, 'case_number_civil', '')
            elif case_type == 'kas':
                case_number = getattr(case, 'case_number_kas', '')
            elif case_type == 'administrative':
                case_number = getattr(case, 'case_number_admin', '')
            
            # Получаем данные решения
            decision_data = self._get_decision_data(decision, case_type)
            
            # Форматируем дату
            decision_date_str = ''
            if decision_data['decision_date']:
                if hasattr(decision_data['decision_date'], 'strftime'):
                    decision_date_str = decision_data['decision_date'].strftime('%d.%m.%Y')
                else:
                    decision_date_str = str(decision_data['decision_date'])
            
            effective_date_str = ''
            if decision_data['effective_date']:
                if hasattr(decision_data['effective_date'], 'strftime'):
                    effective_date_str = decision_data['effective_date'].strftime('%d.%m.%Y')
                else:
                    effective_date_str = str(decision_data['effective_date'])
            
            # Получаем текст решения
            decision_text = decision_data['notation'] or 'Решение вынесено судом.'
            
            # Экранируем спецсимволы для HTML
            decision_text = decision_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            decision_text = decision_text.replace('\n', '<br>')
            
            # Простой HTML шаблон для PDF
            html_content = f"""<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Решение по делу №{case_number}</title>
                <style>
                    body {{ 
                        font-family: 'Times New Roman', Times, serif; 
                        margin: 2cm;
                        font-size: 14pt;
                        line-height: 1.5;
                    }}
                    h1 {{ 
                        text-align: center;
                        font-size: 18pt;
                        margin-bottom: 24pt;
                    }}
                    .meta-info {{
                        margin-bottom: 24pt;
                        padding: 12pt;
                        background: #f5f5f5;
                        border-radius: 4pt;
                    }}
                    .decision-content {{
                        margin-top: 20pt;
                    }}
                    .signature {{
                        margin-top: 48pt;
                        padding-top: 24pt;
                        border-top: 1px solid #000;
                    }}
                    @page {{
                        size: A4;
                        margin: 2cm;
                    }}
                </style>
            </head>
            <body>
                <div class="meta-info">
                    <p><strong>Дело №:</strong> {case_number}</p>
                    <p><strong>Тип дела:</strong> {
                        'Уголовное' if case_type == 'criminal' else
                        'Гражданское' if case_type == 'civil' else
                        'Административное (КАС)' if case_type == 'kas' else
                        'Административное (КоАП)'
                    }</p>
                    <p><strong>Дата решения:</strong> {decision_date_str or '—'}</p>
                    <p><strong>Результат:</strong> {decision_data['outcome'] or 'Решение вынесено'}</p>
                    {f'<p><strong>Штраф:</strong> {decision_data["fine_amount"]:,.0f} руб.</p>' if decision_data['fine_amount'] > 0 else ''}
                    {f'<p><strong>Вступило в силу:</strong> {effective_date_str}</p>' if effective_date_str else ''}
                </div>
                
                <h1>Решение по делу №{case_number}</h1>
                
                <div class="decision-content">
                    {decision_text}
                </div>
                
                <div class="signature">
                    <p>Судья: ____________________</p>
                    <p>Дата: {timezone.now().strftime('%d.%m.%Y')}</p>
                </div>
            </body>
            </html>"""
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                HTML(string=html_content).write_pdf(tmp_file.name)
                tmp_path = tmp_file.name
            
            response = FileResponse(
                open(tmp_path, 'rb'),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="Decision_{case_number}_{decision.id}.pdf"'
            
            atexit.register(lambda: os.unlink(tmp_path))
            
            return response
            
        except ImportError as e:
            return Response(
                {'error': f'PDF generation not available: {str(e)}. Please install weasyprint.'},
                status=501
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error generating PDF: {str(e)}'},
                status=500
            )


class ExportDecisionWordView(APIView):
    """Экспорт решения в Word"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, case_type, case_id, decision_id):
        # Проверяем доступ
        grant = self._check_access(request.user, case_type, case_id)
        if not grant:
            return Response({'error': 'Access denied'}, status=403)
        
        # Получаем решение
        decision, case = self._get_decision(case_type, case_id, decision_id)
        if not decision:
            return Response({'error': 'Decision not found'}, status=404)
        
        # Генерируем Word
        return self._generate_word(decision, case, case_type)
    
    def _check_access(self, user, case_type, case_id):
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return None
        
        app_label, model_name = type_mapping[case_type]
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            return CaseAccessGrant.objects.get(
                external_user=user,
                content_type=ct,
                object_id=case_id,
                is_active=True
            )
        except (ContentType.DoesNotExist, CaseAccessGrant.DoesNotExist):
            return None
    
    def _get_decision(self, case_type, case_id, decision_id):
        """Получает решение в зависимости от типа дела"""
        try:
            if case_type == 'criminal':
                from criminal_proceedings.models import CriminalProceedings, DecisionCriminal
                case = CriminalProceedings.objects.get(id=case_id)
                decision = DecisionCriminal.objects.get(id=decision_id, criminal_proceedings=case)
                return decision, case
                    
            elif case_type == 'civil':
                from civil_proceedings.models import CivilProceedings, Decisions
                case = CivilProceedings.objects.get(id=case_id)
                decision = Decisions.objects.get(id=decision_id, civil_proceedings=case)
                return decision, case
                    
            elif case_type == 'kas':
                from administrative_proceedings.models import KasProceedings, KasDecision
                case = KasProceedings.objects.get(id=case_id)
                decision = KasDecision.objects.get(id=decision_id, kas_proceedings=case)
                return decision, case
                    
            elif case_type == 'administrative':
                from administrative_code.models import AdministrativeProceedings, DecisionAdmin
                case = AdministrativeProceedings.objects.get(id=case_id)
                decision = DecisionAdmin.objects.get(id=decision_id, administrative_proceedings=case)
                return decision, case
            
        except Exception as e:
            print(f"Error getting decision: {e}")
            return None, None
        
        return None, None
    
    def _get_decision_data(self, decision, case_type):
        """Безопасно получает данные из решения"""
        data = {
            'decision_date': None,
            'outcome': None,
            'effective_date': None,
            'fine_amount': 0,
            'notation': '',
        }
        
        if hasattr(decision, 'decision_date'):
            data['decision_date'] = decision.decision_date
        elif hasattr(decision, 'court_consideration_date'):
            data['decision_date'] = decision.court_consideration_date
        
        if hasattr(decision, 'outcome'):
            data['outcome'] = decision.outcome
        elif hasattr(decision, 'case_result'):
            data['outcome'] = decision.case_result
        
        if hasattr(decision, 'decision_effective_date'):
            data['effective_date'] = decision.decision_effective_date
        
        if hasattr(decision, 'fine_amount'):
            data['fine_amount'] = decision.fine_amount or 0
        
        # Пробуем разные поля для текста
        if hasattr(decision, 'notation'):
            data['notation'] = decision.notation or ''
        elif hasattr(decision, 'content'):
            data['notation'] = decision.content or ''
        elif hasattr(decision, 'text'):
            data['notation'] = decision.text or ''
        elif hasattr(decision, 'description'):
            data['notation'] = decision.description or ''
        elif hasattr(decision, 'sentence_text'):
            data['notation'] = decision.sentence_text or ''
        
        return data
    
    def _generate_word(self, decision, case, case_type):
        """Генерирует Word документ из решения"""
        try:
            from docx import Document as DocxDocument
            from docx.shared import Pt
            from docx.enum.text import WD_ALIGN_PARAGRAPH
            from django.http import FileResponse
            import tempfile
            import os
            import atexit
            
            # Получаем номер дела
            case_number = ''
            if case_type == 'criminal':
                case_number = getattr(case, 'case_number_criminal', '')
            elif case_type == 'civil':
                case_number = getattr(case, 'case_number_civil', '')
            elif case_type == 'kas':
                case_number = getattr(case, 'case_number_kas', '')
            elif case_type == 'administrative':
                case_number = getattr(case, 'case_number_admin', '')
            
            # Получаем данные решения
            decision_data = self._get_decision_data(decision, case_type)
            
            # Форматируем даты
            decision_date_str = ''
            if decision_data['decision_date']:
                if hasattr(decision_data['decision_date'], 'strftime'):
                    decision_date_str = decision_data['decision_date'].strftime('%d.%m.%Y')
                else:
                    decision_date_str = str(decision_data['decision_date'])
            
            effective_date_str = ''
            if decision_data['effective_date']:
                if hasattr(decision_data['effective_date'], 'strftime'):
                    effective_date_str = decision_data['effective_date'].strftime('%d.%m.%Y')
                else:
                    effective_date_str = str(decision_data['effective_date'])
            
            # Создаем документ
            doc = DocxDocument()
            
            # Настройка стиля
            style = doc.styles['Normal']
            style.font.name = 'Times New Roman'
            style.font.size = Pt(14)
            
            # Заголовок
            title = doc.add_heading(f'Решение по делу №{case_number}', level=1)
            title.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            # Мета-информация
            doc.add_paragraph()
            info_para = doc.add_paragraph()
            
            info_para.add_run(f"Дело №: {case_number}\n").bold = True
            
            type_text = ('Уголовное' if case_type == 'criminal' else
                        'Гражданское' if case_type == 'civil' else
                        'Административное (КАС)' if case_type == 'kas' else
                        'Административное (КоАП)')
            info_para.add_run(f"Тип дела: {type_text}\n")
            
            if decision_date_str:
                info_para.add_run(f"Дата решения: {decision_date_str}\n")
            
            if decision_data['outcome']:
                info_para.add_run(f"Результат: {decision_data['outcome']}\n")
            
            if decision_data['fine_amount'] > 0:
                info_para.add_run(f"Штраф: {decision_data['fine_amount']:,.0f} руб.\n")
            
            if effective_date_str:
                info_para.add_run(f"Вступило в силу: {effective_date_str}\n")
            
            # Основное содержание
            doc.add_paragraph()
            doc.add_heading('Содержание решения', level=2)
            
            notation = decision_data['notation']
            if notation:
                for paragraph in notation.split('\n'):
                    if paragraph.strip():
                        p = doc.add_paragraph(paragraph.strip())
                        p.paragraph_format.line_spacing = 1.5
            
            # Подпись
            doc.add_paragraph()
            signature_para = doc.add_paragraph()
            signature_para.add_run("\n\nСудья: ____________________")
            signature_para.add_run(f"\n\nДата: {timezone.now().strftime('%d.%m.%Y')}")
            
            # Сохраняем
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_file:
                doc.save(tmp_file.name)
                tmp_path = tmp_file.name
            
            response = FileResponse(
                open(tmp_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="Decision_{case_number}_{decision.id}.docx"'
            
            atexit.register(lambda: os.unlink(tmp_path))
            
            return response
            
        except ImportError as e:
            return Response(
                {'error': f'Word generation not available: {str(e)}. Please install python-docx.'},
                status=501
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error generating Word: {str(e)}'},
                status=500
            )


class UserDocumentsHistoryView(generics.ListAPIView):
    """История отправленных документов текущего пользователя"""
    serializer_class = PartyDocumentHistoryListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Предполагаем, что пользователь - ExternalUser
        return PartyDocument.objects.filter(external_user=user, document_file__isnull=False).order_by('-submission_date')


class UserPetitionsHistoryView(generics.ListAPIView):
    """История поданных ходатайств текущего пользователя"""
    serializer_class = PetitionHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Собираем ходатайства из всех производств
        criminal_petitions = PetitionCriminal.objects.filter(external_user=user).order_by('-date_application')
        civil_petitions = CivilPetition.objects.filter(external_user=user).order_by('-date_application')
        # Возвращаем объединенный список
        return list(criminal_petitions) + list(civil_petitions)


class SubmitClaimView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from case_registry.serializers import ClaimSubmissionSerializer
        from .services import CaseCreationService
        
        print("=== Received claim data ===")
        print(request.data)
        
        serializer = ClaimSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            print("=== Validation errors ===")
            print(serializer.errors)
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=400)
        
        data = serializer.validated_data
        
        try:
            civil_case = CaseCreationService.create_civil_case_from_claim(
                claim_data=data,
                external_user=request.user if hasattr(request.user, 'id') else None
            )
            
            return Response({
                'success': True,
                'message': 'Исковое заявление успешно подано',
                'case_id': civil_case.id,
                'case_number': civil_case.case_number_civil,
                'registered_case_number': civil_case.registered_case.full_number if civil_case.registered_case else None,
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


class UserCourtsView(APIView):
    """Список судов, где у пользователя есть дела"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        grants = CaseAccessGrant.objects.filter(
            external_user=request.user,
            is_active=True
        ).select_related('content_type')
        
        courts = set()
        for grant in grants:
            case = grant.case
            if case and hasattr(case, 'presiding_judge') and case.presiding_judge:
                judge = case.presiding_judge
                court_name = getattr(judge, 'court_name', None) or getattr(judge, 'organization', 'Неизвестный суд')
                courts.add(court_name)
        
        return Response(list(courts))


class RegionsListView(APIView):
    """Получить список регионов для выбора в личном кабинете"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from court_registry.models import Region
        
        regions = Region.objects.filter(is_active=True).order_by('name')
        data = [{'id': r.id, 'name': r.name, 'code': r.code} for r in regions]
        return Response(data)


class CourtsByRegionView(APIView):
    """Получить список судов по региону"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        region_id = request.query_params.get('region_id')
        if not region_id:
            return Response({'error': 'Не указан регион'}, status=400)
        
        from court_registry.models import CourtDirectory
        
        courts = CourtDirectory.objects.filter(
            region_id=region_id,
            is_active=True
        ).order_by('name')
        
        data = [{'id': c.id, 'name': c.name, 'code': c.code} for c in courts]
        return Response(data)
