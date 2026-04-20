from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.models import User
from .models import (
    OtherMaterial, OtherMaterialSidesCaseInCase, OtherMaterialLawyer,
    OtherMaterialMovement, OtherMaterialPetition,
    OtherMaterialDecision, OtherMaterialExecution
)
from .serializers import (
    OtherMaterialSerializer, ArchivedOtherMaterialSerializer,
    OtherMaterialSidesCaseInCaseSerializer, OtherMaterialLawyerSerializer,
    OtherMaterialMovementSerializer, OtherMaterialPetitionSerializer,
    OtherMaterialOptionsSerializer, OtherMaterialDecisionSerializer,
    OtherMaterialExecutionSerializer
)
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument, DocumentTemplate
from case_documents.serializers import (
    CaseDocumentListSerializer, 
    CaseDocumentDetailSerializer,
    DocumentTemplateSerializer
)


class OtherMaterialViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialSerializer

    def get_queryset(self):
        if self.action == 'list':
            queryset = OtherMaterial.objects.all()
            is_archive = self.request.query_params.get('archive', False)
            if is_archive:
                queryset = queryset.filter(status='archived')
            else:
                queryset = queryset.exclude(status='archived')
            return queryset
        return OtherMaterial.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action in ['update', 'partial_update']:
            instance = self.get_object()
            if instance.status == 'archived':
                return ArchivedOtherMaterialSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        material = self.get_object()
        if material.status == 'archived':
            return Response({'error': 'Материал уже в архиве'}, status=status.HTTP_400_BAD_REQUEST)
        material.status = 'archived'
        material.archived_date = timezone.now().date()
        material.save()
        return Response({'message': 'Материал успешно отправлен в архив'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        material = self.get_object()
        if material.status != 'archived':
            return Response({'error': 'Материал не находится в архиве'}, status=status.HTTP_400_BAD_REQUEST)
        material.status = 'active'
        material.save()
        return Response({'message': 'Материал возвращен из архива'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='document-templates')
    def document_templates(self, request, pk=None):
        """
        Возвращает список шаблонов документов, доступных для иных материалов.
        """
        case_category = 'other_material'
        templates = DocumentTemplate.objects.filter(
            case_category__in=[case_category, 'common'],
            is_active=True
        )
        serializer = DocumentTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        """
        Работа со списком документов иного материала.
        """
        other_material = self.get_object()
        content_type = ContentType.objects.get_for_model(other_material)

        if request.method == 'GET':
            docs = CaseDocument.objects.filter(
                content_type=content_type,
                object_id=other_material.id
            )
            serializer = CaseDocumentListSerializer(
                docs, 
                many=True, 
                context={'request': request}
            )
            return Response(serializer.data)

        elif request.method == 'POST':
            data = request.data.copy()
            data['content_type'] = content_type.model
            data['object_id'] = other_material.id
            
            serializer = CaseDocumentDetailSerializer(
                data=data,
                context={'request': request, 'case': other_material}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='documents/(?P<doc_pk>[^/.]+)')
    def retrieve_document(self, request, pk=None, doc_pk=None):
        other_material = self.get_object()
        document = self.get_document_object(other_material, doc_pk)
        serializer = CaseDocumentDetailSerializer(
            document, 
            context={'request': request}
        )
        return Response(serializer.data)

    @documents.mapping.put
    @documents.mapping.patch
    @documents.mapping.delete
    def handle_document_detail(self, request, pk=None, doc_pk=None):
        other_material = self.get_object()
        document = self.get_document_object(other_material, doc_pk)

        if request.method in ['PUT', 'PATCH']:
            serializer = CaseDocumentDetailSerializer(
                document,
                data=request.data,
                partial=(request.method == 'PATCH'),
                context={'request': request, 'case': other_material}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        elif request.method == 'DELETE':
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    def get_document_object(self, other_material, doc_pk):
        content_type = ContentType.objects.get_for_model(other_material)
        return get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=other_material.id,
            pk=doc_pk
        )

    @action(detail=True, methods=['post'], url_path='documents/(?P<doc_pk>[^/.]+)/sign')
    def sign_document(self, request, pk=None, doc_pk=None):
        other_material = self.get_object()
        content_type = ContentType.objects.get_for_model(other_material)
        
        document = get_object_or_404(
            CaseDocument,
            content_type=content_type,
            object_id=other_material.id,
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


class OtherMaterialSidesCaseInCaseViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialSidesCaseInCaseSerializer

    def get_queryset(self):
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            return OtherMaterialSidesCaseInCase.objects.filter(other_material_id=other_material_id)
        return OtherMaterialSidesCaseInCase.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            context['other_material'] = get_object_or_404(OtherMaterial, pk=other_material_id)
        return context

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        sides_case_incase = instance.sides_case_incase
        
        other_usages = OtherMaterialSidesCaseInCase.objects.filter(
            sides_case_incase=sides_case_incase
        ).exclude(id=instance.id).count()
        
        if other_usages == 0:
            instance.delete()
            sides_case_incase.delete()
            return Response(
                {'message': 'Сторона полностью удалена из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            instance.delete()
            return Response(
                {'message': 'Связь с материалом удалена, но сторона сохранена (используется в других материалах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class OtherMaterialLawyerViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialLawyerSerializer

    def get_queryset(self):
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            return OtherMaterialLawyer.objects.filter(other_material_id=other_material_id)
        return OtherMaterialLawyer.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            context['other_material'] = get_object_or_404(OtherMaterial, pk=other_material_id)
        return context

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        lawyer = instance.lawyer
        
        other_usages = OtherMaterialLawyer.objects.filter(
            lawyer=lawyer
        ).exclude(id=instance.id).count()
        
        if other_usages == 0:
            instance.delete()
            lawyer.delete()
            return Response(
                {'message': 'Представитель полностью удален из системы'},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            instance.delete()
            return Response(
                {'message': 'Связь с материалом удалена, но представитель сохранен (используется в других материалах)'},
                status=status.HTTP_204_NO_CONTENT
            )


class OtherMaterialMovementViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialMovementSerializer

    def get_queryset(self):
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            return OtherMaterialMovement.objects.filter(other_material_id=other_material_id)
        return OtherMaterialMovement.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            context['other_material'] = get_object_or_404(OtherMaterial, pk=other_material_id)
        return context


class OtherMaterialPetitionViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialPetitionSerializer

    def get_queryset(self):
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            return OtherMaterialPetition.objects.filter(other_material_id=other_material_id)
        return OtherMaterialPetition.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            context['other_material'] = get_object_or_404(OtherMaterial, pk=other_material_id)
        return context


class OtherMaterialDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialDecisionSerializer

    def get_queryset(self):
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            return OtherMaterialDecision.objects.filter(other_material_id=other_material_id)
        return OtherMaterialDecision.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            context['other_material'] = get_object_or_404(OtherMaterial, pk=other_material_id)
        return context

    def perform_create(self, serializer):
        other_material = self.get_serializer_context().get('other_material')
        serializer.save(other_material=other_material)


class OtherMaterialExecutionViewSet(viewsets.ModelViewSet):
    serializer_class = OtherMaterialExecutionSerializer

    def get_queryset(self):
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            return OtherMaterialExecution.objects.filter(other_material_id=other_material_id)
        return OtherMaterialExecution.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        other_material_id = self.kwargs.get('other_material')
        if other_material_id:
            context['other_material'] = get_object_or_404(OtherMaterial, pk=other_material_id)
        return context

    def perform_create(self, serializer):
        other_material = self.get_serializer_context().get('other_material')
        serializer.save(other_material=other_material)


@api_view(['GET'])
def other_material_options(request):
    options = OtherMaterialOptionsSerializer.get_options()
    return Response(options)


@api_view(['GET'])
def responsible_persons_list(request):
    """Список ответственных лиц (судьи, секретари, помощники)"""
    persons = User.objects.filter(
        role__in=['judge', 'secretary', 'assistant'],
        is_active=True
    )
    data = []
    for person in persons:
        full_name = ' '.join(filter(None, [person.last_name, person.first_name, person.middle_name])).strip()
        data.append({
            'id': person.id,
            'full_name': full_name or person.username,
            'role': person.role,
            'role_display': person.get_role_display(),
        })
    return Response(data)
