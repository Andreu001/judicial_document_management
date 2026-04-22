from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.models import User
from .models import (
    AdministrativeProceedings, AdministrativeDecision, AdministrativeExecution,
    AdministrativeSidesCaseInCase, AdministrativeLawyer,
    AdministrativeCaseMovement, AdministrativePetition, ReferringAuthorityAdmin,
    AdministrativeAppeal, AdministrativeCassation, PostponementReasonAdmin,
    SuspensionReasonAdmin, AdministrativeSubject
)
from .serializers import (
    AdministrativeProceedingsSerializer, ArchivedAdministrativeProceedingsSerializer,
    AdministrativeDecisionSerializer, AdministrativeExecutionSerializer,
    AdministrativeSidesCaseInCaseSerializer, AdministrativeLawyerSerializer,
    AdministrativeCaseMovementSerializer, AdministrativePetitionSerializer,
    ReferringAuthorityAdminSerializer, AdministrativeDecisionOptionsSerializer,
    AdministrativeAppealSerializer, AdministrativeCassationSerializer,
    PostponementReasonAdminSerializer, SuspensionReasonAdminSerializer,
    AdministrativeSubjectSerializer
)
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument, DocumentTemplate
from case_documents.serializers import (
    CaseDocumentListSerializer, 
    CaseDocumentDetailSerializer,
    DocumentTemplateSerializer
)


class AdministrativeProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeProceedingsSerializer

    def get_queryset(self):
        if self.action == 'list':
            queryset = AdministrativeProceedings.objects.all()
            is_archive = self.request.query_params.get('archive', False)
            if is_archive:
                queryset = queryset.filter(status='archived')
            else:
                queryset = queryset.exclude(status='archived')
            return queryset
        return AdministrativeProceedings.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action in ['update', 'partial_update']:
            instance = self.get_object()
            if instance.status == 'archived':
                return ArchivedAdministrativeProceedingsSerializer
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
        Возвращает список шаблонов документов, доступных для дел об АП.
        """
        # Для дел об административных правонарушениях (КОАП)
        case_category = 'admin_offense'
        templates = DocumentTemplate.objects.filter(
            case_category__in=[case_category, 'common'],
            is_active=True
        )
        serializer = DocumentTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        """
        Работа со списком документов дела об административном правонарушении.
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
        admin_case = self.get_object()
        document = self.get_document_object(admin_case, doc_pk)
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
        admin_case = self.get_object()
        document = self.get_document_object(admin_case, doc_pk)

        if request.method in ['PUT', 'PATCH']:
            serializer = CaseDocumentDetailSerializer(
                document,
                data=request.data,
                partial=(request.method == 'PATCH'),
                context={'request': request, 'case': admin_case}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        elif request.method == 'DELETE':
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    def get_document_object(self, admin_case, doc_pk):
        """
        Вспомогательный метод для получения документа по ID.
        """
        content_type = ContentType.objects.get_for_model(admin_case)
        return get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=admin_case.id,
            pk=doc_pk
        )

    @action(detail=True, methods=['post'], url_path='documents/(?P<doc_pk>[^/.]+)/sign')
    def sign_document(self, request, pk=None, doc_pk=None):
        admin_case = self.get_object()
        content_type = ContentType.objects.get_for_model(admin_case)
        
        document = get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=admin_case.id,
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

class AdministrativeDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeDecisionSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeDecision.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeDecision.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context

    def perform_create(self, serializer):
        administrative_proceedings = self.get_serializer_context().get('administrative_proceedings')
        serializer.save(administrative_proceedings=administrative_proceedings)


class AdministrativeExecutionViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeExecutionSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeExecution.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeExecution.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context

    def perform_create(self, serializer):
        administrative_proceedings = self.get_serializer_context().get('administrative_proceedings')
        serializer.save(administrative_proceedings=administrative_proceedings)


class AdministrativeSidesCaseInCaseViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeSidesCaseInCaseSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeSidesCaseInCase.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeSidesCaseInCase.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
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
        
        other_admin_usages = AdministrativeSidesCaseInCase.objects.filter(
            sides_case_incase=sides_case_incase
        ).exclude(id=instance.id).count()
        
        if other_admin_usages == 0:
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


class AdministrativeLawyerViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeLawyerSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeLawyer.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeLawyer.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
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
        
        other_admin_usages = AdministrativeLawyer.objects.filter(
            lawyer=lawyer
        ).exclude(id=instance.id).count()
        
        if other_admin_usages == 0:
            instance.delete()
            lawyer.delete()
            return Response(
                {'message': 'Защитник полностью удален из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            instance.delete()
            return Response(
                {'message': 'Связь с делом удалена, но защитник сохранен (используется в других делах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class AdministrativeCaseMovementViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeCaseMovementSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeCaseMovement.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeCaseMovement.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context

    def perform_create(self, serializer):
        administrative_proceedings = self.get_serializer_context().get('administrative_proceedings')
        serializer.save(administrative_proceedings=administrative_proceedings)


class AdministrativePetitionViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativePetitionSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativePetition.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativePetition.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


class ReferringAuthorityAdminViewSet(viewsets.ModelViewSet):
    queryset = ReferringAuthorityAdmin.objects.all()
    serializer_class = ReferringAuthorityAdminSerializer


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
def admin_decision_options(request):
    try:
        choices_data = AdministrativeDecisionOptionsSerializer.get_choices_from_model()
        return Response(choices_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def admin_options(request):
    options = {
        'considerationType': [
            {'value': '1', 'label': 'Единолично судьёй'},
            {'value': '2', 'label': 'Коллегиально'},
            {'value': '3', 'label': 'С участием прокурора'},
        ],
        'outcome': [
            {'value': '1', 'label': 'Назначено административное наказание'},
            {'value': '2', 'label': 'Прекращено производство по делу'},
            {'value': '3', 'label': 'Возвращено для устранения недостатков'},
            {'value': '4', 'label': 'Передано по подведомственности'},
            {'value': '5', 'label': 'Вынесено предупреждение'},
        ],
        'punishmentType': [
            {'value': '1', 'label': 'Предупреждение'},
            {'value': '2', 'label': 'Административный штраф'},
            {'value': '3', 'label': 'Конфискация орудия или предмета'},
            {'value': '4', 'label': 'Лишение специального права'},
            {'value': '5', 'label': 'Административный арест'},
            {'value': '6', 'label': 'Дисквалификация'},
            {'value': '7', 'label': 'Административное приостановление деятельности'},
            {'value': '8', 'label': 'Обязательные работы'},
            {'value': '9', 'label': 'Административное выдворение'},
        ],
        'executionResult': [
            {'value': '1', 'label': 'Исполнено'},
            {'value': '2', 'label': 'Не исполнено'},
            {'value': '3', 'label': 'Возвращено без исполнения'},
            {'value': '4', 'label': 'Частично исполнено'},
        ],
        'suspensionReason': [
            {'value': '1', 'label': 'Розыск лица, в отношении которого ведётся производство'},
            {'value': '2', 'label': 'Назначение экспертизы'},
            {'value': '3', 'label': 'Направление запроса в Конституционный Суд РФ'},
            {'value': '4', 'label': 'Иное'},
        ],
    }
    return Response(options)


class PostponementReasonAdminViewSet(viewsets.ModelViewSet):
    queryset = PostponementReasonAdmin.objects.all()
    serializer_class = PostponementReasonAdminSerializer


class SuspensionReasonAdminViewSet(viewsets.ModelViewSet):
    queryset = SuspensionReasonAdmin.objects.all()
    serializer_class = SuspensionReasonAdminSerializer


class AdministrativeAppealViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeAppealSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeAppeal.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeAppeal.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context

    def perform_create(self, serializer):
        administrative_proceedings = self.get_serializer_context().get('administrative_proceedings')
        serializer.save(administrative_proceedings=administrative_proceedings)


class AdministrativeCassationViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeCassationSerializer

    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeCassation.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeCassation.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context

    def perform_create(self, serializer):
        administrative_proceedings = self.get_serializer_context().get('administrative_proceedings')
        serializer.save(administrative_proceedings=administrative_proceedings)


class AdministrativeSubjectViewSet(viewsets.ModelViewSet):
    serializer_class = AdministrativeSubjectSerializer
    
    def get_queryset(self):
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            return AdministrativeSubject.objects.filter(administrative_proceedings_id=admin_proceedings_id)
        return AdministrativeSubject.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        admin_proceedings_id = self.kwargs.get('administrative_proceedings')
        if admin_proceedings_id:
            context['administrative_proceedings'] = get_object_or_404(AdministrativeProceedings, pk=admin_proceedings_id)
        return context
    
    def perform_create(self, serializer):
        administrative_proceedings = self.get_serializer_context().get('administrative_proceedings')
        serializer.save(administrative_proceedings=administrative_proceedings)