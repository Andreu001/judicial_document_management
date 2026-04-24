# citizen_access/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.middleware.csrf import get_token
from rest_framework.authtoken.models import Token
from django.shortcuts import render

from .models import CitizenCaseAccess, CitizenPetition, CitizenDocumentUpload
from .serializers import (
    CitizenCaseAccessSerializer, CitizenPetitionSerializer, 
    CitizenPetitionCreateSerializer, CitizenDocumentUploadSerializer,
    CitizenDocumentUploadCreateSerializer, CaseDetailSerializer
)
from .permissions import IsCitizen, HasCaseAccess, CanSubmitPetition, CanUploadDocuments


class CitizenCaseAccessViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Список дел, к которым у гражданина есть доступ
    """
    serializer_class = CitizenCaseAccessSerializer
    permission_classes = [permissions.IsAuthenticated, IsCitizen]
    
    def get_queryset(self):
        return CitizenCaseAccess.objects.filter(
            citizen=self.request.user,
            is_active=True
        )
    
    @action(detail=True, methods=['get'])
    def case_detail(self, request, pk=None):
        """Получить детальную информацию по делу"""
        access = get_object_or_404(CitizenCaseAccess, pk=pk, citizen=request.user, is_active=True)
        
        # Определяем тип дела и получаем данные
        case = access.case
        content_type = access.content_type
        
        serializer = CaseDetailSerializer({
            'access': access,
            'case': case,
            'content_type': content_type.model
        })
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download_decision(self, request, pk=None):
        """Скачать решение по делу"""
        access = get_object_or_404(CitizenCaseAccess, pk=pk, citizen=request.user, is_active=True)
        
        # Здесь логика получения файла решения
        case = access.case
        content_type_name = access.content_type.model
        
        # Пример для уголовных дел
        if content_type_name == 'criminalproceedings':
            from criminal_proceedings.models import CriminalDecision
            decision = CriminalDecision.objects.filter(
                criminal_proceedings=case
            ).first()
            # Здесь должна быть логика генерации или получения файла
            
        return Response({'message': 'Функция скачивания решения будет реализована'})


class CitizenPetitionViewSet(viewsets.ModelViewSet):
    """
    Ходатайства гражданина
    """
    permission_classes = [permissions.IsAuthenticated, IsCitizen]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CitizenPetitionCreateSerializer
        return CitizenPetitionSerializer
    
    def get_queryset(self):
        return CitizenPetition.objects.filter(citizen=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Подать ходатайство (отправить в суд)"""
        petition = get_object_or_404(CitizenPetition, pk=pk, citizen=request.user)
        
        if petition.status != 'draft':
            return Response(
                {'error': 'Ходатайство уже подано или рассмотрено'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем права на подачу ходатайств
        if petition.case_access.access_type not in ['petition', 'full']:
            return Response(
                {'error': 'У вас нет прав на подачу ходатайств по этому делу'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        petition.status = 'submitted'
        petition.submitted_at = timezone.now()
        petition.save()
        
        return Response({'message': 'Ходатайство успешно подано'})


class CitizenDocumentUploadViewSet(viewsets.ModelViewSet):
    """
    Документы, загруженные гражданином
    """
    permission_classes = [permissions.IsAuthenticated, IsCitizen]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CitizenDocumentUploadCreateSerializer
        return CitizenDocumentUploadSerializer
    
    def get_queryset(self):
        return CitizenDocumentUpload.objects.filter(citizen=self.request.user)
    
    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        serializer.save(
            citizen=self.request.user,
            file_name=uploaded_file.name if uploaded_file else '',
            file_size=uploaded_file.size if uploaded_file else 0
        )
    
    @action(detail=False, methods=['post'])
    def upload_multiple(self, request):
        """Загрузка нескольких файлов сразу"""
        files = request.FILES.getlist('files')
        case_access_id = request.data.get('case_access_id')
        
        case_access = get_object_or_404(
            CitizenCaseAccess, 
            pk=case_access_id, 
            citizen=request.user
        )
        
        # Проверяем права на досылку документов
        if case_access.access_type not in ['documents', 'full']:
            return Response(
                {'error': 'У вас нет прав на загрузку документов по этому делу'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        created_documents = []
        for file in files:
            doc = CitizenDocumentUpload.objects.create(
                citizen=request.user,
                case_access=case_access,
                title=request.data.get('title', file.name),
                description=request.data.get('description', ''),
                file=file,
                file_name=file.name,
                file_size=file.size
            )
            created_documents.append({
                'id': doc.id,
                'title': doc.title,
                'file_name': doc.file_name
            })
        
        return Response({
            'message': f'Загружено {len(created_documents)} файлов',
            'documents': created_documents
        })


class CitizenProfileView(APIView):
    """Профиль гражданина"""
    permission_classes = [permissions.IsAuthenticated, IsCitizen]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'middle_name': getattr(user, 'middle_name', ''),
            'email': user.email,
            'phone': getattr(user, 'phone', ''),
            'is_verified': getattr(user, 'is_verified', False),
            'verification_date': getattr(user, 'verification_date', None),
            'vk_id': getattr(user, 'vk_id', ''),
            'yandex_id': getattr(user, 'yandex_id', ''),
            'role': getattr(user, 'role', 'citizen'),
            'cases_count': user.case_accesses.filter(is_active=True).count(),
            'petitions_count': user.citizen_petitions.count(),
            'documents_count': user.citizen_documents.count(),
        })
    
    def patch(self, request):
        user = request.user
        allowed_fields = ['first_name', 'last_name', 'middle_name', 'email', 'phone']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        user.save()
        return Response({'message': 'Профиль обновлен'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth_complete(request):
    """
    Завершение OAuth авторизации
    Получает код от Яндекс и обменивает на токен
    """
    from django.contrib.auth import get_user_model
    from social_django.models import UserSocialAuth
    import requests
    
    User = get_user_model()
    
    code = request.data.get('code')
    
    if not code:
        return Response({
            'success': False,
            'error': 'Отсутствует код авторизации'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Обмениваем код на токен доступа
        token_url = 'https://oauth.yandex.ru/token'
        client_id = '7ae23a1626884d3e8fb7399c3f1dc630'
        client_secret = 'e70c4567a8db4a53945610e0873688c4'
        
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
        }
        
        token_response = requests.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            return Response({
                'success': False,
                'error': 'Ошибка получения токена'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token_info = token_response.json()
        access_token = token_info.get('access_token')
        
        # Получаем информацию о пользователе
        user_info_url = 'https://login.yandex.ru/info'
        headers = {'Authorization': f'OAuth {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)
        
        if user_info_response.status_code != 200:
            return Response({
                'success': False,
                'error': 'Ошибка получения информации о пользователе'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = user_info_response.json()
        yandex_id = str(user_info.get('id'))
        email = user_info.get('default_email', '')
        first_name = user_info.get('first_name', '')
        last_name = user_info.get('last_name', '')
        
        # Ищем или создаем пользователя
        social_auth = UserSocialAuth.objects.filter(provider='yandex-oauth2', uid=yandex_id).first()
        
        if social_auth:
            user = social_auth.user
        else:
            # Ищем пользователя по email или создаем нового
            user = User.objects.filter(email=email).first()
            
            if not user:
                username = email.split('@')[0] if email else f'yandex_{yandex_id}'
                # Убеждаемся, что username уникален
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role='citizen'
                )
                user.set_unusable_password()
                user.save()
            
            # Создаем связь с социальным аккаунтом
            UserSocialAuth.objects.create(
                user=user,
                provider='yandex-oauth2',
                uid=yandex_id
            )
        
        # Обновляем данные пользователя
        user.yandex_id = yandex_id
        if first_name and not user.first_name:
            user.first_name = first_name
        if last_name and not user.last_name:
            user.last_name = last_name
        user.save()
        
        # Логиним пользователя
        login(request, user)
        
        # Создаем или получаем токен
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'middle_name': getattr(user, 'middle_name', ''),
                'email': user.email,
                'role': getattr(user, 'role', 'citizen'),
                'is_verified': getattr(user, 'is_verified', False),
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def citizen_logout(request):
    """Выход гражданина из системы"""
    logout(request)
    return Response({'message': 'Выход выполнен успешно'})


@login_required
def citizen_dashboard_data(request):
    """Возвращает данные для дашборда гражданина"""
    from .models import CitizenCaseAccess
    
    user = request.user
    cases = CitizenCaseAccess.objects.filter(citizen=user, is_active=True)
    
    cases_data = []
    for case in cases:
        case_number = str(case.id)
        case_obj = case.case
        
        if hasattr(case_obj, 'case_number_criminal'):
            case_number = case_obj.case_number_criminal
        elif hasattr(case_obj, 'case_number_civil'):
            case_number = case_obj.case_number_civil
        elif hasattr(case_obj, 'case_number_admin'):
            case_number = case_obj.case_number_admin
        elif hasattr(case_obj, 'case_number_kas'):
            case_number = case_obj.case_number_kas
        
        # Получаем статус дела
        case_status = getattr(case_obj, 'status', 'active')
        
        # Получаем ФИО судьи
        judge_name = None
        if hasattr(case_obj, 'presiding_judge') and case_obj.presiding_judge:
            judge_name = case_obj.presiding_judge.get_full_name()
        
        # Получаем дату заседания
        hearing_date = None
        if hasattr(case_obj, 'hearing_date'):
            hearing_date = case_obj.hearing_date
        elif hasattr(case_obj, 'first_hearing_date'):
            hearing_date = case_obj.first_hearing_date
        
        cases_data.append({
            'id': case.id,
            'case_number': case_number,
            'case_type': case.content_type.model,
            'case_status': case_status,
            'access_type': case.access_type,
            'role_in_case': case.role_in_case,
            'judge_name': judge_name,
            'hearing_date': hearing_date,
        })
    
    return JsonResponse({
        'success': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'middle_name': getattr(user, 'middle_name', ''),
            'is_verified': getattr(user, 'is_verified', False),
            'role': getattr(user, 'role', 'citizen'),
        },
        'cases': cases_data,
        'csrf_token': get_token(request),
    })


from django.shortcuts import redirect
from django.urls import reverse

def oauth_callback_view(request):
    """
    View для обработки OAuth callback и редиректа на React
    """
    from rest_framework.authtoken.models import Token
    
    user = request.user
    
    if user.is_authenticated:
        # Создаем или получаем токен
        token, created = Token.objects.get_or_create(user=user)
        
        # Редиректим на React с токеном в URL
        redirect_url = f'http://localhost:3000/citizen/oauth-callback?token={token.key}'
        return redirect(redirect_url)
    else:
        # Если пользователь не авторизован, редиректим на страницу логина
        return redirect('http://localhost:3000/citizen/login-error')


def citizen_dashboard_page(request):
    """Отдает HTML страницу для React приложения"""
    return render(request, 'citizen/dashboard.html')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsCitizen])
def get_yandex_user_info(request):
    """
    Получение информации о пользователе из Яндекс ID
    """
    user = request.user
    
    # Если есть яндекс ID, можно попробовать получить дополнительные данные
    if user.yandex_id:
        # Возвращаем все данные, которые есть в системе
        return Response({
            'yandex_id': user.yandex_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'birth_date': user.birth_date,
            'is_verified': user.is_verified,
            'sex': getattr(user, 'sex', None),
        })
    
    return Response({'error': 'No Yandex ID linked'}, status=404)