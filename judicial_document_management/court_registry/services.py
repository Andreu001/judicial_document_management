"""
Бизнес-логика приложения court_registry.
Сервисы для передачи дел, приема, сканирования и т.д.
"""
from django.db import transaction
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
import logging
import json
from datetime import timedelta

from .models import (
    Court, CourtDirectory,
    CourtDepartment, CourtEmployee,
    CaseTransfer, CaseTransferItem, CaseTransferDocument, CaseTransferSide,
    CaseTransferStatus, CaseTransferType,
    IncomingCaseNotification,
    PendingTransferCase,
    CourtMessengerRegistration,
    CourtInteractionAuditLog,
    Region, CourtLevel,
)
from users.models import User

logger = logging.getLogger(__name__)


# =============================================================================
# Сервис для работы со справочником судов РФ
# =============================================================================

class CourtDirectoryService:
    """Сервис для работы со справочником судов РФ"""

    @staticmethod
    def sync_from_csv(reader):
        """
        Синхронизация справочника судов из CSV файла.
        Ожидаемые колонки: code, name, name_short, region_code, level_code,
                          address, postal_code, email_main, website
        """
        created_count = 0
        updated_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                code = row.get('code', '').strip()
                if not code:
                    errors.append(f"Строка {row_num}: отсутствует код суда")
                    continue

                # Получаем регион
                region_code = row.get('region_code', '').strip()
                region = Region.objects.filter(code=region_code).first()
                if not region:
                    region_name = row.get('region_name', '').strip()
                    if region_name:
                        region = Region.objects.filter(name__icontains=region_name).first()
                    if not region:
                        errors.append(f"Строка {row_num}: регион не найден для кода '{region_code}'")
                        continue

                # Получаем уровень суда
                level_code = row.get('level_code', '').strip()
                level = CourtLevel.objects.filter(code=level_code).first()
                if not level:
                    level_name = row.get('level_name', '').strip()
                    if level_name:
                        level = CourtLevel.objects.filter(name__icontains=level_name).first()
                    if not level:
                        errors.append(f"Строка {row_num}: уровень суда не найден для кода '{level_code}'")
                        continue

                # Подготавливаем данные
                data = {
                    'code': code,
                    'name': row.get('name', '').strip() or row.get('name_short', '').strip() or code,
                    'name_short': row.get('name_short', '').strip() or None,
                    'region': region,
                    'level': level,
                    'address': row.get('address', '').strip() or None,
                    'postal_code': row.get('postal_code', '').strip() or None,
                    'email_main': row.get('email_main', '').strip() or None,
                    'website': row.get('website', '').strip() or None,
                    'data_source': 'csv',
                }

                # Создаём или обновляем запись
                directory_court, created = CourtDirectory.objects.update_or_create(
                    code=code,
                    defaults=data
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as e:
                errors.append(f"Строка {row_num}: {str(e)}")
                logger.error(f"Error in sync_from_csv row {row_num}: {e}")

        return {
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
        }

    @staticmethod
    def get_courts_by_region(region_code):
        """Получить суды по региону"""
        return CourtDirectory.objects.filter(
            region__code=region_code,
            is_active=True
        )

    @staticmethod
    def get_courts_by_level(level_code):
        """Получить суды по уровню"""
        return CourtDirectory.objects.filter(
            level__code=level_code,
            is_active=True
        )

    @staticmethod
    def get_courts_by_region_and_level(region_code, level_code):
        """Получить суды по региону и уровню"""
        return CourtDirectory.objects.filter(
            region__code=region_code,
            level__code=level_code,
            is_active=True
        )

    @staticmethod
    def get_appeal_court_for_court(court):
        """Получить апелляционный суд для данного суда из справочника"""
        if court.level.code in ['magistrate', 'city_district']:
            return CourtDirectory.objects.filter(
                region=court.region,
                level__code='subject_level',
                is_active=True
            ).first()
        return None

    @staticmethod
    def get_cassation_court_for_court(court):
        """Получить кассационный суд для данного суда из справочника"""
        if court.level.code in ['magistrate', 'city_district', 'subject_level']:
            return CourtDirectory.objects.filter(
                level__code='cassation',
                is_active=True
            ).first()
        return None

    @staticmethod
    def search_courts(query, region_code=None, level_code=None):
        """Поиск судов в справочнике"""
        courts = CourtDirectory.objects.filter(is_active=True)

        if query:
            courts = courts.filter(
                Q(name__icontains=query) |
                Q(name_short__icontains=query) |
                Q(code__icontains=query)
            )

        if region_code:
            courts = courts.filter(region__code=region_code)

        if level_code:
            courts = courts.filter(level__code=level_code)

        return courts

    @staticmethod
    def update_from_network(court_code, data):
        """Обновление данных суда из сети (при обмене данными между судами)"""
        try:
            directory_court = CourtDirectory.objects.get(code=court_code)
            
            if 'address' in data and data['address']:
                directory_court.address = data['address']
            if 'address_juridical' in data and data['address_juridical']:
                directory_court.address_juridical = data['address_juridical']
            if 'postal_code' in data and data['postal_code']:
                directory_court.postal_code = data['postal_code']
            if 'email_main' in data and data['email_main']:
                directory_court.email_main = data['email_main']
            if 'website' in data and data['website']:
                directory_court.website = data['website']
            if 'phones' in data:
                directory_court.phones = data['phones']
            if 'emails' in data:
                directory_court.emails = data['emails']
            if 'working_hours' in data:
                directory_court.working_hours = data['working_hours']
            if 'chairman_name' in data:
                directory_court.chairman_name = data['chairman_name']
            if 'vice_chairmen_names' in data:
                directory_court.vice_chairmen_names = data['vice_chairmen_names']
            
            directory_court.data_source = 'network'
            directory_court.last_sync_at = timezone.now()
            directory_court.save()
            
            return directory_court
        except CourtDirectory.DoesNotExist:
            logger.warning(f"Court with code {court_code} not found in directory")
            return None

    @staticmethod
    def get_court_by_code(code):
        """Получить суд из справочника по коду"""
        try:
            return CourtDirectory.objects.get(code=code, is_active=True)
        except CourtDirectory.DoesNotExist:
            return None


# =============================================================================
# Сервис для работы с передачами дел
# =============================================================================

class CaseTransferService:
    """Сервис для работы с передачами дел"""

    @staticmethod
    def _get_or_create_status(code, name, is_terminal=False):
        """Получить или создать статус передачи"""
        status, _ = CaseTransferStatus.objects.get_or_create(
            code=code,
            defaults={'name': name, 'is_terminal': is_terminal}
        )
        return status

    @staticmethod
    def _get_content_type_by_category(category):
        """Определить ContentType по категории дела"""
        mapping = {
            'criminal': ('criminal_proceedings', 'criminalproceedings'),
            'civil': ('civil_proceedings', 'civilproceedings'),
            'admin_code': ('administrative_code', 'administrativeproceedings'),
            'kas': ('administrative_proceedings', 'kasproceedings'),
        }
        if category in mapping:
            app, model = mapping[category]
            try:
                return ContentType.objects.get(app_label=app, model=model)
            except ContentType.DoesNotExist:
                logger.warning(f"ContentType not found for {app}.{model}")
        return None

    @staticmethod
    @transaction.atomic
    def create_transfer(validated_data, user, request=None):
        """Создание передачи дел"""

        # Создаем копию, чтобы не менять serializer.validated_data
        validated_data = validated_data.copy()

        # Удаляем служебные поля, которые не являются полями модели
        validated_data.pop('_myCourtLoaded', None)

        # Получаем список дел
        items_data = validated_data.pop('items', [])

        # Получаем статус "Черновик"
        draft_status = CaseTransferService._get_or_create_status(
            'draft',
            'Черновик'
        )

        transfer = CaseTransfer.objects.create(
            status=draft_status,
            **validated_data
        )

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

        AuditLogService.log(
            action='transfer_created',
            court=transfer.source_court,
            user=user,
            object_type='CaseTransfer',
            object_id=transfer.id,
            details={
                'uuid': str(transfer.uuid),
                'destination': transfer.destination_court.code,
                'items_count': len(items_data),
            },
            request=request
        )

        return transfer

    @staticmethod
    @transaction.atomic
    def send_transfer(transfer, user, request=None):
        """
        Отправка передачи в другой суд.
        Использует межсудебное API, если целевой суд настроен для сетевого взаимодействия.
        """
        from .intercourt_service import InterCourtSenderService
        
        destination = transfer.destination_court
        
        # Проверяем, настроен ли суд-получатель для сетевого взаимодействия
        if destination.api_base_url and destination.api_key:
            # === РЕЖИМ РЕАЛЬНОЙ ОТПРАВКИ В ДРУГОЙ СУД ===
            try:
                # Отправляем через межсудебное API
                result = InterCourtSenderService.send_transfer_to_court(transfer.id)
                
                # Статус уже обновлен внутри send_transfer_to_court
                # Возвращаем результат
                return {
                    'status': 'sent',
                    'message': f'Передача отправлена в {destination.name}',
                    'external_uuid': result.get('transfer_uuid'),
                    'transfer': transfer
                }
                
            except Exception as e:
                logger.error(f"Failed to send transfer {transfer.uuid} via intercourt API: {e}")
                
                # Отмечаем ошибку отправки
                error_status = CaseTransferService._get_or_create_status(
                    'send_error', 'Ошибка отправки', is_terminal=False
                )
                transfer.status = error_status
                transfer.notes = f"{transfer.notes}\nОшибка отправки: {str(e)}"
                transfer.save(update_fields=['status', 'notes', 'updated_at'])
                
                raise ValueError(f"Не удалось отправить передачу в {destination.name}: {str(e)}")
        
        else:
            # === РЕЖИМ ЛОКАЛЬНОЙ ОТПРАВКИ (для тестирования в одной БД) ===
            # Если целевой суд не настроен для сетевого взаимодействия,
            # используем старую логику (локальное уведомление)
            logger.warning(
                f"Court {destination.code} has no API configuration. Using local mode."
            )
            return CaseTransferService._send_local(transfer, user, request)
    
    @staticmethod
    @transaction.atomic
    def _send_local(transfer, user, request=None):
        """
        Локальная отправка — создает уведомление в той же БД.
        Используется только для тестирования или если суд не настроен для сети.
        """
        # Получаем или создаем статус "Отправлено"
        sent_status = CaseTransferService._get_or_create_status(
            'sent', 'Отправлено', is_terminal=False
        )
        
        transfer.status = sent_status
        transfer.sent_at = timezone.now()
        transfer.save(update_fields=['status', 'sent_at', 'updated_at'])
        
        # Находим суд-получатель в локальной БД
        destination_court = Court.objects.filter(
            code=transfer.destination_court.code
        ).first()
        
        if not destination_court:
            destination_court = Court.objects.filter(
                region=transfer.destination_court.region,
                name__icontains=transfer.destination_court.name[:30]
            ).first()
        
        # Fallback — используем суд-отправитель (только для тестирования)
        if not destination_court:
            logger.warning(
                f"Destination court not found for transfer {transfer.uuid}. "
                f"Using source court as fallback."
            )
            destination_court = transfer.source_court
        
        # Создаем уведомление для получателя (локально)
        notification = IncomingCaseNotification.objects.create(
            court=destination_court,
            transfer=transfer,
            status='pending'
        )
        notification.update_counts()
        
        # Обновляем статус PendingTransferCase
        PendingTransferCase.objects.filter(
            transfer=transfer
        ).update(status='sent')
        
        AuditLogService.log(
            action='transfer_sent',
            court=transfer.source_court,
            user=user,
            object_type='CaseTransfer',
            object_id=transfer.id,
            details={
                'uuid': str(transfer.uuid),
                'destination': transfer.destination_court.code,
                'mode': 'local',
            },
            request=request
        )
        
        return {
            'status': 'sent',
            'message': 'Передача отправлена (локальный режим)',
            'transfer': transfer
        }

    @staticmethod
    @transaction.atomic
    def accept_transfer(transfer, user, request=None, register_cases=True):
        """Принятие дел с автоматической регистрацией"""
        now = timezone.now()
        
        # Получаем или создаем статусы
        completed_status = CaseTransferService._get_or_create_status(
            'completed', 'Завершено', is_terminal=True
        )
        received_status = CaseTransferService._get_or_create_status('received', 'Получено')
        accepted_status = CaseTransferService._get_or_create_status('accepted', 'Принято')

        transfer.received_at = now
        transfer.accepted_at = now
        transfer.completed_at = now
        transfer.status = completed_status
        transfer.save(update_fields=[
            'received_at', 'accepted_at', 'completed_at', 'status'
        ])

        registered_items = []
        employment = CourtEmployee.objects.filter(
            employee=user,
            is_active=True
        ).first()

        for item in transfer.items.all():
            item.is_accepted = True
            item.accepted_at = now

            if register_cases:
                new_number = IncomingCaseService._register_incoming_case(
                    item=item,
                    court=destination_court,
                    user=user,
                    request=request
                )
                item.new_case_number = new_number

            item.save(update_fields=[
                'is_accepted', 'accepted_at', 'new_case_number', 'updated_at'
            ])
            registered_items.append({
                'case_number': item.case_number,
                'new_case_number': item.new_case_number,
                'category': item.case_category,
            })

        # Обновляем уведомление
        try:
            notification = IncomingCaseNotification.objects.filter(
                transfer=transfer
            ).first()
            if notification:
                notification.status = 'accepted'
                notification.processed_by = employment
                notification.processed_at = now
                notification.save()
        except Exception as e:
            logger.error(f"Error updating notification: {e}")

        AuditLogService.log(
            action='transfer_accepted',
            court=transfer.source_court,
            user=user,
            employee=employment,
            object_type='CaseTransfer',
            object_id=transfer.id,
            details={
                'uuid': str(transfer.uuid),
                'source': transfer.source_court.code,
                'registered_items': registered_items,
            },
            request=request
        )

        return {
            'status': 'accepted',
            'message': f'Принято {len(registered_items)} дел',
            'registered_items': registered_items,
            'transfer': {
                'uuid': str(transfer.uuid),
                'accepted_at': now.isoformat(),
            }
        }

    @staticmethod
    @transaction.atomic
    def reject_transfer(transfer, reason, user, request=None):
        """Отклонение передачи"""
        rejected_status = CaseTransferService._get_or_create_status(
            'rejected', 'Отклонено', is_terminal=True
        )

        now = timezone.now()
        transfer.status = rejected_status
        transfer.rejection_reason = reason
        transfer.received_at = now
        transfer.save(update_fields=['status', 'rejection_reason', 'received_at'])

        # Обновляем уведомление
        try:
            employment = CourtEmployee.objects.filter(
                employee=user,
                is_active=True
            ).first()
            notification = IncomingCaseNotification.objects.filter(
                transfer=transfer
            ).first()
            if notification:
                notification.status = 'rejected'
                notification.processed_by = employment
                notification.processed_at = now
                notification.notes = reason
                notification.save()
        except Exception as e:
            logger.error(f"Error updating notification on reject: {e}")

        AuditLogService.log(
            action='transfer_rejected',
            court=transfer.source_court,
            user=user,
            object_type='CaseTransfer',
            object_id=transfer.id,
            details={
                'uuid': str(transfer.uuid),
                'reason': reason,
            },
            request=request
        )

        return transfer

    @staticmethod
    @transaction.atomic
    def return_transfer(transfer, items_data, user, request=None):
        """Возврат дела из апелляции/кассации"""
        now = timezone.now()
        returned_items = []

        for item_info in items_data:
            item_id = item_info.get('item_id')
            return_result = item_info.get('return_result', '')
            decision_document = item_info.get('return_decision_document')
            appeal_court_case_number = item_info.get('appeal_court_case_number', '')

            try:
                item = transfer.items.get(id=item_id)
            except CaseTransferItem.DoesNotExist:
                continue

            item.is_returned = True
            item.returned_at = now
            item.return_result = return_result
            item.appeal_court_case_number = appeal_court_case_number

            if decision_document:
                item.return_decision_document = decision_document

            item.save(update_fields=[
                'is_returned', 'returned_at', 'return_result',
                'return_decision_document', 'appeal_court_case_number', 'updated_at'
            ])

            returned_items.append({
                'case_number': item.case_number,
                'return_result': return_result,
            })

            # Обновляем оригинальное дело в первой инстанции
            IncomingCaseService._update_original_case_after_return(item)

        transfer.returned_at = now
        transfer.save(update_fields=['returned_at'])

        AuditLogService.log(
            action='transfer_returned',
            court=transfer.source_court,
            user=user,
            object_type='CaseTransfer',
            object_id=transfer.id,
            details={
                'uuid': str(transfer.uuid),
                'returned_items': returned_items,
            },
            request=request
        )

        return {
            'status': 'returned',
            'message': f'Возвращено {len(returned_items)} дел',
            'returned_items': returned_items,
        }


# =============================================================================
# Сервис для обработки входящих дел
# =============================================================================

class IncomingCaseService:
    """Сервис для обработки входящих дел"""

    @staticmethod
    def accept_notification(notification, user, request=None):
        """Принять все дела в уведомлении"""
        return CaseTransferService.accept_transfer(
            notification.transfer,
            user=user,
            request=request,
            register_cases=True
        )

    @staticmethod
    def reject_notification(notification, reason, user, request=None):
        """Отклонить все дела в уведомлении"""
        return CaseTransferService.reject_transfer(
            notification.transfer,
            reason=reason,
            user=user,
            request=request
        )

    @staticmethod
    @transaction.atomic
    def _register_incoming_case(item, court, user, request=None):
        """
        Регистрация входящего дела.
        Создает запись в case_registry, копирует данные.
        """
        from case_registry.models import RegistryIndex, RegistryCounter, RegisteredCase

        # Определяем индекс по категории дела
        index_code_map = {
            'criminal': 'УД',
            'civil': 'ГД',
            'admin_code': 'АП',
            'kas': 'АС',
        }
        index_code = index_code_map.get(item.case_category, 'ДР')

        try:
            index = RegistryIndex.objects.get(index=index_code)
        except RegistryIndex.DoesNotExist:
            index, _ = RegistryIndex.objects.get_or_create(
                index=index_code,
                defaults={'name': f'Индекс {index_code}'}
            )

        try:
            counter = RegistryCounter.objects.select_for_update().get(index=index)
        except RegistryCounter.DoesNotExist:
            counter = RegistryCounter.objects.create(
                index=index,
                current_number=0,
                total_registered=0
            )

        counter.current_number += 1
        counter.total_registered += 1
        counter.last_used = timezone.now()
        counter.save()

        current_year = timezone.now().year
        full_number = f"{index.index}-{counter.current_number}/{current_year}"

        registered_case = RegisteredCase.objects.create(
            index=index,
            case_number=counter.current_number,
            full_number=full_number,
            description=item.case_description or f"{item.get_case_category_display()} дело из {item.transfer.source_court.code}",
            status='active',
        )

        logger.info(
            f"Registered incoming case: {full_number} "
            f"(from {item.case_number} at {item.transfer.source_court.code})"
        )

        # Обновляем PendingTransferCase если есть
        PendingTransferCase.objects.filter(
            content_type=item.content_type,
            object_id=item.object_id,
            status='sent'
        ).update(status='completed', transfer=item.transfer)

        return full_number

    @staticmethod
    def _update_original_case_after_return(item):
        """
        Обновление оригинального дела после возврата из апелляции/кассации.
        """
        if not item.content_type or not item.object_id:
            return

        try:
            case = item.content_type.get_object_for_this_type(id=item.object_id)
        except Exception as e:
            logger.error(f"Error getting original case: {e}")
            return

        transfer_type = item.transfer.transfer_type.code if item.transfer.transfer_type else None
        update_fields = ['updated_at']

        if transfer_type in ['appeal', 'return_appeal']:
            if hasattr(case, 'is_appealed'):
                case.is_appealed = True
                update_fields.append('is_appealed')
            if hasattr(case, 'appeal_review_date') and item.transfer.received_at:
                case.appeal_review_date = item.transfer.received_at.date()
                update_fields.append('appeal_review_date')
            if hasattr(case, 'appeal_result') and item.return_result:
                case.appeal_result = item.return_result
                update_fields.append('appeal_result')
            if hasattr(case, 'appeal_date') and item.transfer.received_at:
                case.appeal_date = item.transfer.received_at.date()
                update_fields.append('appeal_date')

        elif transfer_type in ['cassation', 'return_cassation']:
            if hasattr(case, 'is_cassation_filed'):
                case.is_cassation_filed = True
                update_fields.append('is_cassation_filed')
            if hasattr(case, 'cassation_review_date') and item.transfer.received_at:
                case.cassation_review_date = item.transfer.received_at.date()
                update_fields.append('cassation_review_date')
            if hasattr(case, 'cassation_result') and item.return_result:
                case.cassation_result = item.return_result
                update_fields.append('cassation_result')
            if hasattr(case, 'cassation_date') and item.transfer.received_at:
                case.cassation_date = item.transfer.received_at.date()
                update_fields.append('cassation_date')

        if item.appeal_court_case_number:
            if hasattr(case, 'higher_court_case_number'):
                case.higher_court_case_number = item.appeal_court_case_number
                update_fields.append('higher_court_case_number')

        case.save(update_fields=update_fields)

        logger.info(f"Updated original case {item.case_number} after return")


# =============================================================================
# Сервис для сканирования дел на предмет необходимости передачи
# =============================================================================

class PendingTransferService:
    """Сервис для сканирования дел на предмет необходимости передачи"""

    @staticmethod
    @transaction.atomic
    def scan_court_cases(court, user, request=None):
        """
        Сканирует все дела суда и находит те, которые требуют передачи.
        """
        detected_count = 0
        details = {
            'jurisdiction': 0,
            'appeal': 0,
            'cassation': 0,
        }

        # Определяем целевые суды из справочника
        appeal_court = CourtDirectoryService.get_appeal_court_for_court(court)
        cassation_court = CourtDirectoryService.get_cassation_court_for_court(court)

        # === Уголовные дела ===
        try:
            from criminal_proceedings.models import CriminalProceedings, CriminalAppealInstance, CriminalCassationInstance
            from django.contrib.contenttypes.models import ContentType
            
            criminal_ct = ContentType.objects.get(
                app_label='criminal_proceedings',
                model='criminalproceedings'
            )
            
            # Апелляция - ищем через связанную модель CriminalAppealInstance
            appeal_criminal_ids = CriminalAppealInstance.objects.filter(
                appeal_present__in=['2', '3', '4'],  # обжалован
                appeal_date__isnull=False,
            ).values_list('criminal_proceedings_id', flat=True)
            
            appeal_criminal = CriminalProceedings.objects.filter(
                id__in=appeal_criminal_ids,
                status='active'
            )
            for case in appeal_criminal:
                if PendingTransferService._is_case_in_court(case, court):
                    # Получаем дату из апелляционной записи
                    appeal_instance = case.appeal_instances.first()
                    appeal_date = appeal_instance.appeal_date if appeal_instance else None
                    _, created = PendingTransferCase.objects.get_or_create(
                        content_type=criminal_ct,
                        object_id=case.id,
                        transfer_reason='appeal',
                        defaults={
                            'court': court,
                            'case_number': case.case_number_criminal,
                            'case_category': 'criminal',
                            'relevant_date': appeal_date,
                            'target_court': appeal_court,
                        }
                    )
                    if created:
                        detected_count += 1
                        details['appeal'] += 1

            # Кассация
            cassation_criminal_ids = CriminalCassationInstance.objects.filter(
                cassation_filed=True,
                cassation_date__isnull=False,
            ).values_list('criminal_proceedings_id', flat=True)
            
            cassation_criminal = CriminalProceedings.objects.filter(
                id__in=cassation_criminal_ids,
                status='active'
            )
            for case in cassation_criminal:
                if PendingTransferService._is_case_in_court(case, court):
                    cassation_instance = case.cassation_instances.first()
                    cassation_date = cassation_instance.cassation_date if cassation_instance else None
                    _, created = PendingTransferCase.objects.get_or_create(
                        content_type=criminal_ct,
                        object_id=case.id,
                        transfer_reason='cassation',
                        defaults={
                            'court': court,
                            'case_number': case.case_number_criminal,
                            'case_category': 'criminal',
                            'relevant_date': cassation_date,
                            'target_court': cassation_court,
                        }
                    )
                    if created:
                        detected_count += 1
                        details['cassation'] += 1

        except Exception as e:
            logger.error(f"Error scanning criminal cases: {e}")

        # === Дела КАС РФ ===
        try:
            from administrative_proceedings.models import KasProceedings
            kas_ct = ContentType.objects.get(
                app_label='administrative_proceedings',
                model='kasproceedings'
            )

            appeal_kas = KasProceedings.objects.filter(
                is_appealed=True,
                appeal_date__isnull=False,
                status__in=['active', 'completed'],
            )
            for case in appeal_kas:
                if PendingTransferService._is_case_in_court(case, court):
                    _, created = PendingTransferCase.objects.get_or_create(
                        content_type=kas_ct,
                        object_id=case.id,
                        transfer_reason='appeal',
                        defaults={
                            'court': court,
                            'case_number': case.case_number_kas,
                            'case_category': 'kas',
                            'relevant_date': case.appeal_date,
                            'target_court': appeal_court,
                        }
                    )
                    if created:
                        detected_count += 1
                        details['appeal'] += 1

            cassation_kas = KasProceedings.objects.filter(
                is_cassation_filed=True,
                cassation_date__isnull=False,
                status__in=['active', 'completed'],
            )
            for case in cassation_kas:
                if PendingTransferService._is_case_in_court(case, court):
                    _, created = PendingTransferCase.objects.get_or_create(
                        content_type=kas_ct,
                        object_id=case.id,
                        transfer_reason='cassation',
                        defaults={
                            'court': court,
                            'case_number': case.case_number_kas,
                            'case_category': 'kas',
                            'relevant_date': case.cassation_date,
                            'target_court': cassation_court,
                        }
                    )
                    if created:
                        detected_count += 1
                        details['cassation'] += 1

        except Exception as e:
            logger.error(f"Error scanning KAS cases: {e}")

        # === Дела об АП (КоАП) ===
        try:
            from administrative_code.models import AdministrativeProceedings, AdministrativeAppeal, AdministrativeCassation
            admin_ct = ContentType.objects.get(
                app_label='administrative_code',
                model='administrativeproceedings'
            )

            appeal_admin_ids = AdministrativeAppeal.objects.filter(
                complaint_filed=True,
                complaint_filed_date__isnull=False,
            ).values_list('administrative_proceedings_id', flat=True)

            appeal_admin = AdministrativeProceedings.objects.filter(
                id__in=appeal_admin_ids,
                status__in=['active', 'completed'],
            )
            for case in appeal_admin:
                if PendingTransferService._is_case_in_court(case, court):
                    appeal_obj = case.appeal
                    _, created = PendingTransferCase.objects.get_or_create(
                        content_type=admin_ct,
                        object_id=case.id,
                        transfer_reason='appeal',
                        defaults={
                            'court': court,
                            'case_number': case.case_number_admin,
                            'case_category': 'admin_code',
                            'relevant_date': appeal_obj.complaint_filed_date if appeal_obj else None,
                            'target_court': appeal_court,
                        }
                    )
                    if created:
                        detected_count += 1
                        details['appeal'] += 1

            cassation_admin_ids = AdministrativeCassation.objects.filter(
                cassation_filed=True,
                cassation_filed_date__isnull=False,
            ).values_list('administrative_proceedings_id', flat=True)

            cassation_admin = AdministrativeProceedings.objects.filter(
                id__in=cassation_admin_ids,
                status__in=['active', 'completed'],
            )
            for case in cassation_admin:
                if PendingTransferService._is_case_in_court(case, court):
                    cassation_obj = case.cassation
                    _, created = PendingTransferCase.objects.get_or_create(
                        content_type=admin_ct,
                        object_id=case.id,
                        transfer_reason='cassation',
                        defaults={
                            'court': court,
                            'case_number': case.case_number_admin,
                            'case_category': 'admin_code',
                            'relevant_date': cassation_obj.cassation_filed_date if cassation_obj else None,
                            'target_court': cassation_court,
                        }
                    )
                    if created:
                        detected_count += 1
                        details['cassation'] += 1

        except Exception as e:
            logger.error(f"Error scanning AdminCode cases: {e}")

        AuditLogService.log(
            action='transfer_created',
            court=court,
            user=user,
            details={
                'event': 'scan_completed',
                'detected_count': detected_count,
                'breakdown': details,
            },
            request=request
        )

        return {
            'status': 'success',
            'detected_count': detected_count,
            'details': details
        }

    @staticmethod
    def _is_case_in_court(case, court):
        """Проверяет, принадлежит ли дело конкретному суду."""
        if hasattr(case, 'presiding_judge') and case.presiding_judge:
            is_in_court = CourtEmployee.objects.filter(
                employee=case.presiding_judge,
                department__court=court,
                is_active=True
            ).exists()
            if is_in_court:
                return True
        return False


# =============================================================================
# Сервис для управления сетью судов
# =============================================================================

class CourtNetworkService:
    """Сервис для управления сетью судов"""

    @staticmethod
    def create_messenger_registration(court):
        """Создает запись регистрации мессенджера для суда"""
        reg, created = CourtMessengerRegistration.objects.get_or_create(
            court=court,
            defaults={
                'is_registered': True,
                'registered_at': timezone.now(),
                'court_name_in_messenger': court.name_short or court.name,
                'court_code_in_messenger': court.code,
            }
        )
        if not created:
            reg.is_registered = True
            reg.registered_at = timezone.now()
            reg.save()
        return reg

    @staticmethod
    def get_online_courts():
        """Получить список судов онлайн"""
        threshold = timezone.now() - timezone.timedelta(minutes=5)
        CourtMessengerRegistration.objects.filter(
            last_ping__lt=threshold,
            is_online=True
        ).update(is_online=False)

        return Court.objects.filter(
            is_registered_in_network=True,
            messenger_registration__is_online=True
        ).distinct()

    @staticmethod
    def sync_directory_with_network():
        """
        Синхронизация справочника судов с сетью.
        Отправляет данные текущего суда в сеть и получает данные от других судов.
        """
        try:
            current_court = Court.objects.first()
            if not current_court:
                return {'error': 'Текущий суд не зарегистрирован'}

            # Подготавливаем данные текущего суда для отправки
            court_data = {
                'code': current_court.code,
                'address': current_court.address,
                'address_juridical': current_court.address_juridical,
                'postal_code': current_court.postal_code,
                'email_main': current_court.email_main,
                'website': current_court.website,
                'phones': current_court.phones_list,
                'emails': current_court.emails_list,
                'chairman_name': current_court.chairman.get_full_name() if current_court.chairman else None,
                'vice_chairmen_names': [
                    vc.get_full_name() for vc in current_court.vice_chairmen.all()
                ],
                'working_hours': {},
            }

            for wh in current_court.working_hours.all():
                court_data['working_hours'][wh.day_of_week] = {
                    'work_start': str(wh.work_start) if wh.work_start else None,
                    'work_end': str(wh.work_end) if wh.work_end else None,
                    'is_working_day': wh.is_working_day,
                }

            # Обновляем запись текущего суда в справочнике
            CourtDirectoryService.update_from_network(current_court.code, court_data)

            # TODO: Здесь будет логика отправки данных в сеть и получения данных от других судов
            # Это должно быть реализовано через межсудебный обмен данными (API, RabbitMQ, WebSockets и т.д.)
            # Пока что просто обновляем справочник

            return {
                'status': 'success',
                'message': 'Синхронизация завершена',
                'court': court_data,
            }

        except Exception as e:
            logger.error(f"Error in sync_directory_with_network: {e}")
            return {'error': str(e)}

    @staticmethod
    def get_court_network_status(court_code):
        """Получить статус суда в сети"""
        try:
            directory_court = CourtDirectory.objects.get(code=court_code)
            return {
                'code': directory_court.code,
                'name': directory_court.name_short or directory_court.name,
                'is_active': directory_court.is_active,
                'data_source': directory_court.data_source,
                'last_sync_at': directory_court.last_sync_at,
                'has_full_data': bool(
                    directory_court.address and 
                    directory_court.email_main and 
                    directory_court.phones
                ),
            }
        except CourtDirectory.DoesNotExist:
            return {'error': 'Суд не найден в справочнике'}


# =============================================================================
# Сервис для логирования аудита
# =============================================================================

class AuditLogService:
    """Сервис для логирования аудита"""

    @staticmethod
    def log(action, court=None, user=None, employee=None, 
            object_type=None, object_id=None, details=None, request=None):
        """Создает запись в журнале аудита"""
        ip_address = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')

        try:
            CourtInteractionAuditLog.objects.create(
                action=action,
                court=court,
                user=user,
                employee=employee,
                object_type=object_type,
                object_id=object_id,
                details=details or {},
                ip_address=ip_address,
            )
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
