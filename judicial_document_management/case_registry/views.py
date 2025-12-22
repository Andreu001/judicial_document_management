# case_registry/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import RegisteredCase, RegistryIndex, Correspondence
from .serializers import (  RegisteredCaseSerializer,
                            RegistryIndexSerializer,
                            CaseRegistrationSerializer,
                            NumberAdjustmentSerializer,
                            CorrespondenceSerializer,
                            CorrespondenceCreateSerializer)
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


# ВЫНЕСИТЕ ЭТИ ФУНКЦИИ ИЗ КЛАССА - ОНИ ДОЛЖНЫ БЫТЬ ОТДЕЛЬНЫМИ ФУНКЦИЯМИ

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
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CorrespondenceCreateSerializer
        return CorrespondenceSerializer
    
    def get_queryset(self):
        queryset = Correspondence.objects.all()
        
        # Фильтрация по типу корреспонденции
        correspondence_type = self.request.query_params.get('type')
        if correspondence_type in ['incoming', 'outgoing']:
            queryset = queryset.filter(correspondence_type=correspondence_type)
        
        # Фильтрация по статусу
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Фильтрация по дате
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(registration_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(registration_date__lte=end_date)
        
        # Поиск по отправителю/получателю
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(sender__icontains=search) |
                models.Q(recipient__icontains=search) |
                models.Q(summary__icontains=search) |
                models.Q(registration_number__icontains=search)
            )
        
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
