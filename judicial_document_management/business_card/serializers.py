
# from drf_extra_fields.fields import Base64ImageField
# from djoser.serializers import UserCreateSerializer, UserSerializer
# from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework import serializers

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, Decisions, ConsideredCase,
                     Category, BusinessCard, PetitionsInCase,
                     SidesCaseInCase, Appeal, BusinessMovement)
from django.contrib.auth import get_user_model

User = get_user_model()


class FamiliarizationCaseSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = FamiliarizationCase
        fields = ('petition', 'start_date', 'end_date',
                  'number_days', 'amount_one_day', 'total_amount')


class SidesCaseSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = SidesCase
        fields = ('sides_case',)


class PetitionsSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = Petitions
        fields = ('name_petition',)


class DecisionsSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = Decisions
        fields = ('name_case', 'date_consideration')


class ConsideredCaseSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = ConsideredCase
        fields = ('date_consideration',
                  'effective_date',
                  'notification_parties',
                  'executive_lists')


class CategorySerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = Category
        fields = ('title', 'description', 'slug')


class BusinessCardSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = BusinessCard
        fields = ('original_name',
                  'author',
                  'case_category',
                  'article',
                  'pub_date',
                  'preliminary_hearing')


class PetitionsInCaseSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = PetitionsInCase
        fields = ('petitions',
                  'sides_case',
                  'date_application',
                  'decision_rendered',
                  'date_decision',
                  'business_card')


class SidesCaseInCaseSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = SidesCaseInCase
        fields = ('name',
                  'sides_case',
                  'under_arrest',
                  'date_sending_agenda',
                  'business_card')


class AppealSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = Appeal
        fields = ('date_appeal',
                  'filed_appeal',
                  'decision_appeal',
                  'notification_parties',
                  'meeting_requirements')


class BusinessMovementSerializer(serializers.ModelSerializer):
    """

    """
    class Meta:
        model = BusinessMovement
        fields = ('date_meeting',
                  'meeting_time',
                  'decision_case',
                  'composition_colleges',
                  'result_court_session',
                  'reason_deposition',
                  'sides_case',
                  'business_card')
