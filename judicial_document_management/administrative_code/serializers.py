from rest_framework import serializers
from users.models import User
from business_card.models import (SidesCase,
            SidesCaseInCase, Lawyer,
            BusinessMovement, PetitionsInCase, Decisions,
            Petitions
        )
from .models import (
    AdministrativeProceedings, AdministrativeDecision, AdministrativeExecution,
    AdministrativeSidesCaseInCase, AdministrativeLawyer,
    AdministrativeCaseMovement, AdministrativePetition, ReferringAuthorityAdmin
)
from django.contrib.contenttypes.models import ContentType
from case_documents.models import CaseDocument


class ReferringAuthorityAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringAuthorityAdmin
        fields = '__all__'


class AdministrativeDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministrativeDecision
        fields = '__all__'
        read_only_fields = ('administrative_proceedings',)


class AdministrativeDecisionOptionsSerializer(serializers.Serializer):
    @staticmethod
    def get_choices_from_model():
        model_fields = AdministrativeDecision._meta.get_fields()
        choices_data = {}
        
        for field in model_fields:
            if hasattr(field, 'choices') and field.choices:
                field_name = field.name
                choices_data[field_name] = [
                    {'value': choice[0], 'label': choice[1]}
                    for choice in field.choices
                ]
        
        if 'complaint_result' not in choices_data:
            choices_data['complaint_result'] = [
                {'value': '1', 'label': 'Постановление оставлено без изменения'},
                {'value': '2', 'label': 'Постановление изменено'},
                {'value': '3', 'label': 'Постановление отменено, дело прекращено'},
                {'value': '4', 'label': 'Постановление отменено, дело возвращено на новое рассмотрение'},
                {'value': '5', 'label': 'Постановление отменено, дело направлено по подведомственности'},
            ]
        
        return choices_data


class AdministrativeExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministrativeExecution
        fields = '__all__'
        read_only_fields = ('administrative_proceedings',)


