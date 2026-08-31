# judge_assistant/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import JudgeNote, SupremeCourtDocumentRef, CaseAdviceCache
from .serializers import JudgeNoteSerializer, SupremeCourtDocumentRefSerializer, CaseAnalysisSerializer
from .services import CaseAnalyzerService


class CaseAdvisorViewSet(viewsets.GenericViewSet):
    """
    ViewSet для автоматизированного помощника судьи.
    Поддерживает все типы дел: уголовные, гражданские, административные (КАС) и об АП.
    
    Эндпоинты:
    /api/judge-assistant/case-advisor/{type}/{id}/analysis/
    /api/judge-assistant/case-advisor/{type}/{id}/notes/
    /api/judge-assistant/case-advisor/{type}/{id}/refresh/
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'case_id'
    
    # Маппинг типов дел на модели
    CASE_MODELS = {
        'criminal': 'criminal_proceedings.CriminalProceedings',
        'civil': 'civil_proceedings.CivilProceedings',
        'kas': 'administrative_proceedings.KasProceedings',  # ← КАС
        'coap': 'administrative_code.AdministrativeProceedings',  # ← КоАП
    }

    def get_case_model(self, case_type):
        """Получить модель дела по типу."""
        from django.apps import apps
        model_path = self.CASE_MODELS.get(case_type)
        if not model_path:
            raise ValueError(f"Unsupported case type: {case_type}")
        return apps.get_model(model_path)

    def get_case(self, case_type, case_id):
        """Получить дело по типу и ID."""
        model = self.get_case_model(case_type)
        return get_object_or_404(model, pk=case_id)

    @action(detail=False, methods=['get'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/analysis')
    def analysis(self, request, case_type=None, case_id=None):
        """Получить полный анализ дела."""
        case = self.get_case(case_type, case_id)
        
        analyzer = CaseAnalyzerService(case, case_type)
        analysis_result = analyzer.analyze()
        
        # Добавляем заметки судьи
        notes = JudgeNote.objects.filter(
            case_type=case_type,
            case_id=case.id,
            is_completed=False
        ).order_by('-importance', '-created_at')
        
        analysis_result['judge_notes'] = JudgeNoteSerializer(notes, many=True).data
        
        serializer = CaseAnalysisSerializer(analysis_result)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/notes')
    def notes(self, request, case_type=None, case_id=None):
        """Получить все заметки судьи по делу."""
        case = self.get_case(case_type, case_id)
        notes = JudgeNote.objects.filter(case_type=case_type, case_id=case.id)
        
        include_completed = request.query_params.get('include_completed', 'false').lower() == 'true'
        if not include_completed:
            notes = notes.filter(is_completed=False)
        
        serializer = JudgeNoteSerializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/notes')
    def create_note(self, request, case_type=None, case_id=None):
        """Создать заметку судьи по делу."""
        case = self.get_case(case_type, case_id)
        
        data = request.data.copy()
        data['case_type'] = case_type
        data['case_id'] = case.id
        
        serializer = JudgeNoteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['patch'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/notes/(?P<note_id>[^/.]+)')
    def update_note(self, request, case_type=None, case_id=None, note_id=None):
        """Обновить заметку судьи."""
        case = self.get_case(case_type, case_id)
        note = get_object_or_404(JudgeNote, id=note_id, case_type=case_type, case_id=case.id)
        
        serializer = JudgeNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['delete'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/notes/(?P<note_id>[^/.]+)')
    def delete_note(self, request, case_type=None, case_id=None, note_id=None):
        """Удалить заметку судьи."""
        case = self.get_case(case_type, case_id)
        note = get_object_or_404(JudgeNote, id=note_id, case_type=case_type, case_id=case.id)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/notes/(?P<note_id>[^/.]+)/complete')
    def complete_note(self, request, case_type=None, case_id=None, note_id=None):
        """Отметить заметку как выполненную."""
        case = self.get_case(case_type, case_id)
        note = get_object_or_404(JudgeNote, id=note_id, case_type=case_type, case_id=case.id)
        note.is_completed = True
        note.save()
        return Response({'status': 'completed'})

    @action(detail=False, methods=['get'], url_path='supreme-court-docs')
    def supreme_court_docs(self, request):
        """Получить список документов ВС РФ с фильтрацией по этапу."""
        stage = request.query_params.get('stage')
        queryset = SupremeCourtDocumentRef.objects.filter(is_active=True)
        
        if stage:
            queryset = queryset.filter(applicable_stages=stage)
        
        serializer = SupremeCourtDocumentRefSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='(?P<case_type>[^/.]+)/(?P<case_id>[^/.]+)/refresh')
    def refresh_analysis(self, request, case_type=None, case_id=None):
        """Принудительно обновить анализ дела (очистить кэш)."""
        case = self.get_case(case_type, case_id)
        
        CaseAdviceCache.objects.filter(
            case_type=case_type,
            case_id=case.id
        ).delete()
        
        analyzer = CaseAnalyzerService(case, case_type)
        analysis_result = analyzer.analyze()
        
        serializer = CaseAnalysisSerializer(analysis_result)
        return Response(serializer.data)