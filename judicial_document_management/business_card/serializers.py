from rest_framework import serializers

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, ConsideredCase, Decisions,
                     Category, BusinessCard, PetitionsInCase,
                     SidesCaseInCase, Appeal, BusinessMovement,
                     Lawyer, ExecutionCase, LawyerProfile,
                     CourtSessionResult, ReasonDeposition)
from django.contrib.auth import get_user_model
from criminal_proceedings.serializers import CriminalProceedingsSerializer

User = get_user_model()


class SidesCaseInCaseSerializer(serializers.ModelSerializer):
    """
    Модель добавления сторон по делу
    """

    sides_case_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    gender_display = serializers.CharField(
        source='get_gender_display',
        read_only=True
    )
    lawyer_id = serializers.SerializerMethodField()
    is_lawyer = serializers.SerializerMethodField()

    class Meta:
        model = SidesCaseInCase
        fields = '__all__'

    def get_sides_case_name(self, obj):
        return [side.sides_case for side in obj.sides_case.all()]

    def get_lawyer_id(self, obj):
        try:
            lawyer = obj.lawyer_info
            return lawyer.id if lawyer else None
        except Lawyer.DoesNotExist:
            return None

    def get_is_lawyer(self, obj):
        return obj.sides_case.filter(sides_case__icontains='Адвокат').exists()


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

    criminal_proceedings = CriminalProceedingsSerializer(read_only=True)

    class Meta:
        model = BusinessCard
        fields = ('original_name',
                  'id',
                  'author',
                  'case_category',
                  'case_category_title',
                  'pub_date',
                  'preliminary_hearing',
                  'criminal_proceedings'
                  )


