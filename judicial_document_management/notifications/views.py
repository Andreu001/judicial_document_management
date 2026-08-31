from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.apps import apps
from .activity_service import CaseActivityService

from .models import (Notification, JurisdictionCheck,
    DeadlineWarning, CaseActivity, CaseNotificationSummary
)
from .serializers import (
    NotificationSerializer, JurisdictionCheckSerializer,
    DeadlineWarningSerializer, CaseActivitySerializer,
    CaseNotificationStatusSerializer, MarkActivitiesReadSerializer
)
from .services import NotificationService
from .correspondence_service import CorrespondenceNotificationService  # NEW

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        
        # Фильтрация по типу уведомления (опционально)
        notification_type = self.request.query_params.get('type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Фильтрация по делу (опционально)
        case_id = self.request.query_params.get('case_id', None)
        if case_id:
            queryset = queryset.filter(
                models.Q(criminal_proceeding_id=case_id) |
                models.Q(civil_proceeding_id=case_id) |
                models.Q(admin_proceeding_id=case_id) |
                models.Q(kas_proceeding_id=case_id)
            )
        
        return queryset.order_by('-created_at')

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
            # NEW: статистика по типам уведомлений
            'incoming_correspondence': Notification.objects.filter(
                user=user, 
                notification_type='incoming_correspondence',
                is_read=False
            ).count(),
            'outgoing_correspondence': Notification.objects.filter(
                user=user, 
                notification_type='outgoing_correspondence',
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


class CaseActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра активностей по делу.
    """
    serializer_class = CaseActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Только для судей
        if user.role not in ['judge', 'admin']:
            return CaseActivity.objects.none()
        
        # Фильтр по делу
        case_type = self.request.query_params.get('case_type')
        case_id = self.request.query_params.get('case_id')
        
        queryset = CaseActivity.objects.all()
        
        if case_type and case_id:
            type_mapping = {
                'administrative': ('administrative_code', 'administrativeproceedings'),
                'criminal': ('criminal_proceedings', 'criminalproceedings'),
                'civil': ('civil_proceedings', 'civilproceedings'),
                'kas': ('administrative_proceedings', 'kasproceedings'),
            }
            
            if case_type in type_mapping:
                app_label, model_name = type_mapping[case_type]
                from django.contrib.contenttypes.models import ContentType
                ct = ContentType.objects.get(app_label=app_label, model=model_name)
                queryset = queryset.filter(case_content_type=ct, case_object_id=case_id)
        
        # Фильтр по типу активности
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        # Фильтр по прочитанности
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read_by_judge=is_read.lower() == 'true')
        
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        user = request.user
        
        if user.role not in ['judge', 'admin']:
            return Response({'error': 'Доступно только для судей'}, status=403)
        
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        activity_type = request.data.get('activity_type')
        object_id = request.data.get('object_id')
        
        if not case_type or not case_id:
            return Response({'error': 'Необходимо указать case_type и case_id'}, status=400)
        
        case = self._get_case_object(case_type, case_id)
        if not case:
            return Response({'error': 'Дело не найдено'}, status=404)
        
        # Проверяем права судьи
        judge = CaseActivityService.get_presiding_judge(case)
        if judge and judge.id != user.id and user.role != 'admin':
            return Response({'error': 'Вы не являетесь председательствующим'}, status=403)
        
        # Формируем queryset для отметки
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get_for_model(case)
        
        queryset = CaseActivity.objects.filter(
            case_content_type=ct,
            case_object_id=case.id,
            is_read_by_judge=False
        )
        
        # Фильтруем по типу активности и ID объекта
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        if object_id:
            queryset = queryset.filter(related_object_id=object_id)
        
        count = queryset.update(is_read_by_judge=True)
        
        # Обновляем сводку
        CaseActivityService.update_notification_summary(case)
        
        return Response({
            'message': f'Отмечено {count} активностей как прочитанные',
            'marked_count': count
        })
    
    @action(detail=False, methods=['get'], url_path='status')
    def notification_status(self, request):
        """
        Получить статус уведомлений по делу (для отображения в карточке).
        """
        user = request.user
        
        if user.role not in ['judge', 'admin']:
            return Response({'error': 'Доступно только для судей'}, status=403)
        
        case_type = request.query_params.get('case_type')
        case_id = request.query_params.get('case_id')
        
        if not case_type or not case_id:
            return Response({'error': 'Необходимо указать case_type и case_id'}, status=400)
        
        case = CaseActivityService._get_case_object(case_type, case_id)
        if not case:
            return Response({'error': 'Дело не найдено'}, status=404)
        
        status_data = CaseActivityService.get_case_notification_status(case, user)
        serializer = CaseNotificationStatusSerializer(status_data)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='mark-all-case-activities-read')
    def mark_all_case_activities_read(self, request):
        """
        Отметить все активности по делу как прочитанные.
        """
        user = request.user
        
        if user.role not in ['judge', 'admin']:
            return Response({'error': 'Доступно только для судей'}, status=403)
        
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        activity_type = request.data.get('activity_type')
        
        if not case_type or not case_id:
            return Response({'error': 'Необходимо указать case_type и case_id'}, status=400)
        
        case = self._get_case_object(case_type, case_id)
        if not case:
            return Response({'error': 'Дело не найдено'}, status=404)
        
        # Проверяем права судьи
        judge = CaseActivityService.get_presiding_judge(case)
        if judge and judge.id != user.id and user.role != 'admin':
            return Response({'error': 'Вы не являетесь председательствующим'}, status=403)
        
        # Используем исправленный метод
        count = CaseActivityService.mark_activities_as_read(
            case=case,
            judge=user,
            activity_type=activity_type
        )
        
        # Дополнительно получаем обновленную сводку
        status_data = CaseActivityService.get_case_notification_status(case, user)
        
        return Response({
            'message': f'Отмечено {count} активностей как прочитанные',
            'marked_count': count,
            'status': status_data
        })

    @classmethod
    def mark_activity_by_related_object(cls, case, related_object, judge):
        """
        Отметить активность как прочитанную по связанному объекту.
        
        Args:
            case: Объект дела
            related_object: Связанный объект (PartyDocument)
            judge: Судья
        
        Returns:
            bool: Была ли отмечена активность
        """
        from .models import CaseActivity
        from django.contrib.contenttypes.models import ContentType
        
        if not case or not related_object or not judge:
            return False
        
        case_content_type = ContentType.objects.get_for_model(case)
        related_ct = ContentType.objects.get_for_model(related_object)
        
        # Проверяем, что судья является председательствующим
        presiding_judge = cls.get_presiding_judge(case)
        if presiding_judge and presiding_judge.id != judge.id:
            return False
        
        updated = CaseActivity.objects.filter(
            case_content_type=case_content_type,
            case_object_id=case.id,
            related_content_type=related_ct,
            related_object_id=related_object.id,
            activity_type='new_party_document',
            is_read_by_judge=False
        ).update(is_read_by_judge=True)
        
        if updated > 0:
            cls.update_notification_summary(case)
        
        return updated > 0

    @action(detail=False, methods=['post'], url_path='mark-by-object')
    def mark_by_related_object(self, request):
        """
        Отметить активность как прочитанную по связанному объекту.
        """
        user = request.user
        
        if user.role not in ['judge', 'admin']:
            return Response({'error': 'Доступно только для судей'}, status=403)
        
        case_type = request.data.get('case_type')
        case_id = request.data.get('case_id')
        object_type = request.data.get('object_type')
        object_id = request.data.get('object_id')
        
        if not all([case_type, case_id, object_type, object_id]):
            return Response({'error': 'Необходимы case_type, case_id, object_type, object_id'}, status=400)
        
        # Преобразуем case_type для API
        api_case_type = case_type
        if case_type == 'admin':
            api_case_type = 'administrative'
        
        case = self._get_case_object(api_case_type, case_id)
        if not case:
            return Response({'error': 'Дело не найдено'}, status=404)
        
        # Проверяем права
        judge = CaseActivityService.get_presiding_judge(case)
        if judge and judge.id != user.id and user.role != 'admin':
            return Response({'error': 'Вы не являетесь председательствующим'}, status=403)
        
        # Получаем объект по типу и ID
        related_object = None
        if object_type == 'partydocument':
            from case_documents.models import PartyDocument
            try:
                related_object = PartyDocument.objects.get(id=object_id)
            except PartyDocument.DoesNotExist:
                return Response({'error': 'Документ не найден'}, status=404)
        else:
            return Response({'error': f'Неизвестный тип объекта: {object_type}'}, status=400)
        
        # Отмечаем как прочитанное
        success = CaseActivityService.mark_activity_by_related_object(case, related_object, user)
        
        # Обновляем сводку
        CaseActivityService.update_notification_summary(case)
        
        # Получаем обновленный статус
        status_data = CaseActivityService.get_case_notification_status(case, user)
        
        return Response({
            'success': success,
            'marked': success,
            'marked_count': 1 if success else 0,
            'status': status_data
        })


def _get_case_object(case_type, case_id):
    """Получить объект дела по типу и ID"""
    from administrative_code.models import AdministrativeProceedings
    from criminal_proceedings.models import CriminalProceedings
    from civil_proceedings.models import CivilProceedings
    from administrative_proceedings.models import KasProceedings
    
    case_mapping = {
        'administrative': AdministrativeProceedings,
        'administrativeproceedings': AdministrativeProceedings,
        'criminal': CriminalProceedings,
        'civil': CivilProceedings,
        'kas': KasProceedings,
        'admin': AdministrativeProceedings,
    }
    
    if case_type not in case_mapping:
        return None
    
    try:
        return case_mapping[case_type].objects.get(id=case_id)
    except Exception:
        return None

CaseActivityService._get_case_object = staticmethod(_get_case_object)
