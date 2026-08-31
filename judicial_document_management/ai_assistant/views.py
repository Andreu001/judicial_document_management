# ai_assistant/views.py
import json
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import (
    AISession, AIMessage, AICaseAnalysis, AIConfiguration,
    ChatSession, ChatMessage, UploadedFile
)
from .services import (
    CaseAnalyzer, DocumentReviewer, StatisticsAnalyzer,
    CitizenAssistant, AIService, ChatService, FileUploadService, UniversalAIService
)
from .serializers import (
    AISessionSerializer, AIMessageSerializer, AICaseAnalysisSerializer,
    AIConfigurationSerializer,
    ChatSessionSerializer, ChatMessageSerializer, 
    UploadedFileSerializer, ChatSessionCreateSerializer
)

User = get_user_model()


class AIConfigurationViewSet(viewsets.ModelViewSet):
    """Настройки AI ассистента"""
    
    queryset = AIConfiguration.objects.all()
    serializer_class = AIConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Только администраторы могут видеть настройки
        if self.request.user.role in ['admin', 'judge']:
            return self.queryset
        return self.queryset.none()
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Проверка статуса AI ассистента"""
        config = AIConfiguration.get_config()
        ai_service = AIService()
        
        return Response({
            'is_enabled': config.is_enabled,
            'model_loaded': ai_service.is_ready(),
            'model_type': config.model_type,
            'citizen_access': config.citizen_access_enabled,
        })


class AISessionViewSet(viewsets.ModelViewSet):
    """Сессии диалога с AI"""
    
    queryset = AISession.objects.all()
    serializer_class = AISessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(Q(user=user) | Q(user__isnull=True))
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Отправить сообщение в сессии"""
        session = self.get_object()
        message_text = request.data.get('message', '').strip()
        
        if not message_text:
            return Response({'error': 'Сообщение не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Сохраняем сообщение пользователя
        user_message = AIMessage.objects.create(
            session=session,
            role='user',
            content=message_text
        )
        
        # Получаем ответ AI
        ai_service = AIService()
        
        # Собираем историю диалога
        history = session.get_messages()
        context = "\n".join([f"{m.get_role_display()}: {m.content}" for m in history])
        
        prompt = f"""
История диалога:
{context}

Новое сообщение пользователя: {message_text}

Ответь на сообщение, учитывая историю диалога.
"""
        
        response = ai_service.generate_response(prompt)
        
        # Сохраняем ответ AI
        assistant_message = AIMessage.objects.create(
            session=session,
            role='assistant',
            content=response
        )
        
        return Response({
            'message': AIMessageSerializer(assistant_message).data
        })


class AIAnalysisViewSet(viewsets.ViewSet):
    """API для AI анализа дел"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def analyze_case(self, request):
        """
        Анализ дела
        """
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        analysis_type = request.data.get('analysis_type', 'full')
        
        if not case_type or not case_id:
            return Response({'error': 'Необходимо указать case_type и case_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем дело
        case = self._get_case(case_type, case_id)
        if not case:
            return Response({'error': 'Дело не найдено'}, status=status.HTTP_404_NOT_FOUND)
        
        # Проверяем права доступа
        if not self._check_case_access(request.user, case):
            return Response({'error': 'У вас нет доступа к этому делу'}, status=status.HTTP_403_FORBIDDEN)
        
        # Запускаем анализ
        analyzer = CaseAnalyzer()
        result = analyzer.analyze_case(case, analysis_type, request.user)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def analysis_history(self, request):
        """История анализов"""
        case_type = request.query_params.get('case_type')
        case_id = request.query_params.get('case_id')
        
        if case_type and case_id:
            ct = ContentType.objects.get(app_label=case_type, model=case_type)
            analyses = AICaseAnalysis.objects.filter(
                case_content_type=ct,
                case_object_id=case_id
            )
        else:
            analyses = AICaseAnalysis.objects.filter(created_by=request.user)
        
        return Response(AICaseAnalysisSerializer(analyses, many=True).data)
    
    @action(detail=False, methods=['post'])
    def review_document(self, request):
        """Проверка документа"""
        document_id = request.data.get('document_id')
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        
        if not document_id:
            return Response({'error': 'Необходимо указать document_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        from case_documents.models import CaseDocument
        
        try:
            document = CaseDocument.objects.get(id=document_id)
        except CaseDocument.DoesNotExist:
            return Response({'error': 'Документ не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        # Получаем дело, если указано
        case = None
        if case_type and case_id:
            case = self._get_case(case_type, case_id)
        
        # Проверяем доступ
        if case and not self._check_case_access(request.user, case):
            return Response({'error': 'У вас нет доступа к этому делу'}, status=status.HTTP_403_FORBIDDEN)
        
        reviewer = DocumentReviewer()
        result = reviewer.review_document(document, case)
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def analyze_statistics(self, request):
        """Анализ статистики суда"""
        period_days = request.data.get('period_days', 365)
        
        analyzer = StatisticsAnalyzer()
        result = analyzer.analyze_court_statistics(period_days=period_days)
        
        return Response(result)
    
    def _get_case(self, case_type: str, case_id: int):
        """Получает дело по типу и ID"""
        models = {
            'criminal': 'criminal_proceedings.CriminalProceedings',
            'civil': 'civil_proceedings.CivilProceedings',
            'coap': 'administrative_code.AdministrativeProceedings',
            'kas': 'administrative_proceedings.KasProceedings',
        }
        
        model_path = models.get(case_type)
        if not model_path:
            return None
        
        from django.apps import apps
        model = apps.get_model(model_path)
        
        try:
            return model.objects.get(id=case_id)
        except model.DoesNotExist:
            return None
    
    def _check_case_access(self, user, case) -> bool:
        """Проверяет доступ пользователя к делу"""
        # Судьи имеют доступ к своим делам
        if user.role == 'judge':
            if hasattr(case, 'presiding_judge') and case.presiding_judge == user:
                return True
        # Администраторы имеют доступ ко всем делам
        if user.role == 'admin':
            return True
        return False


class CitizenAIAssistantViewSet(viewsets.ViewSet):
    """API для помощи гражданам"""
    
    @action(detail=False, methods=['post'])
    def ask(self, request):
        """Задать вопрос"""
        question = request.data.get('question', '').strip()
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        
        if not question:
            return Response({'error': 'Вопрос не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем внешнего пользователя
        external_user = request.external_user if hasattr(request, 'external_user') else None
        
        # Получаем дело, если указано
        case = None
        if case_type and case_id:
            case = self._get_case(case_type, case_id)
        
        assistant = CitizenAssistant()
        result = assistant.get_help(question, case, external_user)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Статус доступа для граждан"""
        config = AIConfiguration.get_config()
        
        return Response({
            'available': config.is_enabled and config.citizen_access_enabled,
            'message': 'Доступ к AI ассистенту для граждан' if config.citizen_access_enabled else 'Доступ ограничен',
        })
    
    def _get_case(self, case_type: str, case_id: int):
        models = {
            'criminal': 'criminal_proceedings.CriminalProceedings',
            'civil': 'civil_proceedings.CivilProceedings',
            'coap': 'administrative_code.AdministrativeProceedings',
            'kas': 'administrative_proceedings.KasProceedings',
        }
        
        model_path = models.get(case_type)
        if not model_path:
            return None
        
        from django.apps import apps
        model = apps.get_model(model_path)
        
        try:
            return model.objects.get(id=case_id)
        except model.DoesNotExist:
            return None


class ChatSessionViewSet(viewsets.ModelViewSet):
    """Управление чат-сессиями"""
    
    permission_classes = [IsAuthenticated]
    # ✅ Исправлено: JSONParser для create, MultiPartParser для send_message
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_queryset(self):
        return ChatSession.objects.filter(
            Q(user=self.request.user) | Q(user__isnull=True),
            is_active=True
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChatSessionCreateSerializer
        return ChatSessionSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def send_message(self, request, pk=None):
        """Отправка сообщения в сессии"""
        session = self.get_object()
        message = request.data.get('message', '').strip()
        files = request.FILES.getlist('files', [])
        
        if not message:
            return Response(
                {'error': 'Сообщение не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Загружаем файлы
        uploaded_files = []
        if files:
            file_service = FileUploadService()
            for file in files:
                uploaded = file_service.upload_file(file, request.user, session)
                uploaded_files.append(uploaded)
        
        # Отправляем сообщение
        chat_service = ChatService()
        result = chat_service.send_message(session, message, uploaded_files)
        
        return Response({
            'message': ChatMessageSerializer(result['message']).data,
            'response': result['response'],
            'files': UploadedFileSerializer(uploaded_files, many=True).data if uploaded_files else []
        })
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Получение истории сообщений"""
        session = self.get_object()
        messages = session.get_messages()
        return Response(ChatMessageSerializer(messages, many=True).data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Архивирование сессии"""
        session = self.get_object()
        chat_service = ChatService()
        chat_service.archive_session(session)
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановление сессии"""
        session = self.get_object()
        session.is_archived = False
        session.is_active = True
        session.save()
        return Response({'status': 'restored'})
    
    @action(detail=True, methods=['post'])
    def clear_messages(self, request, pk=None):
        """Очистка истории сообщений"""
        session = self.get_object()
        session.messages.all().delete()
        session.message_count = 0
        session.save()
        return Response({'status': 'cleared'})
    
    @action(detail=True, methods=['post'])
    def set_context(self, request, pk=None):
        """Установка контекста сессии"""
        session = self.get_object()
        context = request.data.get('context', {})
        chat_service = ChatService()
        chat_service.update_context(session, context)
        return Response({'status': 'updated', 'context': session.context})


class ChatFileViewSet(viewsets.ViewSet):
    """Управление файлами в чате"""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Загрузка файла"""
        file = request.FILES.get('file')
        session_id = request.data.get('session_id')
        
        if not file:
            return Response(
                {'error': 'Файл не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем сессию
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response(
                    {'error': 'Сессия не найдена'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Загружаем файл
        file_service = FileUploadService()
        uploaded = file_service.upload_file(file, request.user, session)
        
        return Response(UploadedFileSerializer(uploaded).data)
    
    @action(detail=False, methods=['get'])
    def list_files(self, request):
        """Список файлов пользователя"""
        files = UploadedFile.objects.filter(user=request.user)
        return Response(UploadedFileSerializer(files, many=True).data)
    
    @action(detail=True, methods=['delete'])
    def delete(self, request, pk=None):
        """Удаление файла"""
        file_service = FileUploadService()
        if file_service.delete_file(pk, request.user):
            return Response({'status': 'deleted'})
        return Response(
            {'error': 'Файл не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=True, methods=['get'])
    def content(self, request, pk=None):
        """Получение содержимого файла"""
        file_service = FileUploadService()
        file_obj = file_service.get_file(pk, request.user)
        
        if not file_obj:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'id': file_obj.id,
            'file_name': file_obj.file_name,
            'file_type': file_obj.file_type,
            'extracted_text': file_obj.extracted_text[:5000],
            'processing_error': file_obj.processing_error,
            'processed': file_obj.processed
        })


class UniversalAIViewSet(viewsets.ViewSet):
    """Универсальный AI ассистент - быстрые запросы без сессии"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def ask(self, request):
        """Быстрый запрос к AI"""
        question = request.data.get('question', '').strip()
        context = request.data.get('context', {})
        
        if not question:
            return Response(
                {'error': 'Вопрос не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = UniversalAIService()
        
        # Формируем сообщения
        messages = []
        
        # Добавляем контекст
        if context:
            context_str = json.dumps(context, ensure_ascii=False, indent=2)
            messages.append({
                'role': 'system',
                'content': f"Контекст запроса: {context_str}"
            })
        
        messages.append({
            'role': 'user',
            'content': question
        })
        
        # Генерируем ответ
        response = ai_service.generate_response(messages)
        
        return Response({
            'question': question,
            'answer': response,
            'context': context
        })
    
    @action(detail=False, methods=['post'])
    def analyze_document(self, request):
        """Анализ документа (быстрый)"""
        text = request.data.get('text', '').strip()
        file_id = request.data.get('file_id')
        
        if not text and not file_id:
            return Response(
                {'error': 'Предоставьте текст или ID файла'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Если есть file_id, получаем текст из файла
        if file_id:
            try:
                file_obj = UploadedFile.objects.get(id=file_id, user=request.user)
                text = file_obj.extracted_text[:10000]
            except UploadedFile.DoesNotExist:
                return Response(
                    {'error': 'Файл не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if not text:
            return Response(
                {'error': 'Текст документа не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = UniversalAIService()
        
        messages = [
            {
                'role': 'system',
                'content': """Ты - юридический эксперт. Проанализируй предоставленный документ.
Выдели ключевые моменты, проверь на соответствие законодательству,
укажи на возможные ошибки и дай рекомендации."""
            },
            {
                'role': 'user',
                'content': f"Проанализируй документ:\n\n{text[:5000]}"
            }
        ]
        
        response = ai_service.generate_response(messages)
        
        return Response({
            'analysis': response,
            'document_length': len(text)
        })
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Статус AI сервиса"""
        ai_service = UniversalAIService()
        return Response({
            'available': ai_service.is_ready(),
            'model': ai_service.model_name,
            'is_ollama': ai_service.is_ollama_available
        })
