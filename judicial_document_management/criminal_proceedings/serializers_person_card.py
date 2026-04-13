from rest_framework import serializers
from .models_person_card import (
    CriminalPersonCard, PreviousConviction, CrimeComposition, SentencedPunishment
)
from .models import Defendant, CriminalProceedings


class PreviousConvictionSerializer(serializers.ModelSerializer):
    """Сериализатор для предыдущих судимостей"""
    
    class Meta:
        model = PreviousConviction
        fields = '__all__'
        read_only_fields = ('person_card',)


class CrimeCompositionSerializer(serializers.ModelSerializer):
    """Сериализатор для составов преступлений"""
    
    instance_display = serializers.CharField(source='get_instance_display', read_only=True)
    article_type_display = serializers.CharField(source='get_article_type_display', read_only=True)
    crime_stage_display = serializers.CharField(source='get_crime_stage_display', read_only=True)
    recidivism_display = serializers.CharField(source='get_recidivism_display', read_only=True)
    
    class Meta:
        model = CrimeComposition
        fields = '__all__'
        read_only_fields = ('person_card',)


class SentencedPunishmentSerializer(serializers.ModelSerializer):
    """Сериализатор для назначенных наказаний"""
    
    instance_display = serializers.CharField(source='get_instance_display', read_only=True)
    punishment_category_display = serializers.CharField(source='get_punishment_category_display', read_only=True)
    punishment_type_display = serializers.CharField(source='get_punishment_type_display', read_only=True)
    
    class Meta:
        model = SentencedPunishment
        fields = '__all__'
        read_only_fields = ('person_card',)


class CriminalPersonCardSerializer(serializers.ModelSerializer):
    """Основной сериализатор для статистической карточки на подсудимого"""
    
    # Вложенные сериализаторы
    previous_convictions = PreviousConvictionSerializer(many=True, read_only=True)
    crime_compositions = CrimeCompositionSerializer(many=True, read_only=True)
    sentences = SentencedPunishmentSerializer(many=True, read_only=True)
    
    # Для отображения информации о подсудимом
    defendant_name = serializers.SerializerMethodField()
    case_number = serializers.SerializerMethodField()
    
    # Поля для записи ID (не write_only, а просто поля для создания)
    defendant = serializers.PrimaryKeyRelatedField(
        queryset=Defendant.objects.all(),
        required=True
    )
    criminal_proceedings = serializers.PrimaryKeyRelatedField(
        queryset=CriminalProceedings.objects.all(),
        required=True
    )
    
    # Отображение значений Choice полей
    sex_display = serializers.CharField(source='get_sex_display', read_only=True)
    family_status_display = serializers.CharField(source='get_family_status_display', read_only=True)
    citizenship_display = serializers.CharField(source='get_citizenship_display', read_only=True)
    education_display = serializers.CharField(source='get_education_display', read_only=True)
    occupation_display = serializers.CharField(source='get_occupation_display', read_only=True)
    court_result_display = serializers.CharField(source='get_court_result_display', read_only=True)
    correctional_institution_display = serializers.CharField(source='get_correctional_institution_display', read_only=True)
    appeal_result_display = serializers.CharField(source='get_appeal_result_display', read_only=True)
    military_rank_display = serializers.CharField(source='get_military_rank_display', read_only=True)
    
    class Meta:
        model = CriminalPersonCard
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_defendant_name(self, obj):
        return obj.defendant.full_name_criminal if obj.defendant else None
    
    def get_case_number(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else None
    
    def validate(self, data):
        """Валидация: проверяем, нет ли уже карточки"""
        defendant = data.get('defendant')
        criminal_proceedings = data.get('criminal_proceedings')
        
        # При создании проверяем существование
        if self.instance is None:
            if CriminalPersonCard.objects.filter(defendant=defendant).exists():
                raise serializers.ValidationError(
                    {'defendant': 'Карточка на этого подсудимого уже существует'}
                )
        return data


class CriminalPersonCardShortSerializer(serializers.ModelSerializer):
    """Краткий сериализатор для списка карточек"""
    
    defendant_name = serializers.SerializerMethodField()
    case_number = serializers.SerializerMethodField()
    is_completed_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CriminalPersonCard
        fields = ['id', 'defendant_name', 'case_number', 'is_completed', 'created_at', 'updated_at']
    
    def get_defendant_name(self, obj):
        return obj.defendant.full_name_criminal if obj.defendant else None
    
    def get_case_number(self, obj):
        return obj.criminal_proceedings.case_number_criminal if obj.criminal_proceedings else None
    
    def get_is_completed_display(self, obj):
        return "Заполнена" if obj.is_completed else "Не заполнена"
