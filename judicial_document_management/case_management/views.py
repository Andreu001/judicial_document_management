# case_management/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Notification, NotificationType, NotificationTemplate,
    CaseProgressEntry, ProgressActionType
)
from .serializers import (
    NotificationSerializer, NotificationTypeSerializer,
    CaseProgressEntrySerializer, ProgressActionTypeSerializer,
    NotificationCreateSerializer, NotificationTemplateSerializer
)
from .services import NotificationService


class NotificationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationType.objects.all()
    serializer_class = NotificationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для получения шаблонов повесток"""
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        case_category = self.request.query_params.get('case_category')
        participant_type = self.request.query_params.get('participant_type')
        
        if case_category:
            queryset = queryset.filter(case_category=case_category)
        if participant_type:
            queryset = queryset.filter(participant_type=participant_type)
        
        return queryset
    
    @action(detail=True, methods=['post'], url_path='preview')
    def preview(self, request, pk=None):
        """
        Предпросмотр повестки с подстановкой данных
        """
        template = self.get_object()
        case_id = request.data.get('case_id')
        participant_type = request.data.get('participant_type')
        participant_id = request.data.get('participant_id')
        hearing_date = request.data.get('hearing_date')
        hearing_room = request.data.get('hearing_room')
        
        if not case_id:
            return Response({'error': 'Не указан ID дела'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Получаем дело - динамически определяем модель
        case = self._get_case_by_id(case_id)
        if not case:
            return Response({'error': f'Дело с ID {case_id} не найдено'}, status=status.HTTP_404_NOT_FOUND)
        
        # Получаем участника - динамически
        participant = None
        if participant_type and participant_id:
            participant = self._get_participant_by_type_and_id(participant_type, participant_id)
        
        context = NotificationService.prepare_context(case, participant, hearing_date, hearing_room)
        rendered_text = NotificationService.render_notification_text(template.content, context)
        
        return Response({
            'template_id': template.id,
            'template_name': template.name,
            'form_number': template.form_number,
            'rendered_text': rendered_text,
            'variables_used': context
        })
    
    def _get_case_by_id(self, case_id):
        """Динамическое получение дела по ID из любого приложения"""
        case_models = self._get_all_case_models()
        
        for model in case_models:
            try:
                return model.objects.get(id=case_id)
            except model.DoesNotExist:
                continue
        return None
    
    def _get_all_case_models(self):
        """Получение всех моделей дел из всех приложений"""
        case_models = []
        
        try:
            from criminal_proceedings.models import CriminalProceedings
            case_models.append(CriminalProceedings)
        except ImportError:
            pass
        
        try:
            from civil_proceedings.models import CivilProceedings
            case_models.append(CivilProceedings)
        except ImportError:
            pass
        
        try:
            from administrative_proceedings.models import AdministrativeProceedings as AdminProc
            case_models.append(AdminProc)
        except ImportError:
            pass
        
        try:
            from kas_proceedings.models import KasProceedings
            case_models.append(KasProceedings)
        except ImportError:
            pass
        
        try:
            from admin_proceedings.models import AdminProceedings
            case_models.append(AdminProceedings)
        except ImportError:
            pass
        
        try:
            from other_materials.models import OtherMaterial
            case_models.append(OtherMaterial)
        except ImportError:
            pass
        
        return case_models
    
    def _get_all_participant_models(self):
        """Получение всех моделей участников из всех приложений"""
        participant_models = []
        
        # Уголовные участники
        try:
            from criminal_proceedings.models import Defendant, LawyerCriminal, CriminalSidesCaseInCase, Victim, Witness, Expert
            participant_models.extend([Defendant, LawyerCriminal, CriminalSidesCaseInCase, Victim, Witness, Expert])
        except ImportError:
            pass
        
        # Гражданские участники
        try:
            from civil_proceedings.models import CivilSide, CivilRepresentative
            participant_models.extend([CivilSide, CivilRepresentative])
        except ImportError:
            pass
        
        # Административные участники
        try:
            from administrative_proceedings.models import AdministrativeSide, AdministrativeRepresentative
            participant_models.extend([AdministrativeSide, AdministrativeRepresentative])
        except ImportError:
            pass
        
        # КАС участники
        try:
            from kas_proceedings.models import KasSide, KasRepresentative
            participant_models.extend([KasSide, KasRepresentative])
        except ImportError:
            pass
        
        return participant_models
    
    def _get_participant_by_type_and_id(self, participant_type, participant_id):
        """Динамическое получение участника по типу и ID"""
        participant_models = self._get_all_participant_models()
        
        participant_type_lower = participant_type.lower()
        
        for model in participant_models:
            model_name_lower = model.__name__.lower()
            # Проверяем совпадение по имени модели
            if (participant_type_lower == model_name_lower or 
                participant_type_lower in model_name_lower or 
                model_name_lower in participant_type_lower):
                try:
                    return model.objects.get(id=participant_id)
                except model.DoesNotExist:
                    continue
        
        return None


class ProgressActionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProgressActionType.objects.all()
    serializer_class = ProgressActionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationViewSet(viewsets.ModelViewSet):
    """Универсальный ViewSet для работы с уведомлениями любых дел"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Notification.objects.all()
        case_id = self.request.query_params.get('case_id')
        
        if case_id:
            # Ищем дело среди всех типов
            case = self._get_case_by_id(case_id)
            if case:
                content_type = ContentType.objects.get_for_model(case)
                return queryset.filter(case_content_type=content_type, case_object_id=case_id)
        
        # Фильтр по участнику
        participant_type = self.request.query_params.get('participant_type')
        participant_id = self.request.query_params.get('participant_id')
        
        if participant_type and participant_id:
            # Пробуем найти модель по имени
            for app_label in ['criminal_proceedings', 'civil_proceedings', 'administrative_proceedings', 'kas_proceedings', 'admin_proceedings']:
                try:
                    content_type = ContentType.objects.get(app_label=app_label, model=participant_type.lower())
                    return queryset.filter(content_type=content_type, object_id=participant_id)
                except ContentType.DoesNotExist:
                    continue
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        case_id = self.request.query_params.get('case_id') or self.request.data.get('case_id')
        if case_id:
            case = self._get_case_by_id(case_id)
            if case:
                context['case'] = case
        return context

    def perform_create(self, serializer):
        case = self.get_serializer_context().get('case')
        if case:
            case_content_type = ContentType.objects.get_for_model(case)
            serializer.save(
                case_content_type=case_content_type,
                case_object_id=case.id,
                created_by=self.request.user
            )
        else:
            serializer.save(created_by=self.request.user)
    
    def _get_case_by_id(self, case_id):
        """Динамическое получение дела по ID из любого приложения"""
        case_models = self._get_all_case_models()
        
        for model in case_models:
            try:
                return model.objects.get(id=case_id)
            except model.DoesNotExist:
                continue
        return None
    
    def _get_all_case_models(self):
        """Получение всех моделей дел из всех приложений"""
        case_models = []
        
        # Пробуем импортировать модели из разных приложений
        try:
            from criminal_proceedings.models import CriminalProceedings
            case_models.append(CriminalProceedings)
        except ImportError:
            pass
        
        try:
            from civil_proceedings.models import CivilProceedings
            case_models.append(CivilProceedings)
        except ImportError:
            pass
        
        try:
            from administrative_proceedings.models import AdministrativeProceedings as AdminProc
            case_models.append(AdminProc)
        except ImportError:
            pass
        
        try:
            from kas_proceedings.models import KasProceedings
            case_models.append(KasProceedings)
        except ImportError:
            pass
        
        try:
            from admin_proceedings.models import AdminProceedings
            case_models.append(AdminProceedings)
        except ImportError:
            pass
        
        try:
            from other_materials.models import OtherMaterial
            case_models.append(OtherMaterial)
        except ImportError:
            pass
        
        return case_models


class CriminalCaseProgressViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с записями хода дела конкретного уголовного производства"""
    serializer_class = CaseProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return CaseProgressEntry.objects.none()
        
        # Динамически получаем дело
        try:
            from criminal_proceedings.models import CriminalProceedings
            criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
            content_type = ContentType.objects.get_for_model(criminal_case)
            return CaseProgressEntry.objects.filter(
                case_content_type=content_type,
                case_object_id=criminal_case.id
            ).order_by('-action_date', '-created_date')
        except ImportError:
            return CaseProgressEntry.objects.none()

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        try:
            from criminal_proceedings.models import CriminalProceedings
            criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
            content_type = ContentType.objects.get_for_model(criminal_case)
            
            description = self.request.data.get('description', '')
            
            serializer.save(
                case_content_type=content_type,
                case_object_id=criminal_case.id,
                author=self.request.user,
                description=description or ''
            )
        except ImportError:
            pass


class CriminalCaseNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с уведомлениями конкретного уголовного производства"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return Notification.objects.none()
        
        try:
            from criminal_proceedings.models import CriminalProceedings
            criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
            content_type = ContentType.objects.get_for_model(criminal_case)
            return Notification.objects.filter(
                case_content_type=content_type,
                case_object_id=criminal_case.id
            ).order_by('-sent_date')
        except ImportError:
            return Notification.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        case_id = self.kwargs.get('case_id')
        if case_id:
            try:
                from criminal_proceedings.models import CriminalProceedings
                case = CriminalProceedings.objects.get(pk=case_id)
                context['case'] = case
            except (ImportError, CriminalProceedings.DoesNotExist):
                pass
        return context

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        try:
            from criminal_proceedings.models import CriminalProceedings
            criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
            case_content_type = ContentType.objects.get_for_model(criminal_case)
            serializer.save(
                case_content_type=case_content_type,
                case_object_id=criminal_case.id,
                created_by=self.request.user
            )
        except ImportError:
            serializer.save(created_by=self.request.user)