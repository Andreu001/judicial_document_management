from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from criminal_proceedings.models import CriminalProceedings
from .models import Notification, NotificationType, CaseProgressEntry, ProgressActionType
from .serializers import (
    NotificationSerializer, NotificationTypeSerializer,
    CaseProgressEntrySerializer, ProgressActionTypeSerializer, NotificationCreateSerializer
)

# Маппинг case_type на model_name
CASE_TYPE_TO_MODEL = {
    'civil_proceedings': 'civilproceedings',
    'criminal_proceedings': 'criminalproceedings',
    'administrative_proceedings': 'administrativeproceedings',
    'administrative_code': 'administrativecode',
    'kas_proceedings': 'kasproceedings',
}

class NotificationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationType.objects.all()
    serializer_class = NotificationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProgressActionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProgressActionType.objects.all()
    serializer_class = ProgressActionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        case_type = self.request.query_params.get('case_type')
        case_id = self.request.query_params.get('case_id')
        
        if case_type and case_id:
            try:
                model_name = CASE_TYPE_TO_MODEL.get(case_type, case_type.lower())
                content_type = ContentType.objects.get(app_label=case_type, model=model_name)
                return queryset.filter(case_content_type=content_type, case_object_id=case_id)
            except ContentType.DoesNotExist:
                return queryset.none()
        
        participant_type = self.request.query_params.get('participant_type')
        participant_id = self.request.query_params.get('participant_id')
        
        if participant_type and participant_id:
            try:
                content_type = ContentType.objects.get(app_label='business_card', model=participant_type)
                return queryset.filter(content_type=content_type, object_id=participant_id)
            except ContentType.DoesNotExist:
                return queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save()

    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

