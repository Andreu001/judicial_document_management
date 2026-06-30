"""
Административная панель приложения court_registry.
Критически важно для администратора, который вносит данные судов.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import logging

from .models import (
    Region, CourtLevel,
    Court,  # текущий суд
    CourtDirectory,  # справочник судов РФ
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

logger = logging.getLogger(__name__)


# =============================================================================
# Инлайны (вложенные формы)
# =============================================================================

class CourtPhoneInline(admin.TabularInline):
    model = CourtPhone
    extra = 1
    fields = ('phone', 'phone_type', 'description', 'is_active')


class CourtEmailInline(admin.TabularInline):
    model = CourtEmail
    extra = 1
    fields = ('email', 'email_type', 'description', 'is_active')


class CourtWorkingHoursInline(admin.TabularInline):
    model = CourtWorkingHours
    extra = 0
    min_num = 0
    max_num = 7
    fields = ('day_of_week', 'is_working_day', 'work_start', 'work_end', 'break_start', 'break_end', 'reception_start', 'reception_end')
    ordering = ('day_of_week',)


class CourtEmployeeInline(admin.TabularInline):
    model = CourtEmployee
    extra = 0
    raw_id_fields = ('employee',)
    fields = ('employee', 'department', 'position', 'is_head_of_department', 'is_active', 'phone_internal')
    ordering = ('department__name', 'position')


class CaseTransferItemInline(admin.TabularInline):
    model = CaseTransferItem
    extra = 0
    readonly_fields = ('case_number', 'case_category', 'is_accepted', 'new_case_number')
    fields = ('case_number', 'case_category', 'case_description', 'is_accepted', 'new_case_number', 'rejection_reason')
    can_delete = False


class CaseTransferDocumentInline(admin.TabularInline):
    model = CaseTransferDocument
    extra = 0
    readonly_fields = ('original_filename', 'file_type', 'uploaded_at')
    fields = ('file', 'original_filename', 'file_type', 'description')


class CaseTransferSideInline(admin.TabularInline):
    model = CaseTransferSide
    extra = 0
    readonly_fields = ('role', 'name', 'status', 'address', 'phone')
    fields = ('role', 'name', 'status', 'address', 'phone')


# =============================================================================
# Модели справочников
# =============================================================================

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'name_short', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')
    ordering = ('name',)


@admin.register(CourtLevel)
class CourtLevelAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'hierarchy_level')
    ordering = ('hierarchy_level',)


@admin.register(CaseTransferType)
class CaseTransferTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')


@admin.register(CaseTransferStatus)
class CaseTransferStatusAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_terminal')
    list_editable = ('is_terminal',)


# =============================================================================
# Справочник судов РФ
# =============================================================================

@admin.register(CourtDirectory)
class CourtDirectoryAdmin(admin.ModelAdmin):
    # ИСПРАВЛЕНО: добавлено поле 'name' в list_display
    list_display = ('code', 'name', 'region', 'level', 'is_active', 'data_source')
    list_filter = ('is_active', 'region', 'level', 'data_source')
    search_fields = ('name', 'code', 'address')
    readonly_fields = ('uuid', 'created_at', 'updated_at')
    fieldsets = (
        ('Основная информация', {
            'fields': ('uuid', 'name', 'code', 'region', 'level', 'is_active')
        }),
        ('Адреса', {
            'fields': ('address', 'postal_code')
        }),
        ('Контакты и сайт', {
            'fields': ('email_main', 'website')
        }),
        ('Данные из внешних источников', {
            'fields': ('data_source', 'external_id', 'last_sync_at'),
            'classes': ('collapse',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
            ('Сетевое взаимодействие', {
            'fields': (
                'api_base_url', 'api_key', 'api_key_public',
                'last_health_check', 'is_online', 'api_version'
            ),
            'classes': ('collapse',)
        }),
    )
    actions = ['mark_active', 'mark_inactive', 'sync_from_csv']

    @admin.action(description='Активировать выбранные суды')
    def mark_active(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"Активировано судов: {count}")

    @admin.action(description='Деактивировать выбранные суды')
    def mark_inactive(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"Деактивировано судов: {count}")

    @admin.action(description='Синхронизировать из CSV (выберите один файл)')
    def sync_from_csv(self, request, queryset):
        from .services import CourtDirectoryService
        import csv
        from io import StringIO
        
        if 'csv_file' not in request.FILES:
            self.message_user(request, "Необходимо загрузить CSV файл", level='ERROR')
            return
        
        csv_file = request.FILES['csv_file']
        try:
            decoded = csv_file.read().decode('utf-8')
            reader = csv.DictReader(StringIO(decoded))
            result = CourtDirectoryService.sync_from_csv(reader)
            self.message_user(request, f"Загружено: {result['created']} создано, {result['updated']} обновлено, ошибок: {result['errors']}")
        except Exception as e:
            self.message_user(request, f"Ошибка загрузки: {str(e)}", level='ERROR')


# =============================================================================
# Основные модели
# =============================================================================

@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    """
    Администрирование ТЕКУЩЕГО суда (синглтон).
    """
    list_display = ('code', 'name_short', 'region', 'level', 'is_active', 'is_registered_in_network', 'employees_count_display')
    list_filter = ('is_active', 'is_registered_in_network', 'region', 'level')
    search_fields = ('name', 'name_short', 'code', 'address')
    inlines = [CourtPhoneInline, CourtEmailInline, CourtWorkingHoursInline]
    filter_horizontal = ('vice_chairmen',)
    readonly_fields = ('uuid', 'network_registration_date', 'created_at', 'updated_at')
    fieldsets = (
        ('Основная информация', {
            'fields': ('uuid', 'name', 'name_short', 'code', 'region', 'level', 'is_active')
        }),
        ('Адреса', {
            'fields': ('address', 'address_juridical', 'postal_code')
        }),
        ('Контакты и сайт', {
            'fields': ('email_main', 'website')
        }),
        ('Руководство', {
            'fields': ('chairman', 'vice_chairmen')
        }),
        ('Сеть и статусы', {
            'fields': ('is_registered_in_network', 'network_registration_date', 'created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(description='Сотрудников')
    def employees_count_display(self, obj):
        """Возвращает количество сотрудников суда"""
        try:
            # Получаем количество сотрудников через отделы суда
            from .models import CourtDepartment
            departments = CourtDepartment.objects.all()
            count = CourtEmployee.objects.filter(
                department__in=departments,
                is_active=True
            ).count()
            return count
        except Exception as e:
            logger.error(f"Error in employees_count_display: {e}")
            return 0

    def has_add_permission(self, request):
        # Запрещаем добавление нового суда, если уже есть запись
        if Court.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        # Запрещаем удаление суда
        return False

    actions = ['register_in_network']

    @admin.action(description='Зарегистрировать текущий суд в сети')
    def register_in_network(self, request, queryset):
        from .services import CourtNetworkService
        from django.utils import timezone
        count = 0
        for court in queryset:
            if not court.is_registered_in_network:
                CourtNetworkService.create_messenger_registration(court)
                court.is_registered_in_network = True
                court.network_registration_date = timezone.now()
                court.save(update_fields=['is_registered_in_network', 'network_registration_date', 'updated_at'])
                count += 1
        self.message_user(request, f"Зарегистрировано в сети: {count} судов")


@admin.register(CourtDepartment)
class CourtDepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'employees_count_display')
    list_filter = ('is_active',)
    search_fields = ('name',)
    inlines = [CourtEmployeeInline]
    readonly_fields = ('created_at', 'updated_at')

    @admin.display(description='Сотрудников')
    def employees_count_display(self, obj):
        return obj.employees_count


@admin.register(CourtEmployee)
class CourtEmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee', 'department', 'position', 'is_head_of_department', 'is_active')
    list_filter = ('is_active', 'is_head_of_department', 'department')
    search_fields = ('employee__first_name', 'employee__last_name', 'position')
    list_select_related = ('department', 'employee')
    raw_id_fields = ('department', 'employee', 'created_by')
    readonly_fields = ('created_at', 'updated_at', 'created_by')


# =============================================================================
# Передача дел
# =============================================================================

@admin.register(CaseTransfer)
class CaseTransferAdmin(admin.ModelAdmin):
    list_display = ('uuid_short', 'source_court', 'destination_court', 'transfer_type', 'status', 'created_at', 'items_count_display')
    list_filter = ('status', 'transfer_type', 'source_court', 'destination_court')
    search_fields = ('uuid', 'basis', 'basis_document')
    list_select_related = ('source_court', 'destination_court', 'transfer_type', 'status')
    inlines = [CaseTransferItemInline]
    readonly_fields = ('uuid', 'sent_at', 'received_at', 'accepted_at', 'returned_at', 'completed_at', 'created_at')
    fieldsets = (
        ('Направление', {
            'fields': ('source_court', 'source_department', 'source_employee', 'destination_court', 'destination_department')
        }),
        ('Тип и статус', {
            'fields': ('uuid', 'transfer_type', 'status', 'is_batch', 'batch_id')
        }),
        ('Основание', {
            'fields': ('basis', 'basis_document', 'basis_judge')
        }),
        ('Даты', {
            'fields': ('created_at', 'sent_at', 'received_at', 'accepted_at', 'returned_at', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('Доп. информация', {
            'fields': ('notes', 'rejection_reason'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(description='UUID')
    def uuid_short(self, obj):
        return str(obj.uuid)[:8]

    @admin.display(description='Кол-во дел')
    def items_count_display(self, obj):
        return obj.items.count()


@admin.register(CaseTransferItem)
class CaseTransferItemAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'case_category', 'transfer', 'is_accepted', 'new_case_number', 'is_returned')
    list_filter = ('case_category', 'is_accepted', 'is_returned')
    search_fields = ('case_number', 'new_case_number', 'appeal_court_case_number')
    list_select_related = ('transfer',)
    inlines = [CaseTransferDocumentInline, CaseTransferSideInline]
    raw_id_fields = ('transfer', 'content_type')
    readonly_fields = ('content_type', 'object_id', 'accepted_at', 'returned_at', 'created_at', 'updated_at')


@admin.register(IncomingCaseNotification)
class IncomingCaseNotificationAdmin(admin.ModelAdmin):
    list_display = ('court', 'transfer_type_name', 'total_count', 'status', 'created_at', 'processed_at')
    list_filter = ('status', 'court')
    list_select_related = ('court', 'transfer', 'transfer__transfer_type', 'processed_by', 'processed_by__employee')
    readonly_fields = ('created_at', 'updated_at')

    @admin.display(description='Тип передачи')
    def transfer_type_name(self, obj):
        return obj.transfer.transfer_type.name if obj.transfer and obj.transfer.transfer_type else '—'


@admin.register(PendingTransferCase)
class PendingTransferCaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'case_category', 'court', 'transfer_reason', 'status', 'target_court', 'detected_at')
    list_filter = ('case_category', 'transfer_reason', 'status', 'court')
    search_fields = ('case_number',)
    list_select_related = ('court', 'target_court')
    readonly_fields = ('detected_at',)


# =============================================================================
# ВКС
# =============================================================================

@admin.register(VCSRequest)
class VCSRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'initiator_court', 'scheduled_at', 'status', 'related_case_number')
    list_filter = ('status', 'initiator_court')
    search_fields = ('title', 'related_case_number')
    list_select_related = ('initiator_court',)
    filter_horizontal = ('participant_courts', 'participant_departments')
    readonly_fields = ('uuid', 'created_at', 'updated_at')


# =============================================================================
# Система и аудит
# =============================================================================

@admin.register(CourtMessengerRegistration)
class CourtMessengerRegistrationAdmin(admin.ModelAdmin):
    list_display = ('court', 'is_registered', 'is_online', 'last_ping', 'synced_employees_count')
    list_filter = ('is_registered', 'is_online')
    list_select_related = ('court',)
    readonly_fields = ('registered_at', 'last_ping', 'last_sync_at', 'synced_departments_count', 'synced_employees_count', 'created_at', 'updated_at')


@admin.register(CourtInteractionAuditLog)
class CourtInteractionAuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'court', 'user', 'object_type', 'object_id')
    list_filter = ('action', 'court')
    search_fields = ('details',)
    list_select_related = ('court', 'user')
    readonly_fields = ('uuid', 'created_at', 'ip_address')
    date_hierarchy = 'created_at'


    actions = ['check_online_status']

    @admin.action(description='Проверить доступность API судов')
    def check_online_status(self, request, queryset):
        from .intercourt_service import InterCourtAPIClient
        checked = 0
        online = 0
        for court in queryset:
            if court.api_base_url:
                checked += 1
                client = InterCourtAPIClient(court)
                is_online = client.ping()
                court.is_online = is_online
                court.last_health_check = timezone.now()
                court.save(update_fields=['is_online', 'last_health_check'])
                if is_online:
                    online += 1
        self.message_user(request, f"Проверено {checked} судов, онлайн: {online}")