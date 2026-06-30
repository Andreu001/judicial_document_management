from rest_framework import viewsets, status, mixins
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse, HttpResponse, Http404
from django.utils import timezone
from .models import CaseDocument, DocumentTemplate, PartyDocument, PartyDocumentHistory
from .serializers import (
    CaseDocumentListSerializer,
    CaseDocumentDetailSerializer,
    DocumentTemplateSerializer,
    PartyDocumentListSerializer,
    PartyDocumentDetailSerializer,
    PartyDocumentCreateSerializer,
    PartyDocumentHistorySerializer,
    SignedCourtDocumentDownloadSerializer
)
import os
import tempfile
from django.conf import settings
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import html2text

import logging

logger = logging.getLogger(__name__)


class DocumentTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    filterset_fields = ['case_category']


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = CaseDocument.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CaseDocumentListSerializer
        return CaseDocumentDetailSerializer

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        document = self.get_object()
        if document.status == 'signed':
            return Response(
                {'detail': 'Документ уже подписан.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success, message = document.sign(request.user)
        if success:
            serializer = self.get_serializer(document)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': message},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='convert-word')
    def convert_word(self, request):
        pass

    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        document = self.get_object()
        return self._generate_pdf(document)

    @action(detail=True, methods=['get'], url_path='export-word')
    def export_word(self, request, pk=None):
        document = self.get_object()
        return self._generate_word(document)

    def _generate_pdf(self, document):
        try:
            from weasyprint import HTML
            from django.template.loader import render_to_string
            import tempfile
            import os
            import atexit
            
            context = {
                'title': document.title,
                'content': document.content,
                'signature_text': document.signature_text,
                'created_at': document.created_at,
                'signed_at': document.signed_at,
                'created_by': document.created_by,
                'signed_by': document.signed_by,
            }
            
            html_content = render_to_string('case_documents/document_pdf.html', context)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                HTML(string=html_content).write_pdf(tmp_file.name)
                tmp_path = tmp_file.name
            
            response = FileResponse(
                open(tmp_path, 'rb'),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{document.title}.pdf"'
            
            atexit.register(lambda: os.unlink(tmp_path))
            
            return response
            
        except ImportError:
            return Response(
                {'error': 'PDF generation is not available. Please install weasyprint.'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        except Exception as e:
            return Response(
                {'error': f'Error generating PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _generate_word(self, document):
        try:
            from docx import Document as DocxDocument
            from docx.shared import Pt
            from docx.enum.text import WD_ALIGN_PARAGRAPH
            from html2text import HTML2Text
            import tempfile
            import os
            import atexit
            
            doc = DocxDocument()
            
            style = doc.styles['Normal']
            style.font.name = 'Times New Roman'
            style.font.size = Pt(14)
            
            title_para = doc.add_heading(document.title, level=1)
            title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            info_para = doc.add_paragraph()
            info_para.add_run(f"Создан: {document.created_at.strftime('%d.%m.%Y %H:%M') if document.created_at else '—'}\n").bold = True
            info_para.add_run(f"Кем создан: {document.created_by.get_full_name() or document.created_by.username if document.created_by else '—'}\n")
            if document.signed_at:
                info_para.add_run(f"Подписан: {document.signed_at.strftime('%d.%m.%Y %H:%M')}\n").bold = True
                info_para.add_run(f"Кем подписан: {document.signed_by.get_full_name() or document.signed_by.username if document.signed_by else '—'}\n")
            
            doc.add_paragraph()
            
            h = HTML2Text()
            h.ignore_links = False
            h.ignore_images = True
            h.body_width = 0
            
            text_content = h.handle(document.content)
            
            for paragraph in text_content.split('\n'):
                if paragraph.strip():
                    p = doc.add_paragraph(paragraph.strip())
                    p.paragraph_format.line_spacing = 1.5
            
            if document.signature_text:
                doc.add_paragraph()
                signature_para = doc.add_paragraph()
                signature_para.add_run(document.signature_text).italic = True
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_file:
                doc.save(tmp_file.name)
                tmp_path = tmp_file.name
            
            response = FileResponse(
                open(tmp_path, 'rb'),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="{document.title}.docx"'
            
            atexit.register(lambda: os.unlink(tmp_path))
            
            return response
            
        except ImportError as e:
            return Response(
                {'error': f'Word generation is not available: {str(e)}'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        except Exception as e:
            return Response(
                {'error': f'Error generating Word: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== ПЕРЕПИСАННЫЙ VIEWSET ДЛЯ ДОКУМЕНТОВ СТОРОН ==========

class PartyDocumentViewSet(viewsets.ModelViewSet):
    queryset = PartyDocument.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        case_type = self.request.query_params.get('case_type')
        case_id = self.request.query_params.get('case_id')
        
        if case_type and case_id:
            type_mapping = {
                'criminal': ('criminal_proceedings', 'criminalproceedings'),
                'civil': ('civil_proceedings', 'civilproceedings'),
                'kas': ('kas_proceedings', 'kasproceedings'),
                'administrative': ('administrative_proceedings', 'administrativeproceedings'),
            }
            if case_type in type_mapping:
                app_label, model_name = type_mapping[case_type]
                ct = ContentType.objects.get(app_label=app_label, model=model_name)
                qs = qs.filter(content_type=ct, object_id=case_id)
        
        if hasattr(user, 'social_provider'):
            return qs.filter(external_user=user)
        
        return qs
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PartyDocumentListSerializer
        elif self.action == 'create':
            return PartyDocumentCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PartyDocumentDetailSerializer
        return PartyDocumentDetailSerializer
    
    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        from side_case_access.permissions import IsInternalUser
        
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsInternalUser()]
        else:
            return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        request = self.request
        user = request.user
        
        if hasattr(user, 'social_provider'):
            serializer.save(
                external_user=user,
                submitter_name=user.full_name,
                submission_method='online'
            )
        else:
            serializer.save(
                submitted_by=user,
                submitter_name=user.get_full_name() or user.username,
                submission_method=request.data.get('submission_method', 'through_court')
            )

    @action(detail=True, methods=['post'], url_path='register')
    def register_document(self, request, pk=None):
        from side_case_access.permissions import IsInternalUser
        from case_registry.models import Correspondence, CorrespondenceCounter
        
        if not IsInternalUser().has_permission(request, self):
            return Response({'error': 'Только сотрудники суда могут регистрировать документы'}, status=403)
        
        document = self.get_object()
        
        if document.review_status != 'pending':
            return Response({'error': f'Документ уже зарегистрирован (статус: {document.review_status})'}, status=400)
        
        current_year = timezone.now().year
        counter, created = CorrespondenceCounter.objects.get_or_create(
            year=current_year,
            defaults={'incoming_counter': 0, 'outgoing_counter': 0}
        )
        counter.incoming_counter += 1
        counter.save()
        registration_number = f"Вх-{counter.incoming_counter}/{current_year}"
        
        previous_status = document.review_status
        document.register_document(registration_number, request.user)
        
        try:
            sender_name = document.submitter_name
            if document.submitter_role:
                sender_name = f"{document.submitter_name} ({document.submitter_role})"
            
            Correspondence.objects.create(
                correspondence_type='incoming',
                registration_number=registration_number,
                registration_date=document.registration_date.date() if document.registration_date else timezone.now().date(),
                document_type=document.get_document_type_display(),
                summary=f"[Документ стороны] {document.title}",
                sender=sender_name,
                recipient="Суд",
                pages_count=1,
                status='registered',
                notes=f"Зарегистрирован из PartyDocument ID: {document.id}",
            )
            logger.info(f"Создана запись в корреспонденции для документа {document.id} с номером {registration_number}")
        except Exception as e:
            logger.error(f"Ошибка создания записи в корреспонденции: {e}")
        
        PartyDocumentHistory.objects.create(
            document=document,
            previous_status=previous_status,
            new_status='registered',
            changed_by=request.user.get_full_name() or request.user.username,
            comment=f"Зарегистрирован с номером {registration_number}"
        )
        
        return Response({
            'message': 'Документ зарегистрирован',
            'registration_number': registration_number,
            'review_status': document.get_review_status_display()
        })

    # ОТДЕЛЬНЫЙ ЭНДПОИНТ ДЛЯ ОТКАЗА
    @action(detail=True, methods=['post'], url_path='reject')
    def reject_document(self, request, pk=None):
        from side_case_access.permissions import IsInternalUser
        
        if not IsInternalUser().has_permission(request, self):
            return Response({'error': 'Только сотрудники суда могут отклонять документы'}, status=403)
        
        document = self.get_object()
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response({'error': 'Необходимо указать причину отказа'}, status=400)
        
        previous_status = document.review_status
        document.reject_attachment(request.user, reason)
        
        PartyDocumentHistory.objects.create(
            document=document,
            previous_status=previous_status,
            new_status='rejected',
            changed_by=request.user.get_full_name() or request.user.username,
            comment=reason
        )
        
        return Response({
            'message': 'В приобщении документа отказано',
            'review_status': document.get_review_status_display(),
            'judge_decision': document.judge_decision
        })

    # ОТДЕЛЬНЫЙ ЭНДПОИНТ ДЛЯ ВОЗВРАТА
    @action(detail=True, methods=['post'], url_path='return-doc')
    def return_document(self, request, pk=None):
        from side_case_access.permissions import IsInternalUser
        
        if not IsInternalUser().has_permission(request, self):
            return Response({'error': 'Только сотрудники суда могут возвращать документы'}, status=403)
        
        document = self.get_object()
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response({'error': 'Необходимо указать причину возврата'}, status=400)
        
        previous_status = document.review_status
        document.return_to_submitter(request.user, reason)
        
        PartyDocumentHistory.objects.create(
            document=document,
            previous_status=previous_status,
            new_status='returned',
            changed_by=request.user.get_full_name() or request.user.username,
            comment=reason
        )
        
        return Response({
            'message': 'Документ возвращен заявителю',
            'review_status': document.get_review_status_display(),
            'judge_decision': document.judge_decision
        })

    # ОТДЕЛЬНЫЙ ЭНДПОИНТ ДЛЯ ПРИОБЩЕНИЯ
    @action(detail=True, methods=['post'], url_path='attach-to-case')
    def attach_to_case(self, request, pk=None):
        from side_case_access.permissions import IsInternalUser
        
        if not IsInternalUser().has_permission(request, self):
            return Response({'error': 'Только сотрудники суда могут приобщать документы к делу'}, status=403)
        
        document = self.get_object()
        previous_status = document.review_status
        
        document.review_status = 'attached_to_case'
        document.reviewed_by = request.user
        document.judge_decision_date = timezone.now()
        document.judge_decision = request.data.get('decision_text', 'Документ приобщен к материалам дела.')
        document.save()
        
        PartyDocumentHistory.objects.create(
            document=document,
            previous_status=previous_status,
            new_status='attached_to_case',
            changed_by=request.user.get_full_name() or request.user.username,
            comment=request.data.get('decision_text', 'Приобщен к материалам дела')
        )
        
        return Response({
            'message': 'Документ приобщен к материалам дела',
            'review_status': document.get_review_status_display()
        })
    
    @action(detail=True, methods=['get'], url_path='download')
    def download_document(self, request, pk=None):
        document = self.get_object()
        
        user = request.user
        if hasattr(user, 'social_provider'):
            if document.external_user != user:
                return Response({'error': 'У вас нет доступа к этому документу'}, status=403)
        
        if not document.document_file:
            return Response({'error': 'Файл документа не найден'}, status=404)
        
        if not os.path.exists(document.document_file.path):
            return Response({'error': 'Файл документа отсутствует на сервере'}, status=404)
        
        response = FileResponse(
            open(document.document_file.path, 'rb'),
            content_type='application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="{document.file_name or document.title}"'
        return response
    
    @action(detail=True, methods=['get'], url_path='history')
    def get_history(self, request, pk=None):
        document = self.get_object()
        history = document.history_entries.all()
        serializer = PartyDocumentHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def get_by_case(self, request):
        case_type = request.query_params.get('case_type')
        case_id = request.query_params.get('case_id')
        
        if not case_type or not case_id:
            return Response({'error': 'Необходимо указать case_type и case_id'}, status=400)
        
        type_mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
            'administrative': ('administrative_code', 'administrativeproceedings'),
        }
        
        if case_type not in type_mapping:
            return Response({'error': f'Неизвестный тип дела: {case_type}'}, status=400)
        
        app_label, model_name = type_mapping[case_type]
        ct = ContentType.objects.get(app_label=app_label, model=model_name)
        
        documents = PartyDocument.objects.filter(content_type=ct, object_id=case_id)
        serializer = PartyDocumentListSerializer(documents, many=True)
        return Response(serializer.data)


class SignedCourtDocumentDownloadView(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'], url_path='download-signed')
    def download_signed(self, request, pk=None):
        document = get_object_or_404(CaseDocument, pk=pk)
        
        if document.status != 'signed':
            return Response(
                {'error': 'Документ еще не подписан. Скачивание доступно только после подписания.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if document.generated_file and document.generated_file.path and os.path.exists(document.generated_file.path):
            response = FileResponse(
                open(document.generated_file.path, 'rb'),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{document.title}.pdf"'
            return response
        
        return self._generate_pdf_from_content(document)
    
    def _generate_pdf_from_content(self, document):
        try:
            from weasyprint import HTML
            from django.template.loader import render_to_string
            
            html_content = render_to_string('case_documents/pdf_template.html', {
                'title': document.title,
                'content': document.content,
                'signature_text': document.signature_text,
            })
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                HTML(string=html_content).write_pdf(tmp_file.name)
                tmp_path = tmp_file.name
            
            response = FileResponse(
                open(tmp_path, 'rb'),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{document.title}.pdf"'
            
            import atexit
            atexit.register(lambda: os.unlink(tmp_path))
            
            return response
        except Exception as e:
            return Response(
                {'error': f'Ошибка генерации PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='check-signed')
    def check_signed(self, request, pk=None):
        document = get_object_or_404(CaseDocument, pk=pk)
        return Response({
            'is_signed': document.status == 'signed',
            'status': document.status,
            'signed_at': document.signed_at,
            'signed_by': document.signed_by.get_full_name() if document.signed_by else None
        })


class BaseCaseDocumentViewSet(mixins.CreateModelMixin,
                              mixins.RetrieveModelMixin,
                              mixins.UpdateModelMixin,
                              mixins.DestroyModelMixin,
                              mixins.ListModelMixin,
                              viewsets.GenericViewSet):
    serializer_class = CaseDocumentDetailSerializer
    
    def get_queryset(self):
        raise NotImplementedError
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CaseDocumentListSerializer
        return super().get_serializer_class()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['case'] = self.get_case_object()
        return context
    
    def get_case_object(self):
        raise NotImplementedError
    
    def perform_create(self, serializer):
        case = self.get_case_object()
        content_type = ContentType.objects.get_for_model(case)
        serializer.save(
            content_type=content_type,
            object_id=case.id
        )
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        document = self.get_object()
        if document.status == 'signed':
            return Response(
                {'detail': 'Документ уже подписан.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success, message = document.sign(request.user)
        if success:
            serializer = self.get_serializer(document)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': message},
                status=status.HTTP_400_BAD_REQUEST
            )


class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        fields = ['id', 'app_label', 'model']

@action(detail=False, methods=['get'], url_path='content-types')
def get_content_types(self, request):
    """Получение списка content_types для дел"""
    models = ['criminalproceedings', 'civilproceedings', 'administrativeproceedings', 'kasproceedings']
    content_types = ContentType.objects.filter(model__in=models)
    serializer = ContentTypeSerializer(content_types, many=True)
    return Response(serializer.data)

def upload_image(request):
    if request.method == 'POST':
        messages.success(request, 'Изображение успешно загружено (заглушка).')
        return redirect('some-view-name')
    else:
        return render(request, 'case_documents/upload_image.html')
