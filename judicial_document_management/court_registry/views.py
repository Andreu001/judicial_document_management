"""
Представления приложения court_registry.
"""
from rest_framework import (
    viewsets, status, permissions, filters
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django_filters.rest_framework import DjangoFilterBackend
import logging
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import (
    Region, CourtLevel,
    Court, CourtDirectory,
    CourtPhone, CourtEmail, CourtWorkingHours,
    CourtDepartment, CourtEmployee,
    CaseTransferType, CaseTransferStatus,
    CaseTransfer, CaseTransferItem, CaseTransferDocument, CaseTransferSide,
    IncomingCaseNotification,
    PendingTransferCase,
    VCSRequest,
    CourtMessengerRegistration,
    CourtInteractionAuditLog,
)
from .serializers import (
    RegionSerializer, CourtLevelSerializer,
    CaseTransferTypeSerializer, CaseTransferStatusSerializer,
    CourtPhoneSerializer, CourtEmailSerializer, CourtWorkingHoursSerializer,
    CourtListSerializer, CourtDetailSerializer, CourtCreateUpdateSerializer,
    CourtDirectoryListSerializer, CourtDirectoryDetailSerializer,
    CourtDirectoryCreateUpdateSerializer,
    CourtDepartmentListSerializer, CourtDepartmentDetailSerializer,
    CourtDepartmentCreateUpdateSerializer,
    CourtEmployeeListSerializer, CourtEmployeeDetailSerializer,
    CourtEmployeeCreateUpdateSerializer,
    CaseTransferListSerializer, CaseTransferDetailSerializer,
    CaseTransferCreateSerializer,
    CaseTransferItemSerializer, CaseTransferItemDetailSerializer,
    CaseTransferDocumentSerializer, CaseTransferSideSerializer,
    IncomingCaseNotificationListSerializer,
    IncomingCaseNotificationDetailSerializer,
    PendingTransferCaseListSerializer,
    VCSRequestListSerializer, VCSRequestDetailSerializer,
    VCSRequestCreateUpdateSerializer,
    CourtMessengerRegistrationSerializer,
    CourtMessengerRegistrationUpdateSerializer,
    CourtInteractionAuditLogSerializer,
)
from .permissions import (
    IsCourtAdmin, IsCourtEmployee, IsSameCourt,
    IsSourceCourt, IsDestinationCourt
)
from .services import (
    CaseTransferService,
    IncomingCaseService,
    PendingTransferService,
    CourtNetworkService,
    AuditLogService,
    CourtDirectoryService,
)
from .filters import (
    CourtFilter, CaseTransferFilter, PendingTransferCaseFilter,
    VCSRequestFilter,
)
from .intercourt_service import InterCourtReceiverAPI, InterCourtSenderService

logger = logging.getLogger(__name__)


# =============================================================================
# Справочники
# =============================================================================

class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """Справочник регионов"""
    queryset = Region.objects.filter(is_active=True)
    serializer_class = RegionSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'code', 'name_short']
    filterset_fields = ['is_active']


class CourtLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """Справочник уровней судов"""
    queryset = CourtLevel.objects.all()
    serializer_class = CourtLevelSerializer
    permission_classes = [IsAuthenticated]


class CaseTransferTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """Справочник типов передачи дел"""
    queryset = CaseTransferType.objects.all()
    serializer_class = CaseTransferTypeSerializer
    permission_classes = [IsAuthenticated]


class CaseTransferStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """Справочник статусов передачи дел"""
    queryset = CaseTransferStatus.objects.all()
    serializer_class = CaseTransferStatusSerializer
    permission_classes = [IsAuthenticated]


# =============================================================================
# Справочник судов РФ
# =============================================================================

