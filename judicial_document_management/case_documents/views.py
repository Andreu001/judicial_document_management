# case_documents/views.py - ИСПРАВЛЕННАЯ ВЕРСИЯ С WEASYPRINT

from rest_framework import viewsets, status, mixins
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse, HttpResponse, Http404
from django.utils import timezone
from django.template.loader import render_to_string
from .models import CaseDocument, DocumentTemplate, PartyDocument, PartyDocumentHistory
from .serializers import (
    CaseDocumentListSerializer,
    CaseDocumentDetailSerializer,
    DocumentTemplateSerializer,
    PartyDocumentListSerializer,
    PartyDocumentDetailSerializer,
    PartyDocumentCreateSerializer,
    PartyDocumentHistorySerializer,
)
import os
import tempfile
import io
import re
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


# ================================================================
# ГЕНЕРАТОР PDF ЧЕРЕЗ WEASYPRINT С ПОЛНОЙ ПОДДЕРЖКОЙ HTML/CSS
# ================================================================

def generate_pdf_weasyprint(title, content, signature_text=""):
    """
    Генерирует PDF с использованием weasyprint
    Полная поддержка HTML/CSS, кириллица, отступы, стили
    """
    try:
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        
        # Путь к шрифту
        font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'DejaVuSans.ttf')
        
        # Проверяем наличие шрифта
        if not os.path.exists(font_path):
            logger.warning(f"Font not found at {font_path}, using system fonts")
            font_path = None
        
        # Подготавливаем HTML-контент с сохранением всех стилей
        # Оборачиваем контент в div с классом content, чтобы сохранить все HTML-теги
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{
                    size: A4;
                    margin: 2.5cm 2cm 2cm 2cm;
                    @top-center {{
                        content: "";
                    }}
                }}
                body {{
                    font-family: 'DejaVu Sans', 'Arial', 'Helvetica', sans-serif;
                    font-size: 12pt;
                    line-height: 1.5;
                    color: #000000;
                }}
                h1 {{
                    text-align: center;
                    font-size: 18pt;
                    margin-bottom: 24pt;
                    font-weight: bold;
                }}
                h2 {{
                    font-size: 16pt;
                    margin-top: 16pt;
                    margin-bottom: 8pt;
                    font-weight: bold;
                }}
                h3 {{
                    font-size: 14pt;
                    margin-top: 12pt;
                    margin-bottom: 6pt;
                    font-weight: bold;
                }}
                p {{
                    margin: 0 0 6pt 0;
                    text-align: justify;
                    line-height: 1.5;
                    text-indent: 1.25cm;
                }}
                .no-indent {{
                    text-indent: 0;
                }}
                .center {{
                    text-align: center;
                }}
                .right {{
                    text-align: right;
                }}
                .left {{
                    text-align: left;
                }}
                .signature {{
                    margin-top: 48pt;
                    padding-top: 24pt;
                    border-top: 2px solid #000000;
                }}
                .bold {{
                    font-weight: bold;
                }}
                .italic {{
                    font-style: italic;
                }}
                .underline {{
                    text-decoration: underline;
                }}
                .small {{
                    font-size: 10pt;
                }}
                .large {{
                    font-size: 14pt;
                }}
                .list-item {{
                    padding-left: 1.25cm;
                }}
                .meta-info {{
                    margin-bottom: 24pt;
                    padding: 12pt;
                    background: #f5f5f5;
                    border-radius: 4pt;
                }}
                br {{
                    display: block;
                    content: "";
                    margin: 4pt 0;
                }}
                .content {{
                    font-size: 12pt;
                    line-height: 1.5;
                }}
                .content p {{
                    text-indent: 1.25cm;
                }}
                .content p:first-of-type {{
                    text-indent: 0;
                }}
                .content .no-indent {{
                    text-indent: 0;
                }}
            </style>
        </head>
        <body>
            <h1>{title or ''}</h1>
            <div class="content">
                {content or ''}
            </div>
            {f'<div class="signature">{signature_text}</div>' if signature_text else ''}
        </body>
        </html>
        """
        
        # Настройка шрифтов
        font_config = FontConfiguration()
        
        # Создаем PDF
        if font_path:
            # Создаем CSS с указанием шрифта
            css = CSS(string=f'@font-face {{ font-family: "DejaVu Sans"; src: url("{font_path}"); }}')
            html = HTML(string=html_content, base_url=settings.BASE_DIR)
            pdf_buffer = io.BytesIO()
            html.write_pdf(pdf_buffer, stylesheets=[css], font_config=font_config)
        else:
            html = HTML(string=html_content)
            pdf_buffer = io.BytesIO()
            html.write_pdf(pdf_buffer, font_config=font_config)
        
        pdf_buffer.seek(0)
        return pdf_buffer
        
    except ImportError as e:
        logger.error(f"weasyprint not installed: {e}")
        return None
    except Exception as e:
        logger.error(f"Error generating PDF with weasyprint: {e}")
        return None


# ================================================================
# КЛАСС ДЛЯ СКАЧИВАНИЯ ПОДПИСАННЫХ ДОКУМЕНТОВ
# ================================================================

class SignedDocumentDownloadView(APIView):
    """
    View для скачивания подписанного судебного документа (CaseDocument).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = get_object_or_404(CaseDocument, pk=pk)
        
        if document.status != 'signed':
            return Response(
                {'error': 'Документ еще не подписан.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем наличие сгенерированного файла
        if document.generated_file and document.generated_file.path and os.path.exists(document.generated_file.path):
            response = FileResponse(
                open(document.generated_file.path, 'rb'),
                content_type='application/pdf'
            )
            filename = f"{document.title}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        # Генерируем PDF через weasyprint
        pdf_buffer = generate_pdf_weasyprint(
            document.title,
            document.content,
            document.signature_text
        )
        
        if pdf_buffer:
            response = FileResponse(
                pdf_buffer,
                content_type='application/pdf'
            )
            filename = f"{document.title}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        else:
            return Response(
                {'error': 'Не удалось сгенерировать PDF. Установите weasyprint: pip install weasyprint'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )


# ================================================================
# КЛАСС ДЛЯ СКАЧИВАНИЯ ДОКУМЕНТОВ СТОРОН
# ================================================================

class PartyDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = get_object_or_404(PartyDocument, pk=pk)
        
        user = request.user
        
        if hasattr(user, 'social_provider'):
            if document.external_user != user:
                return Response(
                    {'error': 'У вас нет доступа к этому документу'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        if not document.document_file:
            return Response(
                {'error': 'Файл документа не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not os.path.exists(document.document_file.path):
            return Response(
                {'error': 'Файл документа отсутствует на сервере'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        content_type = 'application/octet-stream'
        filename = document.file_name or document.title
        
        if filename.endswith('.pdf'):
            content_type = 'application/pdf'
        elif filename.endswith('.docx'):
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif filename.endswith('.doc'):
            content_type = 'application/msword'
        
        response = FileResponse(
            open(document.document_file.path, 'rb'),
            content_type=content_type
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


# ================================================================
# ОСТАЛЬНЫЕ VIEWS
# ================================================================

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
    
    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        document = self.get_object()
        
        pdf_buffer = generate_pdf_weasyprint(
            document.title,
            document.content,
            document.signature_text
        )
        
        if pdf_buffer:
            response = FileResponse(
                pdf_buffer,
                content_type='application/pdf'
            )
            filename = f"{document.title}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        else:
            return Response(
                {'error': 'Не удалось сгенерировать PDF. Установите weasyprint: pip install weasyprint'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

    @action(detail=True, methods=['get'], url_path='export-word')
    def export_word(self, request, pk=None):
        document = self.get_object()
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


# ================================================================
# VIEW ДЛЯ ПОЛУЧЕНИЯ CONTENT_TYPES
# ================================================================

class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        fields = ['id', 'app_label', 'model']


def get_content_types(request):
    models = ['criminalproceedings', 'civilproceedings', 'administrativeproceedings', 'kasproceedings']
    content_types = ContentType.objects.filter(model__in=models)
    serializer = ContentTypeSerializer(content_types, many=True)
    return Response(serializer.data)