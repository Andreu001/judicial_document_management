# judge_assistant/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from criminal_proceedings.models import CriminalProceedings
from .models import JudgeNote, SupremeCourtDocumentRef
from .serializers import JudgeNoteSerializer, SupremeCourtDocumentRefSerializer, CaseAnalysisSerializer
from .services import CaseAnalyzerService


class CaseAdvisorViewSet(viewsets.GenericViewSet):
    """
    ViewSet для автоматизированного помощника судьи.
    Эндпоинты:
    /api/case-advisor/{id}/analysis/
    /api/case-advisor/{id}/notes/
    /api/case-advisor/{id}/refresh/
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'criminal_proceedings_pk'
    lookup_value_regex = '[^/.]+'

    def get_case(self):
        """Получить дело по переданному pk из URL"""
        # DRF передает pk как 'pk' даже если мы переименовали lookup_field
        # Нужно получать из self.kwargs
        case_id = self.kwargs.get('criminal_proceedings_pk') or self.kwargs.get('pk')
        return get_object_or_404(CriminalProceedings, pk=case_id)

    @action(detail=True, methods=['get'], url_path='analysis')
    def analysis(self, request, **kwargs):
        """Получить полный анализ дела: текущий этап, нарушения, рекомендации."""
        case = self.get_case()
        
        # Анализируем дело
        analyzer = CaseAnalyzerService(case)
        analysis_result = analyzer.analyze()
        
        # Добавляем заметки судьи
        notes = JudgeNote.objects.filter(
            criminal_proceedings=case,
            is_completed=False
        ).order_by('-importance', '-created_at')
        
        analysis_result['judge_notes'] = JudgeNoteSerializer(notes, many=True).data
        
        # Сериализуем результат
        serializer = CaseAnalysisSerializer(analysis_result)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='notes')
    def notes(self, request, **kwargs):
        """Получить все заметки судьи по делу."""
        case = self.get_case()
        notes = JudgeNote.objects.filter(criminal_proceedings=case)
        
        include_completed = request.query_params.get('include_completed', 'false').lower() == 'true'
        if not include_completed:
            notes = notes.filter(is_completed=False)
        
        serializer = JudgeNoteSerializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='notes')
    def create_note(self, request, **kwargs):
        """Создать заметку судьи по делу."""
        case = self.get_case()
        
        serializer = JudgeNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            criminal_proceedings=case,
            created_by=request.user
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='notes/(?P<note_id>[^/.]+)')
    def update_note(self, request, note_id=None, **kwargs):
        """Обновить заметку судьи."""
        case = self.get_case()
        note = get_object_or_404(JudgeNote, id=note_id, criminal_proceedings=case)
        
        serializer = JudgeNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='notes/(?P<note_id>[^/.]+)')
    def delete_note(self, request, note_id=None, **kwargs):
        """Удалить заметку судьи."""
        case = self.get_case()
        note = get_object_or_404(JudgeNote, id=note_id, criminal_proceedings=case)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='notes/(?P<note_id>[^/.]+)/complete')
    def complete_note(self, request, note_id=None, **kwargs):
        """Отметить заметку как выполненную."""
        case = self.get_case()
        note = get_object_or_404(JudgeNote, id=note_id, criminal_proceedings=case)
        note.is_completed = True
        note.save()
        return Response({'status': 'completed'})

    @action(detail=False, methods=['get'], url_path='supreme-court-docs')
    def supreme_court_docs(self, request):
        """Получить список документов ВС РФ (Пленумы, Обзоры) с фильтрацией по этапу."""
        stage = request.query_params.get('stage')
        queryset = SupremeCourtDocumentRef.objects.filter(is_active=True)
        
        if stage:
            queryset = queryset.filter(applicable_stages=stage)
        
        serializer = SupremeCourtDocumentRefSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='refresh')
    def refresh_analysis(self, request, **kwargs):
        """Принудительно обновить анализ дела (очистить кэш)."""
        case = self.get_case()
        
        # Удаляем старый кэш, если есть
        from .models import CaseAdviceCache
        CaseAdviceCache.objects.filter(criminal_proceedings=case).delete()
        
        # Делаем новый анализ
        analyzer = CaseAnalyzerService(case)
        analysis_result = analyzer.analyze()
        
        serializer = CaseAnalysisSerializer(analysis_result)
        return Response(serializer.data)