class CaseProgressEntryViewSet(viewsets.ModelViewSet):
    queryset = CaseProgressEntry.objects.all()  # ← ДОБАВИТЬ ЭТУ СТРОКУ
    serializer_class = CaseProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()  # ← ИЗМЕНИТЬ
        case_type = self.request.query_params.get('case_type')
        case_id = self.request.query_params.get('case_id')
        
        if case_type and case_id:
            try:
                model_name = CASE_TYPE_TO_MODEL.get(case_type, case_type.lower())
                content_type = ContentType.objects.get(app_label=case_type, model=model_name)
                return queryset.filter(case_content_type=content_type, case_object_id=case_id)
            except ContentType.DoesNotExist:
                return queryset.none()
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        action_type_id = request.data.get('action_type_id')
        description = request.data.get('description')
        action_date = request.data.get('action_date')
        
        if not all([case_type, case_id, action_type_id]):
            return Response(
                {'error': 'Missing required fields: case_type, case_id, action_type_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        model_name = CASE_TYPE_TO_MODEL.get(case_type, case_type.lower())
        
        try:
            content_type = ContentType.objects.get(app_label=case_type, model=model_name)
            case_obj = content_type.get_object_for_this_type(pk=case_id)
        except ContentType.DoesNotExist:
            return Response(
                {'error': f'Invalid case_type: {case_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        entry = CaseProgressEntry.objects.create(
            case=case_obj,
            action_type_id=action_type_id,
            description=description or '',
            action_date=action_date or timezone.now().date(),
            author=request.user
        )
        
        serializer = self.get_serializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def auto_create(self, request):
        """Автоматическое создание записи при отправке уведомления"""
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        notification_id = request.data.get('notification_id')
        action_type_id = request.data.get('action_type_id')
        description = request.data.get('description')
        
        if not all([case_type, case_id, notification_id, action_type_id]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        model_name = CASE_TYPE_TO_MODEL.get(case_type, case_type.lower())
        
        try:
            content_type = ContentType.objects.get(app_label=case_type, model=model_name)
            case_obj = content_type.get_object_for_this_type(pk=case_id)
        except ContentType.DoesNotExist:
            return Response({'error': f'Invalid case_type: {case_type}'}, status=status.HTTP_400_BAD_REQUEST)
        
        notification = get_object_or_404(Notification, pk=notification_id)
        
        entry = CaseProgressEntry.objects.create(
            case=case_obj,
            action_type_id=action_type_id,
            description=description or f"Направлено извещение: {notification.notification_type.name}",
            action_date=timezone.now().date(),
            author=request.user,
            related_notification=notification
        )
        
        return Response(CaseProgressEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    

class CriminalCaseProgressViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с записями хода дела конкретного уголовного производства"""
    serializer_class = CaseProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return CaseProgressEntry.objects.none()
        
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        content_type = ContentType.objects.get_for_model(criminal_case)
        return CaseProgressEntry.objects.filter(
            case_content_type=content_type,
            case_object_id=criminal_case.id
        ).order_by('-action_date', '-created_date')

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        content_type = ContentType.objects.get_for_model(criminal_case)
        serializer.save(
            case_content_type=content_type,
            case_object_id=criminal_case.id,
            author=self.request.user
        )


class CriminalCaseNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с уведомлениями конкретного уголовного производства"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return Notification.objects.none()
        
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        content_type = ContentType.objects.get_for_model(criminal_case)
        return Notification.objects.filter(
            case_content_type=content_type,
            case_object_id=criminal_case.id
        ).order_by('-sent_date')

    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import NotificationCreateForParticipantSerializer
            return NotificationCreateForParticipantSerializer
        return NotificationSerializer

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        case_content_type = ContentType.objects.get_for_model(criminal_case)
        serializer.save(
            case_content_type=case_content_type,
            case_object_id=criminal_case.id,
            created_by=self.request.user
        )# case_management/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from criminal_proceedings.models import CriminalProceedings
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
        
        # Получаем дело
        case = get_object_or_404(CriminalProceedings, pk=case_id)
        
        # Получаем участника
        participant = None
        if participant_type and participant_id:
            from criminal_proceedings.models import Defendant, LawyerCriminal, CriminalSidesCaseInCase
            model_map = {
                'defendant': Defendant,
                'lawyer': LawyerCriminal,
                'side': CriminalSidesCaseInCase
            }
            model = model_map.get(participant_type)
            if model:
                try:
                    participant = model.objects.get(id=participant_id)
                except model.DoesNotExist:
                    pass
        
        context = NotificationService.prepare_context(case, participant, hearing_date, hearing_room)
        rendered_text = NotificationService.render_notification_text(template.content, context)
        
        return Response({
            'template_id': template.id,
            'template_name': template.name,
            'form_number': template.form_number,
            'rendered_text': rendered_text,
            'variables_used': context
        })


class ProgressActionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProgressActionType.objects.all()
    serializer_class = ProgressActionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        case_type = self.request.query_params.get('case_type')
        case_id = self.request.query_params.get('case_id')
        
        if case_type and case_id:
            try:
                app_label_map = {
                    'criminal_proceedings': 'criminal_proceedings',
                    'civil_proceedings': 'civil_proceedings',
                    'administrative_proceedings': 'administrative_proceedings',
                }
                model_name_map = {
                    'criminal_proceedings': 'criminalproceedings',
                    'civil_proceedings': 'civilproceedings',
                    'administrative_proceedings': 'administrativeproceedings',
                }
                app_label = app_label_map.get(case_type, case_type)
                model_name = model_name_map.get(case_type, case_type.lower())
                content_type = ContentType.objects.get(app_label=app_label, model=model_name)
                return queryset.filter(case_content_type=content_type, case_object_id=case_id)
            except ContentType.DoesNotExist:
                return queryset.none()
        
        participant_type = self.request.query_params.get('participant_type')
        participant_id = self.request.query_params.get('participant_id')
        
        if participant_type and participant_id:
            try:
                content_type = ContentType.objects.get(app_label='criminal_proceedings', model=participant_type)
                return queryset.filter(content_type=content_type, object_id=participant_id)
            except ContentType.DoesNotExist:
                return queryset.none()
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        case_id = self.request.data.get('case_id') or self.kwargs.get('case_id')
        if case_id:
            try:
                case = CriminalProceedings.objects.get(pk=case_id)
                context['case'] = case
            except CriminalProceedings.DoesNotExist:
                pass
        return context


class CriminalCaseProgressViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с записями хода дела конкретного уголовного производства"""
    serializer_class = CaseProgressEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return CaseProgressEntry.objects.none()
        
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        content_type = ContentType.objects.get_for_model(criminal_case)
        return CaseProgressEntry.objects.filter(
            case_content_type=content_type,
            case_object_id=criminal_case.id
        ).order_by('-action_date', '-created_date')

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        content_type = ContentType.objects.get_for_model(criminal_case)
        serializer.save(
            case_content_type=content_type,
            case_object_id=criminal_case.id,
            author=self.request.user
        )


class CriminalCaseNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с уведомлениями конкретного уголовного производства"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_id')
        if not case_id:
            return Notification.objects.none()
        
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        content_type = ContentType.objects.get_for_model(criminal_case)
        return Notification.objects.filter(
            case_content_type=content_type,
            case_object_id=criminal_case.id
        ).order_by('-sent_date')

    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        case_id = self.kwargs.get('case_id')
        if case_id:
            try:
                case = CriminalProceedings.objects.get(pk=case_id)
                context['case'] = case
            except CriminalProceedings.DoesNotExist:
                pass
        return context

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_id')
        criminal_case = get_object_or_404(CriminalProceedings, pk=case_id)
        case_content_type = ContentType.objects.get_for_model(criminal_case)
        serializer.save(
            case_content_type=case_content_type,
            case_object_id=criminal_case.id,
            created_by=self.request.user
        )