class NestedSidesCaseInCaseSerializer(serializers.ModelSerializer):
    sides_case = serializers.PrimaryKeyRelatedField(
        queryset=SidesCase.objects.all(),
        many=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = SidesCaseInCase
        fields = [
            'id', 'name', 'status', 'date_sending_agenda',
            'birth_date', 'gender', 'document_type', 'document_number',
            'document_series', 'document_issued_by', 'document_issue_date',
            'inn', 'kpp', 'ogrn', 'legal_address', 'director_name',
            'address', 'phone', 'email', 'additional_info', 'sides_case'
        ]
    
    def create(self, validated_data):
        sides_case_data = validated_data.pop('sides_case', [])
        instance = SidesCaseInCase.objects.create(**validated_data)
        if sides_case_data:
            instance.sides_case.set(sides_case_data)
        return instance


class AdministrativeSidesCaseInCaseSerializer(serializers.ModelSerializer):
    sides_case_incase_detail = serializers.SerializerMethodField()
    sides_case_role_detail = serializers.SerializerMethodField()
    
    sides_case_incase_data = NestedSidesCaseInCaseSerializer(
        write_only=True,
        required=False
    )
    
    existing_sides_case_incase_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = AdministrativeSidesCaseInCase
        fields = [
            'id', 'administrative_proceedings', 'sides_case_incase', 'sides_case_role',
            'sides_case_incase_detail', 'sides_case_role_detail',
            'sides_case_incase_data', 'existing_sides_case_incase_id'
        ]
        read_only_fields = ('administrative_proceedings', 'sides_case_incase')

    def get_sides_case_incase_detail(self, obj):
        if obj.sides_case_incase:
            return {
                'id': obj.sides_case_incase.id,
                'name': obj.sides_case_incase.name,
                'status': obj.sides_case_incase.status,
                'status_display': obj.sides_case_incase.get_status_display(),
                'date_sending_agenda': obj.sides_case_incase.date_sending_agenda,
                'birth_date': obj.sides_case_incase.birth_date,
                'gender': obj.sides_case_incase.gender,
                'document_type': obj.sides_case_incase.document_type,
                'document_number': obj.sides_case_incase.document_number,
                'document_series': obj.sides_case_incase.document_series,
                'document_issued_by': obj.sides_case_incase.document_issued_by,
                'document_issue_date': obj.sides_case_incase.document_issue_date,
                'inn': obj.sides_case_incase.inn,
                'kpp': obj.sides_case_incase.kpp,
                'ogrn': obj.sides_case_incase.ogrn,
                'legal_address': obj.sides_case_incase.legal_address,
                'director_name': obj.sides_case_incase.director_name,
                'address': obj.sides_case_incase.address,
                'phone': obj.sides_case_incase.phone,
                'email': obj.sides_case_incase.email,
                'additional_info': obj.sides_case_incase.additional_info,
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
        existing_id = data.get('existing_sides_case_incase_id')
        new_data = data.get('sides_case_incase_data')
        
        if not existing_id and not new_data and not self.instance:
            raise serializers.ValidationError(
                "Необходимо указать либо existing_sides_case_incase_id для существующей стороны, "
                "либо sides_case_incase_data для создания новой стороны"
            )
        
        if existing_id and new_data:
            raise serializers.ValidationError(
                "Нельзя указать одновременно existing_sides_case_incase_id и sides_case_incase_data"
            )
        
        if existing_id:
            try:
                SidesCaseInCase.objects.get(id=existing_id)
            except SidesCaseInCase.DoesNotExist:
                raise serializers.ValidationError(
                    {'existing_sides_case_incase_id': f'Сторона с ID {existing_id} не существует'}
                )
        
        return data

    def create(self, validated_data):
        administrative_proceedings = self.context.get('administrative_proceedings')
        if not administrative_proceedings:
            raise serializers.ValidationError(
                {'administrative_proceedings': 'Не указано дело об АП'}
            )
        
        existing_id = validated_data.pop('existing_sides_case_incase_id', None)
        new_side_data = validated_data.pop('sides_case_incase_data', None)
        sides_case_role = validated_data.pop('sides_case_role')
        
        if new_side_data:
            sides_case_incase = NestedSidesCaseInCaseSerializer().create(new_side_data)
        else:
            sides_case_incase = SidesCaseInCase.objects.get(id=existing_id)
        
        admin_side = AdministrativeSidesCaseInCase.objects.create(
            administrative_proceedings=administrative_proceedings,
            sides_case_incase=sides_case_incase,
            sides_case_role=sides_case_role
        )
        
        return admin_side

    def update(self, instance, validated_data):
        if 'sides_case_role' in validated_data:
            instance.sides_case_role = validated_data['sides_case_role']
        
        if 'sides_case_incase_data' in validated_data:
            side_data = validated_data.pop('sides_case_incase_data')
            if side_data and instance.sides_case_incase:
                for attr, value in side_data.items():
                    if value is not None:
                        setattr(instance.sides_case_incase, attr, value)
                instance.sides_case_incase.save()
        
        validated_data.pop('existing_sides_case_incase_id', None)
        validated_data.pop('sides_case_incase_data', None)
        
        instance.save()
        return instance


class NestedLawyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lawyer
        fields = [
            'id', 'law_firm_name', 'law_firm_address', 'law_firm_phone',
            'law_firm_email', 'bank_name', 'bank_bik', 'correspondent_account',
            'payment_account', 'lawyer_certificate_number', 'lawyer_certificate_date',
            'days_for_payment', 'payment_amount', 'payment_date', 'notes'
        ]


class AdministrativeLawyerSerializer(serializers.ModelSerializer):
    lawyer_detail = serializers.SerializerMethodField()
    sides_case_role_detail = serializers.SerializerMethodField()
    
    lawyer_data = NestedLawyerSerializer(
        write_only=True,
        required=False
    )
    
    existing_lawyer_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = AdministrativeLawyer
        fields = [
            'id', 'administrative_proceedings', 'lawyer', 'sides_case_role',
            'lawyer_detail', 'sides_case_role_detail',
            'lawyer_data', 'existing_lawyer_id'
        ]
        read_only_fields = ('administrative_proceedings', 'lawyer')

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
                "Необходимо указать либо existing_lawyer_id для существующего защитника, "
                "либо lawyer_data для создания нового защитника"
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
                    {'existing_lawyer_id': f'Защитник с ID {existing_id} не существует'}
                )
        
        return data

    def create(self, validated_data):
        administrative_proceedings = self.context.get('administrative_proceedings')
        if not administrative_proceedings:
            raise serializers.ValidationError(
                {'administrative_proceedings': 'Не указано дело об АП'}
            )
        
        existing_id = validated_data.pop('existing_lawyer_id', None)
        new_lawyer_data = validated_data.pop('lawyer_data', None)
        sides_case_role = validated_data.pop('sides_case_role')
        
        if new_lawyer_data:
            lawyer = NestedLawyerSerializer().create(new_lawyer_data)
        else:
            lawyer = Lawyer.objects.get(id=existing_id)
        
        admin_lawyer = AdministrativeLawyer.objects.create(
            administrative_proceedings=administrative_proceedings,
            lawyer=lawyer,
            sides_case_role=sides_case_role
        )
        
        return admin_lawyer

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


class AdministrativeCaseMovementSerializer(serializers.ModelSerializer):
    business_movement_detail = serializers.SerializerMethodField(read_only=True)
    
    date_meeting = serializers.DateField(required=True, write_only=True)
    meeting_time = serializers.TimeField(required=True, write_only=True)
    decision_case = serializers.PrimaryKeyRelatedField(
        queryset=Decisions.objects.all(),
        many=True,
        required=False,
        write_only=True
    )
    composition_colleges = serializers.CharField(
        required=False, 
        allow_blank=True, 
        write_only=True
    )
    result_court_session = serializers.CharField(
        required=False, 
        allow_blank=True, 
        write_only=True
    )
    reason_deposition = serializers.CharField(
        required=False, 
        allow_blank=True, 
        write_only=True
    )

    class Meta:
        model = AdministrativeCaseMovement
        fields = [
            'id', 'administrative_proceedings', 'business_movement',
            'business_movement_detail', 'date_meeting', 'meeting_time',
            'decision_case', 'composition_colleges', 'result_court_session',
            'reason_deposition'
        ]
        read_only_fields = ('administrative_proceedings', 'business_movement')

    def get_business_movement_detail(self, obj):
        if obj.business_movement:
            return {
                'id': obj.business_movement.id,
                'date_meeting': obj.business_movement.date_meeting,
                'meeting_time': obj.business_movement.meeting_time,
                'decision_case': [
                    {'id': d.id, 'name_case': d.name_case} 
                    for d in obj.business_movement.decision_case.all()
                ],
                'composition_colleges': obj.business_movement.composition_colleges,
                'result_court_session': obj.business_movement.result_court_session,
                'reason_deposition': obj.business_movement.reason_deposition,
            }
        return None

    def validate(self, data):
        request_method = self.context.get('request').method if self.context.get('request') else None
        
        if request_method == 'POST':
            if not data.get('date_meeting'):
                raise serializers.ValidationError({'date_meeting': 'Обязательное поле.'})
            if not data.get('meeting_time'):
                raise serializers.ValidationError({'meeting_time': 'Обязательное поле.'})
        
        return data

    def create(self, validated_data):
        administrative_proceedings = self.context.get('administrative_proceedings')
        if not administrative_proceedings:
            raise serializers.ValidationError(
                {'administrative_proceedings': 'Не указано дело об АП'}
            )

        date_meeting = validated_data.pop('date_meeting')
        meeting_time = validated_data.pop('meeting_time')
        decision_case_ids = validated_data.pop('decision_case', [])
        composition_colleges = validated_data.pop('composition_colleges', '')
        result_court_session = validated_data.pop('result_court_session', '')
        reason_deposition = validated_data.pop('reason_deposition', '')

        business_movement = BusinessMovement.objects.create(
            date_meeting=date_meeting,
            meeting_time=meeting_time,
            composition_colleges=composition_colleges,
            result_court_session=result_court_session,
            reason_deposition=reason_deposition
        )

        if decision_case_ids:
            business_movement.decision_case.set(decision_case_ids)

        admin_movement = AdministrativeCaseMovement.objects.create(
            administrative_proceedings=administrative_proceedings,
            business_movement=business_movement
        )

        return admin_movement

    def update(self, instance, validated_data):
        date_meeting = validated_data.pop('date_meeting', None)
        meeting_time = validated_data.pop('meeting_time', None)
        decision_case_ids = validated_data.pop('decision_case', None)
        composition_colleges = validated_data.pop('composition_colleges', None)
        result_court_session = validated_data.pop('result_court_session', None)
        reason_deposition = validated_data.pop('reason_deposition', None)

        if instance.business_movement:
            business_movement = instance.business_movement
            
            if date_meeting is not None:
                business_movement.date_meeting = date_meeting
            if meeting_time is not None:
                business_movement.meeting_time = meeting_time
            if composition_colleges is not None:
                business_movement.composition_colleges = composition_colleges
            if result_court_session is not None:
                business_movement.result_court_session = result_court_session
            if reason_deposition is not None:
                business_movement.reason_deposition = reason_deposition
            
            business_movement.save()

            if decision_case_ids is not None:
                business_movement.decision_case.set(decision_case_ids)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class AdministrativePetitionSerializer(serializers.ModelSerializer):
    petitions_incase_detail = serializers.SerializerMethodField()
    petitioner_info = serializers.SerializerMethodField()

    petitioner_type = serializers.ChoiceField(
        choices=['admin_sides', 'admin_lawyer'],
        write_only=True,
        required=False,
        allow_null=True
    )
    petitioner_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True
    )

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
        queryset=Decisions.objects.all(),
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
        model = AdministrativePetition
        fields = [
            'id', 'administrative_proceedings', 'petitions_incase',
            'petitions_incase_detail', 'petitioner_info',
            'petitioner_type', 'petitioner_id',
            'petitions_name', 'date_application', 'decision_rendered',
            'date_decision', 'notation'
        ]
        read_only_fields = ('administrative_proceedings', 'petitions_incase')

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
        administrative_proceedings = self.context.get('administrative_proceedings')
        if not administrative_proceedings:
            raise serializers.ValidationError(
                {'administrative_proceedings': 'Не указано дело об АП'}
            )

        petitions_name_ids = validated_data.pop('petitions_name', [])
        date_application = validated_data.pop('date_application')
        decision_rendered_id = validated_data.pop('decision_rendered', None)
        date_decision = validated_data.pop('date_decision', None)
        notation = validated_data.pop('notation', '')

        petitioner_type = validated_data.pop('petitioner_type', None)
        petitioner_id = validated_data.pop('petitioner_id', None)

        petitions_incase = PetitionsInCase.objects.create(
            date_application=date_application,
            date_decision=date_decision,
            notation=notation
        )

        if petitions_name_ids:
            petitions_incase.petitions_name.set(petitions_name_ids)

        if decision_rendered_id:
            try:
                decision = Decisions.objects.get(id=decision_rendered_id)
                petitions_incase.decision_rendered = decision
                petitions_incase.save()
            except Decisions.DoesNotExist:
                pass

        admin_petition = AdministrativePetition.objects.create(
            administrative_proceedings=administrative_proceedings,
            petitions_incase=petitions_incase,
            petitioner_type=petitioner_type,
            petitioner_id=petitioner_id
        )

        return admin_petition

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
                        decision = Decisions.objects.get(id=decision_rendered_id)
                        petitions_incase.decision_rendered = decision
                    except Decisions.DoesNotExist:
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


