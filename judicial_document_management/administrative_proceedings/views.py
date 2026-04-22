from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.models import User
from .models import (
    KasProceedings, KasDecision, KasExecution,
    KasSidesCaseInCase, KasLawyer,
    KasCaseMovement, KasPetition, ReferringAuthorityKas
)
from .serializers import (
    KasProceedingsSerializer, ArchivedKasProceedingsSerializer,
    KasDecisionSerializer, KasExecutionSerializer,
    KasSidesCaseInCaseSerializer, KasLawyerSerializer,
    KasCaseMovementSerializer, KasPetitionSerializer,
    ReferringAuthorityKasSerializer
)
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument, DocumentTemplate
from case_documents.serializers import (
    CaseDocumentListSerializer, 
    CaseDocumentDetailSerializer,
    DocumentTemplateSerializer
)

class KasProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = KasProceedingsSerializer

    def get_queryset(self):
        if self.action == 'list':
            queryset = KasProceedings.objects.all()
            is_archive = self.request.query_params.get('archive', False)
            if is_archive:
                queryset = queryset.filter(status='archived')
            else:
                queryset = queryset.exclude(status='archived')
            return queryset
        return KasProceedings.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action in ['update', 'partial_update']:
            instance = self.get_object()
            if instance.status == 'archived':
                return ArchivedKasProceedingsSerializer
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

    @action(detail=True, methods=['get'], url_path='document-templates')
    def document_templates(self, request, pk=None):
        """
        Возвращает список шаблонов документов, доступных для дел КАС.
        """
        case_category = 'kas'
        templates = DocumentTemplate.objects.filter(
            case_category__in=[case_category, 'common'],
            is_active=True
        )
        serializer = DocumentTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        """
        Работа со списком документов дела.
        GET - получить список документов
        POST - создать новый документ
        """
        admin_case = self.get_object()
        content_type = ContentType.objects.get_for_model(admin_case)

        if request.method == 'GET':
            docs = CaseDocument.objects.filter(
                content_type=content_type,
                object_id=admin_case.id
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
            data['object_id'] = admin_case.id
            
            serializer = CaseDocumentDetailSerializer(
                data=data,
                context={'request': request, 'case': admin_case}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='documents/(?P<doc_pk>[^/.]+)')
    def retrieve_document(self, request, pk=None, doc_pk=None):
        """
        Получить конкретный документ по ID.
        """
        kas_case = self.get_object()
        document = self.get_document_object(kas_case, doc_pk)
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
        kas_case = self.get_object()
        document = self.get_document_object(kas_case, doc_pk)

        if request.method in ['PUT', 'PATCH']:
            serializer = CaseDocumentDetailSerializer(
                document,
                data=request.data,
                partial=(request.method == 'PATCH'),
                context={'request': request, 'case': kas_case}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        elif request.method == 'DELETE':
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    def get_document_object(self, kas_case, doc_pk):
        """
        Вспомогательный метод для получения документа по ID.
        """
        content_type = ContentType.objects.get_for_model(kas_case)
        return get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=kas_case.id,
            pk=doc_pk
        )

    @action(detail=True, methods=['post'], url_path='documents/(?P<doc_pk>[^/.]+)/sign')
    def sign_document(self, request, pk=None, doc_pk=None):
        kas_case = self.get_object()
        content_type = ContentType.objects.get_for_model(kas_case)
        
        document = get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=kas_case.id,
            pk=doc_pk
        )
        
        if document.status == 'signed':
            return Response(
                {'detail': 'Документ уже подписан.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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

class KasDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = KasDecisionSerializer

    def get_queryset(self):
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            return KasDecision.objects.filter(kas_proceedings_id=kas_proceedings_id)
        return KasDecision.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            context['kas_proceedings'] = get_object_or_404(KasProceedings, pk=kas_proceedings_id)
        return context

    def perform_create(self, serializer):
        kas_proceedings = self.get_serializer_context().get('kas_proceedings')
        serializer.save(kas_proceedings=kas_proceedings)


class KasExecutionViewSet(viewsets.ModelViewSet):
    serializer_class = KasExecutionSerializer

    def get_queryset(self):
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            return KasExecution.objects.filter(kas_proceedings_id=kas_proceedings_id)
        return KasExecution.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            context['kas_proceedings'] = get_object_or_404(KasProceedings, pk=kas_proceedings_id)
        return context

    def perform_create(self, serializer):
        kas_proceedings = self.get_serializer_context().get('kas_proceedings')
        serializer.save(kas_proceedings=kas_proceedings)


class KasSidesCaseInCaseViewSet(viewsets.ModelViewSet):
    serializer_class = KasSidesCaseInCaseSerializer

    def get_queryset(self):
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            return KasSidesCaseInCase.objects.filter(kas_proceedings_id=kas_proceedings_id)
        return KasSidesCaseInCase.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            context['kas_proceedings'] = get_object_or_404(KasProceedings, pk=kas_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        sides_case_incase = instance.sides_case_incase

        other_kas_usages = KasSidesCaseInCase.objects.filter(
            sides_case_incase=sides_case_incase
        ).exclude(id=instance.id).count()

        if other_kas_usages == 0:
            instance.delete()
            sides_case_incase.delete()
            return Response(
                {'message': 'Сторона полностью удалена из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            instance.delete()
            return Response(
                {'message': 'Связь с делом удалена, но сторона сохранена (используется в других делах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class KasLawyerViewSet(viewsets.ModelViewSet):
    serializer_class = KasLawyerSerializer

    def get_queryset(self):
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            return KasLawyer.objects.filter(kas_proceedings_id=kas_proceedings_id)
        return KasLawyer.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            context['kas_proceedings'] = get_object_or_404(KasProceedings, pk=kas_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        lawyer = instance.lawyer

        other_kas_usages = KasLawyer.objects.filter(
            lawyer=lawyer
        ).exclude(id=instance.id).count()

        if other_kas_usages == 0:
            instance.delete()
            lawyer.delete()
            return Response(
                {'message': 'Представитель полностью удален из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            instance.delete()
            return Response(
                {'message': 'Связь с делом удалена, но представитель сохранен (используется в других делах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class KasCaseMovementViewSet(viewsets.ModelViewSet):
    serializer_class = KasCaseMovementSerializer

    def get_queryset(self):
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            return KasCaseMovement.objects.filter(kas_proceedings_id=kas_proceedings_id)
        return KasCaseMovement.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            context['kas_proceedings'] = get_object_or_404(KasProceedings, pk=kas_proceedings_id)
        return context

    def perform_create(self, serializer):
        kas_proceedings = self.get_serializer_context().get('kas_proceedings')
        serializer.save(kas_proceedings=kas_proceedings)


class KasPetitionViewSet(viewsets.ModelViewSet):
    serializer_class = KasPetitionSerializer

    def get_queryset(self):
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            return KasPetition.objects.filter(kas_proceedings_id=kas_proceedings_id)
        return KasPetition.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        kas_proceedings_id = self.kwargs.get('kas_proceedings')
        if kas_proceedings_id:
            context['kas_proceedings'] = get_object_or_404(KasProceedings, pk=kas_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


class ReferringAuthorityKasViewSet(viewsets.ModelViewSet):
    queryset = ReferringAuthorityKas.objects.all()
    serializer_class = ReferringAuthorityKasSerializer


@api_view(['GET'])
def judges_list(request):
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
def kas_decision_options(request):
    try:
        choices_data = KasDecisionOptionsSerializer.get_choices_from_model()
        return Response(choices_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def kas_options(request):
    options = {
        'admissionOrder': [
            {'value': '1', 'label': 'Впервые'},
            {'value': '2', 'label': 'Впервые, связанное с другим адм. делом'},
            {'value': '3', 'label': 'Выделено судом в отдельное производство'},
            {'value': '4', 'label': 'По подсудности из другого суда'},
            {'value': '5', 'label': 'После отмены суд. постановления вышестоящим судом'},
            {'value': '6', 'label': 'Ранее оставленное без рассмотрения этим же судом'},
            {'value': '7', 'label': 'После отмены определения об отказе в принятии или оставлении без движения'},
            {'value': '8', 'label': 'После отмены суд. постановления по новым или вновь открывшимся обстоятельствам'},
        ],
        'postponementReason': [
            {'value': '1', 'label': 'Неявка лиц без сведений об извещении'},
            {'value': '2', 'label': 'Неявка извещенного ответчика с обязательным присутствием'},
            {'value': '2.1', 'label': 'Неявка ответчика повторно без уважительных причин'},
            {'value': '2.2', 'label': 'Неявка ответчика повторно с уважительными причинами'},
            {'value': '3', 'label': 'Неявка представителя с обязательным участием'},
            {'value': '3.1', 'label': 'Неявка представителя повторно без уважительных причин'},
            {'value': '3.2', 'label': 'Неявка представителя повторно с уважительными причинами'},
            {'value': '4', 'label': 'Ходатайство об отложении по уважительной причине'},
            {'value': '5', 'label': 'Ходатайство представителя с необязательным участием'},
            {'value': '6', 'label': 'Подано встречное административное исковое заявление'},
            {'value': '7', 'label': 'Ходатайство для предоставления доп. доказательств'},
            {'value': '8', 'label': 'Технические неполадки'},
            {'value': '9', 'label': 'Совершение иных процессуальных действий'},
        ],
        'outcome': [
            {'value': '1', 'label': 'Иск (заявление) удовлетворен'},
            {'value': '1.1', 'label': ' - в том числе удовлетворен частично'},
            {'value': '2', 'label': 'Отказано'},
            {'value': '3', 'label': 'Дело прекращено'},
            {'value': '4', 'label': 'Оставлено без рассмотрения'},
            {'value': '5', 'label': 'Передано по подсудности'},
        ],
        'appealResult': [
            {'value': '1', 'label': 'Оставлено без изменений'},
            {'value': '2', 'label': 'Отменено с возвращением на новое рассмотрение'},
            {'value': '3', 'label': 'Производство по делу прекращено'},
            {'value': '4', 'label': 'Заявление оставлено без рассмотрения'},
            {'value': '5', 'label': 'Вынесено новое решение'},
            {'value': '6', 'label': 'Изменено'},
            {'value': '7', 'label': 'Другое судебное постановление с удовлетворением жалобы'},
        ],
    }
    return Response(options)


@api_view(['GET'])
def kas_all_options(request):
    """
    Возвращает ВСЕ справочные данные для фронтенда одним запросом.
    Это оптимизирует загрузку страницы - не нужно делать 10 отдельных запросов.
    """
    from django.apps import apps
    
    # Получаем модели справочников
    AdmissionOrder = apps.get_model('administrative_code', 'AdmissionOrder')
    PostponementReason = apps.get_model('administrative_code', 'PostponementReason')
    SuspensionReason = apps.get_model('administrative_code', 'SuspensionReason')
    PreliminaryProtection = apps.get_model('administrative_code', 'PreliminaryProtection')
    ExpertiseType = apps.get_model('administrative_code', 'ExpertiseType')
    AppealResult = apps.get_model('administrative_code', 'AppealResult')
    CassationResult = apps.get_model('administrative_code', 'CassationResult')
    TermCompliance = apps.get_model('administrative_code', 'TermCompliance')
    Outcome = apps.get_model('administrative_code', 'Outcome')
    
    options = {
        'admissionOrder': [{'value': obj.code, 'label': obj.label} for obj in AdmissionOrder.objects.all().order_by('id')],
        'postponementReason': [{'value': obj.code, 'label': obj.label} for obj in PostponementReason.objects.all().order_by('id')],
        'suspensionReason': [{'value': obj.code, 'label': obj.label} for obj in SuspensionReason.objects.all().order_by('id')],
        'preliminaryProtection': [{'value': obj.code, 'label': obj.label} for obj in PreliminaryProtection.objects.all().order_by('id')],
        'expertiseTypes': [{'value': obj.code, 'label': obj.label} for obj in ExpertiseType.objects.all().order_by('id')],
        'appealResults': [{'value': obj.code, 'label': obj.label} for obj in AppealResult.objects.all().order_by('id')],
        'cassationResults': [{'value': obj.code, 'label': obj.label} for obj in CassationResult.objects.all().order_by('id')],
        'termCompliance': [{'value': obj.code, 'label': obj.label} for obj in TermCompliance.objects.all().order_by('id')],
        'outcomes': [{'value': obj.code, 'label': obj.label} for obj in Outcome.objects.all().order_by('id')],
        'statuses': [
            {'value': 'active', 'label': 'Активное'},
            {'value': 'completed', 'label': 'Рассмотрено'},
            {'value': 'execution', 'label': 'На исполнении'},
            {'value': 'archived', 'label': 'В архиве'},
        ],
        'appealTypes': [
            {'value': '1', 'label': 'Жалоба'},
            {'value': '2', 'label': 'Представление прокурора'},
        ],
        'cassationTypes': [
            {'value': '1', 'label': 'Жалоба'},
            {'value': '2', 'label': 'Представление прокурора'},
        ],
    }
    return Response(options)