class CourtDirectoryViewSet(viewsets.ModelViewSet):
    """
    Справочник судов РФ.
    Доступен для просмотра всем аутентифицированным пользователям.
    Редактирование — только администраторам.
    """
    queryset = CourtDirectory.objects.select_related(
        'region', 'level'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['region', 'level', 'is_active', 'data_source']
    search_fields = ['name', 'name_short', 'code', 'address']
    ordering_fields = ['name', 'code', 'region__name', 'level__hierarchy_level']
    ordering = ['region__name', 'level__hierarchy_level', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourtDirectoryListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CourtDirectoryCreateUpdateSerializer
        return CourtDirectoryDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def sync_from_csv(self, request):
        """
        Синхронизация справочника из CSV файла.
        Ожидается файл с колонками: code, name, name_short, region_code,
        level_code, address, postal_code, email_main, website
        """
        if 'csv_file' not in request.FILES:
            return Response(
                {'error': 'Необходимо загрузить CSV файл'},
                status=status.HTTP_400_BAD_REQUEST
            )

        import csv
        from io import StringIO

        csv_file = request.FILES['csv_file']
        try:
            decoded = csv_file.read().decode('utf-8')
            reader = csv.DictReader(StringIO(decoded))
            result = CourtDirectoryService.sync_from_csv(reader)
            return Response(result)
        except Exception as e:
            logger.error(f"Error syncing CSV: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск судов в справочнике"""
        query = request.query_params.get('q', '')
        region_code = request.query_params.get('region', '')
        level_code = request.query_params.get('level', '')

        courts = CourtDirectoryService.search_courts(
            query=query,
            region_code=region_code,
            level_code=level_code
        )

        serializer = CourtDirectoryListSerializer(
            courts[:100], many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_region(self, request):
        """Получить суды по региону"""
        region_code = request.query_params.get('code')
        if not region_code:
            return Response(
                {'error': 'Необходимо указать код региона'},
                status=status.HTTP_400_BAD_REQUEST
            )

        courts = CourtDirectoryService.get_courts_by_region(region_code)
        serializer = CourtDirectoryListSerializer(
            courts, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """Получить суды по уровню"""
        level_code = request.query_params.get('code')
        if not level_code:
            return Response(
                {'error': 'Необходимо указать код уровня суда'},
                status=status.HTTP_400_BAD_REQUEST
            )

        courts = CourtDirectoryService.get_courts_by_level(level_code)
        serializer = CourtDirectoryListSerializer(
            courts, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def sync_with_network(self, request):
        """Синхронизация справочника с сетью судов"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Требуются права администратора'},
                status=status.HTTP_403_FORBIDDEN
            )

        result = CourtNetworkService.sync_directory_with_network()
        return Response(result)


# =============================================================================
# Текущий суд
# =============================================================================

class CourtViewSet(viewsets.ModelViewSet):
    """
    Управление ТЕКУЩИМ судом (синглтон).
    """
    queryset = Court.objects.select_related(
        'region', 'level', 'chairman'
    ).prefetch_related(
        'phones', 'emails', 'working_hours'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourtFilter
    search_fields = ['name', 'name_short', 'code', 'address']
    ordering_fields = ['name', 'code', 'region__name', 'created_at']
    ordering = ['region__name', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourtListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CourtCreateUpdateSerializer
        return CourtDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        # Возвращаем только один суд (синглтон)
        return Court.objects.all()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        AuditLogService.log(
            action='court_created',
            court=instance,
            user=self.request.user,
            details={'name': instance.name, 'code': instance.code},
            request=self.request
        )
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLogService.log(
            action='court_updated',
            court=instance,
            user=self.request.user,
            details={'name': instance.name, 'code': instance.code},
            request=self.request
        )

    @action(detail=True, methods=['post'])
    def register_in_network(self, request, pk=None):
        """Зарегистрировать суд в сети"""
        court = self.get_object()
        court.is_registered_in_network = True
        court.network_registration_date = timezone.now()
        court.save(update_fields=[
            'is_registered_in_network', 'network_registration_date', 'updated_at'
        ])
        CourtNetworkService.create_messenger_registration(court)
        return Response({
            'status': 'success',
            'message': f'Суд {court.name} зарегистрирован в сети'
        })

    @action(detail=True, methods=['get'])
    def departments(self, request, pk=None):
        """Получить отделы суда"""
        court = self.get_object()
        departments = court.departments.filter(is_active=True)
        serializer = CourtDepartmentListSerializer(
            departments, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Получить сотрудников суда"""
        court = self.get_object()
        employees = CourtEmployee.objects.filter(
            department__court=court,
            is_active=True
        ).select_related('employee', 'department')
        serializer = CourtEmployeeListSerializer(
            employees, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def judges(self, request, pk=None):
        """Получить судей суда"""
        court = self.get_object()
        judges = CourtEmployee.objects.filter(
            department__court=court,
            is_active=True,
            employee__role='judge'
        ).select_related('employee', 'department')
        serializer = CourtEmployeeListSerializer(
            judges, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_court(self, request):
        """Получить информацию о текущем суде"""
        court = Court.objects.first()
        if not court:
            return Response(
                {'error': 'Текущий суд не зарегистрирован'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CourtDetailSerializer(
            court, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_network(self, request):
        """Поиск судов в сети (из справочника)"""
        query = request.query_params.get('q', '')
        region_code = request.query_params.get('region', '')
        level_code = request.query_params.get('level', '')

        courts = CourtDirectory.objects.filter(
            is_active=True
        )

        if query:
            courts = courts.filter(
                Q(name__icontains=query) |
                Q(name_short__icontains=query) |
                Q(code__icontains=query)
            )
        if region_code:
            courts = courts.filter(region__code=region_code)
        if level_code:
            courts = courts.filter(level__code=level_code)

        serializer = CourtDirectoryListSerializer(
            courts[:50], many=True, context={'request': request}
        )
        return Response(serializer.data)


# =============================================================================
# Отделы суда (упрощенные)
# =============================================================================

# court_registry/views.py

# court_registry/views.py

class CourtDepartmentViewSet(viewsets.ModelViewSet):
    """Управление отделами текущего суда"""
    queryset = CourtDepartment.objects.select_related('court').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['court', 'is_active']
    search_fields = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourtDepartmentListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CourtDepartmentCreateUpdateSerializer
        return CourtDepartmentDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsCourtAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        # ВОЗВРАЩАЕМ ВСЕ ОТДЕЛЫ БЕЗ ЛЮБОЙ ФИЛЬТРАЦИИ
        return super().get_queryset()

    def perform_create(self, serializer):
        court = Court.objects.first()
        if court:
            instance = serializer.save(court=court)
            AuditLogService.log(
                action='department_created',
                court=court,
                user=self.request.user,
                object_type='CourtDepartment',
                object_id=instance.id,
                details={'name': instance.name},
                request=self.request
            )
        else:
            instance = serializer.save()

# =============================================================================
# Сотрудники суда (упрощенные)
# =============================================================================

class CourtEmployeeViewSet(viewsets.ModelViewSet):
    """Управление сотрудниками в отделах"""
    queryset = CourtEmployee.objects.select_related(
        'department', 'department__court', 'employee', 'created_by'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department', 'employee', 'is_active', 'is_head_of_department']
    search_fields = ['employee__first_name', 'employee__last_name', 'position']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourtEmployeeListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CourtEmployeeCreateUpdateSerializer
        return CourtEmployeeDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsCourtAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Ограничиваем только текущим судом
        court = Court.objects.first()
        if court:
            qs = qs.filter(department__court=court)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        court = Court.objects.first()
        AuditLogService.log(
            action='employee_added',
            court=court,
            user=self.request.user,
            employee=instance,
            object_type='CourtEmployee',
            object_id=instance.id,
            details={
                'employee': str(instance.employee),
                'position': instance.position,
                'department': instance.department.name,
            },
            request=self.request
        )

    def perform_destroy(self, instance):
        court = Court.objects.first()
        AuditLogService.log(
            action='employee_removed',
            court=court,
            user=self.request.user,
            employee=instance,
            object_type='CourtEmployee',
            object_id=instance.id,
            details={
                'employee': str(instance.employee),
                'position': instance.position,
            },
            request=self.request
        )
        instance.delete()


# =============================================================================
# Передача дел
# =============================================================================

class CaseTransferViewSet(viewsets.ModelViewSet):
    """
    Управление передачами дел между судами.
    """
    queryset = CaseTransfer.objects.select_related(
        'source_court', 'destination_court',
        'source_department', 'destination_department',
        'source_employee', 'transfer_type', 'status',
        'basis_judge'
    ).prefetch_related('items', 'items__documents', 'items__sides')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CaseTransferFilter
    search_fields = ['basis', 'basis_document', 'uuid']
    ordering_fields = ['created_at', 'sent_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CaseTransferListSerializer
        if self.action == 'create':
            return CaseTransferCreateSerializer
        return CaseTransferDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        court = Court.objects.first()
        if court:
            qs = qs.filter(
                Q(source_court=court) |
                Q(destination_court__in=CourtDirectory.objects.filter(region=court.region))
            )
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        transfer = CaseTransferService.create_transfer(
            serializer.validated_data,
            user=self.request.user,
            request=self.request
        )
        serializer.instance = transfer

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Отправить передачу"""
        transfer = self.get_object()
        transfer = CaseTransferService.send_transfer(
            transfer, user=request.user, request=request
        )
        return Response(CaseTransferDetailSerializer(
            transfer, context={'request': request}
        ).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принять дела (с автоматической регистрацией)"""
        transfer = self.get_object()
        result = CaseTransferService.accept_transfer(
            transfer,
            user=request.user,
            request=request,
            register_cases=request.data.get('register_cases', True)
        )
        return Response(result)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить передачу"""
        transfer = self.get_object()
        reason = request.data.get('reason', '')
        transfer = CaseTransferService.reject_transfer(
            transfer, reason=reason, user=request.user, request=request
        )
        return Response(CaseTransferDetailSerializer(
            transfer, context={'request': request}
        ).data)

    @action(detail=True, methods=['post'])
    def return_transfer(self, request, pk=None):
        """Вернуть дело из апелляции/кассации"""
        transfer = self.get_object()
        items_data = request.data.get('items', [])
        result = CaseTransferService.return_transfer(
            transfer, items_data=items_data,
            user=request.user, request=request
        )
        return Response(result)

    @action(detail=False, methods=['get'])
    def outgoing(self, request):
        """Исходящие передачи"""
        court = Court.objects.first()
        qs = self.get_queryset().filter(
            source_court=court
        ).distinct()
        serializer = CaseTransferListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def incoming(self, request):
        """Входящие передачи"""
        court = Court.objects.first()
        if court:
            qs = self.get_queryset().filter(
                destination_court__region=court.region
            ).distinct()
            serializer = CaseTransferListSerializer(qs, many=True)
            return Response(serializer.data)
        return Response([], status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# Уведомления о поступлении дел
# =============================================================================

class IncomingCaseNotificationViewSet(viewsets.ModelViewSet):
    """
    Уведомления о поступлении дел.
    Только просмотр и обработка (принять/отклонить).
    """
    queryset = IncomingCaseNotification.objects.select_related(
        'court', 'transfer', 'transfer__source_court',
        'transfer__transfer_type', 'processed_by', 'processed_by__employee'
    )
    permission_classes = [IsAuthenticated]
    filterset_fields = ['court', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return IncomingCaseNotificationListSerializer
        return IncomingCaseNotificationDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        court = Court.objects.first()
        if court:
            qs = qs.filter(court=court)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.AllowAny()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def accept_all(self, request, pk=None):
        """Принять все дела в уведомлении"""
        notification = self.get_object()
        result = IncomingCaseService.accept_notification(
            notification,
            user=request.user,
            request=request
        )
        return Response(result)

    @action(detail=True, methods=['post'])
    def reject_all(self, request, pk=None):
        """Отклонить все дела"""
        notification = self.get_object()
        reason = request.data.get('reason', '')
        result = IncomingCaseService.reject_notification(
            notification, reason=reason,
            user=request.user, request=request
        )
        return Response(result)

    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        """Количество ожидающих уведомлений"""
        court = Court.objects.first()
        if court:
            count = IncomingCaseNotification.objects.filter(
                court=court,
                status='pending'
            ).count()
            return Response({'pending_count': count})
        return Response({'pending_count': 0})


# =============================================================================
# Дела, ожидающие передачи
# =============================================================================

class PendingTransferCaseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Дела, ожидающие передачи (апелляция, кассация, подсудность).
    """
    queryset = PendingTransferCase.objects.select_related(
        'court', 'target_court', 'transfer'
    )
    serializer_class = PendingTransferCaseListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PendingTransferCaseFilter
    search_fields = ['case_number']
    ordering_fields = ['detected_at', 'relevant_date', 'status']
    ordering = ['-detected_at']

    def get_queryset(self):
        qs = super().get_queryset()
        court = Court.objects.first()
        if court:
            qs = qs.filter(court=court)
        return qs

    @action(detail=False, methods=['get'])
    def by_reason(self, request):
        """Группировка по причинам передачи"""
        court = Court.objects.first()
        if court:
            counts = PendingTransferCase.objects.filter(
                court=court,
                status__in=['detected', 'ready']
            ).values('transfer_reason').annotate(
                count=Count('id')
            )
            return Response(list(counts))
        return Response([])

    @action(detail=False, methods=['post'])
    def scan_cases(self, request):
        """Запустить сканирование дел на предмет необходимости передачи"""
        court = Court.objects.first()
        if court:
            try:
                result = PendingTransferService.scan_court_cases(
                    court,
                    user=request.user,
                    request=request
                )
                return Response(result)
            except Exception as e:
                logger.error(f"Error scanning cases: {e}")
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(
            {'error': 'Текущий суд не зарегистрирован'},
            status=status.HTTP_400_BAD_REQUEST
        )


# =============================================================================
# Запросы ВКС
# =============================================================================

class VCSRequestViewSet(viewsets.ModelViewSet):
    """Запросы на ВКС"""
    queryset = VCSRequest.objects.select_related(
        'initiator_court', 'initiator_department',
        'initiator_employee', 'video_conference'
    ).prefetch_related('participant_courts', 'participant_departments')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VCSRequestFilter
    search_fields = ['title', 'description', 'related_case_number']
    ordering_fields = ['scheduled_at', 'created_at', 'status']
    ordering = ['-scheduled_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VCSRequestListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return VCSRequestCreateUpdateSerializer
        return VCSRequestDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        court = Court.objects.first()
        if court:
            qs = qs.filter(
                Q(initiator_court=court) |
                Q(participant_courts__region=court.region)
            ).distinct()
        return qs

    def perform_create(self, serializer):
        vcs = serializer.save()
        court = Court.objects.first()
        AuditLogService.log(
            action='vcs_created',
            court=court,
            user=self.request.user,
            object_type='VCSRequest',
            object_id=vcs.id,
            details={'title': vcs.title, 'scheduled_at': str(vcs.scheduled_at)},
            request=self.request
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Подтвердить ВКС"""
        vcs = self.get_object()
        vcs.status = 'confirmed'
        vcs.save(update_fields=['status', 'updated_at'])
        AuditLogService.log(
            action='vcs_confirmed',
            court=vcs.initiator_court,
            user=self.request.user,
            object_type='VCSRequest',
            object_id=vcs.id,
            request=self.request
        )
        return Response(VCSRequestDetailSerializer(
            vcs, context={'request': request}
        ).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить ВКС"""
        vcs = self.get_object()
        vcs.status = 'rejected'
        vcs.rejection_reason = request.data.get('reason', '')
        vcs.save(update_fields=['status', 'rejection_reason', 'updated_at'])
        return Response(VCSRequestDetailSerializer(
            vcs, context={'request': request}
        ).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Отметить ВКС как проведенную"""
        vcs = self.get_object()
        vcs.status = 'completed'
        vcs.save(update_fields=['status', 'updated_at'])
        AuditLogService.log(
            action='vcs_completed',
            court=vcs.initiator_court,
            user=self.request.user,
            object_type='VCSRequest',
            object_id=vcs.id,
            request=self.request
        )
        return Response(VCSRequestDetailSerializer(
            vcs, context={'request': request}
        ).data)


# =============================================================================
# Регистрация мессенджера
# =============================================================================

class CourtMessengerRegistrationViewSet(viewsets.ViewSet):
    """Регистрация мессенджера в суде"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_registration(self, request):
        """Получить регистрацию мессенджера своего суда"""
        court = Court.objects.first()
        if court:
            reg, created = CourtMessengerRegistration.objects.get_or_create(
                court=court
            )
            serializer = CourtMessengerRegistrationSerializer(reg)
            return Response(serializer.data)
        return Response(
            {'error': 'Текущий суд не зарегистрирован'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Зарегистрировать мессенджер в сети"""
        court = Court.objects.first()
        if not court:
            return Response(
                {'error': 'Текущий суд не зарегистрирован'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reg, created = CourtMessengerRegistration.objects.get_or_create(
            court=court
        )

        reg.is_registered = True
        reg.registered_at = timezone.now()
        reg.is_online = True
        reg.court_name_in_messenger = court.name_short or court.name
        reg.court_code_in_messenger = court.code
        reg.save()
        reg.update_sync_counts()

        court.is_registered_in_network = True
        court.network_registration_date = timezone.now()
        court.save(update_fields=[
            'is_registered_in_network', 'network_registration_date', 'updated_at'
        ])

        AuditLogService.log(
            action='messenger_registered',
            court=court,
            user=request.user,
            details={'court_name': reg.court_name_in_messenger},
            request=self.request
        )

        return Response(CourtMessengerRegistrationSerializer(reg).data)

    @action(detail=False, methods=['post'])
    def ping(self, request):
        """Ping — обновление статуса онлайн"""
        court = Court.objects.first()
        if court:
            reg, _ = CourtMessengerRegistration.objects.get_or_create(
                court=court
            )
            reg.last_ping = timezone.now()
            reg.is_online = True
            reg.save(update_fields=['last_ping', 'is_online', 'updated_at'])
            AuditLogService.log(
                action='messenger_ping',
                court=court,
                user=request.user,
                request=self.request
            )
            return Response({'status': 'pong', 'timestamp': reg.last_ping})
        return Response({'status': 'error'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def update_settings(self, request):
        """Обновить настройки мессенджера"""
        court = Court.objects.first()
        if court:
            reg, _ = CourtMessengerRegistration.objects.get_or_create(
                court=court
            )
            serializer = CourtMessengerRegistrationUpdateSerializer(
                reg, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(CourtMessengerRegistrationSerializer(reg).data)
        return Response(
            {'error': 'Текущий суд не зарегистрирован'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'])
    def sync_data(self, request):
        """Синхронизировать данные суда с мессенджером"""
        court = Court.objects.first()
        if court:
            reg, _ = CourtMessengerRegistration.objects.get_or_create(
                court=court
            )
            reg.update_sync_counts()

            court_data = CourtDetailSerializer(
                court, context={'request': request}
            ).data

            return Response({
                'registration': CourtMessengerRegistrationSerializer(reg).data,
                'court': court_data,
            })
        return Response(
            {'error': 'Текущий суд не зарегистрирован'},
            status=status.HTTP_400_BAD_REQUEST
        )


# =============================================================================
# Журнал аудита
# =============================================================================

class CourtInteractionAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Журнал аудита межсудебного взаимодействия"""
    queryset = CourtInteractionAuditLog.objects.select_related(
        'court', 'user', 'employee'
    )
    serializer_class = CourtInteractionAuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['court', 'user', 'action', 'object_type']
    search_fields = ['details']
    ordering = ['-created_at']
    ordering_fields = ['created_at', 'action']


class InterCourtReceiveTransferView(APIView):
    """
    Эндпоинт для ПРИЁМА передач от других судов.
    Доступен без аутентификации, но проверяет API ключ.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Проверяем API ключ
        api_key = request.headers.get('Authorization', '').replace('Bearer ', '')
        source_code = request.headers.get('X-Source-Court-Code', '')

        # Проверяем, что ключ валидный
        if not self._validate_api_key(api_key, source_code):
            return Response(
                {'error': 'Invalid API key'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            result = InterCourtReceiverAPI.receive_transfer(
                request.data,
                source_court_code=source_code
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error receiving transfer: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _validate_api_key(self, api_key, source_code):
        """Проверка API ключа отправителя"""
        # Ищем суд в справочнике по публичному ключу
        court = CourtDirectory.objects.filter(
            api_key_public=api_key,
            is_active=True
        ).first()
        if court:
            return True

        # Или проверяем по коду суда и ключу
        court = CourtDirectory.objects.filter(
            code=source_code,
            is_active=True
        ).first()
        if court and court.api_key == api_key:
            return True

        return False


class InterCourtPingView(APIView):
    """Проверка доступности API"""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(InterCourtReceiverAPI.ping())


class InterCourtSendTransferView(APIView):
    """Отправить передачу в другой суд (вызывается из UI)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, transfer_id):
        try:
            result = InterCourtSenderService.send_transfer_to_court(transfer_id)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )