# intercourt_service.py
"""
Сервис для межсудебного взаимодействия через HTTP API.
"""
import json
import logging
import requests
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import (
    Court, CourtDirectory, 
    CaseTransfer, CaseTransferStatus,
    CaseTransferType, CaseTransferItem,
    CaseTransferDocument, CaseTransferSide,
    IncomingCaseNotification,
)
from .services import AuditLogService

logger = logging.getLogger(__name__)


class InterCourtAPIClient:
    """Клиент для взаимодействия с API других судов"""

    def __init__(self, target_court: CourtDirectory):
        self.target = target_court
        self.base_url = target_court.api_base_url
        self.api_key = target_court.api_key
        self.timeout = 30  # секунд

    def _get_headers(self):
        """Получить заголовки для запроса"""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Source-Court-Code': Court.objects.first().code if Court.objects.exists() else '',
            'X-Source-Court-Name': Court.objects.first().name_short if Court.objects.exists() else '',
        }

    def _post(self, endpoint, data):
        """Отправить POST запрос"""
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        try:
            response = requests.post(
                url,
                json=data,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            logger.error(f"Timeout connecting to {url}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to {url}: {e}")
            raise

    def send_transfer(self, transfer_data):
        """
        Отправить передачу дел в другой суд.
        Возвращает результат (uuid созданной передачи на стороне получателя)
        """
        # Добавляем метаданные о том, кто отправитель
        sender_court = Court.objects.first()
        if sender_court:
            transfer_data['source_court_code'] = sender_court.code
            transfer_data['source_court_name'] = sender_court.name_short

        return self._post('/api/intercourt/receive-transfer/', transfer_data)

    def ping(self):
        """Проверить доступность API суда"""
        try:
            response = requests.get(
                f"{self.base_url.rstrip('/')}/api/intercourt/ping/",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False


class InterCourtReceiverAPI:
    """
    API для ПРИЁМА передач от других судов.
    Это endpoint, который вызывают другие суды.
    """

    @staticmethod
    @transaction.atomic
    def receive_transfer(data, source_court_code=None):
        """
        Принять передачу дел от другого суда.
        Создаёт IncomingCaseNotification для текущего суда.
        """
        court = Court.objects.first()
        if not court:
            raise ValueError("Текущий суд не зарегистрирован")

        # Найти суд-отправитель в справочнике
        source_court = CourtDirectory.objects.filter(
            code=data.get('source_court_code') or source_court_code
        ).first()

        if not source_court:
            # Если не нашли, создаём временную запись
            source_court = CourtDirectory.objects.create(
                code=data.get('source_court_code', 'UNKNOWN'),
                name=data.get('source_court_name', 'Неизвестный суд'),
                region=court.region,  # временно привязываем к своему региону
                level=court.level,
                is_active=True,
                data_source='network'
            )

        # Получаем статус "Ожидает приёма"
        status, _ = CaseTransferStatus.objects.get_or_create(
            code='pending',
            defaults={'name': 'Ожидает приёма', 'is_terminal': False}
        )

        # Получаем тип передачи
        transfer_type_code = data.get('transfer_type_code', 'appeal')
        transfer_type, _ = CaseTransferType.objects.get_or_create(
            code=transfer_type_code,
            defaults={'name': data.get('transfer_type_name', 'Передача')}
        )

        # Создаём передачу
        transfer = CaseTransfer.objects.create(
            source_court=court,  # Для нас это источник входящей
            destination_court=source_court,
            transfer_type=transfer_type,
            status=status,
            basis=data.get('basis', 'Входящая передача'),
            basis_document=data.get('basis_document', ''),
            received_at=timezone.now(),
            notes=data.get('notes', ''),
            is_batch=data.get('is_batch', False),
            batch_id=data.get('batch_id'),
        )

        # Создаём элементы передачи (дела)
        for item_data in data.get('items', []):
            transfer_item = CaseTransferItem.objects.create(
                transfer=transfer,
                case_number=item_data.get('case_number', ''),
                case_category=item_data.get('case_category', 'civil'),
                case_description=item_data.get('case_description', ''),
                # content_type и object_id будут заполнены при регистрации
                content_type=None,
                object_id=None,
            )

            # Стороны дела
            for side_data in item_data.get('sides', []):
                CaseTransferSide.objects.create(
                    transfer_item=transfer_item,
                    role=side_data.get('role', ''),
                    name=side_data.get('name', ''),
                    status=side_data.get('status', 'individual'),
                    address=side_data.get('address', ''),
                    phone=side_data.get('phone', ''),
                    email=side_data.get('email', ''),
                )

            # Документы (только метаданные, файлы передаются отдельно)
            for doc_data in item_data.get('documents', []):
                CaseTransferDocument.objects.create(
                    transfer_item=transfer_item,
                    file=None,  # Файлы передаются отдельным потоком
                    original_filename=doc_data.get('original_filename', ''),
                    file_type=doc_data.get('file_type', 'other'),
                    description=doc_data.get('description', ''),
                )

        # Создаём уведомление
        notification = IncomingCaseNotification.objects.create(
            court=court,
            transfer=transfer,
            status='pending'
        )
        notification.update_counts()

        AuditLogService.log(
            action='transfer_received',
            court=court,
            user=None,
            object_type='CaseTransfer',
            object_id=transfer.id,
            details={
                'source_court': source_court.code,
                'items_count': len(data.get('items', [])),
            }
        )

        return {
            'status': 'success',
            'transfer_uuid': str(transfer.uuid),
            'notification_id': notification.id,
            'message': f'Получена передача из {source_court.name}',
        }

    @staticmethod
    def ping():
        """Проверка доступности API"""
        return {'status': 'ok', 'timestamp': timezone.now().isoformat()}


class InterCourtSenderService:
    """
    Сервис для ОТПРАВКИ передач в другие суды.
    """

    @staticmethod
    @transaction.atomic
    def send_transfer_to_court(transfer_id):
        """
        Отправить передачу в целевой суд.
        Вызывается из админки или по расписанию.
        """
        transfer = CaseTransfer.objects.get(id=transfer_id)
        destination = transfer.destination_court

        if not destination.api_base_url:
            raise ValueError(f"Суд {destination.code} не настроен для сетевого взаимодействия")

        if not destination.api_key:
            raise ValueError(f"Суд {destination.code} не имеет API ключа")

        # Подготавливаем данные
        transfer_data = {
            'source_court_code': transfer.source_court.code,
            'source_court_name': transfer.source_court.name_short,
            'transfer_type_code': transfer.transfer_type.code,
            'transfer_type_name': transfer.transfer_type.name,
            'basis': transfer.basis,
            'basis_document': transfer.basis_document,
            'notes': transfer.notes,
            'is_batch': transfer.is_batch,
            'batch_id': str(transfer.batch_id) if transfer.batch_id else None,
            'items': [],
        }

        for item in transfer.items.all():
            item_data = {
                'case_number': item.case_number,
                'case_category': item.case_category,
                'case_description': item.case_description,
                'sides': [],
                'documents': [],
            }

            for side in item.sides.all():
                item_data['sides'].append({
                    'role': side.role,
                    'name': side.name,
                    'status': side.status,
                    'address': side.address,
                    'phone': side.phone,
                    'email': side.email,
                })

            for doc in item.documents.all():
                item_data['documents'].append({
                    'original_filename': doc.original_filename,
                    'file_type': doc.file_type,
                    'description': doc.description,
                })

            transfer_data['items'].append(item_data)

        # Отправляем запрос
        client = InterCourtAPIClient(destination)
        try:
            result = client.send_transfer(transfer_data)

            # Обновляем статус передачи
            sent_status, _ = CaseTransferStatus.objects.get_or_create(
                code='sent',
                defaults={'name': 'Отправлено', 'is_terminal': False}
            )
            transfer.status = sent_status
            transfer.sent_at = timezone.now()
            transfer.save(update_fields=['status', 'sent_at', 'updated_at'])

            # Обновляем удалённый UUID, если получен
            if result.get('transfer_uuid'):
                # Сохраняем внешний UUID для отслеживания
                transfer.external_uuid = result.get('transfer_uuid')
                transfer.save(update_fields=['external_uuid'])

            AuditLogService.log(
                action='transfer_sent',
                court=transfer.source_court,
                user=None,
                object_type='CaseTransfer',
                object_id=transfer.id,
                details={
                    'destination': destination.code,
                    'external_uuid': result.get('transfer_uuid'),
                }
            )

            return result

        except Exception as e:
            # Отмечаем ошибку отправки
            error_status, _ = CaseTransferStatus.objects.get_or_create(
                code='send_error',
                defaults={'name': 'Ошибка отправки', 'is_terminal': False}
            )
            transfer.status = error_status
            transfer.notes = f"{transfer.notes}\nОшибка отправки: {str(e)}"
            transfer.save(update_fields=['status', 'notes', 'updated_at'])
            raise