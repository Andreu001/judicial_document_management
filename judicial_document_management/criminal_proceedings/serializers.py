from rest_framework import serializers
from users.models import User
from django.contrib.contenttypes.models import ContentType
from business_card.models import SidesCase, SidesCaseInCase, Lawyer, Petitions, PetitionsInCase  
from .models import (CriminalProceedings,
                     Defendant,
                     CriminalDecision,
                     CriminalRuling,
                     CriminalCaseMovement,
                     CriminalDecisions,
                     CriminalAppeal,
                     ReferringAuthority, LawyerCriminal,
                     CriminalSidesCaseInCase, PetitionCriminal,
                     CriminalExecution, CriminalCivilClaim)
from .models_appeal_cassation import (
    CriminalAppealInstance, CriminalCassationInstance,
    CriminalAppealApplicantStatus, CriminalCassationResult, CriminalSupervisoryResult
)
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument


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
    """Сериализатор для адвокатов в уголовных делах (унифицированная версия)"""
    
    lawyer_detail = serializers.SerializerMethodField()
    sides_case_role_detail = serializers.SerializerMethodField()
    
    # Поле для создания нового адвоката
    lawyer_data = serializers.DictField(
        write_only=True,
        required=False
    )
    
    # ID существующего адвоката
    existing_lawyer_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = LawyerCriminal
        fields = [
            'id', 'criminal_proceedings', 'lawyer', 'sides_case_role',
            'lawyer_detail', 'sides_case_role_detail',
            'lawyer_data', 'existing_lawyer_id'
        ]
        read_only_fields = ('criminal_proceedings', 'lawyer')

    def get_lawyer_detail(self, obj):
        if obj.lawyer:
            return {
                'id': obj.lawyer.id,
                'law_firm_name': obj.lawyer.law_firm_name,
                'law_firm_address': obj.lawyer.law_firm_address,
                'law_firm_phone': obj.lawyer.law_firm_phone,
                'law_firm_email': obj.lawyer.law_firm_email,
                'lawyer_certificate_number': obj.lawyer.lawyer_certificate_number,
                'bank_name': obj.lawyer.bank_name,
                'bank_bik': obj.lawyer.bank_bik,
                'correspondent_account': obj.lawyer.correspondent_account,
                'payment_account': obj.lawyer.payment_account,
                'lawyer_certificate_date': obj.lawyer.lawyer_certificate_date,
                'days_for_payment': obj.lawyer.days_for_payment,
                'payment_amount': obj.lawyer.payment_amount,
                'payment_date': obj.lawyer.payment_date,
                'notes': obj.lawyer.notes,
            }
        return None

    def get_sides_case_role_detail(self, obj):
        if obj.sides_case_role:
            return {
                'id': obj.sides_case_role.id,
                'name': obj.sides_case_role.sides_case,
            }
        return None

    def validate(self, data):
        existing_id = data.get('existing_lawyer_id')
        new_data = data.get('lawyer_data')
        
        if not existing_id and not new_data and not self.instance:
            raise serializers.ValidationError(
                "Необходимо указать либо existing_lawyer_id для существующего адвоката, "
                "либо lawyer_data для создания нового адвоката"
            )
        
        if existing_id and new_data:
            raise serializers.ValidationError(
                "Нельзя указать одновременно existing_lawyer_id и lawyer_data"
            )
        
        if existing_id:
            try:
                Lawyer.objects.get(id=existing_id)
            except Lawyer.DoesNotExist:
                raise serializers.ValidationError(
                    {'existing_lawyer_id': f'Адвокат с ID {existing_id} не существует'}
                )
        
        return data

    def create(self, validated_data):
        criminal_proceedings = self.context.get('criminal_proceedings')
        if not criminal_proceedings:
            raise serializers.ValidationError(
                {'criminal_proceedings': 'Не указано уголовное производство'}
            )
        
        existing_id = validated_data.pop('existing_lawyer_id', None)
        new_lawyer_data = validated_data.pop('lawyer_data', None)
        sides_case_role = validated_data.pop('sides_case_role')
        
        if new_lawyer_data:
            lawyer = Lawyer.objects.create(**new_lawyer_data)
        else:
            lawyer = Lawyer.objects.get(id=existing_id)
        
        criminal_lawyer = LawyerCriminal.objects.create(
            criminal_proceedings=criminal_proceedings,
            lawyer=lawyer,
            sides_case_role=sides_case_role
        )
        
        return criminal_lawyer

    def update(self, instance, validated_data):
        if 'sides_case_role' in validated_data:
            instance.sides_case_role = validated_data['sides_case_role']
        
        if 'lawyer_data' in validated_data:
            lawyer_data = validated_data.pop('lawyer_data')
            if lawyer_data and instance.lawyer:
                for attr, value in lawyer_data.items():
                    if value is not None:
                        setattr(instance.lawyer, attr, value)
                instance.lawyer.save()
        
        validated_data.pop('existing_lawyer_id', None)
        validated_data.pop('lawyer_data', None)
        
        instance.save()
        return instance


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


class PetitionCriminalSerializer(serializers.ModelSerializer):
    """Сериализатор для ходатайств в уголовных делах (унифицированная версия)"""
    
    petitions_incase_detail = serializers.SerializerMethodField()
    petitioner_info = serializers.SerializerMethodField()

    petitioner_type = serializers.ChoiceField(
        choices=['criminal_defendant', 'criminal_lawyer', 'criminal_side'],
        write_only=True,
        required=False,
        allow_null=True
    )
    petitioner_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True
    )

    # Поля для создания PetitionsInCase
    petitions_name = serializers.PrimaryKeyRelatedField(
        queryset=Petitions.objects.all(),
        many=True,
        required=True,
        write_only=True
    )
    date_application = serializers.DateField(
        required=True,
        write_only=True
    )
    decision_rendered = serializers.PrimaryKeyRelatedField(
        queryset=CriminalDecisions.objects.all(),
        many=False,
        required=False,
        write_only=True,
        allow_null=True
    )
    date_decision = serializers.DateField(
        required=False,
        allow_null=True,
        write_only=True
    )
    notation = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = PetitionCriminal
        fields = [
            'id', 'criminal_proceedings', 'petitions_incase',
            'petitions_incase_detail', 'petitioner_info',
            'petitioner_type', 'petitioner_id',
            'petitions_name', 'date_application', 'decision_rendered',
            'date_decision', 'notation'
        ]
        read_only_fields = ('criminal_proceedings', 'petitions_incase')

    def get_petitions_incase_detail(self, obj):
        if obj.petitions_incase:
            petitions_incase = obj.petitions_incase
            decision_data = None
            if petitions_incase.decision_rendered:
                decision = petitions_incase.decision_rendered
                decision_data = {
                    'id': decision.id,
                    'name_case': decision.name_case
                }
            
            return {
                'id': petitions_incase.id,
                'petitions_name': [
                    {'id': p.id, 'name': p.petitions} 
                    for p in petitions_incase.petitions_name.all()
                ],
                'date_application': petitions_incase.date_application,
                'decision_rendered': decision_data,
                'date_decision': petitions_incase.date_decision,
                'notation': petitions_incase.notation,
            }
        return None

    def get_petitioner_info(self, obj):
        return obj.petitioner_info

    def validate(self, data):
        request_method = self.context.get('request').method if self.context.get('request') else None
        
        if request_method == 'POST':
            if not data.get('petitions_name'):
                raise serializers.ValidationError({'petitions_name': 'Обязательное поле.'})
            if not data.get('date_application'):
                raise serializers.ValidationError({'date_application': 'Обязательное поле.'})

        return data

    def create(self, validated_data):
        criminal_proceedings = self.context.get('criminal_proceedings')
        if not criminal_proceedings:
            raise serializers.ValidationError(
                {'criminal_proceedings': 'Не указано уголовное производство'}
            )

        petitions_name_ids = validated_data.pop('petitions_name', [])
        date_application = validated_data.pop('date_application')
        decision_rendered_id = validated_data.pop('decision_rendered', None)
        date_decision = validated_data.pop('date_decision', None)
        notation = validated_data.pop('notation', '')

        petitioner_type = validated_data.pop('petitioner_type', None)
        petitioner_id = validated_data.pop('petitioner_id', None)

        # ИСПРАВЛЕНО: используем импортированный PetitionsInCase
        petitions_incase = PetitionsInCase.objects.create(
            date_application=date_application,
            date_decision=date_decision,
            notation=notation
        )

        if petitions_name_ids:
            petitions_incase.petitions_name.set(petitions_name_ids)

        if decision_rendered_id:
            try:
                decision = CriminalDecisions.objects.get(id=decision_rendered_id)
                petitions_incase.decision_rendered = decision
                petitions_incase.save()
            except CriminalDecisions.DoesNotExist:
                pass

        criminal_petition = PetitionCriminal.objects.create(
            criminal_proceedings=criminal_proceedings,
            petitions_incase=petitions_incase,
            petitioner_type=petitioner_type,
            petitioner_id=petitioner_id
        )

        return criminal_petition

    def update(self, instance, validated_data):
        petitions_name_ids = validated_data.pop('petitions_name', None)
        date_application = validated_data.pop('date_application', None)
        decision_rendered_id = validated_data.pop('decision_rendered', None)
        date_decision = validated_data.pop('date_decision', None)
        notation = validated_data.pop('notation', None)

        petitioner_type = validated_data.pop('petitioner_type', None)
        petitioner_id = validated_data.pop('petitioner_id', None)

        if instance.petitions_incase:
            petitions_incase = instance.petitions_incase
            
            if date_application is not None:
                petitions_incase.date_application = date_application
            if date_decision is not None:
                petitions_incase.date_decision = date_decision
            if notation is not None:
                petitions_incase.notation = notation
            
            if decision_rendered_id is not None:
                if decision_rendered_id:
                    try:
                        decision = CriminalDecisions.objects.get(id=decision_rendered_id)
                        petitions_incase.decision_rendered = decision
                    except CriminalDecisions.DoesNotExist:
                        petitions_incase.decision_rendered = None
                else:
                    petitions_incase.decision_rendered = None
            
            petitions_incase.save()

            if petitions_name_ids is not None:
                petitions_incase.petitions_name.set(petitions_name_ids)

        if petitioner_type is not None:
            instance.petitioner_type = petitioner_type
        if petitioner_id is not None:
            instance.petitioner_id = petitioner_id

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


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


class CriminalExecutionSerializer(serializers.ModelSerializer):
    """Сериализатор для исполнения по уголовному делу"""
    
    # Поля для отображения детальной информации о связанных объектах
    criminal_side_case_execution_detail = serializers.SerializerMethodField(read_only=True)
    criminal_defendant_execution_detail = serializers.SerializerMethodField(read_only=True)
    sides_case_lawyer_execution_detail = serializers.SerializerMethodField(read_only=True)
    
    # Поля для создания/обновления с возможностью выбора типа стороны
    execution_recipient_type = serializers.ChoiceField(
        choices=['side', 'defendant', 'lawyer'],
        write_only=True,
        required=False,
        help_text="Тип получателя: side - сторона, defendant - обвиняемый, lawyer - адвокат"
    )
    execution_recipient_id = serializers.IntegerField(
        write_only=True,
        required=False,
        help_text="ID получателя в зависимости от типа"
    )

    class Meta:
        model = CriminalExecution
        fields = [
            'id',
            'criminal_proceedings',
            # Новые поля связей
            'criminal_side_case_execution',
            'criminal_defendant_execution',
            'sides_case_lawyer_execution',
            # Детальная информация
            'criminal_side_case_execution_detail',
            'criminal_defendant_execution_detail',
            'sides_case_lawyer_execution_detail',
            # Поля для создания связей
            'execution_recipient_type',
            'execution_recipient_id',
            # Остальные поля
            'sentence_execution_date',
            'execution_sent_date',
            'execution_sent_to',
            'execution_sent_document',
            'control_return_date',
            'control_result',
            'execution_mark_date',
            'execution_mark_content',
            'execution_mark_author',
            'special_execution_notes',
            'removal_from_control_date',
            'removal_from_control_reason',
            'copies_sent_info',
        ]
        read_only_fields = ('criminal_proceedings',)

    def get_criminal_side_case_execution_detail(self, obj):
        """Детальная информация о стороне (SidesCaseInCase)"""
        if obj.criminal_side_case_execution:
            side = obj.criminal_side_case_execution
            return {
                'id': side.id,
                'name': side.name,
                'address': side.address,
                'phone': side.phone,
                'email': side.email,
                'type': 'Сторона по делу'
            }
        return None

    def get_criminal_defendant_execution_detail(self, obj):
        """Детальная информация об обвиняемом (Defendant)"""
        if obj.criminal_defendant_execution:
            defendant = obj.criminal_defendant_execution
            return {
                'id': defendant.id,
                'full_name': defendant.full_name_criminal,
                'birth_date': defendant.birth_date,
                'address': defendant.address,
                'type': 'Обвиняемый'
            }
        return None

    def get_sides_case_lawyer_execution_detail(self, obj):
        """Детальная информация об адвокате (Lawyer)"""
        if obj.sides_case_lawyer_execution:
            lawyer = obj.sides_case_lawyer_execution
            return {
                'id': lawyer.id,
                'law_firm_name': lawyer.law_firm_name,
                'law_firm_phone': lawyer.law_firm_phone,
                'law_firm_email': lawyer.law_firm_email,
                'type': 'Адвокат'
            }
        return None

    def validate(self, data):
        """
        Валидация данных, особенно полей связей
        """
        # Если указаны поля для создания связи
        recipient_type = data.get('execution_recipient_type')
        recipient_id = data.get('execution_recipient_id')
        
        if recipient_type and recipient_id is not None:
            criminal_proceedings = self.context.get('criminal_proceedings')
            
            if not criminal_proceedings:
                raise serializers.ValidationError(
                    "Не указано уголовное производство в контексте"
                )
            
            # Проверяем существование объекта в зависимости от типа
            if recipient_type == 'side':
                try:
                    from .models import CriminalSidesCaseInCase
                    side_obj = CriminalSidesCaseInCase.objects.get(
                        id=recipient_id,
                        criminal_proceedings=criminal_proceedings
                    )
                    data['criminal_side_case_execution'] = side_obj.criminal_side_case
                except CriminalSidesCaseInCase.DoesNotExist:
                    raise serializers.ValidationError(
                        {'execution_recipient_id': f'Сторона с ID {recipient_id} не найдена в этом деле'}
                    )
            
            elif recipient_type == 'defendant':
                try:
                    defendant = Defendant.objects.get(
                        id=recipient_id,
                        criminal_proceedings=criminal_proceedings
                    )
                    data['criminal_defendant_execution'] = defendant
                except Defendant.DoesNotExist:
                    raise serializers.ValidationError(
                        {'execution_recipient_id': f'Обвиняемый с ID {recipient_id} не найден в этом деле'}
                    )
            
            elif recipient_type == 'lawyer':
                try:
                    from .models import LawyerCriminal
                    lawyer_obj = LawyerCriminal.objects.get(
                        id=recipient_id,
                        criminal_proceedings=criminal_proceedings
                    )
                    data['sides_case_lawyer_execution'] = lawyer_obj.sides_case_lawyer_criminal
                except LawyerCriminal.DoesNotExist:
                    raise serializers.ValidationError(
                        {'execution_recipient_id': f'Адвокат с ID {recipient_id} не найден в этом деле'}
                    )
        
        # Удаляем вспомогательные поля из данных
        data.pop('execution_recipient_type', None)
        data.pop('execution_recipient_id', None)
        
        return data

    def create(self, validated_data):
        """Создание записи об исполнении"""
        criminal_proceedings = self.context.get('criminal_proceedings')
        if not criminal_proceedings:
            raise serializers.ValidationError(
                {'criminal_proceedings': 'Не указано уголовное производство'}
            )
        
        # Убеждаемся, что в validated_data нет criminal_proceedings
        validated_data.pop('criminal_proceedings', None)
        
        return CriminalExecution.objects.create(
            criminal_proceedings=criminal_proceedings,
            **validated_data
        )

    def update(self, instance, validated_data):
        """Обновление записи об исполнении"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class CriminalAppealApplicantStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для статуса заявителя апелляции"""
    class Meta:
        model = CriminalAppealApplicantStatus
        fields = '__all__'


class CriminalAppealInstanceSerializer(serializers.ModelSerializer):
    """Сериализатор для апелляционного рассмотрения"""
    
    appeal_result_display = serializers.CharField(source='get_appeal_result_display', read_only=True)
    appeal_type_display = serializers.CharField(source='get_appeal_type_display', read_only=True)
    court_composition_display = serializers.CharField(source='get_court_composition_display', read_only=True)
    appeal_applicant_status_detail = CriminalAppealApplicantStatusSerializer(source='appeal_applicant_status', read_only=True)
    
    class Meta:
        model = CriminalAppealInstance
        fields = '__all__'
        read_only_fields = ('criminal_proceedings',)


class CriminalCassationInstanceSerializer(serializers.ModelSerializer):
    """Сериализатор для кассационного рассмотрения"""
    
    cassation_result_display = serializers.CharField(source='get_cassation_result_display', read_only=True)
    instance_type_display = serializers.CharField(source='get_instance_type_display', read_only=True)
    cassation_type_display = serializers.CharField(source='get_cassation_type_display', read_only=True)
    
    class Meta:
        model = CriminalCassationInstance
        fields = '__all__'
        read_only_fields = ('criminal_proceedings',)


class CriminalCivilClaimSerializer(serializers.ModelSerializer):
    """Сериализатор для гражданского иска в уголовном деле"""
    
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    
    class Meta:
        model = CriminalCivilClaim
        fields = '__all__'
        read_only_fields = ('criminal_proceedings',)


class CriminalProceedingsSerializer(serializers.ModelSerializer):
    defendants = DefendantSerializer(many=True, read_only=True)
    criminal_decisions = CriminalDecisionSerializer(many=True, read_only=True)
    case_movement = CriminalCaseMovementSerializer(read_only=True)
    referring_authority = ReferringAuthoritySerializer(read_only=True)
    registered_case_info = serializers.SerializerMethodField()
    criminal_executions = CriminalExecutionSerializer(many=True, read_only=True)
    appeal_instances = CriminalAppealInstanceSerializer(many=True, read_only=True)
    cassation_instances = CriminalCassationInstanceSerializer(many=True, read_only=True)
    civil_claims = CriminalCivilClaimSerializer(many=True, read_only=True)

    # Добавляем поля для отображения ФИО судьи
    presiding_judge_full_name = serializers.SerializerMethodField()
    presiding_judge_name = serializers.SerializerMethodField()

    # Добавляем поле для отображения названия органа
    referring_authority_name = serializers.SerializerMethodField()
    referring_authority_code = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()

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

    def get_documents_count(self, obj):
        content_type = ContentType.objects.get_for_model(obj)
        return CaseDocument.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).count()


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


class CriminalCassationResultSerializer(serializers.ModelSerializer):
    """Сериализатор для результатов кассации"""
    class Meta:
        model = CriminalCassationResult
        fields = '__all__'


class CriminalSupervisoryResultSerializer(serializers.ModelSerializer):
    """Сериализатор для результатов надзора"""
    class Meta:
        model = CriminalSupervisoryResult
        fields = '__all__'
