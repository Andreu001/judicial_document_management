from django.contrib.auth import get_user_model
# from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
# from django.http import HttpResponseBadRequest
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
# from rest_framework.decorators import action

# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.authentication import TokenAuthentication

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, ConsideredCase,
                     Category, BusinessCard, PetitionsInCase,
                     Appeal, SidesCaseInCase, ExecutionCase)
from .serializers import (FamiliarizationCaseSerializer,
                          SidesCaseSerializer, PetitionsSerializer,
                          ConsideredCaseSerializer, ExecutionCaseSerializer,
                          CategorySerializer, BusinessCardSerializer,
                          PetitionsInCaseSerializer, SidesCaseInCaseSerializer,
                          AppealSerializer, BusinessMovementSerializer)
# from .utils import paginator_list


POSTS_NUMBER = 6

User = get_user_model()


class SidesCaseViewSet(viewsets.ModelViewSet):
    """
    Список сторон по делу
    """
    queryset = SidesCase.objects.all()
    serializer_class = SidesCaseSerializer


class PetitionsViewSet(viewsets.ModelViewSet):
    """
    Список ходатайств
    """
    queryset = Petitions.objects.all()
    serializer_class = PetitionsSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Список категорий
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class BusinessCardViewSet(viewsets.ModelViewSet):
    """
    API endpoint для работы с карточками по делу
    """
    queryset = BusinessCard.objects.all()
    serializer_class = BusinessCardSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SidesCaseInCaseViewSet(viewsets.ModelViewSet):
    """
    API endpoint для работы с моделью SidesCaseInCase.
    """
    serializer_class = SidesCaseInCaseSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.sidescaseincase.all()
        return new_queryset

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        sides_case_data = self.request.data.get('sides_case', [])
        sides_case_ids = [
            int(side_id) for side_id in sides_case_data if isinstance(
                side_id, (int, str)
                )]
        sides_case = SidesCase.objects.filter(id__in=sides_case_ids)

        instance = serializer.save(business_card=businesscard)
        instance.sides_case.set(sides_case)

    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        sides_case_data = self.request.data.get('sides_case', [])
        sides_case_ids = [
            int(side_id) for side_id in sides_case_data if isinstance(
                side_id, (int, str)
                )
            ]
        sides_case = SidesCase.objects.filter(id__in=sides_case_ids)
        instance = serializer.save(business_card=businesscard)
        instance.sides_case.set(sides_case)


class PetitionsInCaseViewSet(viewsets.ModelViewSet):
    """
    Ходатайства по делу
    """
    serializer_class = PetitionsInCaseSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.petitionsincase.all()
        return new_queryset

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')

        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)
        petitions_data = self.request.data.get('petitions', [])
        petitions_ids = [
            int(petitions_id) for petitions_id in petitions_data if isinstance(
                petitions_id, (int, str)
                )]
        petitions = Petitions.objects.filter(id__in=petitions_ids)

        instance = serializer.save(business_card=businesscard)
        instance.petitions.set(petitions)

    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')

        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)
        petitions_data = self.request.data.get('petitions', [])
        petitions_ids = [
            int(petitions_id) for petitions_id in petitions_data if isinstance(
                petitions_id, (int, str)
                )]
        petitions = Petitions.objects.filter(id__in=petitions_ids)

        instance = serializer.save(business_card=businesscard)
        instance.petitions.set(petitions)


class FamiliarizationCaseViewSet(viewsets.ModelViewSet):
    """
    Ознакомление с мат. дела
    """
    serializer_class = FamiliarizationCaseSerializer
    search_fields = ('notification_parties',)

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.familiarizationcase.all()
        return new_queryset

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        familiarization_data = self.request.data.get('notification_parties', [])
        familiarization = SidesCaseInCase.objects.filter(
            id__in=familiarization_data
        )

        instance = serializer.save(business_card=businesscard)
        instance.notification_parties.set(familiarization)

    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')

        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)
        familiarization_data = self.request.data.get('familiarization', [])
        familiarization_ids = [
            int(
                familiarization_id
                ) for familiarization_id in familiarization_data if isinstance(
                familiarization_id, (int, str)
                )]
        familiarization = FamiliarizationCase.objects.filter(
            id__in=familiarization_ids
            )

        instance = serializer.save(business_card=businesscard)
        instance.familiarization.set(familiarization)


class BusinessMovementViewSet(viewsets.ModelViewSet):
    """
    Движение дела
    """
    serializer_class = BusinessMovementSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.businessmovement.all()
        return new_queryset

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        movement_data = self.request.data.get('sides_case', [])
        movement_ids = [
            int(movement_id) for movement_id in movement_data if isinstance(
                movement_id, (int, str)
                )]

        instance = serializer.save(business_card=businesscard)

    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        movement_data = self.request.data.get('sides_case', [])
        movement_ids = [
            int(side_id) for side_id in movement_data if isinstance(
                side_id, (int, str)
                )
            ]
        sides_case = SidesCase.objects.filter(id__in=movement_ids)
        instance = serializer.save(business_card=businesscard)
        instance.sides_case.set(sides_case)


class ConsideredCaseViewSet(viewsets.ModelViewSet):
    """
    Рассмотрение дела
    """

    serializer_class = ConsideredCaseSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.consideredcase.all()
        return new_queryset


class AppealViewSet(viewsets.ModelViewSet):
    """
    Апелляция по делу
    """
    queryset = Appeal.objects.all()
    serializer_class = AppealSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.appeal.all()
        return new_queryset


class ExecutionCaseViewSet(viewsets.ModelViewSet):
    """
    Исполнение дела
    """
    serializer_class = ExecutionCaseSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.executioncase.all()
        return new_queryset
