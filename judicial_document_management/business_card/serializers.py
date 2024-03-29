
# from drf_extra_fields.fields import Base64ImageField
# from djoser.serializers import UserCreateSerializer, UserSerializer
# from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework import serializers

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, ConsideredCase,
                     Category, BusinessCard, PetitionsInCase,
                     SidesCaseInCase, Appeal, BusinessMovement, ExecutionCase)
from django.contrib.auth import get_user_model

User = get_user_model()


class FamiliarizationCaseSerializer(serializers.ModelSerializer):
    """
    Ознакомление с материалами дела
    """
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


class ConsideredCaseSerializer(serializers.ModelSerializer):
    """
     Действия по рассмотренному делу
    """
    class Meta:
        model = ConsideredCase
        fields = ('id', 'date_consideration',
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


class SidesCaseInCaseSerializer(serializers.ModelSerializer):
    """
    Модель добавления сторон по делу
    """
    # sides_case = SidesCaseSerializer(many=True, read_only=True)

    class Meta:
        model = SidesCaseInCase
        fields = ('name', 'id',
                  'sides_case',
                  'under_arrest',
                  'date_sending_agenda'
                  )


class PetitionsInCaseSerializer(serializers.ModelSerializer):
    """
    Промежуточная таблица для ходатайств
    """

    notification_parties_names = serializers.SerializerMethodField()

    class Meta:
        model = PetitionsInCase
        fields = (
            'petitions',
            'id',
            'notification_parties',
            'notification_parties_names',  # Добавляем это поле
            'date_application',
            'decision_rendered',
            'date_decision',
        )

    def get_notification_parties_names(self, obj):
        return [str(side) for side in obj.notification_parties.all()]


class AppealSerializer(serializers.ModelSerializer):
    """
    Апелляция по делу
    """
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

    class Meta:
        model = ExecutionCase
        fields = ('date_notification',
                  'notification_parties',
                  'executive_lists',
                  )
