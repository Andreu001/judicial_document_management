from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from .models import LegalDocument
from .serializers import (
    LegalDocumentListSerializer, 
    LegalDocumentDetailSerializer,
    LegalDocumentCreateUpdateSerializer,
    DocumentSearchSerializer
)

class LegalDocumentFilter(django_filters.FilterSet):
    """Фильтры для документов"""
    date_from = django_filters.DateFilter(field_name='document_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='document_date', lookup_expr='lte')
    article_search = django_filters.CharFilter(method='filter_by_article')
    keyword_search = django_filters.CharFilter(method='filter_by_keywords')
    
    class Meta:
        model = LegalDocument
        fields = ['document_type', 'category', 'is_active']
    
    def filter_by_article(self, queryset, name, value):
        """Поиск по статьям"""
        return queryset.filter(articles__icontains=value)
    
    def filter_by_keywords(self, queryset, name, value):
        """Поиск по ключевым словам"""
        return queryset.filter(keywords__icontains=value)

class LegalDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с правовыми документами
    """
    queryset = LegalDocument.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LegalDocumentFilter
    search_fields = ['title', 'description', 'articles', 'keywords', 'document_number']
    ordering_fields = ['document_date', 'uploaded_at', 'title']
    ordering = ['-document_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LegalDocumentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LegalDocumentCreateUpdateSerializer
        return LegalDocumentDetailSerializer
    
    def get_permissions(self):
        """Разные права для разных действий"""
        if self.action in ['list', 'retrieve', 'search']:
            permission_classes = [AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Сохраняем пользователя, который загрузил документ"""
        if self.request.user.is_authenticated:
            serializer.save(uploaded_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'], url_path='by-type/(?P<doc_type>[^/.]+)')
    def by_type(self, request, doc_type=None):
        """Получить документы по типу"""
        queryset = self.get_queryset().filter(document_type=doc_type)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-category/(?P<category>[^/.]+)')
    def by_category(self, request, category=None):
        """Получить документы по категории"""
        queryset = self.get_queryset().filter(category=category)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """Последние загруженные документы"""
        queryset = self.get_queryset().order_by('-uploaded_at')[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def advanced_search(self, request):
        """Расширенный поиск с несколькими параметрами"""
        serializer = DocumentSearchSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            queryset = self.get_queryset()
            
            # Базовый поиск по тексту
            if data.get('query'):
                queryset = queryset.filter(
                    Q(title__icontains=data['query']) |
                    Q(description__icontains=data['query']) |
                    Q(keywords__icontains=data['query'])
                )
            
            # Фильтр по типу документа
            if data.get('document_type') and data['document_type'] != 'all':
                queryset = queryset.filter(document_type=data['document_type'])
            
            # Фильтр по категории
            if data.get('category') and data['category'] != 'all':
                queryset = queryset.filter(category=data['category'])
            
            # Поиск по статье
            if data.get('article'):
                queryset = queryset.filter(articles__icontains=data['article'])
            
            # Фильтр по дате
            if data.get('date_from'):
                queryset = queryset.filter(document_date__gte=data['date_from'])
            if data.get('date_to'):
                queryset = queryset.filter(document_date__lte=data['date_to'])
            
            # Фильтр активности
            if data.get('is_active') is not None:
                queryset = queryset.filter(is_active=data['is_active'])
            
            page = self.paginate_queryset(queryset)
            if page is not None:
                result_serializer = LegalDocumentListSerializer(page, many=True)
                return self.get_paginated_response(result_serializer.data)
            
            result_serializer = LegalDocumentListSerializer(queryset, many=True)
            return Response(result_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Статистика по документам"""
        stats_data = {
            'total': LegalDocument.objects.count(),
            'by_type': {},
            'by_category': {},
            'active': LegalDocument.objects.filter(is_active=True).count(),
            'inactive': LegalDocument.objects.filter(is_active=False).count(),
        }
        
        # Статистика по типам
        for doc_type, _ in LegalDocument.DOCUMENT_TYPES:
            count = LegalDocument.objects.filter(document_type=doc_type).count()
            if count > 0:
                stats_data['by_type'][doc_type] = count
        
        # Статистика по категориям
        for category, _ in LegalDocument.CATEGORY_CHOICES:
            count = LegalDocument.objects.filter(category=category).count()
            if count > 0:
                stats_data['by_category'][category] = count
        
        return Response(stats_data)
