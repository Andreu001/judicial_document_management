from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db.models import Q
from django_filters import rest_framework as filters
from .models import RegisteredCase, RegistryIndex, Correspondence
from .serializers import (
    RegisteredCaseSerializer,
    RegistryIndexSerializer,
    CaseRegistrationSerializer,
    NumberAdjustmentSerializer,
    CorrespondenceSerializer,
    CorrespondenceCreateSerializer,
    CorrespondenceUpdateSerializer  # ДОБАВИТЬ
)
from .filters import CorrespondenceFilter
from .managers import case_registry
import logging

logger = logging.getLogger(__name__)


class RegistryIndexViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RegistryIndex.objects.all()
    serializer_class = RegistryIndexSerializer


class RegisteredCaseViewSet(viewsets.ModelViewSet):
    queryset = RegisteredCase.objects.exclude(status='deleted')
    serializer_class = RegisteredCaseSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Фильтрация по индексу
        index = self.request.query_params.get('index')
        if index:
            queryset = queryset.filter(index__index=index)

        # Фильтрация по статусу
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        business_card = self.request.query_params.get('business_card')
        if business_card:
            queryset = queryset.filter(business_card_id=business_card)

        return queryset

    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Регистрация нового дела
        """
        serializer = CaseRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                case = case_registry.register_case(
                    index_code=serializer.validated_data['index'],
                    description=serializer.validated_data.get('description'),
                    business_card_id=serializer.validated_data.get('business_card_id'),
                    criminal_proceedings_id=serializer.validated_data.get('criminal_proceedings_id')
                )

                case_serializer = RegisteredCaseSerializer(case)
                return Response(case_serializer.data, status=status.HTTP_201_CREATED)

            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Ошибка при регистрации дела: {e}")
                return Response(
                    {'error': 'Внутренняя ошибка сервера'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def delete_case(self, request, pk=None):
        """
        Удаление дела с откатом нумерации
        """
        reason = request.data.get('reason', 'Удаление по запросу API')

        try:
            case = case_registry.delete_case(pk, reason)
            return Response({'message': f'Дело {case.full_number} удалено'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def register_case(request):
    """
    Регистрация нового дела (альтернативный endpoint)
    """
    serializer = CaseRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            case = case_registry.register_case(
                index_code=serializer.validated_data['index'],
                description=serializer.validated_data.get('description'),
                business_card_id=serializer.validated_data.get('business_card_id'),
                criminal_proceedings_id=serializer.validated_data.get('criminal_proceedings_id')
            )

            case_serializer = RegisteredCaseSerializer(case)
            return Response(case_serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Ошибка при регистрации дела: {e}")
            return Response(
                {'error': 'Внутренняя ошибка сервера'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def adjust_numbering(request):
    """
    Ручная корректировка нумерации
    """
    serializer = NumberAdjustmentSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            adjustment = case_registry.adjust_numbering(
                index_code=serializer.validated_data['index'],
                new_current_number=serializer.validated_data['new_current_number'],
                reason=serializer.validated_data['reason'],
                adjusted_by=serializer.validated_data['adjusted_by']
            )
            
            return Response({
                'message': f'Нумерация для индекса {serializer.validated_data["index"]} скорректирована',
                'old_number': adjustment.old_number,
                'new_number': adjustment.new_number
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_next_number(request, index_code):
    """
    Получение следующего номера для указанного индекса
    """
    try:
        next_number = case_registry.get_next_number(index_code)
        return Response({'next_number': next_number}, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CorrespondenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления корреспонденцией
    """
    queryset = Correspondence.objects.all()
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = CorrespondenceFilter
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CorrespondenceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CorrespondenceUpdateSerializer  # Используем отдельный сериализатор для обновления
        return CorrespondenceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # ФИЛЬТРАЦИЯ ПО ТИПУ КОРРЕСПОНДЕНЦИИ
        correspondence_type = self.request.query_params.get('type')
        if correspondence_type:
            queryset = queryset.filter(correspondence_type=correspondence_type)
        
        # Применяем фильтры из filterset_class
        queryset = self.filter_queryset(queryset)
        
        return queryset.order_by('-registration_date', '-created_at')
     
    def perform_create(self, serializer):
        """Автоматическая генерация регистрационного номера"""
        from django.utils import timezone
        from .models import CorrespondenceCounter
        
        instance = serializer.save()
        
        # Генерация регистрационного номера
        current_year = timezone.now().year
        
        # Получаем или создаем счетчик для текущего года
        counter, created = CorrespondenceCounter.objects.get_or_create(
            year=current_year,
            defaults={
                'incoming_counter': 0,
                'outgoing_counter': 0
            }
        )
        
        if instance.correspondence_type == 'incoming':
            counter.incoming_counter += 1
            prefix = 'Вх'
            number = counter.incoming_counter
        else:
            counter.outgoing_counter += 1
            prefix = 'Исх'
            number = counter.outgoing_counter
        
        counter.save()
        
        # Формат: Префикс-номер/год
        instance.registration_number = f"{prefix}-{number}/{current_year}"
        instance.save()
    
    def perform_update(self, serializer):
        """Обновление корреспонденции"""
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по корреспонденции"""
        from django.db.models import Count
        from django.utils import timezone
        
        current_year = timezone.now().year
        
        # Статистика по типам
        type_stats = Correspondence.objects.values('correspondence_type').annotate(
            count=Count('id')
        )
        
        # Статистика по месяцам текущего года
        monthly_stats = Correspondence.objects.filter(
            registration_date__year=current_year
        ).values('correspondence_type', 'registration_date__month').annotate(
            count=Count('id')
        ).order_by('correspondence_type', 'registration_date__month')
        
        # Статистика по статусам
        status_stats = Correspondence.objects.values('status').annotate(
            count=Count('id')
        )
        
        return Response({
            'type_statistics': type_stats,
            'monthly_statistics': monthly_stats,
            'status_statistics': status_stats,
            'current_year': current_year
        })
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Получение доступных опций для фильтров"""
        from django.db.models import Count
        
        return Response({
            'correspondence_types': dict(Correspondence.TYPE_CHOICES),
            'statuses': dict(Correspondence.STATUS_CHOICES),
            'admission_methods': dict(Correspondence.ADMISSION_METOD),
            'executors': list(Correspondence.objects
                .exclude(executor__isnull=True)
                .exclude(executor='')
                .values_list('executor', flat=True)
                .distinct()
                .order_by('executor')),
            'document_types': list(Correspondence.objects
                .exclude(document_type__isnull=True)
                .exclude(document_type='')
                .values_list('document_type', flat=True)
                .distinct()
                .order_by('document_type')),
            'senders': list(Correspondence.objects
                .exclude(sender__isnull=True)
                .exclude(sender='')
                .values_list('sender', flat=True)
                .distinct()
                .order_by('sender')),
            'recipients': list(Correspondence.objects
                .exclude(recipient__isnull=True)
                .exclude(recipient='')
                .values_list('recipient', flat=True)
                .distinct()
                .order_by('recipient'))
        })