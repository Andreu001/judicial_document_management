from django.contrib.auth import get_user_model
# from django.contrib.auth.decorators import login_required
# from django.shortcuts import get_object_or_404, redirect, render
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
    API endpoint для работы с карточками по делу
    """
    queryset = BusinessCard.objects.all()
    serializer_class = BusinessCardSerializer

    def remove(self, request, *args, **kwargs):
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
    Модель добавления сторон по делу сторон по делу
    """
    queryset = SidesCaseInCase.objects.all()
    serializer_class = SidesCaseInCaseSerializer

    def perform_create(self, serializer):
        # Извлечение id дела из URL запроса
        business_card_id = self.kwargs.get('businesscard_pk')

        # Получение объекта дела
        business_card = BusinessCard.objects.get(id=business_card_id)

        # Извлечение данных о сторонах из входных данных сериализатора
        sides_data = self.request.data.get('sides_case', [])

        # Создание объекта SidesCaseInCase
        instance = serializer.save(business_card=business_card)

        # Добавление связанных сторон по делу
        for side_data in sides_data:
            side_serializer = SidesCaseSerializer(data=side_data)
            if side_serializer.is_valid():
                side_serializer.save(sides_case_in_case=instance)
            else:
                # Обработка случая, если данные стороны недействительны
                # Здесь можно добавить нужную обработку ошибок
                pass

    def perform_update(self, serializer):
        # Извлечение id дела из URL запроса
        business_card_id = self.kwargs.get('businesscard_pk')

        # Получение объекта дела
        business_card = BusinessCard.objects.get(id=business_card_id)

        # Сохранение сторон по делу, привязанных к делу
        instance = serializer.save(business_card=business_card)


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
