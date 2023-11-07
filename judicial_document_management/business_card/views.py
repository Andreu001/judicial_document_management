from django.contrib.auth import get_user_model
# from django.contrib.auth.decorators import login_required
# from django.shortcuts import get_object_or_404, redirect, render
# from django.http import HttpResponseBadRequest
from rest_framework import viewsets

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, Decisions, ConsideredCase,
                     Category, BusinessCard, PetitionsInCase,
                     SidesCaseInCase, Appeal, BusinessMovement)
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

    """
    queryset = BusinessCard.objects.all()
    serializer_class = BusinessCardSerializer


class PetitionsInCaseViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = PetitionsInCase.objects.all()
    serializer_class = PetitionsInCaseSerializer


class SidesCaseInCaseViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = SidesCaseInCase.objects.all()
    serializer_class = SidesCaseInCaseSerializer


class AppealViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = Appeal.objects.all()
    serializer_class = AppealSerializer


class BusinessMovementViewSet(viewsets.ModelViewSet):
    """

    """
    queryset = BusinessMovement.objects.all()
    serializer_class = BusinessMovementSerializer
