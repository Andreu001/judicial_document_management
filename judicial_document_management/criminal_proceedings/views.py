from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import Http404
from django.shortcuts import get_object_or_404
from business_card.models import BusinessCard
from .models import CriminalProceedings, Defendant, CriminalDecision, CriminalRuling
from .serializers import (  CriminalProceedingsSerializer,
                            DefendantSerializer,
                            CriminalDecisionSerializer,
                            CriminalOptionsSerializer,
                            DefendantOptionsSerializer,
                            CriminalDecisionOptionsSerializer,
                            CriminalRulingSerializer)
import logging

logger = logging.getLogger(__name__)


class CriminalProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalProceedingsSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        return CriminalProceedings.objects.filter(business_card_id=businesscard_id)

    def get_object(self):
        queryset = self.get_queryset()
        # Используем get_object_or_404 только если объект должен существовать
        # Для случаев, когда объект может не существовать, лучше использовать другую логику
        filter_kwargs = self.kwargs.copy()
        filter_kwargs.pop('businesscard_id', None)
        obj = get_object_or_404(queryset, **filter_kwargs)
        return obj

    def retrieve(self, request, *args, **kwargs):
        """Переопределяем retrieve для обработки случая, когда запись не найдена"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Http404:
            # Если запись не найдена, возвращаем пустой ответ вместо 404
            return Response(None, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        businesscard_id = self.kwargs.get("businesscard_id")
        
        # Проверяем, существует ли уже запись для этой бизнес-карточки
        existing_record = CriminalProceedings.objects.filter(business_card_id=businesscard_id).first()
        
        if existing_record:
            # Если запись существует, обновляем её
            serializer = self.get_serializer(existing_record, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Если записи нет, создаём новую
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)
        serializer.save(business_card=businesscard)

    def update(self, request, *args, **kwargs):
        # Пытаемся получить объект, если он существует
        try:
            instance = self.get_object()
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Http404:
            # Если объект не найден, создаём новый
            return self.create(request, *args, **kwargs)

    def perform_update(self, serializer):
        serializer.save()


class DefendantViewSet(viewsets.ModelViewSet):
    serializer_class = DefendantSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        try:
            proceedings = CriminalProceedings.objects.get(business_card_id=businesscard_id)
            return Defendant.objects.filter(criminal_proceedings=proceedings)
        except CriminalProceedings.DoesNotExist:
            return Defendant.objects.none()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        proceedings, created = CriminalProceedings.objects.get_or_create(
            business_card_id=businesscard_id,
            defaults={
                'case_number': f'Уголовное дело {businesscard_id}'
            }
        )
        serializer.save(criminal_proceedings=proceedings)


class CriminalDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalDecisionSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        try:
            proceedings = CriminalProceedings.objects.get(business_card_id=businesscard_id)
            return CriminalDecision.objects.filter(criminal_proceedings=proceedings)
        except CriminalProceedings.DoesNotExist:
            return CriminalDecision.objects.none()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        proceedings, created = CriminalProceedings.objects.get_or_create(
            business_card_id=businesscard_id,
            defaults={
                'case_number': f'Уголовное дело {businesscard_id}'
            }
        )
        serializer.save(criminal_proceedings=proceedings)


@api_view(['GET'])
def criminal_options(request):
    """Получение всех опций для уголовного дела из choices полей модели"""
    choices_data = CriminalOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def defendant_options(request):
    """Получение всех опций для подсудимого из choices полей модели"""
    choices_data = DefendantOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def criminal_decision_options(request):
    """Получение всех опций для судебного решения из choices полей модели"""
    choices_data = CriminalDecisionOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


class CriminalRulingViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalRulingSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        try:
            proceedings = CriminalProceedings.objects.get(business_card_id=businesscard_id)
            return CriminalRuling.objects.filter(criminal_proceedings=proceedings)
        except CriminalProceedings.DoesNotExist:
            return CriminalRuling.objects.none()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        proceedings, created = CriminalProceedings.objects.get_or_create(
            business_card_id=businesscard_id,
            defaults={
                'case_number': f'Уголовное дело {businesscard_id}'
            }
        )
        serializer.save(criminal_proceedings=proceedings)