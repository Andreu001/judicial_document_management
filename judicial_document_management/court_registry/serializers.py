"""
Сериализаторы приложения court_registry.
"""
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db import transaction
import logging

from .models import (
    Region, CourtLevel,
    Court, CourtDirectory,
    CourtPhone, CourtEmail, CourtWorkingHours,
    CourtDepartment, CourtEmployee,
    CaseTransferType, CaseTransferStatus,
    CaseTransfer, CaseTransferItem, CaseTransferDocument, CaseTransferSide,
    IncomingCaseNotification,
    PendingTransferCase,
    VCSRequest,
    CourtMessengerRegistration,
    CourtInteractionAuditLog,
)
from users.serializers import UserSerializer

logger = logging.getLogger(__name__)


# =============================================================================
# Справочники
# =============================================================================

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = '__all__'


class CourtLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtLevel
        fields = '__all__'


class CaseTransferTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseTransferType
        fields = '__all__'


class CaseTransferStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseTransferStatus
        fields = '__all__'


# =============================================================================
# Справочник судов РФ
# =============================================================================

class CourtDirectoryListSerializer(serializers.ModelSerializer):
    """Краткий список судов из справочника"""
    level_name = serializers.CharField(
        source='level.name', read_only=True
    )
    region_name = serializers.CharField(
        source='region.name', read_only=True
    )
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = CourtDirectory
        fields = [
            'id', 'uuid', 'name', 'code',
            'level', 'level_name', 'region', 'region_name',
            'address', 'postal_code', 'full_address',
            'email_main', 'website',
            'is_active', 'data_source',
        ]


class CourtDirectoryDetailSerializer(CourtDirectoryListSerializer):
    """Полная информация о суде из справочника"""
    class Meta(CourtDirectoryListSerializer.Meta):
        fields = CourtDirectoryListSerializer.Meta.fields + [
            'address_juridical', 'phones', 'emails',
            'working_hours', 'chairman_name', 'vice_chairmen_names',
            'external_id', 'last_sync_at', 'created_at', 'updated_at',
        ]


class CourtDirectoryCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtDirectory
        fields = '__all__'
        read_only_fields = ['uuid', 'created_at', 'updated_at']


# =============================================================================
# Телефоны, Email, Режим работы (только для текущего суда)
# =============================================================================

class CourtPhoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtPhone
        fields = '__all__'
        read_only_fields = ['court']


class CourtEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtEmail
        fields = '__all__'
        read_only_fields = ['court']


class CourtWorkingHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtWorkingHours
        fields = '__all__'
        read_only_fields = ['court']


# =============================================================================
# Текущий суд
# =============================================================================

class CourtListSerializer(serializers.ModelSerializer):
    """Краткий список (фактически один суд)"""
    level_name = serializers.CharField(
        source='level.name', read_only=True
    )
    region_name = serializers.CharField(
        source='region.name', read_only=True
    )
    employees_count = serializers.IntegerField(read_only=True)
    judges_count = serializers.IntegerField(read_only=True)
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = Court
        fields = [
            'id', 'uuid', 'name', 'name_short', 'code',
            'level', 'level_name', 'region', 'region_name',
            'address', 'email_main', 'website',
            'is_active', 'is_registered_in_network',
            'employees_count', 'judges_count', 'is_online',
        ]

    def get_is_online(self, obj):
        try:
            return obj.messenger_registration.is_online
        except CourtMessengerRegistration.DoesNotExist:
            return False