class PetitionsInCaseSerializer(serializers.ModelSerializer):
    """
    Промежуточная таблица для ходатайств
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)
    petitions_name = PetitionsSerializer(many=True, read_only=True)

    petitioner_info = serializers.JSONField(required=False, default=dict, allow_null=True)

    decision_rendered = serializers.PrimaryKeyRelatedField(
        queryset=Decisions.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = PetitionsInCase
        fields = (
            'id',
            'petitions_name',
            'notification_parties',
            'date_application',
            'decision_rendered',
            'date_decision',
            'notation',
            'petitioner_info',
            'business_card',
        )
        read_only_fields = ('business_card',)


class AppealSerializer(serializers.ModelSerializer):
    """
    Апелляция по делу
    """

    notification_parties = SidesCaseInCaseSerializer(many=True, read_only=True)

    class Meta:
        model = Appeal
        fields = ('id',
                  'decision_appeal',
                  'notification_parties',
                  )


class CourtSessionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtSessionResult
        fields = ('id', 'name', 'order')


class ReasonDepositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReasonDeposition
        fields = ('id', 'name', 'order')


class BusinessMovementSerializer(serializers.ModelSerializer):
    """Движение по делу"""

    court_session_result_detail = CourtSessionResultSerializer(
        source='court_session_result', read_only=True
    )
    reason_deposition_detail = ReasonDepositionSerializer(
        source='reason_deposition', read_only=True
    )
    decision_case_detail = DecisionsSerializer(
        source='decision_case', many=True, read_only=True
    )

    class Meta:
        model = BusinessMovement
        fields = (
            'id',
            'date_meeting',
            'meeting_time',
            'decision_case',
            'decision_case_detail',
            'court_session_result',
            'court_session_result_detail',
            'reason_deposition',
            'reason_deposition_detail',
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


class LawyerProfileSerializer(serializers.ModelSerializer):
    """Сериализатор реестра адвокатов"""

    class Meta:
        model = LawyerProfile
        fields = '__all__'
        read_only_fields = ('id',)


class LawyerSerializer(serializers.ModelSerializer):
    """Сериализатор для чтения адвоката"""

    profile_detail = LawyerProfileSerializer(source='profile', read_only=True)
    payment_status_display = serializers.CharField(
        source='get_payment_status_display', read_only=True
    )

    class Meta:
        model = Lawyer
        fields = '__all__'
        read_only_fields = ('id',)


class LawyerCreateSerializer(serializers.ModelSerializer):
    """Создание/обновление адвоката под форму LawyerDetails.jsx"""

    lawyer_data = serializers.DictField(write_only=True, required=False)
    sides_case_role = serializers.PrimaryKeyRelatedField(
        queryset=SidesCase.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    profile_id = serializers.PrimaryKeyRelatedField(
        queryset=LawyerProfile.objects.all(),
        source='profile',
        write_only=True,
        required=False,
        allow_null=True
    )
    save_to_registry = serializers.BooleanField(
        write_only=True, required=False, default=False
    )

    # Поля Lawyer, которые разрешено записывать через lawyer_data
    ALLOWED_LAWYER_FIELDS = (
        'full_name',
        'law_firm_name', 'law_firm_address', 'law_firm_phone', 'law_firm_email',
        'bank_name', 'bank_bik', 'correspondent_account', 'payment_account',
        'lawyer_certificate_number', 'lawyer_certificate_date',
        'days_for_payment', 'payment_per_day', 'payment_amount', 'payment_date',
        'payment_status', 'payment_request_date', 'accounting_sent_date',
        'notes',
    )

    class Meta:
        model = Lawyer
        fields = [
            'id',
            'lawyer_data', 'sides_case_role',
            'profile_id', 'save_to_registry',
        ]

    # ---------- helpers ----------
    def _pop_lawyer_data(self, validated_data):
        lawyer_data = validated_data.pop('lawyer_data', {}) or {}
        sides_case_role = validated_data.pop('sides_case_role', None)
        profile = validated_data.get('profile')
        save_to_registry = validated_data.pop('save_to_registry', False)
        return lawyer_data, sides_case_role, profile, save_to_registry

    def _create_profile_if_needed(self, lawyer_data, profile, save_to_registry):
        """Создаёт LawyerProfile, если галочка стоит и профиль не выбран"""
        if profile is None and save_to_registry:
            profile = LawyerProfile.objects.create(
                full_name=(
                    lawyer_data.get('full_name')
                    or lawyer_data.get('law_firm_name')
                    or 'Адвокат'
                ),
                law_firm_name=lawyer_data.get('law_firm_name'),
                law_firm_address=lawyer_data.get('law_firm_address'),
                law_firm_phone=lawyer_data.get('law_firm_phone'),
                law_firm_email=lawyer_data.get('law_firm_email'),
                bank_name=lawyer_data.get('bank_name'),
                bank_bik=lawyer_data.get('bank_bik'),
                correspondent_account=lawyer_data.get('correspondent_account'),
                payment_account=lawyer_data.get('payment_account'),
                lawyer_certificate_number=lawyer_data.get('lawyer_certificate_number'),
                lawyer_certificate_date=lawyer_data.get('lawyer_certificate_date'),
                notes=lawyer_data.get('notes'),
            )
        return profile

    def _filter_lawyer_data(self, lawyer_data):
        return {
            k: v for k, v in lawyer_data.items()
            if k in self.ALLOWED_LAWYER_FIELDS
        }

    # ---------- create ----------
    def create(self, validated_data):
        lawyer_data, sides_case_role, profile, save_to_registry = self._pop_lawyer_data(validated_data)
        profile = self._create_profile_if_needed(lawyer_data, profile, save_to_registry)

        lawyer = Lawyer.objects.create(
            profile=profile,
            **self._filter_lawyer_data(lawyer_data)
        )
        return lawyer

    # ---------- update ----------
    def update(self, instance, validated_data):
        lawyer_data, sides_case_role, profile, save_to_registry = self._pop_lawyer_data(validated_data)
        profile = self._create_profile_if_needed(lawyer_data, profile, save_to_registry)

        if profile is not None:
            instance.profile = profile

        for key, value in self._filter_lawyer_data(lawyer_data).items():
            setattr(instance, key, value)

        instance.save()
        return instance
