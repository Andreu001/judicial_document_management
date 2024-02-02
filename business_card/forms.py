from django.forms import ModelForm
from .models import (
                    BusinessCard, SidesCaseInCase,
                    BusinessMovement, PetitionsInCase)


class CardForm(ModelForm):
    class Meta:
        model = BusinessCard
        fields = [
            'original_name', 'case_category', 'article',
            'preliminary_hearing'
        ]

        labels = {
            'original_name': 'Номер дела',
            'case_category': 'категория'
        }

        help_texts = {
            'original_name': 'Номер нового дела',
            'case_category': 'Категория'
        }


class SideForm(ModelForm):
    class Meta:
        model = SidesCaseInCase
        fields = [
            'sides_case', 'name',
            'under_arrest',
            'date_sending_agenda',
            'business_card',
        ]

        '''labels = {
            'sides_case': 'Статус стороны',
            'name': 'ФИО'
        }'''


class SidesCaseInCaseForm(ModelForm):
    class Meta:
        model = SidesCaseInCase
        fields = [
            'sides_case',
            'name',
            'date_sending_agenda',
            # 'familiarization_case'
        ]


class MovementForm(ModelForm):
    class Meta:
        model = BusinessMovement
        fields = [
            'date_meeting', 'meeting_time',
            'decision_case',
            'composition_colleges',
            'result_court_session',
            'reason_deposition',
            'business_card',
        ]


class PetitionsInCaseForm(ModelForm):
    class Meta:
        model = PetitionsInCase
        fields = [
            'petitions', 'sides_case',
            'date_application',
            'business_card',
        ]
