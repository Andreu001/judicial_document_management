# criminal_proceedings/views.py
from rest_framework import viewsets
from django.shortcuts import get_object_or_404
from business_card.models import BusinessCard
from .models import CriminalProceedings, Defendant, CriminalDecision
from .serializers import CriminalProceedingsSerializer, DefendantSerializer, CriminalDecisionSerializer

class CriminalProceedingsViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalProceedingsSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(BusinessCard, pk=self.kwargs.get("businesscard_id"))
        return CriminalProceedings.objects.filter(business_card=businesscard)

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get("businesscard_id")
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)
        serializer.save(business_card=businesscard)


class DefendantViewSet(viewsets.ModelViewSet):
    serializer_class = DefendantSerializer

    def get_queryset(self):
        proceedings = get_object_or_404(CriminalProceedings, business_card_id=self.kwargs.get("businesscard_id"))
        return Defendant.objects.filter(criminal_proceedings=proceedings)

    def perform_create(self, serializer):
        proceedings = get_object_or_404(CriminalProceedings, business_card_id=self.kwargs.get("businesscard_id"))
        serializer.save(criminal_proceedings=proceedings)


class CriminalDecisionViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalDecisionSerializer

    def get_queryset(self):
        proceedings = get_object_or_404(CriminalProceedings, business_card_id=self.kwargs.get("businesscard_id"))
        return CriminalDecision.objects.filter(criminal_proceedings=proceedings)

    def perform_create(self, serializer):
        proceedings = get_object_or_404(CriminalProceedings, business_card_id=self.kwargs.get("businesscard_id"))
        serializer.save(criminal_proceedings=proceedings)