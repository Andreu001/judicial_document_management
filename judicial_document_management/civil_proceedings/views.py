from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.models import User
from .models import (
    CivilProceedings, CivilDecision, CivilExecution,
    CivilSidesCaseInCase, CivilLawyer,
    CivilCaseMovement, CivilPetition, ReferringAuthorityCivil
)
from .serializers import (
    CivilProceedingsSerializer, ArchivedCivilProceedingsSerializer,
    CivilDecisionSerializer, CivilExecutionSerializer,
    CivilSidesCaseInCaseSerializer, CivilLawyerSerializer,
    CivilCaseMovementSerializer, CivilPetitionSerializer,
    ReferringAuthorityCivilSerializer, CivilDecisionOptionsSerializer
)


class CivilProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CivilProceedingsSerializer

    def get_queryset(self):
        if self.action == 'list':
            queryset = CivilProceedings.objects.all()
            is_archive = self.request.query_params.get('archive', False)
            if is_archive:
                queryset = queryset.filter(status='archived')
            else:
                queryset = queryset.exclude(status='archived')
            return queryset
        return CivilProceedings.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action in ['update', 'partial_update']:
            instance = self.get_object()
            if instance.status == 'archived':
                return ArchivedCivilProceedingsSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        proceeding = self.get_object()
        if proceeding.status == 'archived':
            return Response({'error': 'Дело уже в архиве'}, status=status.HTTP_400_BAD_REQUEST)
        proceeding.status = 'archived'
        proceeding.archived_date = timezone.now().date()
        proceeding.save()
        return Response({'message': 'Дело успешно отправлено в архив'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        proceeding = self.get_object()
        if proceeding.status != 'archived':
            return Response({'error': 'Дело не находится в архиве'}, status=status.HTTP_400_BAD_REQUEST)
        proceeding.status = 'active'
        proceeding.save()
        return Response({'message': 'Дело возвращено из архива'}, status=status.HTTP_200_OK)


class CivilDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = CivilDecisionSerializer

    def get_queryset(self):
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            return CivilDecision.objects.filter(civil_proceedings_id=civil_proceedings_id)
        return CivilDecision.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            context['civil_proceedings'] = get_object_or_404(CivilProceedings, pk=civil_proceedings_id)
        return context

    def perform_create(self, serializer):
        civil_proceedings = self.get_serializer_context().get('civil_proceedings')
        serializer.save(civil_proceedings=civil_proceedings)


class CivilExecutionViewSet(viewsets.ModelViewSet):
    serializer_class = CivilExecutionSerializer

    def get_queryset(self):
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            return CivilExecution.objects.filter(civil_proceedings_id=civil_proceedings_id)
        return CivilExecution.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            context['civil_proceedings'] = get_object_or_404(CivilProceedings, pk=civil_proceedings_id)
        return context

    def perform_create(self, serializer):
        civil_proceedings = self.get_serializer_context().get('civil_proceedings')
        serializer.save(civil_proceedings=civil_proceedings)


class CivilSidesCaseInCaseViewSet(viewsets.ModelViewSet):
    """ViewSet для создания сторон с привязкой к гражданскому делу"""
    serializer_class = CivilSidesCaseInCaseSerializer

    def get_queryset(self):
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            return CivilSidesCaseInCase.objects.filter(civil_proceedings_id=civil_proceedings_id)
        return CivilSidesCaseInCase.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            context['civil_proceedings'] = get_object_or_404(CivilProceedings, pk=civil_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        """Переопределяем метод удаления для проверки использования стороны в других делах"""
        instance = self.get_object()
        sides_case_incase = instance.sides_case_incase
        
        # Проверяем, используется ли эта сторона в других гражданских делах
        other_civil_usages = CivilSidesCaseInCase.objects.filter(
            sides_case_incase=sides_case_incase
        ).exclude(id=instance.id).count()
        
        # Проверяем, используется ли эта сторона в других приложениях (если есть)
        # Например, в бизнес-карточках или других типах производств
        # Здесь нужно добавить проверки для других моделей, которые могут использовать SidesCaseInCase
        
        # Если сторона не используется больше нигде, удаляем её полностью
        if other_civil_usages == 0:
            # Сначала удаляем связь, затем саму сторону
            instance.delete()
            sides_case_incase.delete()
            return Response(
                {'message': 'Сторона полностью удалена из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            # Если сторона используется в других делах, удаляем только связь
            instance.delete()
            return Response(
                {'message': 'Связь с делом удалена, но сторона сохранена (используется в других делах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class CivilLawyerViewSet(viewsets.ModelViewSet):
    """ViewSet для создания адвокатов с привязкой к гражданскому делу"""
    serializer_class = CivilLawyerSerializer

    def get_queryset(self):
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            return CivilLawyer.objects.filter(civil_proceedings_id=civil_proceedings_id)
        return CivilLawyer.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            context['civil_proceedings'] = get_object_or_404(CivilProceedings, pk=civil_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        """Переопределяем метод удаления для проверки использования адвоката в других делах"""
        instance = self.get_object()
        lawyer = instance.lawyer
        
        # Проверяем, используется ли этот адвокат в других гражданских делах
        other_civil_usages = CivilLawyer.objects.filter(
            lawyer=lawyer
        ).exclude(id=instance.id).count()
        
        # Проверяем, используется ли адвокат в других приложениях (если есть)
        # Здесь можно добавить проверки для других моделей
        
        # Если адвокат не используется больше нигде, удаляем его полностью
        if other_civil_usages == 0:
            # Сначала удаляем связь, затем самого адвоката
            instance.delete()
            lawyer.delete()
            return Response(
                {'message': 'Адвокат полностью удален из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            # Если адвокат используется в других делах, удаляем только связь
            instance.delete()
            return Response(
                {'message': 'Связь с делом удалена, но адвокат сохранен (используется в других делах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class CivilCaseMovementViewSet(viewsets.ModelViewSet):
    serializer_class = CivilCaseMovementSerializer

    def get_queryset(self):
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            return CivilCaseMovement.objects.filter(civil_proceedings_id=civil_proceedings_id)
        return CivilCaseMovement.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            context['civil_proceedings'] = get_object_or_404(CivilProceedings, pk=civil_proceedings_id)
        return context

    def perform_create(self, serializer):
        civil_proceedings = self.get_serializer_context().get('civil_proceedings')
        serializer.save(civil_proceedings=civil_proceedings)


class CivilPetitionViewSet(viewsets.ModelViewSet):
    serializer_class = CivilPetitionSerializer

    def get_queryset(self):
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            return CivilPetition.objects.filter(civil_proceedings_id=civil_proceedings_id)
        return CivilPetition.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        civil_proceedings_id = self.kwargs.get('civil_proceedings')
        if civil_proceedings_id:
            context['civil_proceedings'] = get_object_or_404(CivilProceedings, pk=civil_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


class ReferringAuthorityCivilViewSet(viewsets.ModelViewSet):
    queryset = ReferringAuthorityCivil.objects.all()
    serializer_class = ReferringAuthorityCivilSerializer


@api_view(['GET'])
def judges_list(request):
    """Список судей для выпадающего списка"""
    judges = User.objects.filter(role='judge', is_active=True)
    data = []
    for judge in judges:
        full_name = ' '.join(filter(None, [judge.last_name, judge.first_name, judge.middle_name])).strip()
        data.append({
            'id': judge.id,
            'full_name': full_name or judge.username,
            'judge_code': judge.username,
        })
    return Response(data)


@api_view(['GET'])
def civil_decision_options(request):
    """Получение всех опций для гражданских решений из choices полей модели"""
    try:
        choices_data = CivilDecisionOptionsSerializer.get_choices_from_model()
        return Response(choices_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def civil_options(request):
    """Получение всех опций для гражданских дел"""
    options = {
        'caseCategory': [
            {'value': '1', 'label': 'Исковое производство'},
            {'value': '2', 'label': 'Приказное производство'},
            {'value': '3', 'label': 'Особое производство'},
            {'value': '4', 'label': 'Производство по делам, возникающим из публичных правоотношений'},
            {'value': '5', 'label': 'Иное'},
        ],
        'caseType': [
            {'value': '1', 'label': 'Первая инстанция'},
            {'value': '2', 'label': 'Апелляция'},
            {'value': '3', 'label': 'Кассация'},
            {'value': '4', 'label': 'Надзор'},
        ],
        # Добавьте остальные опции по аналогии
    }
    return Response(options)
