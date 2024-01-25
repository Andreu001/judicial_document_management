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
                     Petitions, Decisions, ConsideredCase,
                     Category, BusinessCard, PetitionsInCase,
                     Appeal)
from .serializers import (FamiliarizationCaseSerializer,
                          SidesCaseSerializer, PetitionsSerializer,
                          DecisionsSerializer,
                          ConsideredCaseSerializer,
                          CategorySerializer, BusinessCardSerializer,
                          PetitionsInCaseSerializer, SidesCaseInCaseSerializer,
                          AppealSerializer, BusinessMovementSerializer)
# from .utils import paginator_list


POSTS_NUMBER = 6

User = get_user_model()


class FamiliarizationCaseViewSet(viewsets.ModelViewSet):
    """
    Получить список всех категорий. Права доступа: Доступно без токена
    """
    queryset = FamiliarizationCase.objects.all()
    serializer_class = FamiliarizationCaseSerializer
    search_fields = ('name',)
    lookup_field = 'slug'


class SidesCaseViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = SidesCase.objects.all()
    serializer_class = SidesCaseSerializer


class PetitionsViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = Petitions.objects.all()
    serializer_class = PetitionsSerializer


class DecisionsViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = Decisions.objects.all()
    serializer_class = DecisionsSerializer


class ConsideredCaseViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = ConsideredCase.objects.all()
    serializer_class = ConsideredCaseSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """

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


class PetitionsInCaseViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = PetitionsInCase.objects.all()
    serializer_class = PetitionsInCaseSerializer


class SidesCaseInCaseViewSet(viewsets.ModelViewSet):
    """

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


class AppealViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = Appeal.objects.all()
    serializer_class = AppealSerializer


class BusinessMovementViewSet(viewsets.ModelViewSet):
    """

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
