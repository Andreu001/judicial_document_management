"""
ViewSet для статистической карточки на подсудимого
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from .models import Defendant, CriminalProceedings
from .models_person_card import (
    CriminalPersonCard, PreviousConviction, CrimeComposition, SentencedPunishment
)
from .serializers_person_card import (
    CriminalPersonCardSerializer,
    CriminalPersonCardShortSerializer,
    PreviousConvictionSerializer,
    CrimeCompositionSerializer,
    SentencedPunishmentSerializer
)

logger = logging.getLogger(__name__)


class CriminalPersonCardViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления статистическими карточками на подсудимого
    """
    serializer_class = CriminalPersonCardSerializer
    
    def get_queryset(self):
        """Фильтрация карточек по уголовному производству и подсудимому"""
        queryset = CriminalPersonCard.objects.all().select_related(
            'defendant', 'criminal_proceedings'
        )
        return queryset
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return CriminalPersonCardShortSerializer
        return CriminalPersonCardSerializer
    
    @action(detail=False, methods=['get'], url_path='by-defendant/(?P<defendant_id>[^/.]+)')
    def by_defendant(self, request, defendant_id=None):
        """Получить карточку по ID подсудимого"""
        try:
            card = CriminalPersonCard.objects.get(defendant_id=defendant_id)
            serializer = CriminalPersonCardSerializer(card, context={'request': request})
            return Response(serializer.data)
        except CriminalPersonCard.DoesNotExist:
            return Response(
                {'detail': f'Карточка для подсудимого ID {defendant_id} не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='by-proceeding/(?P<proceeding_id>[^/.]+)')
    def by_proceeding(self, request, proceeding_id=None):
        """Получить все карточки по уголовному производству"""
        cards = CriminalPersonCard.objects.filter(
            criminal_proceedings_id=proceeding_id
        ).select_related('defendant')
        serializer = CriminalPersonCardShortSerializer(cards, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Отметить карточку как заполненную"""
        card = self.get_object()
        card.is_completed = True
        card.save()
        return Response({'status': 'completed', 'is_completed': True})
    
    @action(detail=True, methods=['post'])
    def mark_incomplete(self, request, pk=None):
        """Отметить карточку как незаполненную"""
        card = self.get_object()
        card.is_completed = False
        card.save()
        return Response({'status': 'incomplete', 'is_completed': False})
    
    @action(detail=True, methods=['get'], url_path='statistics')
    def get_statistics(self, request, pk=None):
        """Получить статистику по карточке"""
        card = self.get_object()
        stats = {
            'total_crimes': card.crime_compositions.count(),
            'main_crimes': card.crime_compositions.filter(article_type='1').count(),
            'additional_crimes': card.crime_compositions.filter(article_type='2').count(),
            'prior_convictions': card.previous_convictions.count(),
            'has_recidivism': card.crime_compositions.filter(recidivism__in=['1', '2', '3']).exists(),
            'has_mitigating': card.mitigating_circumstances not in [None, '0'],
            'has_aggravating': card.aggravating_circumstances not in [None, '0'],
        }
        return Response(stats)


class PreviousConvictionViewSet(viewsets.ModelViewSet):
    """ViewSet для предыдущих судимостей"""
    serializer_class = PreviousConvictionSerializer
    
    def get_queryset(self):
        person_card_id = self.kwargs.get('person_card_id')
        if person_card_id:
            return PreviousConviction.objects.filter(person_card_id=person_card_id)
        return PreviousConviction.objects.none()
    
    def perform_create(self, serializer):
        person_card_id = self.kwargs.get('person_card_id')
        person_card = get_object_or_404(CriminalPersonCard, pk=person_card_id)
        serializer.save(person_card=person_card)
        # Обновляем счетчик судимостей
        person_card.prior_convictions_count = person_card.previous_convictions.count()
        person_card.save(update_fields=['prior_convictions_count'])
    
    def perform_destroy(self, instance):
        """При удалении судимости обновляем счетчик"""
        person_card = instance.person_card
        instance.delete()
        person_card.prior_convictions_count = person_card.previous_convictions.count()
        person_card.save(update_fields=['prior_convictions_count'])


class CrimeCompositionViewSet(viewsets.ModelViewSet):
    """ViewSet для составов преступлений"""
    serializer_class = CrimeCompositionSerializer
    
    def get_queryset(self):
        person_card_id = self.kwargs.get('person_card_id')
        if person_card_id:
            return CrimeComposition.objects.filter(person_card_id=person_card_id)
        return CrimeComposition.objects.none()
    
    def perform_create(self, serializer):
        person_card_id = self.kwargs.get('person_card_id')
        person_card = get_object_or_404(CriminalPersonCard, pk=person_card_id)
        serializer.save(person_card=person_card)


class SentencedPunishmentViewSet(viewsets.ModelViewSet):
    """ViewSet для назначенных наказаний"""
    serializer_class = SentencedPunishmentSerializer
    
    def get_queryset(self):
        person_card_id = self.kwargs.get('person_card_id')
        if person_card_id:
            return SentencedPunishment.objects.filter(person_card_id=person_card_id)
        return SentencedPunishment.objects.none()
    
    def perform_create(self, serializer):
        person_card_id = self.kwargs.get('person_card_id')
        person_card = get_object_or_404(CriminalPersonCard, pk=person_card_id)
        serializer.save(person_card=person_card)