class CourtDetailSerializer(serializers.ModelSerializer):
    """Полная информация о текущем суде"""
    level_detail = CourtLevelSerializer(
        source='level', read_only=True
    )
    region_detail = RegionSerializer(
        source='region', read_only=True
    )
    phones = CourtPhoneSerializer(
        many=True, read_only=True
    )
    emails = CourtEmailSerializer(
        many=True, read_only=True
    )
    working_hours = CourtWorkingHoursSerializer(
        many=True, read_only=True
    )
    chairman_info = UserSerializer(
        source='chairman', read_only=True
    )
    departments_count = serializers.SerializerMethodField()
    employees_count = serializers.IntegerField(read_only=True)
    judges_count = serializers.IntegerField(read_only=True)
    appeal_court = serializers.SerializerMethodField()
    cassation_court = serializers.SerializerMethodField()
    messenger_registration = serializers.SerializerMethodField()

    class Meta:
        model = Court
        fields = '__all__'
        read_only_fields = [
            'uuid', 'is_registered_in_network', 'network_registration_date',
            'created_at', 'updated_at',
        ]

    def get_departments_count(self, obj):
        from .models import CourtDepartment
        return CourtDepartment.objects.filter(is_active=True).count()

    def get_appeal_court(self, obj):
        from .services import CourtDirectoryService
        appeal = CourtDirectoryService.get_appeal_court_for_court(obj)
        if appeal:
            return CourtDirectoryListSerializer(appeal).data
        return None

    def get_cassation_court(self, obj):
        from .services import CourtDirectoryService
        cassation = CourtDirectoryService.get_cassation_court_for_court(obj)
        if cassation:
            return CourtDirectoryListSerializer(cassation).data
        return None

    def get_messenger_registration(self, obj):
        try:
            reg = obj.messenger_registration
            return CourtMessengerRegistrationSerializer(reg).data
        except CourtMessengerRegistration.DoesNotExist:
            return None


class CourtCreateUpdateSerializer(serializers.ModelSerializer):
    """Создание/обновление текущего суда"""
    phones = CourtPhoneSerializer(
        many=True, required=False
    )
    emails = CourtEmailSerializer(
        many=True, required=False
    )
    working_hours = CourtWorkingHoursSerializer(
        many=True, required=False
    )

    class Meta:
        model = Court
        fields = '__all__'
        read_only_fields = [
            'uuid', 'is_registered_in_network', 'network_registration_date',
            'created_at', 'updated_at', 'created_by',
        ]

    @transaction.atomic
    def create(self, validated_data):
        phones_data = validated_data.pop('phones', [])
        emails_data = validated_data.pop('emails', [])
        working_hours_data = validated_data.pop('working_hours', [])

        court = super().create(validated_data)

        for phone_data in phones_data:
            CourtPhone.objects.create(court=court, **phone_data)
        for email_data in emails_data:
            CourtEmail.objects.create(court=court, **email_data)
        for wh_data in working_hours_data:
            CourtWorkingHours.objects.create(court=court, **wh_data)

        return court

    @transaction.atomic
    def update(self, instance, validated_data):
        phones_data = validated_data.pop('phones', None)
        emails_data = validated_data.pop('emails', None)
        working_hours_data = validated_data.pop('working_hours', None)

        court = super().update(instance, validated_data)

        if phones_data is not None:
            court.phones.all().delete()
            for phone_data in phones_data:
                CourtPhone.objects.create(court=court, **phone_data)

        if emails_data is not None:
            court.emails.all().delete()
            for email_data in emails_data:
                CourtEmail.objects.create(court=court, **email_data)

        if working_hours_data is not None:
            court.working_hours.all().delete()
            for wh_data in working_hours_data:
                CourtWorkingHours.objects.create(court=court, **wh_data)

        return court


# =============================================================================
# Отделы суда (только для текущего суда)
# =============================================================================

class CourtDepartmentListSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(
        source='court.name_short', read_only=True
    )
    court_code = serializers.CharField(
        source='court.code', read_only=True
    )
    employees_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CourtDepartment
        fields = [
            'id', 'court', 'court_name', 'court_code',
            'name', 'phone_internal', 'room', 'description',
            'is_active', 'sort_order', 'employees_count',
        ]


class CourtDepartmentDetailSerializer(CourtDepartmentListSerializer):
    class Meta(CourtDepartmentListSerializer.Meta):
        fields = CourtDepartmentListSerializer.Meta.fields + [
            'created_at', 'updated_at',
        ]


class CourtDepartmentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtDepartment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


# =============================================================================
# Сотрудники суда (только для текущего суда)
# =============================================================================

class CourtEmployeeListSerializer(serializers.ModelSerializer):
    employee_info = UserSerializer(
        source='employee', read_only=True
    )
    court_name = serializers.CharField(
        source='court.name_short', read_only=True
    )
    department_name = serializers.CharField(
        source='department.name', read_only=True
    )

    class Meta:
        model = CourtEmployee
        fields = [
            'id', 'court_name', 'department', 'department_name',
            'employee', 'employee_info', 'position',
            'is_head_of_department', 'phone_internal', 'phone_mobile',
            'room', 'is_active', 'date_started', 'date_ended',
        ]


class CourtEmployeeDetailSerializer(CourtEmployeeListSerializer):
    class Meta(CourtEmployeeListSerializer.Meta):
        fields = CourtEmployeeListSerializer.Meta.fields + [
            'created_at', 'updated_at', 'created_by',
        ]


# court_registry/serializers.py

class CourtEmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    new_user = serializers.DictField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = CourtEmployee
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def validate(self, attrs):
        new_user = attrs.get('new_user')
        employee = attrs.get('employee')
        if not employee and not new_user:
            raise serializers.ValidationError(
                'Укажите пользователя или данные для создания нового'
            )
        if 'department' in attrs and not attrs['department'].is_active:
            raise serializers.ValidationError('Отдел не активен')
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        new_user_data = validated_data.pop('new_user', None)
        if new_user_data:
            from users.models import User
            from users.serializers import UserCreateSerializer
            user_ser = UserCreateSerializer(data=new_user_data)
            user_ser.is_valid(raise_exception=True)
            employee = user_ser.save()
            validated_data['employee'] = employee

        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data.pop('new_user', None)
        return super().update(instance, validated_data)

# =============================================================================
# Передача дел
# =============================================================================

class CaseTransferItemSerializer(serializers.ModelSerializer):
    case_type_display = serializers.CharField(read_only=True)
    documents_count = serializers.IntegerField(
        source='documents.count', read_only=True
    )
    sides_count = serializers.IntegerField(
        source='sides.count', read_only=True
    )

    class Meta:
        model = CaseTransferItem
        fields = [
            'id', 'transfer', 'content_type', 'object_id',
            'case_number', 'case_category', 'case_type_display',
            'case_description',
            'is_accepted', 'accepted_at', 'new_case_number',
            'rejection_reason',
            'is_returned', 'returned_at', 'return_result',
            'return_decision_document', 'appeal_court_case_number',
            'documents_count', 'sides_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id',
            'transfer',
            'is_accepted', 'accepted_at',
            'new_case_number', 'is_returned', 'returned_at',
            'created_at', 'updated_at',
        ]
        extra_kwargs = {
            'content_type': {'required': False, 'allow_null': True},
            'object_id': {'required': False, 'allow_null': True},
        }

    def to_internal_value(self, data):
        """
        Конвертируем строку 'app_label.model' в id ContentType.
        """
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        if 'content_type' in data and isinstance(data['content_type'], str):
            try:
                app_label, model_name = data['content_type'].split('.')
                ct = ContentType.objects.get(
                    app_label=app_label,
                    model=model_name
                )
                data['content_type'] = ct.id
            except (ValueError, ContentType.DoesNotExist):
                logger.warning(
                    f"ContentType not found for: {data['content_type']}"
                )
                data.pop('content_type', None)
                data.pop('object_id', None)
        
        return super().to_internal_value(data)


class CaseTransferDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseTransferDocument
        fields = '__all__'
        read_only_fields = ['uploaded_at']


class CaseTransferSideSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseTransferSide
        fields = '__all__'


class CaseTransferItemDetailSerializer(CaseTransferItemSerializer):
    documents = CaseTransferDocumentSerializer(
        many=True, read_only=True
    )
    sides = CaseTransferSideSerializer(
        many=True, read_only=True
    )

    class Meta(CaseTransferItemSerializer.Meta):
        fields = CaseTransferItemSerializer.Meta.fields + ['documents', 'sides']


class CaseTransferListSerializer(serializers.ModelSerializer):
    transfer_type_name = serializers.CharField(
        source='transfer_type.name', read_only=True
    )
    status_name = serializers.CharField(
        source='status.name', read_only=True
    )
    source_court_name = serializers.CharField(
        source='source_court.name_short', read_only=True
    )
    source_court_code = serializers.CharField(
        source='source_court.code', read_only=True
    )
    # ИСПРАВЛЕНО: destination_court_detail должен быть объектом CourtDirectoryDetail
    destination_court_detail = CourtDirectoryListSerializer(
        source='destination_court', read_only=True
    )
    # Добавляем поля для обратной совместимости
    destination_court_name = serializers.CharField(
        source='destination_court.name_short', read_only=True
    )
    destination_court_code = serializers.CharField(
        source='destination_court.code', read_only=True
    )
    items_count = serializers.IntegerField(
        source='items.count', read_only=True
    )
    items_summary = serializers.SerializerMethodField()

    class Meta:
        model = CaseTransfer
        fields = [
            'id', 'uuid', 'transfer_type', 'transfer_type_name',
            'status', 'status_name',
            'source_court', 'source_court_name', 'source_court_code',
            'source_department', 'source_employee',
            'destination_court', 'destination_court_detail',
            'destination_court_name', 'destination_court_code',
            'destination_department',
            'basis', 'basis_document',
            'created_at', 'sent_at', 'received_at', 'accepted_at',
            'returned_at', 'completed_at',
            'is_batch', 'batch_id',
            'items_count', 'items_summary',
        ]

    def get_items_summary(self, obj):
        items = obj.items.all()
        return {
            'criminal': items.filter(case_category='criminal').count(),
            'civil': items.filter(case_category='civil').count(),
            'admin_code': items.filter(case_category='admin_code').count(),
            'kas': items.filter(case_category='kas').count(),
            'total': items.count(),
        }


class CaseTransferDetailSerializer(CaseTransferListSerializer):
    source_court_detail = CourtListSerializer(
        source='source_court', read_only=True
    )
    destination_court_detail = CourtDirectoryListSerializer(
        source='destination_court', read_only=True
    )
    source_department_name = serializers.CharField(
        source='source_department.name', read_only=True, default=None
    )
    destination_department_name = serializers.CharField(
        source='destination_department.name', read_only=True, default=None
    )
    source_employee_name = serializers.SerializerMethodField()
    items = CaseTransferItemDetailSerializer(
        many=True, read_only=True
    )
    basis_judge_info = UserSerializer(
        source='basis_judge', read_only=True
    )

    class Meta(CaseTransferListSerializer.Meta):
        fields = CaseTransferListSerializer.Meta.fields + [
            'source_court_detail', 'destination_court_detail',
            'source_department_name', 'destination_department_name',
            'source_employee_name', 'items',
            'basis_judge_info', 'notes', 'rejection_reason',
        ]

    def get_source_employee_name(self, obj):
        if obj.source_employee:
            return obj.source_employee.employee.get_full_name()
        return None


class CaseTransferCreateSerializer(serializers.ModelSerializer):
    items = CaseTransferItemSerializer(
        many=True, required=True
    )
    # Игнорируем служебное поле с фронтенда
    _myCourtLoaded = serializers.BooleanField(
        write_only=True, required=False, default=True
    )

    class Meta:
        model = CaseTransfer
        fields = [
            'source_court', 'source_department', 'source_employee',
            'destination_court', 'destination_department',
            'transfer_type', 'basis', 'basis_document', 'basis_judge',
            'is_batch', 'notes',
            'items',
            '_myCourtLoaded',
        ]

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('_myCourtLoaded', None)
        items_data = validated_data.pop('items')
        transfer = CaseTransfer.objects.create(**validated_data)

        for item_data in items_data:
            documents_data = item_data.pop('documents', [])
            sides_data = item_data.pop('sides', [])

            item = CaseTransferItem.objects.create(
                transfer=transfer,
                **item_data
            )

            for doc_data in documents_data:
                CaseTransferDocument.objects.create(
                    transfer_item=item,
                    **doc_data
                )

            for side_data in sides_data:
                CaseTransferSide.objects.create(
                    transfer_item=item,
                    **side_data
                )

        return transfer

# =============================================================================
# Уведомления о поступлении дел
# =============================================================================

