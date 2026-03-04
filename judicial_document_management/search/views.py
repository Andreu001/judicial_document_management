from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .search_service import CaseSearchService, CaseStatusService
from administrative_code.models import AdministrativeProceedings
from administrative_proceedings.models import KasProceedings
from criminal_proceedings.models import CriminalProceedings
from civil_proceedings.models import CivilProceedings
from .search_service import PersonSearchService

import logging

logger = logging.getLogger(__name__)


class CaseSearchView(APIView):
    """API для поиска по всем типам дел"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        case_types = request.query_params.getlist('types[]')
        
        if not query:
            return Response(
                {'error': 'Поисковый запрос не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            results = CaseSearchService.search(query, case_types if case_types else None)
            return Response(results)
        except Exception as e:
            logger.error(f"Ошибка поиска: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateCaseStatusView(APIView):
    """API для принудительного обновления статуса дела"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        case_id = request.data.get('case_id')
        case_type = request.data.get('case_type')
        
        if not case_id or not case_type:
            return Response(
                {'error': 'Не указаны case_id и case_type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем модель по типу
        model_map = {
            'criminal': CriminalProceedings,
            'civil': CivilProceedings,
            'administrative': AdministrativeProceedings,
            'kas': KasProceedings,
        }
        
        model = model_map.get(case_type)
        if not model:
            return Response(
                {'error': f'Неизвестный тип дела: {case_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instance = model.objects.get(id=case_id)
            new_status = CaseStatusService.update_all_case_statuses(instance, case_type)
            
            return Response({
                'case_id': case_id,
                'case_type': case_type,
                'status': new_status,
                'message': f'Статус обновлен на {new_status}'
            })
        except model.DoesNotExist:
            return Response(
                {'error': f'Дело с id {case_id} не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Ошибка обновления статуса: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkUpdateCaseStatusesView(APIView):
    """API для массового обновления статусов дел"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        case_type = request.data.get('case_type')
        case_ids = request.data.get('case_ids', [])
        
        if not case_type:
            return Response(
                {'error': 'Не указан case_type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем модель по типу
        model_map = {
            'criminal': CriminalProceedings,
            'civil': CivilProceedings,
            'administrative': AdministrativeProceedings,
            'kas': KasProceedings,
        }
        
        model = model_map.get(case_type)
        if not model:
            return Response(
                {'error': f'Неизвестный тип дела: {case_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            queryset = model.objects.all()
            if case_ids:
                queryset = queryset.filter(id__in=case_ids)
            
            updated_count = 0
            results = []
            
            for instance in queryset:
                old_status = instance.status
                new_status = CaseStatusService.update_all_case_statuses(instance, case_type)
                
                if new_status != old_status:
                    updated_count += 1
                
                results.append({
                    'id': instance.id,
                    'old_status': old_status,
                    'new_status': new_status
                })
            
            return Response({
                'updated_count': updated_count,
                'total_count': queryset.count(),
                'results': results
            })
        except Exception as e:
            logger.error(f"Ошибка массового обновления статусов: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PersonDetailView(APIView):
    """API для получения подробной информации об участнике"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, person_id):
        try:
            person_data = PersonSearchService.get_person_details(person_id)
            
            if not person_data:
                return Response(
                    {'error': f'Участник с id {person_id} не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(person_data)
            
        except Exception as e:
            logger.error(f"Ошибка получения данных участника: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