class AdministrativeProceedingsSerializer(serializers.ModelSerializer):
    presiding_judge_full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    referring_authority_detail = ReferringAuthorityAdminSerializer(source='referring_authority', read_only=True)
    registered_case_info = serializers.SerializerMethodField()
    
    admin_decisions = AdministrativeDecisionSerializer(many=True, read_only=True)
    admin_executions = AdministrativeExecutionSerializer(many=True, read_only=True)
    documents_count = serializers.SerializerMethodField()

    class Meta:
        model = AdministrativeProceedings
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_presiding_judge_full_name(self, obj):
        if obj.presiding_judge:
            parts = filter(None, [
                obj.presiding_judge.last_name,
                obj.presiding_judge.first_name,
                obj.presiding_judge.middle_name
            ])
            return ' '.join(parts).strip() or str(obj.presiding_judge)
        return None

    def validate_case_number_admin(self, value):
        instance = self.instance
        if instance and instance.case_number_admin == value:
            return value
        if AdministrativeProceedings.objects.filter(case_number_admin=value).exists():
            raise serializers.ValidationError("Дело с таким номером уже существует")
        return value

    def validate(self, data):
        instance = self.instance
        if instance and instance.status == 'archived':
            editable_fields = ['archive_notes', 'status', 'archived_date', 'special_notes']
            for field in data.keys():
                if field not in editable_fields:
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
        """Количество документов по делу"""
        content_type = ContentType.objects.get_for_model(obj)
        return CaseDocument.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).count()


class ArchivedAdministrativeProceedingsSerializer(AdministrativeProceedingsSerializer):
    class Meta(AdministrativeProceedingsSerializer.Meta):
        read_only_fields = AdministrativeProceedingsSerializer.Meta.read_only_fields + (
            'case_number_admin', 'incoming_date', 'judge_acceptance_date',
            'presiding_judge', 'article_number', 'offense_description',
        )

    def validate_case_number_admin(self, value):
        return value
