from django.contrib.auth import get_user_model
# from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
# from django.http import HttpResponseBadRequest
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from users.permissions import IsCourtStaff, IsLawyer

from .models import (SidesCase, Petitions, Category, BusinessCard,
                     Appeal, SidesCaseInCase, Decisions, Lawyer)
from .serializers import (FamiliarizationCaseSerializer,
                          SidesCaseSerializer, PetitionsSerializer,
                          ConsideredCaseSerializer, ExecutionCaseSerializer,
                          CategorySerializer, BusinessCardSerializer,
                          PetitionsInCaseSerializer, SidesCaseInCaseSerializer,
                          AppealSerializer, BusinessMovementSerializer,
                          LawyerSerializer, DecisionsSerializer, LawyerCreateSerializer)
from django_filters import rest_framework as django_filters
from rest_framework.decorators import action
from .filters import SidesCaseInCaseFilter


POSTS_NUMBER = 6

User = get_user_model()


class DocumentViewSet(viewsets.ModelViewSet):
    # Все аутентифицированные пользователи могут просматривать
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Только сотрудники суда могут изменять документы
            return [IsCourtStaff()]
        return super().get_permissions()


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
    allow_null=True
    queryset = Petitions.objects.all()
    serializer_class = PetitionsSerializer


class DecisionsViewSet(viewsets.ModelViewSet):
    """
    Список ходатайств
    """
    queryset = Decisions.objects.all()
    serializer_class = DecisionsSerializer


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

    def perform_create(self, serializer):
        instance = serializer.save()
        
        # Автоматически создаем уголовное производство для уголовных дел
        if instance.case_category and instance.case_category.id == 4:
            try:
                from criminal_proceedings.models import CriminalProceedings
                CriminalProceedings.objects.create(business_card=instance)
                print(f"Created criminal proceedings for card {instance.id}")
            except Exception as e:
                print(f"Error creating criminal proceedings: {e}")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SidesCaseInCaseViewSet(viewsets.ModelViewSet):
    """
    API endpoint для работы с моделью SidesCaseInCase.
    """
    serializer_class = SidesCaseInCaseSerializer
    filter_backends = [django_filters.DjangoFilterBackend]
    filterset_class = SidesCaseInCaseFilter

    def get_queryset(self):
        businesscard_id = self.kwargs.get('businesscard_id')
        if businesscard_id:
            businesscard = get_object_or_404(
                BusinessCard, pk=businesscard_id
            )
            return businesscard.sidescaseincase.all()
        
        # Для глобального поиска возвращаем все записи
        return SidesCaseInCase.objects.all()

    @action(detail=False, methods=['get'], url_path='search/physical')
    def search_physical(self, request):
        """Поиск физических лиц"""
        queryset = SidesCaseInCase.objects.filter(status='individual')
        
        # Применяем фильтры
        filtered_queryset = self.filter_queryset(queryset)
        
        # Пагинация
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='search/legal')
    def search_legal(self, request):
        """Поиск юридических лиц"""
        queryset = SidesCaseInCase.objects.filter(status='legal')
        
        # Применяем фильтры
        filtered_queryset = self.filter_queryset(queryset)
        
        # Пагинация
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='export/physical')
    def export_physical(self, request):
        """Экспорт физических лиц в Excel"""
        queryset = SidesCaseInCase.objects.filter(status='individual')
        filtered_queryset = self.filter_queryset(queryset)
        
        # Здесь должна быть логика экспорта в Excel
        # Например, с использованием библиотеки openpyxl или pandas
        return Response({"message": "Export endpoint - implement Excel generation"})

    @action(detail=False, methods=['get'], url_path='export/legal')
    def export_legal(self, request):
        """Экспорт юридических лиц в Excel"""
        queryset = SidesCaseInCase.objects.filter(status='legal')
        filtered_queryset = self.filter_queryset(queryset)
        
        # Здесь должна быть логика экспорта в Excel
        return Response({"message": "Export endpoint - implement Excel generation"})


