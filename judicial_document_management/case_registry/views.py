# case_registry/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import RegisteredCase, RegistryIndex
from .serializers import RegisteredCaseSerializer, RegistryIndexSerializer, CaseRegistrationSerializer, NumberAdjustmentSerializer
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