from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import Http404
from django.shortcuts import get_object_or_404
from users.models import User
from .models import CriminalRuling
from .models import (CriminalProceedings, Defendant,
                     CriminalDecision, CriminalRuling,
                     CriminalCaseMovement, ReferringAuthority,
                     CriminalSidesCaseInCase, LawyerCriminal,
                     PetitionCriminal, CriminalExecution, CriminalCivilClaim)
from .serializers import (CriminalProceedingsSerializer,
    DefendantSerializer, CriminalDecisionSerializer, CriminalOptionsSerializer,  DefendantOptionsSerializer,
    CriminalDecisionOptionsSerializer, CriminalRulingSerializer, CriminalCaseMovementSerializer,
    ReferringAuthorityListSerializer, UserSerializer, LawyerCriminalSerializer,
    SidesCaseInCaseSerializer, PetitionCriminalSerializer, PetitionCriminalOptionsSerializer,
    ArchivedCriminalProceedingsSerializer, CriminalExecutionSerializer,
    CriminalAppealInstanceSerializer, CriminalCassationInstanceSerializer,
    CriminalAppealApplicantStatusSerializer, CriminalCassationResultSerializer,
    CriminalSupervisoryResultSerializer, CriminalCivilClaimSerializer)
from .models_appeal_cassation import (
    CriminalAppealInstance, CriminalCassationInstance,
    CriminalAppealApplicantStatus, CriminalCassationResult, CriminalSupervisoryResult
)
import logging
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument, DocumentTemplate
from case_documents.serializers import (
    CaseDocumentListSerializer, 
    CaseDocumentDetailSerializer,
    DocumentTemplateSerializer
)

logger = logging.getLogger(__name__)


class CriminalProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalProceedingsSerializer

    def get_queryset(self):
        # Для списка (list) фильтруем по статусу
        if self.action == 'list':
            queryset = CriminalProceedings.objects.all()
            is_archive = self.request.query_params.get('archive', False)
            if is_archive:
                queryset = queryset.filter(status='archived')
            else:
                queryset = queryset.exclude(status='archived')
            return queryset
        # Для остальных действий (retrieve, update и т.д.) возвращаем все объекты
        return CriminalProceedings.objects.all()

    def get_serializer_class(self):
        """Выбираем сериализатор в зависимости от статуса дела"""
        if self.action == 'retrieve':
            instance = self.get_object()
            if instance.status == 'archived':
                return ArchivedCriminalProceedingsSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            instance = self.get_object()
            if instance.status == 'archived':
                return ArchivedCriminalProceedingsSerializer
        return super().get_serializer_class()

    def perform_destroy(self, instance):
        """
        Принудительное удаление уголовного дела с удалением регистрации
        """
        # Сначала удаляем регистрацию, если она есть
        if instance.registered_case:
            try:
                case_registry.delete_case(
                    instance.registered_case.id,
                    reason="Удалено уголовное производство через API"
                )
                logger.info(f"Удалена регистрация для уголовного дела {instance.case_number_criminal}")
            except Exception as e:
                logger.error(f"Ошибка при удалении регистрации: {e}")
        
        # Затем удаляем само дело
        instance.delete()
    
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
    
    @action(detail=True, methods=['get'], url_path='all-sides')
    def all_sides(self, request, pk=None):
        """Возвращает объединённый список всех сторон по делу (обвиняемые, адвокаты, иные стороны)"""
        proceeding = self.get_object()

        # 1. Обвиняемые
        defendants = Defendant.objects.filter(criminal_proceedings=proceeding)
        defendant_list = [
            {
                'id': d.id,
                'type': 'defendant',
                'name': d.full_name_criminal or f"Обвиняемый #{d.id}",
                'role': 'Обвиняемый',
                'details': d.full_name_criminal or ''
            }
            for d in defendants
        ]

        # 2. Адвокаты
        lawyers = LawyerCriminal.objects.filter(criminal_proceedings=proceeding)
        lawyer_list = [
            {
                'id': l.id,
                'type': 'lawyer',
                'name': l.sides_case_lawyer_criminal.law_firm_name if l.sides_case_lawyer_criminal else 'Адвокат',
                'role': 'Адвокат',
                'details': l.sides_case_lawyer_criminal.law_firm_name if l.sides_case_lawyer_criminal else ''
            }
            for l in lawyers
        ]

        # 3. Иные стороны
        sides = CriminalSidesCaseInCase.objects.filter(criminal_proceedings=proceeding)
        side_list = [
            {
                'id': s.id,
                'type': 'side',
                'name': s.criminal_side_case.name if s.criminal_side_case else 'Сторона',
                'role': s.sides_case_criminal.sides_case if s.sides_case_criminal else 'Участник',
                'details': s.criminal_side_case.name if s.criminal_side_case else ''
            }
            for s in sides
        ]

        all_sides = defendant_list + lawyer_list + side_list
        return Response(all_sides)

    @action(detail=True, methods=['get'], url_path='document-templates')
    def document_templates(self, request, pk=None):
        """
        Возвращает список шаблонов документов, доступных для уголовных дел.
        """
        case_category = 'criminal'
        templates = DocumentTemplate.objects.filter(
            case_category__in=[case_category, 'common'],
            is_active=True
        )
        serializer = DocumentTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        """
        Работа со списком документов уголовного дела.
        """
        criminal_case = self.get_object()
        content_type = ContentType.objects.get_for_model(criminal_case)

        if request.method == 'GET':
            docs = CaseDocument.objects.filter(
                content_type=content_type,
                object_id=criminal_case.id
            )
            serializer = CaseDocumentListSerializer(
                docs, 
                many=True, 
                context={'request': request}
            )
            return Response(serializer.data)

        elif request.method == 'POST':
            # Делаем копию данных, чтобы не изменять оригинал
            data = request.data.copy()
            
            # Добавляем content_type и object_id в данные
            data['content_type'] = content_type.model
            data['object_id'] = criminal_case.id
            
            serializer = CaseDocumentDetailSerializer(
                data=data,
                context={'request': request, 'case': criminal_case}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='documents/(?P<doc_pk>[^/.]+)')
    def retrieve_document(self, request, pk=None, doc_pk=None):
        """
        Получить конкретный документ по ID.
        """
        criminal_case = self.get_object()
        document = self.get_document_object(criminal_case, doc_pk)
        serializer = CaseDocumentDetailSerializer(
            document, 
            context={'request': request}
        )
        return Response(serializer.data)

    @documents.mapping.put
    @documents.mapping.patch
    @documents.mapping.delete
    def handle_document_detail(self, request, pk=None, doc_pk=None):
        """
        Обработка PUT, PATCH, DELETE запросов для конкретного документа.
        """
        criminal_case = self.get_object()
        document = self.get_document_object(criminal_case, doc_pk)

        if request.method in ['PUT', 'PATCH']:
            serializer = CaseDocumentDetailSerializer(
                document,
                data=request.data,
                partial=(request.method == 'PATCH'),
                context={'request': request, 'case': criminal_case}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        elif request.method == 'DELETE':
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    def get_document_object(self, criminal_case, doc_pk):
        """
        Вспомогательный метод для получения документа по ID.
        """
        content_type = ContentType.objects.get_for_model(criminal_case)
        return get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=criminal_case.id,
            pk=doc_pk
        )

    @action(detail=True, methods=['post'], url_path='documents/(?P<doc_pk>[^/.]+)/sign')
    def sign_document(self, request, pk=None, doc_pk=None):
        """
        Подписание документа.
        """
        criminal_case = self.get_object()
        content_type = ContentType.objects.get_for_model(criminal_case)
        
        # Получаем документ, проверяем что он принадлежит этому делу
        document = get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=criminal_case.id,
            pk=doc_pk
        )
        
        # Проверяем, не подписан ли уже документ
        if document.status == 'signed':
            return Response(
                {'detail': 'Документ уже подписан.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Подписываем документ
        success, message = document.sign(request.user)
        if success:
            serializer = CaseDocumentDetailSerializer(
                document, 
                context={'request': request}
            )
            return Response(serializer.data)
        else:
            return Response(
                {'detail': message},
                status=status.HTTP_400_BAD_REQUEST
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
            ).select_related('lawyer', 'sides_case_role')
        return LawyerCriminal.objects.none()

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

    def destroy(self, request, *args, **kwargs):
        """Переопределяем метод удаления для проверки использования адвоката в других делах"""
        instance = self.get_object()
        lawyer = instance.lawyer
        
        other_usages = LawyerCriminal.objects.filter(lawyer=lawyer).exclude(id=instance.id).count()
        
        if other_usages == 0:
            instance.delete()
            lawyer.delete()
            return Response(
                {'message': 'Адвокат полностью удален из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            instance.delete()
            return Response(
                {'message': 'Связь с делом удалена, но адвокат сохранен (используется в других делах)'},
                status=status.HTTP_204_NO_CONTENT
            )


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
                criminal_proceedings_id=criminal_proceedings_id
            ).select_related('petitions_incase')
        return PetitionCriminal.objects.none()
    
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


class CriminalExecutionViewSet(viewsets.ModelViewSet):
    """ViewSet для исполнения по уголовным делам"""
    serializer_class = CriminalExecutionSerializer

    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            return CriminalExecution.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            ).select_related(
                'criminal_side_case_execution',
                'criminal_defendant_execution',
                'sides_case_lawyer_execution'
            )
        return CriminalExecution.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            # Сохраняем в контекст, но не передаем в validated_data
            context['criminal_proceedings'] = get_object_or_404(
                CriminalProceedings, 
                pk=criminal_proceedings_id
            )
        return context

    def perform_create(self, serializer):
        # Не передаем criminal_proceedings здесь, так как сериализатор 
        # уже получит его из контекста в методе create
        serializer.save()


class CriminalAppealInstanceViewSet(viewsets.ModelViewSet):
    """ViewSet для апелляционного рассмотрения"""
    serializer_class = CriminalAppealInstanceSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            return CriminalAppealInstance.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return CriminalAppealInstance.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            context['criminal_proceedings'] = get_object_or_404(
                CriminalProceedings, pk=criminal_proceedings_id
            )
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class CriminalCassationInstanceViewSet(viewsets.ModelViewSet):
    """ViewSet для кассационного рассмотрения"""
    serializer_class = CriminalCassationInstanceSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            return CriminalCassationInstance.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return CriminalCassationInstance.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            context['criminal_proceedings'] = get_object_or_404(
                CriminalProceedings, pk=criminal_proceedings_id
            )
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class CriminalCivilClaimViewSet(viewsets.ModelViewSet):
    """ViewSet для гражданских исков в уголовных делах"""
    serializer_class = CriminalCivilClaimSerializer
    
    def get_queryset(self):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            return CriminalCivilClaim.objects.filter(
                criminal_proceedings_id=criminal_proceedings_id
            )
        return CriminalCivilClaim.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            context['criminal_proceedings'] = get_object_or_404(
                CriminalProceedings, pk=criminal_proceedings_id
            )
        return context
    
    def perform_create(self, serializer):
        criminal_proceedings_id = self.kwargs.get('criminal_proceedings')
        if criminal_proceedings_id:
            proceedings = get_object_or_404(CriminalProceedings, pk=criminal_proceedings_id)
            serializer.save(criminal_proceedings=proceedings)


class CriminalAppealApplicantStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для справочника статусов заявителей апелляции"""
    serializer_class = CriminalAppealApplicantStatusSerializer
    queryset = CriminalAppealApplicantStatus.objects.all()


class CriminalCassationResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для справочника результатов кассации"""
    serializer_class = CriminalCassationResultSerializer
    queryset = CriminalCassationResult.objects.all()


class CriminalSupervisoryResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для справочника результатов надзора"""
    serializer_class = CriminalSupervisoryResultSerializer
    queryset = CriminalSupervisoryResult.objects.all()



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
    """Получить список судей с полными именами"""
    judges = User.objects.filter(role='judge', is_active=True)
    judges_data = []
    for judge in judges:
        # Формируем полное ФИО
        full_name = ' '.join(filter(None, [
            judge.last_name,
            judge.first_name,
            judge.middle_name
        ])).strip() or judge.username
        
        # Получаем код судьи (можно заменить на нужное поле)
        judge_code = getattr(judge, 'judge_code', '') or judge.username
        
        judges_data.append({
            'id': judge.id,
            'full_name': full_name,
            'last_name': judge.last_name or '',
            'first_name': judge.first_name or '',
            'middle_name': judge.middle_name or '',
            'judge_code': judge_code,
            'username': judge.username
        })
    
    return Response(judges_data)


@api_view(['GET'])
def lawyer_criminal_options(request):
    """Получение всех опций для адвоката из choices полей модели"""
    from .serializers import LawyerCriminalOptionsSerializer
    choices_data = LawyerCriminalOptionsSerializer.get_choices_from_model()
    return Response(choices_data)
