# case_registry/search_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from criminal_proceedings.models import CriminalProceedings
from civil_proceedings.models import CivilProceedings
from administrative_code.models import AdministrativeProceedings
from administrative_proceedings.models import KasProceedings
import logging

logger = logging.getLogger(__name__)

class CaseSearchView(APIView):
    """
    API для поиска по всем типам дел (уголовные, гражданские, административные)
    Используется для автодополнения в формах корреспонденции
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            query = request.query_params.get('q', '').strip()
            
            logger.info(f"Поиск дел по запросу: '{query}'")
            
            if len(query) < 2:
                return Response([])
            
            results = []
            
            # 1. Поиск по уголовным делам
            criminal_cases = CriminalProceedings.objects.filter(
                Q(case_number_criminal__icontains=query)
            ).exclude(
                status='archived'
            ).order_by('case_number_criminal')[:10]
            
            for case in criminal_cases:
                results.append({
                    'id': case.id,
                    'case_type': 'criminal',
                    'case_type_label': 'Уголовное дело',
                    'case_number': case.case_number_criminal,
                    'full_info': f"Уголовное дело № {case.case_number_criminal}"
                })
            
            # 2. Поиск по гражданским делам
            civil_cases = CivilProceedings.objects.filter(
                Q(case_number_civil__icontains=query)
            ).exclude(
                status='archived'
            ).order_by('case_number_civil')[:10]
            
            for case in civil_cases:
                results.append({
                    'id': case.id,
                    'case_type': 'civil',
                    'case_type_label': 'Гражданское дело',
                    'case_number': case.case_number_civil,
                    'full_info': f"Гражданское дело № {case.case_number_civil}"
                })
            
            # 3. Поиск по делам об АП (КоАП)
            admin_cases = AdministrativeProceedings.objects.filter(
                Q(case_number_admin__icontains=query)
            ).exclude(
                status='archived'
            ).order_by('case_number_admin')[:10]
            
            for case in admin_cases:
                results.append({
                    'id': case.id,
                    'case_type': 'administrative',
                    'case_type_label': 'Дело об АП (КоАП)',
                    'case_number': case.case_number_admin,
                    'full_info': f"Дело об АП № {case.case_number_admin}"
                })
            
            # 4. Поиск по делам КАС
            kas_cases = KasProceedings.objects.filter(
                Q(case_number_kas__icontains=query)
            ).exclude(
                status='archived'
            ).order_by('case_number_kas')[:10]
            
            for case in kas_cases:
                results.append({
                    'id': case.id,
                    'case_type': 'kas',
                    'case_type_label': 'Административное дело (КАС)',
                    'case_number': case.case_number_kas,
                    'full_info': f"Административное дело № {case.case_number_kas}"
                })
            
            # Сортируем результаты по релевантности (по номеру дела)
            results.sort(key=lambda x: len(x['case_number']))
            
            logger.info(f"Найдено {len(results)} результатов для запроса '{query}'")
            return Response(results[:20])  # Ограничиваем до 20 результатов
            
        except Exception as e:
            logger.error(f"Ошибка поиска дел: {e}", exc_info=True)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )