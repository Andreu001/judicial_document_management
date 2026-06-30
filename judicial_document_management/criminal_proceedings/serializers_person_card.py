from rest_framework import serializers
from legal_codes.models import CriminalCodeArticle
from .models_person_card import (
    CriminalPersonCard, PreviousConviction, CrimeComposition, SentencedPunishment
)
from .models import Defendant, CriminalProceedings
from .person_card_constants import *


class CriminalCodeArticleSimpleSerializer(serializers.ModelSerializer):
    """Краткий сериализатор для статей УК РФ"""
    class Meta:
        model = CriminalCodeArticle
        fields = ['id', 'full_number', 'number', 'title_short']


class PreviousConvictionSerializer(serializers.ModelSerializer):
    """Сериализатор для предыдущих судимостей"""
    
    article_detail = serializers.SerializerMethodField()
    article_structure = serializers.SerializerMethodField()
    punishment_type_display = serializers.SerializerMethodField()
    punishment_served_display = serializers.SerializerMethodField()
    
    # Добавляем поле для приема ID статьи
    article_id = serializers.PrimaryKeyRelatedField(
        source='article',
        queryset=CriminalCodeArticle.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = PreviousConviction
        fields = '__all__'
        read_only_fields = ('person_card',)
    
    def get_article_detail(self, obj):
        if obj.article:
            return {
                'id': obj.article.id,
                'full_number': obj.article.full_number,
                'title': obj.article.title[:100] if obj.article.title else '',
                'title_short': obj.article.title[:50] if obj.article.title else '',
                'parts': obj.article.structure.get('parts', []) if obj.article.structure else []
            }
        return None
    
    def get_article_structure(self, obj):
        if obj.article and obj.article.structure:
            return obj.article.structure
        return None
    
    def get_punishment_type_display(self, obj):
        choices = dict(PUNISHMENT_TYPE_CHOICES)
        return choices.get(obj.punishment_type, obj.punishment_type) if obj.punishment_type else None
    
    def get_punishment_served_display(self, obj):
        served_choices = {
            '1': 'отбыл наказание полностью',
            '2': 'освобожден условно-досрочно',
            '3': 'освобожден в порядке замены более мягким видом',
            '4': 'освобожден по амнистии (помилованию)',
            '5': 'освобожден по болезни',
            '6': 'освобожден в связи с истечением срока давности',
            '9': 'условное осуждение, исполняется самостоятельно',
            '10': 'условное осуждение отменено с отбытием реального наказания',
            '11': 'условное осуждение отменено без отбытия реального наказания',
        }
        return served_choices.get(obj.punishment_served, obj.punishment_served) if obj.punishment_served else None
    
    def create(self, validated_data):
        # article_id уже преобразован в article через source='article'
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class CrimeCompositionSerializer(serializers.ModelSerializer):
    """Сериализатор для составов преступлений"""
    
    instance_display = serializers.CharField(source='get_instance_display', read_only=True)
    article_type_display = serializers.CharField(source='get_article_type_display', read_only=True)
    crime_stage_display = serializers.CharField(source='get_crime_stage_display', read_only=True)
    recidivism_display = serializers.CharField(source='get_recidivism_display', read_only=True)
    
    article_detail = serializers.SerializerMethodField()
    article_structure = serializers.SerializerMethodField()
    
    # Добавляем поле для приема ID статьи
    article_id = serializers.PrimaryKeyRelatedField(
        source='article',
        queryset=CriminalCodeArticle.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = CrimeComposition
        fields = '__all__'
        read_only_fields = ('person_card',)
    
    def get_article_detail(self, obj):
        if obj.article:
            return {
                'id': obj.article.id,
                'full_number': obj.article.full_number,
                'title': obj.article.title[:100] if obj.article.title else '',
                'title_short': obj.article.title[:50] if obj.article.title else '',
                'parts': obj.article.structure.get('parts', []) if obj.article.structure else []
            }
        return None
    
    def get_article_structure(self, obj):
        if obj.article and obj.article.structure:
            return obj.article.structure
        return None


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
    
    previous_convictions = PreviousConvictionSerializer(many=True, read_only=True)
    crime_compositions = CrimeCompositionSerializer(many=True, read_only=True)
    sentences = SentencedPunishmentSerializer(many=True, read_only=True)
    
    defendant_name = serializers.SerializerMethodField()
    case_number = serializers.SerializerMethodField()
    
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
        defendant = data.get('defendant')
        criminal_proceedings = data.get('criminal_proceedings')
        
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
