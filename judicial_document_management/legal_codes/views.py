from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import (CriminalCodeArticle, CivilCodeArticle,
    AdministrativeCodeArticle, KASCodeArticle
)
from .serializers import (CriminalCodeArticleSerializer, CivilCodeArticleSerializer,
    AdministrativeCodeArticleSerializer, KASCodeArticleSerializer
)


class CriminalCodeArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для статей УК РФ (только для чтения)"""
    queryset = CriminalCodeArticle.objects.filter(is_active=True)
    serializer_class = CriminalCodeArticleSerializer
    search_fields = ['full_number', 'number', 'title', 'full_text']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_number__icontains=search) |
                Q(title__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['get'], url_path='structure')
    def get_structure(self, request, pk=None):
        """Получить структуру частей и пунктов статьи"""
        article = self.get_object()
        return Response({
            'id': article.id,
            'full_number': article.full_number,
            'title': article.title,
            'parts': article.structure.get('parts', [])
        })
    
    @action(detail=False, methods=['get'], url_path='all')
    def get_all_articles(self, request):
        """Получить все статьи для выпадающего списка"""
        articles = self.get_queryset().order_by('sort_number')
        data = [
            {
                'id': article.id,
                'full_number': article.full_number,
                'title_short': article.title[:80] + '...' if len(article.title) > 80 else article.title,
                'title': article.title,
                'structure': article.structure
            }
            for article in articles
        ]
        return Response(data)


class CivilCodeArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для статей ГК РФ (только для чтения)"""
    queryset = CivilCodeArticle.objects.filter(is_active=True)
    serializer_class = CivilCodeArticleSerializer
    search_fields = ['full_number', 'number', 'title', 'full_text']
    filterset_fields = ['part', 'section', 'chapter']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_number__icontains=search) |
                Q(title__icontains=search)
            )
        
        # Фильтрация по части кодекса
        part = self.request.query_params.get('part')
        if part:
            queryset = queryset.filter(part__icontains=part)
        
        # Фильтрация по главе
        chapter = self.request.query_params.get('chapter')
        if chapter:
            queryset = queryset.filter(chapter__icontains=chapter)
        
        return queryset
    
    @action(detail=True, methods=['get'], url_path='structure')
    def get_structure(self, request, pk=None):
        """Получить структуру пунктов статьи"""
        article = self.get_object()
        return Response({
            'id': article.id,
            'full_number': article.full_number,
            'title': article.title,
            'chapter': article.chapter,
            'section': article.section,
            'part': article.part,
            'parts': article.structure.get('parts', [])
        })
    
    @action(detail=False, methods=['get'], url_path='by-chapter')
    def get_by_chapter(self, request):
        """Получить статьи по главе"""
        chapter = request.query_params.get('chapter')
        if not chapter:
            return Response({"error": "Parameter 'chapter' is required"}, status=400)
        
        articles = self.get_queryset().filter(chapter__icontains=chapter)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)


class AdministrativeCodeArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для статей КоАП РФ (только для чтения)"""
    queryset = AdministrativeCodeArticle.objects.filter(is_active=True)
    serializer_class = AdministrativeCodeArticleSerializer
    search_fields = ['full_number', 'number', 'title', 'full_text']
    filterset_fields = ['section', 'chapter']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_number__icontains=search) |
                Q(title__icontains=search)
            )
        
        # Фильтрация по разделу
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section__icontains=section)
        
        # Фильтрация по главе
        chapter = self.request.query_params.get('chapter')
        if chapter:
            queryset = queryset.filter(chapter__icontains=chapter)
        
        return queryset
    
    @action(detail=True, methods=['get'], url_path='structure')
    def get_structure(self, request, pk=None):
        """Получить структуру частей и пунктов статьи КоАП"""
        article = self.get_object()
        return Response({
            'id': article.id,
            'full_number': article.full_number,
            'title': article.title,
            'parts': article.structure.get('parts', [])
        })
    
    @action(detail=False, methods=['get'], url_path='by-chapter')
    def get_by_chapter(self, request):
        """Получить статьи по главе"""
        chapter = request.query_params.get('chapter')
        if not chapter:
            return Response({"error": "Parameter 'chapter' is required"}, status=400)
        
        articles = self.get_queryset().filter(chapter__icontains=chapter)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-section')
    def get_by_section(self, request):
        """Получить статьи по разделу"""
        section = request.query_params.get('section')
        if not section:
            return Response({"error": "Parameter 'section' is required"}, status=400)
        
        articles = self.get_queryset().filter(section__icontains=section)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)


class KASCodeArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для статей КАС РФ (только для чтения)"""
    queryset = KASCodeArticle.objects.filter(is_active=True)
    serializer_class = KASCodeArticleSerializer
    search_fields = ['full_number', 'number', 'title', 'full_text']
    filterset_fields = ['section', 'chapter']

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_number__icontains=search) |
                Q(title__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['get'], url_path='structure')
    def get_structure(self, request, pk=None):
        """Получить структуру частей и пунктов статьи КАС"""
        article = self.get_object()
        return Response({
            'id': article.id,
            'full_number': article.full_number,
            'title': article.title,
            'chapter': article.chapter,
            'section': article.section,
            'parts': article.structure.get('parts', [])
        })

    @action(detail=False, methods=['get'], url_path='by-chapter')
    def get_by_chapter(self, request):
        """Получить статьи по главе"""
        chapter = request.query_params.get('chapter')
        if not chapter:
            return Response({"error": "Parameter 'chapter' is required"}, status=400)
        articles = self.get_queryset().filter(chapter__icontains=chapter)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
