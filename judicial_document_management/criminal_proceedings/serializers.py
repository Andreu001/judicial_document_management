from rest_framework import serializers
from users.models import User
from django.contrib.contenttypes.models import ContentType
from business_card.models import SidesCase, SidesCaseInCase, Lawyer, Petitions
from .models import (CriminalProceedings,
                     Defendant,
                     CriminalDecision,
                     CriminalRuling,
                     CriminalCaseMovement,
                     CriminalDecisions,
                     CriminalAppeal,
                     ReferringAuthority, LawyerCriminal,
                     CriminalSidesCaseInCase, PetitionCriminal)


class SidesCaseInCaseDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального отображения стороны"""
    class Meta:
        model = SidesCaseInCase
        fields = '__all__'


class LawyerDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального отображения адвоката"""
    class Meta:
        model = Lawyer
        fields = '__all__'


class SidesCaseInCaseSerializer(serializers.ModelSerializer):
    """Сериализатор для сторон в уголовном деле"""
    
    sides_case_criminal_detail = serializers.SerializerMethodField()
    criminal_side_case_detail = SidesCaseInCaseDetailSerializer(
        source='criminal_side_case', 
        read_only=True
    )
    
    # Исправлено: вместо SidesCaseInCaseDetailSerializer используем словарь
    criminal_side_case_data = serializers.DictField(
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Добавляем поле name для удобства (опционально)
    name = serializers.CharField(
        source='criminal_side_case.name',
        read_only=True
    )
    
    class Meta:
        model = CriminalSidesCaseInCase
        fields = '__all__'
        read_only_fields = ('criminal_proceedings',)
    
    def get_sides_case_criminal_detail(self, obj):
        if obj.sides_case_criminal:
            return {
                'id': obj.sides_case_criminal.id,
                'sides_case': obj.sides_case_criminal.sides_case,
            }
        return None
    
    def create(self, validated_data):
        # Извлекаем данные для SidesCaseInCase
        criminal_side_case_data = validated_data.pop('criminal_side_case_data', {})
        
        # Получаем criminal_proceedings из контекста
        criminal_proceedings = self.context.get('criminal_proceedings')
        if criminal_proceedings:
            validated_data['criminal_proceedings'] = criminal_proceedings
        
        # Проверяем, есть ли уже связанный объект
        if 'criminal_side_case' in validated_data and validated_data['criminal_side_case']:
            # Если объект уже предоставлен, используем его
            criminal_side_case = validated_data['criminal_side_case']
        else:
            # Создаем новый объект SidesCaseInCase с предоставленными данными
            if criminal_side_case_data:
                criminal_side_case = SidesCaseInCase.objects.create(**criminal_side_case_data)
            else:
                # Создаем пустой объект
                criminal_side_case = SidesCaseInCase.objects.create()
            
            validated_data['criminal_side_case'] = criminal_side_case
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        criminal_side_case_data = validated_data.pop('criminal_side_case_data', None)
        
        if criminal_side_case_data:
            if instance.criminal_side_case:
                # Обновляем существующий объект
                for key, value in criminal_side_case_data.items():
                    setattr(instance.criminal_side_case, key, value)
                instance.criminal_side_case.save()
            else:
                # Создаем новый объект
                criminal_side_case = SidesCaseInCase.objects.create(**criminal_side_case_data)
                validated_data['criminal_side_case'] = criminal_side_case
        
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        """Переопределяем вывод, чтобы показать имя"""
        representation = super().to_representation(instance)
        if instance.criminal_side_case and instance.criminal_side_case.name:
            representation['name'] = instance.criminal_side_case.name
        return representation


class LawyerCriminalSerializer(serializers.ModelSerializer):
    """Сериализатор для адвокатов в уголовных делах"""
    
    sides_case_lawyer_detail = serializers.SerializerMethodField()
    lawyer_detail = LawyerDetailSerializer(
        source='sides_case_lawyer_criminal', 
        read_only=True
    )
    
    # Исправлено: вместо LawyerDetailSerializer используем словарь
    sides_case_lawyer_criminal_data = serializers.DictField(
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Добавляем поле name для удобства
    name = serializers.CharField(
        source='sides_case_lawyer_criminal.law_firm_name',
        read_only=True
    )
    
    class Meta:
        model = LawyerCriminal
        fields = '__all__'
        read_only_fields = ('criminal_proceedings',)
    
    def get_sides_case_lawyer_detail(self, obj):
        if obj.sides_case_lawyer:
            return {
                'id': obj.sides_case_lawyer.id,
                'sides_case': obj.sides_case_lawyer.sides_case,
            }
        return None
    
    def create(self, validated_data):
        # Извлекаем данные для Lawyer
        sides_case_lawyer_criminal_data = validated_data.pop('sides_case_lawyer_criminal_data', {})
        
        # Получаем criminal_proceedings из контекста
        criminal_proceedings = self.context.get('criminal_proceedings')
        if criminal_proceedings:
            validated_data['criminal_proceedings'] = criminal_proceedings
        
        # Проверяем, есть ли уже связанный объект
        if 'sides_case_lawyer_criminal' in validated_data and validated_data['sides_case_lawyer_criminal']:
            # Если объект уже предоставлен, используем его
            lawyer = validated_data['sides_case_lawyer_criminal']
        else:
            # Создаем новый объект Lawyer с предоставленными данными
            if sides_case_lawyer_criminal_data:
                lawyer = Lawyer.objects.create(**sides_case_lawyer_criminal_data)
            else:
                # Создаем пустой объект
                lawyer = Lawyer.objects.create()
            
            validated_data['sides_case_lawyer_criminal'] = lawyer
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        sides_case_lawyer_criminal_data = validated_data.pop('sides_case_lawyer_criminal_data', None)
        
        if sides_case_lawyer_criminal_data:
            if instance.sides_case_lawyer_criminal:
                # Обновляем существующий объект
                for key, value in sides_case_lawyer_criminal_data.items():
                    setattr(instance.sides_case_lawyer_criminal, key, value)
                instance.sides_case_lawyer_criminal.save()
            else:
                # Создаем новый объект
                lawyer = Lawyer.objects.create(**sides_case_lawyer_criminal_data)
                validated_data['sides_case_lawyer_criminal'] = lawyer
        
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        """Переопределяем вывод, чтобы показать имя"""
        representation = super().to_representation(instance)
        if instance.sides_case_lawyer_criminal and instance.sides_case_lawyer_criminal.law_firm_name:
            representation['name'] = instance.sides_case_lawyer_criminal.law_firm_name
        elif instance.sides_case_lawyer:
            representation['name'] = instance.sides_case_lawyer.sides_case
        return representation


class DefendantSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='sides_case_defendant.name', read_only=True)
    full_name = serializers.CharField(source='sides_case_defendant.name', read_only=True)
    
    # Поле для чтения ID стороны (для фронтенда)
    sides_case_defendant_id = serializers.IntegerField(source='sides_case_defendant.id', read_only=True)
    
    # Поле для записи ID стороны (обязательное при создании)
    sides_case_defendant_input = serializers.IntegerField(
        write_only=True, 
        required=True,
        source='sides_case_defendant_id'
    )
    
    sides_case_defendant_name = serializers.CharField(
        source='sides_case_defendant.sides_case', 
        read_only=True
    )

    edit_name = serializers.CharField(write_only=True, required=False)
    edit_address = serializers.CharField(write_only=True, required=False)
    edit_birth_date = serializers.DateField(write_only=True, required=False)
    
    class Meta:
        model = Defendant
        fields = "__all__"
        read_only_fields = ("criminal_proceedings", "sides_case_defendant")
        extra_kwargs = {
            'sides_case_defendant': {'required': False, 'read_only': True},
        }
    
    def validate(self, data):
        """Валидация всех данных"""
        # Извлекаем ID стороны из данных
        sides_case_defendant_id = data.get('sides_case_defendant_id')
        
        if not sides_case_defendant_id:
            raise serializers.ValidationError({
                'sides_case_defendant_input': 'Поле "Вид стороны" обязательно для заполнения'
            })
        
        try:
            if isinstance(sides_case_defendant_id, str):
                sides_case_defendant_id = int(sides_case_defendant_id)
            
            sides_case = SidesCase.objects.get(id=sides_case_defendant_id)
            
            # Проверяем, что это сторона типа "подсудимый"
            defendant_side_ids = [8, 9, 12, 13]
            
            if sides_case_defendant_id not in defendant_side_ids:
                valid_sides = SidesCase.objects.filter(id__in=defendant_side_ids)
                valid_sides_names = [f"{s.id}: {s.sides_case}" for s in valid_sides]
                
                raise serializers.ValidationError({
                    'sides_case_defendant_input': 
                        f"Выбранный вид стороны не является подсудимым. "
                        f"Допустимые виды сторон: {', '.join(valid_sides_names)}"
                })
            
        except (SidesCase.DoesNotExist, ValueError):
            raise serializers.ValidationError({
                'sides_case_defendant_input': f"Вид стороны с ID {sides_case_defendant_id} не найден"
            })
        
        return data
    
    def create(self, validated_data):
        """Создаем запись с указанной стороной"""
        # Извлекаем ID стороны
        sides_case_defendant_id = validated_data.get('sides_case_defendant_id')
        
        if not sides_case_defendant_id:
            raise serializers.ValidationError({
                'sides_case_defendant_input': 'Не указан ID стороны'
            })
        
        # Получаем объект SidesCase
        try:
            sides_case = SidesCase.objects.get(id=sides_case_defendant_id)
        except SidesCase.DoesNotExist:
            raise serializers.ValidationError({
                'sides_case_defendant_input': f'Вид стороны с ID {sides_case_defendant_id} не найден'
            })
        
        # Удаляем поле ID из validated_data
        validated_data.pop('sides_case_defendant_id', None)
        
        # Создаем запись с объектом стороны
        return Defendant.objects.create(
            sides_case_defendant=sides_case,
            **validated_data
        )
    
    def update(self, instance, validated_data):
        """Обновляем запись с указанной стороной"""
        # Извлекаем ID стороны, если он предоставлен
        sides_case_defendant_id = validated_data.pop('sides_case_defendant_id', None)
        
        # Если предоставлен новый ID стороны
        if sides_case_defendant_id is not None:
            try:
                sides_case = SidesCase.objects.get(id=sides_case_defendant_id)
                instance.sides_case_defendant = sides_case
            except SidesCase.DoesNotExist:
                raise serializers.ValidationError({
                    'sides_case_defendant_input': f'Вид стороны с ID {sides_case_defendant_id} не найден'
                })
        
        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


from django.contrib.contenttypes.models import ContentType

class PetitionCriminalSerializer(serializers.ModelSerializer):
    petition_detail = serializers.SerializerMethodField()
    petition_id = serializers.IntegerField(write_only=True, required=True)
    
    # Поля для работы со стороной-заявителем
    petitioner_info = serializers.SerializerMethodField(read_only=True)
    petitioner_type = serializers.ChoiceField(
        choices=['defendant', 'lawyer', 'side'],
        write_only=True,
        required=False,
        allow_null=True,
        allow_blank=True
    )
    petitioner_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = PetitionCriminal
        fields = [
            'id', 'date_application', 'date_decision', 'notation',
            'criminal_proceedings', 'petition_id', 'petition_detail',
            'petitioner_info', 'petitioner_type', 'petitioner_id'
        ]
        read_only_fields = ('criminal_proceedings', 'petitions_criminal')
        extra_kwargs = {
            'date_application': {'required': False, 'allow_null': True},
            'date_decision': {'required': False, 'allow_null': True},
            'notation': {'required': False, 'allow_null': True},
        }

    def get_petition_detail(self, obj):
        """Получить информацию о ходатайстве"""
        petition = obj.petitions_criminal.first()  # Получаем первое ходатайство
        if petition:
            return {
                'id': petition.id,
                'petitions': petition.petitions,
                'name': petition.petitions
            }
        return None

    def get_petitioner_info(self, obj):
        """Возвращает информацию о заявителе в унифицированном формате"""
        if not obj.petitioner:
            return None
        petitioner = obj.petitioner
        model_name = obj.content_type.model
        # Определяем, какое поле использовать для отображения имени
        if model_name == 'defendant':
            name = petitioner.full_name_criminal or str(petitioner)
            role = 'Обвиняемый'
        elif model_name == 'lawyercriminal':
            # У LawyerCriminal может быть имя через связанный Lawyer
            name = petitioner.sides_case_lawyer_criminal.law_firm_name if petitioner.sides_case_lawyer_criminal else 'Адвокат'
            role = 'Адвокат'
        elif model_name == 'criminalsidescaseincase':
            name = petitioner.criminal_side_case.name if petitioner.criminal_side_case else 'Сторона'
            role = petitioner.sides_case_criminal.sides_case if petitioner.sides_case_criminal else 'Участник'
        else:
            name = str(petitioner)
            role = None

        return {
            'id': petitioner.id,
            'type': model_name,
            'name': name,
            'role': role
        }

    def validate(self, data):
        # 1. Проверка petition_id (как и раньше)
        petition_id = data.get('petition_id')
        if not petition_id:
            raise serializers.ValidationError({'petition_id': 'Необходимо указать ходатайство'})
        try:
            petition = Petitions.objects.get(id=petition_id)
            data['_petition'] = petition
        except Petitions.DoesNotExist:
            raise serializers.ValidationError({'petition_id': f'Ходатайство с ID {petition_id} не найдено'})

        # 2. Валидация заявителя (если передан)
        petitioner_type = data.get('petitioner_type')
        petitioner_id = data.get('petitioner_id')
        criminal_proceedings = self.context.get('criminal_proceedings')

        if petitioner_type and petitioner_id is not None:
            # Проверяем, что тип допустим
            if petitioner_type not in ['defendant', 'lawyer', 'side']:
                raise serializers.ValidationError(
                    {'petitioner_type': 'Тип стороны должен быть defendant, lawyer или side'}
                )

            # Определяем модель по типу
            model_map = {
                'defendant': Defendant,
                'lawyer': LawyerCriminal,
                'side': CriminalSidesCaseInCase
            }
            model = model_map[petitioner_type]

            # Проверяем существование объекта и принадлежность к данному производству
            try:
                petitioner_obj = model.objects.get(
                    id=petitioner_id,
                    criminal_proceedings=criminal_proceedings
                )
                data['_petitioner_obj'] = petitioner_obj
                data['_petitioner_model'] = model
            except model.DoesNotExist:
                raise serializers.ValidationError(
                    {'petitioner_id': f'Сторона с ID {petitioner_id} не найдена в этом деле'}
                )
        else:
            # Если переданы не оба поля, сбрасываем заявителя (можно удалить)
            data['_petitioner_obj'] = None
            data['_petitioner_model'] = None

        return data

    def create(self, validated_data):
        petition = validated_data.pop('_petition')
        petitioner_obj = validated_data.pop('_petitioner_obj', None)
        petitioner_model = validated_data.pop('_petitioner_model', None)
        
        # Убираем write_only поля
        validated_data.pop('petition_id', None)
        validated_data.pop('petitioner_type', None)
        validated_data.pop('petitioner_id', None)

        criminal_proceedings = self.context.get('criminal_proceedings')
        if criminal_proceedings:
            validated_data['criminal_proceedings'] = criminal_proceedings

        # Если есть заявитель – заполняем content_type и object_id
        if petitioner_obj:
            content_type = ContentType.objects.get_for_model(petitioner_model)
            validated_data['content_type'] = content_type
            validated_data['object_id'] = petitioner_obj.id
        else:
            validated_data['content_type'] = None
            validated_data['object_id'] = None

        instance = PetitionCriminal.objects.create(**validated_data)
        instance.petitions_criminal.add(petition)
        return instance

    def update(self, instance, validated_data):
        petition = validated_data.pop('_petition', None)
        petitioner_obj = validated_data.pop('_petitioner_obj', None)
        petitioner_model = validated_data.pop('_petitioner_model', None)

        validated_data.pop('petition_id', None)
        validated_data.pop('petitioner_type', None)
        validated_data.pop('petitioner_id', None)

        # Обновляем простые поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Обновляем заявителя
        if petitioner_obj:
            content_type = ContentType.objects.get_for_model(petitioner_model)
            instance.content_type = content_type
            instance.object_id = petitioner_obj.id
        else:
            # Если переданы пустые значения – очищаем
            instance.content_type = None
            instance.object_id = None

        instance.save()

        if petition is not None:
            instance.petitions_criminal.clear()
            instance.petitions_criminal.add(petition)

        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Добавляем имя ходатайства
        petition = instance.petitions_criminal.first()
        if petition:
            rep['petition_name'] = petition.petitions
        return rep


class PetitionerInfoSerializer(serializers.Serializer):
    """Унифицированное представление любой стороны по делу"""
    id = serializers.IntegerField()
    type = serializers.CharField()
    name = serializers.CharField()
    role = serializers.CharField(required=False, allow_null=True)

    class Meta:
        fields = ('id', 'type', 'name', 'role')


class PetitionCriminalOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций ходатайств"""
    
    @staticmethod
    def get_options():
        """Получаем список всех ходатайств"""
        from .models import Petitions
        
        petitions = Petitions.objects.all().order_by('petitions')
        return [
            {
                'id': petition.id,
                'value': petition.id,
                'label': petition.petitions,
                'name': petition.petitions
            }
            for petition in petitions
        ]


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
    registered_case_info = serializers.SerializerMethodField()

    # Добавляем поля для отображения ФИО судьи
    presiding_judge_full_name = serializers.SerializerMethodField()
    presiding_judge_name = serializers.SerializerMethodField()

    # Добавляем поле для отображения названия органа
    referring_authority_name = serializers.SerializerMethodField()
    referring_authority_code = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )

    class Meta:
        model = CriminalProceedings
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")
    
    def get_presiding_judge_full_name(self, obj):
        """Получить полное ФИО председательствующего судьи"""
        if obj.presiding_judge:
            # Собираем ФИО из частей
            parts = []
            if obj.presiding_judge.last_name:
                parts.append(obj.presiding_judge.last_name)
            if obj.presiding_judge.first_name:
                parts.append(obj.presiding_judge.first_name)
            if obj.presiding_judge.middle_name:
                parts.append(obj.presiding_judge.middle_name)
            
            full_name = ' '.join(parts).strip()
            return full_name if full_name else str(obj.presiding_judge)
        return None
    
    def get_presiding_judge_name(self, obj):
        """Алиас для full_name (для обратной совместимости)"""
        return self.get_presiding_judge_full_name(obj)
    
    def get_referring_authority_name(self, obj):
        """Получить название органа, направившего материалы"""
        if obj.referring_authority:
            return obj.referring_authority.name
        return None
    
    def get_referring_authority_code(self, obj):
        """Получить код органа, направившего материалы"""
        if obj.referring_authority:
            return obj.referring_authority.code
        return None
    
    def validate_case_number_criminal(self, value):
        # Проверка уникальности на уровне сериализатора
        instance = self.instance
        if instance and instance.case_number_criminal == value:
            return value
            
        if CriminalProceedings.objects.filter(case_number_criminal=value).exists():
            raise serializers.ValidationError("Запись с таким номером дела уже существует")
        return value
    
    def validate(self, data):
        # Валидация: нельзя изменять некоторые поля для архивных дел
        instance = self.instance
        
        if instance and instance.status == 'archived':
            # Определяем, какие поля можно редактировать в архиве
            editable_in_archive = [
                'archive_notes',
                'special_notes',
                'case_to_archive_date',
                'status',
            ]
            
            # Проверяем, не пытаются ли изменить запрещенные поля
            for field in data.keys():
                if field not in editable_in_archive:
                    raise serializers.ValidationError(
                        f"Поле '{field}' нельзя редактировать в архивном деле"
                    )
        
        return data

    def get_registered_case_info(self, obj):
        if obj.registered_case:
            return {
                'id': obj.registered_case.id,
                'full_number': obj.registered_case.full_number,
                'registration_date': obj.registered_case.registration_date,
                'status': obj.registered_case.get_status_display()
            }
        return None


class ArchivedCriminalProceedingsSerializer(CriminalProceedingsSerializer):
    class Meta(CriminalProceedingsSerializer.Meta):
        read_only_fields = CriminalProceedingsSerializer.Meta.read_only_fields + (
            'case_number_criminal',
            'incoming_date',
            'judge_decision',
            'case_result',
            'number_of_persons',
            'evidence_present',
            'evidence_reg_number',
            'incoming_from',
            'volume_count',
            'referring_authority',
            'case_order',
            'separated_case_number',
            'separated_case_date',
            'repeated_court_code',
            'repeated_primary_reg_number',
            'repeat_case',
            'repeat_case_date',
            'case_category_criminal',
            'judge_acceptance_date',
            'preliminary_hearing_grounds',
            'total_duration_days',
            'case_duration_category',
            'judge_code',
            'presiding_judge',
            'composition_court',
            'consideration_date',
            'participation_prosecutor',
            'participation_translator',
            'participation_expert',
            'participation_specialist',
            'absence_defendant',
            'absence_lawyer',
            'absence_pmmh_person',
            'closed_hearing',
            'vks_technology',
            'audio_recording',
            'video_recording',
            'special_procedure_consent',
            'special_procedure_agreement',
            'private_rulings_count',
            'sentence_date',
            'sentence_result',
        )
    
    def validate(self, data):
        """Переопределяем валидацию для архивных дел"""
        instance = self.instance
        
        if instance and instance.status == 'archived':
            # Определяем, какие поля можно редактировать в архиве
            editable_in_archive = [
                'archive_notes',
                'special_notes',
                'case_to_archive_date',
                'status',
            ]
            
            # Проверяем, не пытаются ли изменить запрещенные поля
            for field in data.keys():
                if field not in editable_in_archive:
                    raise serializers.ValidationError(
                        f"Поле '{field}' нельзя редактировать в архивном деле"
                    )
        
        return data
    
    # Отключаем проверку уникальности номера дела для архивных дел
    def validate_case_number_criminal(self, value):
        # Для архивных дел не проверяем уникальность
        return value




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


class LawyerCriminalOptionsSerializer(serializers.Serializer):
    """Сериализатор для получения опций из choices полей модели LawyerCriminal"""
    
    @staticmethod
    def get_choices_from_model():
        """Получает все choices опции из модели LawyerCriminal"""
        from .models import LawyerCriminal
        model_fields = LawyerCriminal._meta.get_fields()
        choices_data = {}
        
        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]
        
        return choices_data
