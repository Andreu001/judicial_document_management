from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.http import Http404
from django.shortcuts import get_object_or_404
from users.models import User
from .models import (CriminalProceedings, Defendant,
                     CriminalDecision, CriminalRuling,
                     CriminalCaseMovement, ReferringAuthority,
                     CriminalSidesCaseInCase, LawyerCriminal,
                     PetitionCriminal)
from .serializers import (CriminalProceedingsSerializer,
                          DefendantSerializer,
                          CriminalDecisionSerializer,
                          CriminalOptionsSerializer,
                          DefendantOptionsSerializer,
                          CriminalDecisionOptionsSerializer,
                          CriminalRulingSerializer,
                          CriminalCaseMovementSerializer,
                          ReferringAuthorityListSerializer,
                          UserSerializer,
                          LawyerCriminalSerializer,
                          SidesCaseInCaseSerializer,
                          PetitionCriminalSerializer,
                          PetitionCriminalOptionsSerializer,
                          ArchivedCriminalProceedingsSerializer)
import logging

logger = logging.getLogger(__name__)


class CriminalProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalProceedingsSerializer

    def get_queryset(self):
        # По умолчанию показываем только активные дела
        queryset = CriminalProceedings.objects.all()
        
        # Если запрос из архива, показываем архивные дела
        is_archive = self.request.query_params.get('archive', False)
        if is_archive:
            queryset = queryset.filter(status='archived')
        else:
            # Иначе показываем неархивные дела
            queryset = queryset.exclude(status='archived')
        
        return queryset

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Перевести дело в архив"""
        proceeding = self.get_object()
        
        # Проверяем, можно ли архивировать
        if proceeding.status == 'archived':
            return Response(
                {'error': 'Дело уже в архиве'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Обновляем статус
        proceeding.status = 'archived'
        proceeding.archived_date = timezone.now().date()
        proceeding.save()
        
        # Логируем действие
        logger.info(f"Дело {proceeding.case_number_criminal} отправлено в архив")
        
        return Response(
            {'message': 'Дело успешно отправлено в архив'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        """Вернуть дело из архива"""
        proceeding = self.get_object()
        
        if proceeding.status != 'archived':
            return Response(
                {'error': 'Дело не находится в архиве'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        proceeding.status = 'active'
        proceeding.save()
        
        return Response(
            {'message': 'Дело возвращено из архива'},
            status=status.HTTP_200_OK
        )


class ArchivedCriminalProceedingsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet только для просмотра архивных дел"""
    serializer_class = ArchivedCriminalProceedingsSerializer
    queryset = CriminalProceedings.objects.filter(status='archived')
    
    def get_queryset(self):
        # Можно добавить фильтрацию по дате архивации и т.д.
        return super().get_queryset().order_by('-archived_date')


class DefendantViewSet(viewsets.ModelViewSet):
    serializer_class = DefendantSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return Defendant.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return Defendant.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Логируем входящие данные
        logger.info(f"Creating defendant for proceeding {self.kwargs.get('criminal_proceedings')}")
        logger.info(f"Request data: {request.data}")
        logger.info(f"Request content type: {request.content_type}")
        
        # Проверяем структуру данных
        logger.info(f"Keys in request.data: {list(request.data.keys())}")
        logger.info(f"sides_case_defendant_id value: {request.data.get('sides_case_defendant_id')}")
        logger.info(f"Type of sides_case_defendant_id: {type(request.data.get('sides_case_defendant_id'))}")
        
        # Проверяем, что данные пришли как JSON
        if request.content_type != 'application/json':
            logger.warning(f"Unexpected content type: {request.content_type}")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            logger.info("Serializer is valid")
            logger.info(f"Validated data: {serializer.validated_data}")
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            logger.error(f"Serializer errors: {serializer.errors}")
            logger.error(f"Error details: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            try:
                proceedings = CriminalProceedings.objects.get(pk=criminal_proceedings_id)
                context['criminal_proceedings'] = proceedings
            except CriminalProceedings.DoesNotExist:
                pass
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class CriminalDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalDecisionSerializer

    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return CriminalDecision.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return CriminalDecision.objects.none()

    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


@api_view(['GET'])
def criminal_options(request):
    """Получение всех опций для уголовного дела из choices полей модели"""
    choices_data = CriminalOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def defendant_options(request):
    """Получение всех опций для подсудимого из choices полей модели"""
    choices_data = DefendantOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def criminal_decision_options(request):
    """Получение всех опций для судебного решения из choices полей модели"""
    choices_data = CriminalDecisionOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def criminal_case_movement_options(request):
    """Получение всех опций для движения дела из choices полей модели"""
    from .serializers import CriminalCaseMovementOptionsSerializer
    choices_data = CriminalCaseMovementOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


class CriminalRulingViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalRulingSerializer

    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return CriminalRuling.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return CriminalRuling.objects.none()

    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class CriminalCaseMovementViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalCaseMovementSerializer

    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return CriminalCaseMovement.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return CriminalCaseMovement.objects.none()

    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class LawyerCriminalViewSet(viewsets.ModelViewSet):
    """ViewSet для адвокатов в уголовных делах"""
    serializer_class = LawyerCriminalSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return LawyerCriminal.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            ).select_related('sides_case_lawyer_criminal', 'sides_case_lawyer')
        return LawyerCriminal.objects.none()
    
    def get_serializer_context(self):
        """Добавляем criminal_proceedings в контекст сериализатора"""
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            try:
                proceedings = CriminalProceedings.objects.get(pk=criminal_proceedings_id)
                context['criminal_proceedings'] = proceedings
            except CriminalProceedings.DoesNotExist:
                pass
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class SidesCaseInCaseViewSet(viewsets.ModelViewSet):
    """ViewSet для сторон в уголовном деле"""
    serializer_class = SidesCaseInCaseSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return CriminalSidesCaseInCase.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            ).select_related('criminal_side_case', 'sides_case_criminal')
        return CriminalSidesCaseInCase.objects.none()
    
    def get_serializer_context(self):
        """Добавляем criminal_proceedings в контекст сериализатора"""
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            try:
                proceedings = CriminalProceedings.objects.get(pk=criminal_proceedings_id)
                context['criminal_proceedings'] = proceedings
            except CriminalProceedings.DoesNotExist:
                pass
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class PetitionCriminalViewSet(viewsets.ModelViewSet):
    """ViewSet для ходатайств в уголовных делах"""
    
    serializer_class = PetitionCriminalSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            return PetitionCriminal.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id  # Правильное имя поля
            ).prefetch_related('petitions_criminal')  # Используем prefetch_related для ManyToMany
        return PetitionCriminal.objects.none()
    
    def get_serializer_context(self):
        """Добавляем criminal_proceedings в контекст"""
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            try:
                proceedings = CriminalProceedings.objects.get(pk=criminal_proceedings_id)
                context['criminal_proceedings'] = proceedings
            except CriminalProceedings.DoesNotExist:
                pass
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get("criminal_proceedings")
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


@api_view(['GET'])
def petition_criminal_options(request):
    """Получение всех опций для ходатайств из choices полей модели"""
    choices_data = PetitionCriminalOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def referring_authorities_list(request):
    authorities = ReferringAuthority.objects.all()
    serializer = ReferringAuthorityListSerializer(authorities, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def judges_list(request):
    judges = User.objects.filter(role='judge')
    serializer = UserSerializer(judges, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def lawyer_criminal_options(request):
    """Получение всех опций для адвоката из choices полей модели"""
    from .serializers import LawyerCriminalOptionsSerializer
    choices_data = LawyerCriminalOptionsSerializer.get_choices_from_model()
    return Response(choices_data)
