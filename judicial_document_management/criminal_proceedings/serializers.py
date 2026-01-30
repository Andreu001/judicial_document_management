from rest_framework import serializers
from users.models import User
from business_card.models import SidesCaseInCase, SidesCase
from .models import (CriminalProceedings,
                     Defendant,
                     CriminalDecision,
                     CriminalRuling,
                     CriminalCaseMovement,
                     CriminalDecisions,
                     CriminalAppeal,
                     ReferringAuthority)


class DefendantSerializer(serializers.ModelSerializer):

    name = serializers.CharField(source='sides_case_person.name', read_only=True)
    full_name = serializers.CharField(source='sides_case_person.name', read_only=True)

    sides_case_person_id = serializers.PrimaryKeyRelatedField(
        queryset=SidesCaseInCase.objects.all(),
        source='sides_case_person',
        required=True
    )

    edit_name = serializers.CharField(write_only=True, required=False)
    edit_address = serializers.CharField(write_only=True, required=False)
    edit_birth_date = serializers.DateField(write_only=True, required=False)
    
    class Meta:
        model = Defendant
        fields = "__all__"
        read_only_fields = ("criminal_proceedings",)
    
    def update(self, instance, validated_data):
        sides_case_person_data = {}
        
        if 'edit_name' in validated_data:
            sides_case_person_data['name'] = validated_data.pop('edit_name')
        
        if 'edit_address' in validated_data:
            sides_case_person_data['address'] = validated_data.pop('edit_address')
        
        if 'edit_birth_date' in validated_data:
            sides_case_person_data['birth_date'] = validated_data.pop('edit_birth_date')

        if sides_case_person_data:
            instance.sides_case_person.__dict__.update(sides_case_person_data)
            instance.sides_case_person.save()

        return super().update(instance, validated_data)


class ReferringAuthoritySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringAuthority
        fields = '__all__'


class CriminalDecisionSerializer(serializers.ModelSerializer):

    name_case = serializers.CharField(read_only=True)

    class Meta:
        model = CriminalDecision
        fields = "__all__"
        read_only_fields = ("criminal_proceedings",)


class CriminalCaseMovementSerializer(serializers.ModelSerializer):
    """Сериализатор для движения дела"""
    class Meta:
        model = CriminalCaseMovement
        fields = "__all__"
        read_only_fields = ("criminal_proceedings",)


class CriminalProceedingsSerializer(serializers.ModelSerializer):
    defendants = DefendantSerializer(many=True, read_only=True)
    criminal_decisions = CriminalDecisionSerializer(many=True, read_only=True)
    case_movement = CriminalCaseMovementSerializer(read_only=True)
    referring_authority = ReferringAuthoritySerializer(read_only=True)

    class Meta:
        model = CriminalProceedings
        fields = "__all__"
        read_only_fields = ("business_card",)


class CriminalOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices
            полей модели CriminalProceedings"""

    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели CriminalProceedings"""
        model_fields = CriminalProceedings._meta.get_fields()
        choices_data = {}

        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]

        return choices_data


class DefendantOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices полей модели Defendant"""

    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели Defendant"""
        model_fields = Defendant._meta.get_fields()
        choices_data = {}

        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]

        return choices_data


class CriminalDecisionOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices
              полей модели CriminalDecision"""

    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели CriminalDecision"""
        model_fields = CriminalDecision._meta.get_fields()
        choices_data = {}

        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]

        return choices_data


class CriminalCaseMovementOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices
         полей модели CriminalCaseMovement"""

    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели CriminalCaseMovement"""
        from .models import CriminalCaseMovement
        model_fields = CriminalCaseMovement._meta.get_fields()
        choices_data = {}

        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]

        return choices_data


class CriminalRulingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalRuling
        fields = "__all__"
        read_only_fields = ("criminal_proceedings", "created_at", "updated_at")


class CriminalDecisionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalDecisions
        fields = '__all__'


class CriminalAppealSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalAppeal
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'court', 'role']


class ReferringAuthorityListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringAuthority
        fields = ['id', 'name', 'code']


class DefendantCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания обвиняемых"""
    
    # Поля для создания связанного SidesCaseInCase
    name = serializers.CharField(write_only=True, required=True)
    sides_case = serializers.PrimaryKeyRelatedField(
        queryset=SidesCase.objects.filter(
            sides_case__in=['Обвиняемый', 'Осужденный', 'Подозреваемый', 'Подсудимый']
        ),
        many=True,
        write_only=True,
        required=True
    )
    status = serializers.CharField(write_only=True, default='individual')
    birth_date = serializers.DateField(write_only=True, required=False)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Defendant
        fields = [
            'id', 'name', 'sides_case', 'status', 'birth_date', 'address', 'phone',
            'article', 'maximum_penalty_article', 'address', 'birth_date',
            'sex', 'citizenship', 'trial_result', 'restraint_measure', 'restraint_date',
            'restraint_application', 'restraint_change', 'restraint_change_date',
            'restraint_change_to', 'conviction_article', 'punishment_type',
            'punishment_term', 'additional_punishment', 'parole_info',
            'property_damage', 'moral_damage', 'detention_institution',
            'detention_address', 'special_notes'
        ]
    
    def create(self, validated_data):
        # Извлекаем данные для SidesCaseInCase
        criminal_proceedings = self.context['criminal_proceedings']
        business_card = criminal_proceedings.business_card
        name = validated_data.pop('name')
        sides_case_ids = validated_data.pop('sides_case')
        status = validated_data.pop('status')
        birth_date = validated_data.pop('birth_date', None)
        address = validated_data.pop('address', '')
        phone = validated_data.pop('phone', '')
        
        # Создаем SidesCaseInCase для обвиняемого
        sides_case_incase = SidesCaseInCase.objects.create(
            name=name,
            status=status,
            birth_date=birth_date,
            address=address,
            phone=phone,
            business_card=business_card
        )
        sides_case_incase.sides_case.set(sides_case_ids)
        
        # Создаем Defendant
        defendant = Defendant.objects.create(
            criminal_proceedings=criminal_proceedings,
            sides_case_person=sides_case_incase,
            **validated_data
        )
        
        return defendant
