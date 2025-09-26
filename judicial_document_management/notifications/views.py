# notifications/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Notification, JurisdictionCheck, DeadlineWarning
from .serializers import (
    NotificationSerializer, 
    JurisdictionCheckSerializer,
    DeadlineWarningSerializer
)
from .services import NotificationService

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_read()
        return Response({'status': 'marked as read'})

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        notification = self.get_object()
        notification.mark_completed()
        return Response({'status': 'marked as completed'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        stats = {
            'total': Notification.objects.filter(user=user).count(),
            'unread': Notification.objects.filter(user=user, is_read=False).count(),
            'high_priority': Notification.objects.filter(
                user=user, 
                priority__in=['high', 'critical'],
                is_read=False
            ).count(),
        }
        return Response(stats)

class JurisdictionCheckViewSet(viewsets.ModelViewSet):
    serializer_class = JurisdictionCheckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JurisdictionCheck.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def check_jurisdiction(self, request):
        proceeding_id = request.data.get('proceeding_id')
        try:
            CriminalProceedings = apps.get_model('criminal_proceedings', 'CriminalProceedings')
            proceeding = CriminalProceedings.objects.get(id=proceeding_id)
            
            check = NotificationService.create_jurisdiction_notification(
                proceeding, 
                request.user
            )
            
            serializer = self.get_serializer(check)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class DeadlineWarningViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DeadlineWarningSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Получаем дела, связанные с пользователем
        CriminalProceedings = apps.get_model('criminal_proceedings', 'CriminalProceedings')
        user_proceedings = CriminalProceedings.objects.filter(
            business_card__user=self.request.user
        )
        return DeadlineWarning.objects.filter(
            criminal_proceeding__in=user_proceedings,
            is_active=True
        )