class IncomingCaseNotificationListSerializer(serializers.ModelSerializer):
    source_court_name = serializers.CharField(
        source='transfer.source_court.name_short', read_only=True
    )
    source_court_code = serializers.CharField(
        source='transfer.source_court.code', read_only=True
    )
    destination_court_name = serializers.CharField(
        source='court.name_short', read_only=True
    )
    transfer_type_name = serializers.CharField(
        source='transfer.transfer_type.name', read_only=True
    )
    transfer_uuid = serializers.UUIDField(
        source='transfer.uuid', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = IncomingCaseNotification
        fields = [
            'id', 'court', 'transfer', 'transfer_uuid',
            'status', 'status_display',
            'source_court_name', 'source_court_code',
            'destination_court_name',
            'transfer_type_name',
            'criminal_count', 'civil_count', 'admin_code_count', 'kas_count',
            'total_count',
            'processed_by', 'processed_at',
            'created_at', 'updated_at',
        ]


class IncomingCaseNotificationDetailSerializer(IncomingCaseNotificationListSerializer):
    items = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    class Meta(IncomingCaseNotificationListSerializer.Meta):
        fields = IncomingCaseNotificationListSerializer.Meta.fields + [
            'items', 'processed_by_name', 'notes',
        ]

    def get_items(self, obj):
        items = obj.transfer.items.all()
        return CaseTransferItemSerializer(items, many=True).data

    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return obj.processed_by.employee.get_full_name()
        return None


# =============================================================================
# Дела, ожидающие передачи
# =============================================================================

class PendingTransferCaseListSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(
        source='court.name_short', read_only=True
    )
    transfer_reason_display = serializers.CharField(
        source='get_transfer_reason_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    is_overdue = serializers.BooleanField(
        source='is_overdue', read_only=True
    )
    target_court_name = serializers.CharField(
        source='target_court.name_short', read_only=True, default=None
    )

    class Meta:
        model = PendingTransferCase
        fields = [
            'id', 'court', 'court_name',
            'content_type', 'object_id',
            'case_number', 'case_category',
            'transfer_reason', 'transfer_reason_display',
            'status', 'status_display',
            'detected_at', 'relevant_date',
            'target_court', 'target_court_name',
            'transfer', 'is_overdue', 'notes',
        ]


# =============================================================================
# Запросы ВКС
# =============================================================================

class VCSRequestListSerializer(serializers.ModelSerializer):
    initiator_court_name = serializers.CharField(
        source='initiator_court.name_short', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    participant_courts_names = serializers.SerializerMethodField()

    class Meta:
        model = VCSRequest
        fields = [
            'id', 'uuid', 'title',
            'initiator_court', 'initiator_court_name',
            'scheduled_at', 'estimated_duration_minutes',
            'status', 'status_display',
            'related_case_number', 'related_case_type',
            'participant_courts_names',
            'created_at',
        ]

    def get_participant_courts_names(self, obj):
        return list(
            obj.participant_courts.values_list('name_short', flat=True)
        )


class VCSRequestDetailSerializer(VCSRequestListSerializer):
    initiator_department_name = serializers.CharField(
        source='initiator_department.name', read_only=True, default=None
    )
    initiator_employee_name = serializers.SerializerMethodField()
    participant_courts_detail = CourtDirectoryListSerializer(
        source='participant_courts', many=True, read_only=True
    )
    participant_departments_detail = CourtDepartmentListSerializer(
        source='participant_departments', many=True, read_only=True
    )

    class Meta(VCSRequestListSerializer.Meta):
        fields = VCSRequestListSerializer.Meta.fields + [
            'description',
            'initiator_department', 'initiator_department_name',
            'initiator_employee_name',
            'participant_courts_detail', 'participant_departments_detail',
            'external_system', 'external_meeting_id', 'external_link',
            'rejection_reason', 'video_conference',
            'updated_at',
        ]

    def get_initiator_employee_name(self, obj):
        if obj.initiator_employee:
            return obj.initiator_employee.employee.get_full_name()
        return None


class VCSRequestCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VCSRequest
        fields = '__all__'
        read_only_fields = ['uuid', 'created_at', 'updated_at']


# =============================================================================
# Регистрация мессенджера
# =============================================================================

class CourtMessengerRegistrationSerializer(serializers.ModelSerializer):
    court_info = CourtListSerializer(
        source='court', read_only=True
    )

    class Meta:
        model = CourtMessengerRegistration
        fields = '__all__'
        read_only_fields = [
            'registered_at', 'last_ping', 'last_sync_at',
            'synced_departments_count', 'synced_employees_count',
            'created_at', 'updated_at',
        ]


class CourtMessengerRegistrationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourtMessengerRegistration
        fields = [
            'court_name_in_messenger', 'court_code_in_messenger',
            'default_department_for_chats',
            'allow_intercourt_chats', 'allow_interregional_chats',
            'allow_higher_instance_chats',
        ]


# =============================================================================
# Журнал аудита
# =============================================================================

class CourtInteractionAuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(
        source='get_action_display', read_only=True
    )
    court_name = serializers.CharField(
        source='court.name_short', read_only=True, default=None
    )
    user_name = serializers.CharField(
        source='user.get_full_name', read_only=True, default=None
    )

    class Meta:
        model = CourtInteractionAuditLog
        fields = [
            'id', 'uuid', 'action', 'action_display',
            'court', 'court_name', 'user', 'user_name',
            'employee', 'object_type', 'object_id',
            'details', 'ip_address', 'created_at',
        ]