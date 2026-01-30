
from rest_framework import serializers

from .models import (FamiliarizationCase, SidesCase,
                     Petitions, ConsideredCase, Decisions,
                     Category, BusinessCard, PetitionsInCase,
                     SidesCaseInCase, Appeal, BusinessMovement,
                     Lawyer, ExecutionCase)
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
        # Получаем ID связанного адвоката, если он существует
        try:
            lawyer = obj.lawyer_info
            return lawyer.id if lawyer else None
        except Lawyer.DoesNotExist:
            return None
    
    def get_is_lawyer(self, obj):
        # Проверяем, является ли сторона адвокатом
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
    decision_rendered = serializers.PrimaryKeyRelatedField(
        queryset=Decisions.objects.all(),
        many=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = PetitionsInCase
        fields = (
            'petitions_name',
            'id',
            'notification_parties',
            'date_application',
            'decision_rendered',  # Убедитесь, что поле включено
            'date_decision',
        )


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


class LawyerSerializer(serializers.ModelSerializer):
    sides_case_incase = serializers.PrimaryKeyRelatedField(
        queryset=SidesCaseInCase.objects.all()
    )
    

    sides_case_incase_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Lawyer
        fields = '__all__'
        read_only_fields = ('id',)
    
    def get_sides_case_incase_name(self, obj):
        if obj.sides_case_incase:
            return obj.sides_case_incase.name
        return None


class LawyerCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания адвокатов"""
    
    # Поля для создания связанного SidesCaseInCase
    name = serializers.CharField(write_only=True, required=True)
    status = serializers.CharField(write_only=True, default='individual')
    sides_case = serializers.PrimaryKeyRelatedField(
        queryset=SidesCase.objects.filter(sides_case='Адвокат(защитник)'),
        many=True,
        write_only=True,
        required=True
    )
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Lawyer
        fields = [
            'id', 'name', 'status', 'sides_case', 'address', 'phone', 'email',
            'law_firm_name', 'law_firm_address', 'law_firm_phone', 'law_firm_email',
            'bank_name', 'bank_bik', 'correspondent_account', 'payment_account',
            'lawyer_certificate_number', 'lawyer_certificate_date',
            'days_for_payment', 'payment_amount', 'payment_date', 'notes'
        ]
    
    def create(self, validated_data):
        # Извлекаем данные для SidesCaseInCase
        business_card = self.context['business_card']
        name = validated_data.pop('name')
        status = validated_data.pop('status')
        sides_case_ids = validated_data.pop('sides_case')
        address = validated_data.pop('address', '')
        phone = validated_data.pop('phone', '')
        email = validated_data.pop('email', '')
        
        # Создаем SidesCaseInCase для адвоката
        sides_case_incase = SidesCaseInCase.objects.create(
            name=name,
            status=status,
            address=address,
            phone=phone,
            email=email,
            business_card=business_card
        )
        sides_case_incase.sides_case.set(sides_case_ids)
        
        # Создаем Lawyer
        lawyer = Lawyer.objects.create(
            sides_case_incase=sides_case_incase,
            **validated_data
        )
        
        return lawyer
