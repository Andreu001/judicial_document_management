# civil_proceedings/views.py
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, action
from django.shortcuts import get_object_or_404
from django.http import Http404
from business_card.models import BusinessCard
from .models import CivilProceedings, CivilDecision, CivilSide, CivilProcedureAction
from .serializers import (
    CivilProceedingsSerializer, 
    CivilDecisionSerializer,
    CivilSideSerializer,
    CivilProcedureActionSerializer
)
import logging

logger = logging.getLogger(__name__)


class CivilProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CivilProceedingsSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        return CivilProceedings.objects.filter(business_card_id=businesscard_id)

    def get_object(self):
        queryset = self.get_queryset()
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
        existing_record = CivilProceedings.objects.filter(business_card_id=businesscard_id).first()
        
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


class CivilDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = CivilDecisionSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        try:
            proceedings = CivilProceedings.objects.get(business_card_id=businesscard_id)
            return CivilDecision.objects.filter(civil_proceedings=proceedings)
        except CivilProceedings.DoesNotExist:
            return CivilDecision.objects.none()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        proceedings, created = CivilProceedings.objects.get_or_create(
            business_card_id=businesscard_id,
            defaults={'business_card_id': businesscard_id}
        )
        serializer.save(civil_proceedings=proceedings)


class CivilSideViewSet(viewsets.ModelViewSet):
    serializer_class = CivilSideSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        try:
            proceedings = CivilProceedings.objects.get(business_card_id=businesscard_id)
            return CivilSide.objects.filter(civil_proceedings=proceedings)
        except CivilProceedings.DoesNotExist:
            return CivilSide.objects.none()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        proceedings, created = CivilProceedings.objects.get_or_create(
            business_card_id=businesscard_id,
            defaults={'business_card_id': businesscard_id}
        )
        serializer.save(civil_proceedings=proceedings)


class CivilProcedureActionViewSet(viewsets.ModelViewSet):
    serializer_class = CivilProcedureActionSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        try:
            proceedings = CivilProceedings.objects.get(business_card_id=businesscard_id)
            return CivilProcedureAction.objects.filter(civil_proceedings=proceedings)
        except CivilProceedings.DoesNotExist:
            return CivilProcedureAction.objects.none()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        proceedings, created = CivilProceedings.objects.get_or_create(
            business_card_id=businesscard_id,
            defaults={'business_card_id': businesscard_id}
        )
        serializer.save(civil_proceedings=proceedings)


# Опционально: Добавьте endpoint для получения choices опций, если они есть в моделях
@api_view(['GET'])
def civil_proceedings_options(request):
    """Получение всех опций для гражданского дела из choices полей модели"""
    from .serializers import CivilOptionsSerializer
    choices_data = CivilOptionsSerializer.get_choices_from_model()
    return Response(choices_data)


@api_view(['GET'])
def civil_decision_options(request):
    """Получение всех опций для решений по гражданскому делу из choices полей модели"""
    from .serializers import CivilDecisionOptionsSerializer
    choices_data = CivilDecisionOptionsSerializer.get_choices_from_model()
    return Response(choices_data)