class PetitionsInCaseViewSet(viewsets.ModelViewSet):
    """
    Ходатайства по делу
    """
    serializer_class = PetitionsInCaseSerializer
    search_fields = ('notification_parties',)

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id'))
        return businesscard.petitionsincase.all()

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        # Получаем данные из запроса
        petitions_data = self.request.data.get('petitions_name', [])
        notification_parties_data = self.request.data.get('notification_parties', [])

        # Преобразуем данные в список ID
        petitions_ids = [
            int(petition_id) for petition_id in petitions_data
            if isinstance(petition_id, (int, str)) and str(petition_id).isdigit()
        ]
        notification_parties_ids = [
            int(party_id) for party_id in notification_parties_data
            if isinstance(party_id, (int, str)) and str(party_id).isdigit()
        ]

        # Фильтруем объекты
        petitions = Petitions.objects.filter(id__in=petitions_ids)
        notification_parties = SidesCaseInCase.objects.filter(
            id__in=notification_parties_ids, business_card=businesscard
        )

        # Сохраняем объект и устанавливаем связи
        instance = serializer.save(business_card=businesscard)
        instance.petitions_name.set(petitions)
        instance.notification_parties.set(notification_parties)

    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        # Получаем данные из запроса
        petitions_data = self.request.data.get('petitions_name', [])
        notification_parties_data = self.request.data.get('notification_parties', [])

        # Преобразуем данные в список ID
        petitions_ids = [
            int(petition_id) for petition_id in petitions_data
            if isinstance(petition_id, (int, str)) and str(petition_id).isdigit()
        ]
        notification_parties_ids = [
            int(party_id) for party_id in notification_parties_data
            if isinstance(party_id, (int, str)) and str(party_id).isdigit()
        ]

        # Фильтруем объекты
        petitions = Petitions.objects.filter(id__in=petitions_ids)
        notification_parties = SidesCaseInCase.objects.filter(
            id__in=notification_parties_ids, business_card=businesscard
        )

        # Сохраняем объект и устанавливаем связи
        instance = serializer.save(business_card=businesscard)
        instance.petitions_name.set(petitions)
        instance.notification_parties.set(notification_parties)


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

        familiarization_data = self.request.data.get(
            'notification_parties', []
            )
        familiarization = SidesCaseInCase.objects.filter(
            id__in=familiarization_data, business_card=businesscard
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
        familiarization = SidesCaseInCase.objects.filter(
            id__in=familiarization_ids, business_card=businesscard
            )

        instance = serializer.save(business_card=businesscard)
        instance.notification_parties.set(familiarization)


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

        decision_case_data = self.request.data.get('decision_case', [])
        
        decision_case_ids = [
            int(decision_id) for decision_id in decision_case_data
            if isinstance(decision_id, (int, str)) and str(decision_id).isdigit()
        ]

        decisions = Decisions.objects.filter(id__in=decision_case_ids)
        
        instance = serializer.save(business_card=businesscard)
        instance.decision_case.set(decisions)

def perform_update(self, serializer):
    businesscard_id = self.kwargs.get('businesscard_id')
    businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

    decision_case_data = self.request.data.get('decision_case', [])

    decision_case_ids = [
        int(decision_id) for decision_id in decision_case_data
        if isinstance(decision_id, (int, str)) and str(decision_id).isdigit()
    ]

    decisions = Decisions.objects.filter(id__in=decision_case_ids)

    instance = serializer.save(business_card=businesscard)

    instance.decision_case.set(decisions)


class ConsideredCaseViewSet(viewsets.ModelViewSet):
    """
    Решение по делу
    """

    serializer_class = ConsideredCaseSerializer

    def get_queryset(self):
        businesscard = get_object_or_404(
            BusinessCard, pk=self.kwargs.get('businesscard_id')
            )
        new_queryset = businesscard.consideredcase.all()
        return new_queryset

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        consideredcase_data = self.request.data.get('notification_parties', [])
        consideredcase = SidesCaseInCase.objects.filter(id__in=consideredcase_data, business_card=businesscard)

        name_case_data = self.request.data.get('name_case', [])  # Получаем id решений
        name_case_instances = Decisions.objects.filter(id__in=name_case_data)  # Ищем решения по ID

        instance = serializer.save(business_card=businesscard)
        instance.notification_parties.set(consideredcase)
        instance.name_case.set(name_case_instances)  # Привязываем решения


    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        consideredcase_data = self.request.data.get('notification_parties', [])
        consideredcase = SidesCaseInCase.objects.filter(id__in=consideredcase_data, business_card=businesscard)

        name_case_data = self.request.data.get('name_case', [])  # Получаем id решений
        name_case_instances = Decisions.objects.filter(id__in=name_case_data)  # Ищем решения по ID

        instance = serializer.save(business_card=businesscard)
        instance.notification_parties.set(consideredcase)
        instance.name_case.set(name_case_instances)  # Привязываем решения


class AppealViewSet(viewsets.ModelViewSet):
    """
    Апелляция по делу
    """
    queryset = Appeal.objects.all()
    serializer_class = AppealSerializer


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

    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        executioncase_data = self.request.data.get(
            'notification_parties', []
            )
        executioncase = SidesCaseInCase.objects.filter(
            id__in=executioncase_data, business_card=businesscard
        )

        instance = serializer.save(business_card=businesscard)
        instance.notification_parties.set(executioncase)

    def perform_update(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        businesscard = get_object_or_404(BusinessCard, pk=businesscard_id)

        executioncase_data = self.request.data.get(
            'notification_parties', []
            )
        executioncase = SidesCaseInCase.objects.filter(
            id__in=executioncase_data, business_card=businesscard
        )

        instance = serializer.save(business_card=businesscard)
        instance.notification_parties.set(executioncase)


class LawyerViewSet(viewsets.ModelViewSet):
    serializer_class = LawyerSerializer
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LawyerCreateSerializer
        return LawyerSerializer
    
    def get_queryset(self):
        businesscard_id = self.kwargs.get('businesscard_id')
        if businesscard_id:
            return Lawyer.objects.filter(
                sides_case_incase__business_card_id=businesscard_id
            )
        return Lawyer.objects.all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        businesscard_id = self.kwargs.get('businesscard_id')
        if businesscard_id:
            context['business_card'] = get_object_or_404(
                BusinessCard, pk=businesscard_id
            )
        return context
    
    def perform_create(self, serializer):
        businesscard_id = self.kwargs.get('businesscard_id')
        business_card = get_object_or_404(BusinessCard, pk=businesscard_id)
        serializer.save()
