from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from business_card.models import BusinessCard
from .models import CriminalProceedings, Defendant, CriminalDecision
from .serializers import CriminalProceedingsSerializer, DefendantSerializer, CriminalDecisionSerializer
import logging

logger = logging.getLogger(__name__)


class CriminalProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalProceedingsSerializer

    def get_queryset(self):
        businesscard_id = self.kwargs.get("businesscard_id")
        return CriminalProceedings.objects.filter(business_card_id=businesscard_id)

    def get_object(self):
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset)
        return obj

    def create(self, request, *args, **kwargs):
        businesscard_id = self.kwargs.get("businesscard_id")
        
        # Проверяем, существует ли уже запись для этой бизнес-карточки
        if CriminalProceedings.objects.filter(business_card_id=businesscard_id).exists():
            return Response(
                {"error": "Criminal proceedings already exist for this business card"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)
        serializer.save(business_card=businesscard)

    # ДОБАВЬТЕ ЭТОТ МЕТОД ДЛЯ ОБНОВЛЕНИЯ
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

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