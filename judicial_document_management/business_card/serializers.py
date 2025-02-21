
# from drf_extra_fields.fields import Base64ImageField
# from djoser.serializers import UserCreateSerializer, UserSerializer
# from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework import serializers

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, ConsideredCase, Decisions,
                     Category, BusinessCard, PetitionsInCase,
                     SidesCaseInCase, Appeal, BusinessMovement, ExecutionCase)
from django.contrib.auth import get_user_model

User = get_user_model()


class SidesCaseInCaseSerializer(serializers.ModelSerializer):
    """
    Модель добавления сторон по делу
    """

    sides_case_name = serializers.StringRelatedField(
        many=True,
        source='sides_case',
        read_only=True
    )

    class Meta:
        model = SidesCaseInCase
        fields = ('name', 'id',
                  'sides_case', 'sides_case_name',
                  'under_arrest',
                  'date_sending_agenda'
                  )


class FamiliarizationCaseSerializer(serializers.ModelSerializer):
    """
    Ознакомление с материалами дела
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)

    class Meta:
        model = FamiliarizationCase
        fields = ('id', 'petition', 'start_date', 'end_date',
                  'number_days', 'amount_one_day',
                  'total_amount', 'notification_parties')


class SidesCaseSerializer(serializers.ModelSerializer):
    """
    Стороны по делу
    """

    class Meta:
        model = SidesCase
        fields = ('id', 'sides_case',)


class PetitionsSerializer(serializers.ModelSerializer):
    """
    Модель заявленных ходатайств по делу
    """
    class Meta:
        model = Petitions
        fields = ('id', 'petitions',)


class DecisionsSerializer(serializers.ModelSerializer):
    """
    Модель заявленных ходатайств по делу
    """
    class Meta:
        model = Decisions
        fields = ('id', 'name_case', 'date_consideration', 
                  'notation',
                  )


class ConsideredCaseSerializer(serializers.ModelSerializer):
    """
     Действия по рассмотренному делу
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)
    name_case = DecisionsSerializer(many=True, read_only=True)

    class Meta:
        model = ConsideredCase
        fields = ('name_case', 'id', 'date_consideration',
                  'effective_date',
                  'notification_parties',
                  'executive_lists')


class CategorySerializer(serializers.ModelSerializer):
    """
    Модель категорий дела
    """
    class Meta:
        model = Category
        fields = ('id', 'title_category', 'description', 'slug')


class BusinessCardSerializer(serializers.ModelSerializer):
    """
    Модель карточки по делу
    """

    case_category_title = serializers.CharField(
        source='case_category.title_category', read_only=True
        )

    class Meta:
        model = BusinessCard
        fields = ('original_name',
                  'id',
                  'author',
                  'case_category',
                  'case_category_title',
                  'article',
                  'pub_date',
                  'preliminary_hearing')



class PetitionsInCaseSerializer(serializers.ModelSerializer):
    """
    Промежуточная таблица для ходатайств
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)
    petitions_name = PetitionsSerializer(many=True, read_only=True)

    class Meta:
        model = PetitionsInCase
        fields = (
            'petitions_name',
            'id',
            'notification_parties',
            'date_application',
            'decision_rendered',
            'date_decision',
        )


class AppealSerializer(serializers.ModelSerializer):
    """
    Апелляция по делу
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)

    class Meta:
        model = Appeal
        fields = ('date_appeal',
                  'id',
                  'filed_appeal',
                  'decision_appeal',
                  'notification_parties',
                  'meeting_requirements')


class BusinessMovementSerializer(serializers.ModelSerializer):
    """
    Движение по делу
    """

    class Meta:
        model = BusinessMovement
        fields = ('date_meeting',
                  'id',
                  'meeting_time',
                  'decision_case',
                  'composition_colleges',
                  'result_court_session',
                  'reason_deposition',
                  )


class ExecutionCaseSerializer(serializers.ModelSerializer):
    """
    ИСполнение по делу
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)

    class Meta:
        model = ExecutionCase
        fields = ('date_notification',
                  'notification_parties',
                  'executive_lists',
                  )
