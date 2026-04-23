from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
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
        # В зависимости от типа дела, решение может быть в разных моделях
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
        
        # Здесь можно отправить уведомление секретарю/судье
        # notify_court_staff(petition)
        
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


# ========== ДОБАВЛЕННЫЕ КЛАССЫ И ФУНКЦИИ ==========

class CitizenVerificationView(APIView):
    """Верификация гражданина по паспортным данным"""
    permission_classes = [permissions.IsAuthenticated, IsCitizen]
    
    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = request.user
        
        passport_series = request.data.get('passport_series')
        passport_number = request.data.get('passport_number')
        birth_date = request.data.get('birth_date')
        
        if not all([passport_series, passport_number, birth_date]):
            return Response(
                {'error': 'Необходимо заполнить все поля'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Здесь должна быть проверка в базе данных дел
        # Ищем дела, где фигурирует этот человек
        
        user.passport_series = passport_series
        user.passport_number = passport_number
        user.birth_date = birth_date
        user.is_verified = True
        user.verification_date = timezone.now()
        user.save()
        
        # Автоматически связываем дела
        from .signals import auto_link_cases_on_verification
        auto_link_cases_on_verification(User, user)
        
        return Response({
            'message': 'Верификация пройдена успешно',
            'cases_count': user.case_accesses.count()
        })


class CitizenProfileView(APIView):
    """Профиль гражданина"""
    permission_classes = [permissions.IsAuthenticated, IsCitizen]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'middle_name': user.middle_name,
            'email': user.email,
            'phone': user.phone,
            'is_verified': user.is_verified,
            'verification_date': user.verification_date,
            'vk_id': user.vk_id,
            'yandex_id': user.yandex_id,
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