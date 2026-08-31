import logging
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from .models import ExternalUser, CaseAccessGrant, SyncLog, SideCaseLink
from django.utils import timezone

from civil_proceedings.models import (
    CivilProceedings, CivilProceedingsType,
    CivilSidesCaseInCase, CivilDecision,
    CivilCaseMovement, CivilPetition
)
from business_card.models import SidesCase, SidesCaseInCase
from case_registry.models import RegisteredCase
from case_registry.managers import case_registry
from users.models import User

logger = logging.getLogger(__name__)


class CaseAccessSyncService:
    """
    Сервис для синхронизации доступа к делам.
    """
    
    # Маппинг типов сторон к моделям
    SIDE_MODELS = {
        # Уголовные дела - подсудимые (Defendant)
        'criminal_defendant': {
            'app_label': 'criminal_proceedings',
            'model': 'Defendant',
            'case_field': 'criminal_proceedings',
            'case_model': 'CriminalProceedings',
            'case_number_field': 'case_number_criminal',
            'get_side_info': lambda side: {
                'full_name': side.full_name_criminal,
                'birth_date': side.birth_date,
                'email': getattr(side, 'email', None),
                'type': 'defendant',
            },
            'get_side_name': lambda side: side.full_name_criminal,
            'search_fields': ['full_name_criminal'],
            'has_email': False,
        },
        
        # Уголовные дела - стороны (CriminalSidesCaseInCase) - ДОБАВЛЕНО!
        'criminal_side': {
            'app_label': 'criminal_proceedings',
            'model': 'CriminalSidesCaseInCase',
            'case_field': 'criminal_proceedings',
            'case_model': 'CriminalProceedings',
            'case_number_field': 'case_number_criminal',
            'get_side_info': lambda side: {
                'full_name': side.criminal_side_case.name if side.criminal_side_case else str(side),
                'email': side.criminal_side_case.email if side.criminal_side_case else None,
                'type': 'side',
            },
            'get_side_name': lambda side: side.criminal_side_case.name if side.criminal_side_case else str(side),
            'search_fields': ['criminal_side_case__name', 'criminal_side_case__email'],
            'has_email': True,
            'email_field': 'criminal_side_case__email',
        },
        
        # Гражданские дела - стороны
        'civil_side': {
            'app_label': 'civil_proceedings',
            'model': 'CivilSidesCaseInCase',
            'case_field': 'civil_proceedings',
            'case_model': 'CivilProceedings',
            'case_number_field': 'case_number_civil',
            'get_side_info': lambda side: {
                'full_name': side.sides_case_incase.name if side.sides_case_incase else str(side),
                'email': side.sides_case_incase.email if side.sides_case_incase else None,
                'type': 'side',
            },
            'get_side_name': lambda side: side.sides_case_incase.name if side.sides_case_incase else str(side),
            'search_fields': ['sides_case_incase__name', 'sides_case_incase__email'],
            'has_email': True,
            'email_field': 'sides_case_incase__email',
        },
        
        # Административные дела (КАС) - стороны
        'kas_side': {
            'app_label': 'administrative_proceedings',
            'model': 'KasSidesCaseInCase',
            'case_field': 'kas_proceedings',
            'case_model': 'KasProceedings',
            'case_number_field': 'case_number_kas',
            'get_side_info': lambda side: {
                'full_name': side.sides_case_incase.name if side.sides_case_incase else str(side),
                'email': side.sides_case_incase.email if side.sides_case_incase else None,
                'type': 'side',
            },
            'get_side_name': lambda side: side.sides_case_incase.name if side.sides_case_incase else str(side),
            'search_fields': ['sides_case_incase__name', 'sides_case_incase__email'],
            'has_email': True,
            'email_field': 'sides_case_incase__email',
        },
        
        # Административные правонарушения (КоАП) - стороны
        'admin_side': {
            'app_label': 'administrative_code',
            'model': 'AdministrativeSidesCaseInCase',
            'case_field': 'administrative_proceedings',
            'case_model': 'AdministrativeProceedings',
            'case_number_field': 'case_number_admin',
            'get_side_info': lambda side: {
                'full_name': side.sides_case_incase.name if side.sides_case_incase else str(side),
                'email': side.sides_case_incase.email if side.sides_case_incase else None,
                'type': 'side',
            },
            'get_side_name': lambda side: side.sides_case_incase.name if side.sides_case_incase else str(side),
            'search_fields': ['sides_case_incase__name', 'sides_case_incase__email'],
            'has_email': True,
            'email_field': 'sides_case_incase__email',
        },
    }
    
    @classmethod
    def _normalize_name(cls, name):
        """Нормализует ФИО для поиска"""
        if not name:
            return ''
        name = ' '.join(name.split())
        return name.lower()
    
    @classmethod
    def _name_matches(cls, user_name, side_name):
        """Проверяет, соответствует ли имя пользователя имени стороны"""
        if not user_name or not side_name:
            return False
        
        user_normalized = cls._normalize_name(user_name)
        side_normalized = cls._normalize_name(side_name)
        
        # Точное совпадение
        if user_normalized == side_normalized:
            return True
        
        # Имя пользователя содержится в имени стороны
        if user_normalized in side_normalized:
            return True
        
        # Имя стороны содержится в имени пользователя
        if side_normalized in user_normalized:
            return True
        
        # Разбиваем на части
        user_parts = user_normalized.split()
        side_parts = side_normalized.split()
        
        if user_parts and side_parts:
            # Совпадение по фамилии
            if user_parts[0] == side_parts[0]:
                return True
            # Совпадение по фамилии и имени
            if len(user_parts) >= 2 and len(side_parts) >= 2:
                if user_parts[0] == side_parts[0] and user_parts[1] == side_parts[1]:
                    return True
        
        return False
    
    @classmethod
    def sync_user_access(cls, external_user, triggered_by='user'):
        from django.apps import apps
        
        cases_found = 0
        cases_added = 0
        cases_removed = 0
        
        existing_grants = set(
            CaseAccessGrant.objects.filter(
                external_user=external_user,
                is_active=True
            ).values_list('content_type_id', 'object_id')
        )
        
        new_grants = set()
        
        print(f"\n=== Синхронизация для {external_user.full_name} (email: {external_user.email}) ===")
        print(f"Ищем по ФИО: {external_user.full_name}")
        print(f"Дата рождения: {external_user.birth_date}")
        
        for side_type, config in cls.SIDE_MODELS.items():
            try:
                print(f"\n--- {side_type} ---")
                SideModel = apps.get_model(config['app_label'], config['model'])
                CaseModel = apps.get_model(config['app_label'], config['case_model'])
                ContentTypeCase = ContentType.objects.get_for_model(CaseModel)
                
                sides_found = []
                
                # Для уголовных дел - используем умный поиск по всем моделям
                if side_type in ['criminal_defendant', 'criminal_side']:
                    # Получаем все записи этой модели
                    all_records = SideModel.objects.select_related(config['case_field']).all()
                    
                    for record in all_records:
                        record_name = config['get_side_name'](record)
                        
                        # Проверяем совпадение по имени
                        if cls._name_matches(external_user.full_name, record_name):
                            sides_found.append(record)
                            print(f"  Совпадение по имени: '{record_name}'")
                        # Проверяем совпадение по email (если есть)
                        elif config.get('has_email') and external_user.email:
                            record_email = record.criminal_side_case.email if record.criminal_side_case else None
                            if record_email and record_email.lower() == external_user.email.lower():
                                sides_found.append(record)
                                print(f"  Совпадение по email: {record_email}")
                        # Проверяем совпадение по дате рождения
                        elif external_user.birth_date and hasattr(record, 'birth_date') and record.birth_date == external_user.birth_date:
                            sides_found.append(record)
                            print(f"  Совпадение по дате рождения: {record.birth_date}")
                
                else:
                    # Для остальных типов дел - стандартный поиск через Q
                    conditions = Q()
                    
                    if external_user.full_name:
                        for search_field in config['search_fields']:
                            conditions |= Q(**{f"{search_field}__icontains": external_user.full_name})
                    
                    if external_user.email and config.get('has_email'):
                        email_field = config['email_field']
                        conditions |= Q(**{f"{email_field}__iexact": external_user.email})
                        print(f"  Поиск по email: {external_user.email} в поле {email_field}")
                    
                    if conditions:
                        sides_found = list(SideModel.objects.filter(conditions).select_related(config['case_field']))
                
                print(f"  Найдено сторон: {len(sides_found)}")
                
                for side in sides_found:
                    case = getattr(side, config['case_field'])
                    if not case:
                        print(f"  - Нет дела у стороны {side.id}")
                        continue
                    
                    case_number = getattr(case, config['case_number_field'], 'Неизвестно')
                    print(f"  - Найдено дело: {case_number} (ID: {case.id})")
                    
                    cases_found += 1
                    key = (ContentTypeCase.id, case.id)
                    new_grants.add(key)
                    
                    side_name = config['get_side_name'](side)
                    
                    # Используем get_or_create с обработкой конкурентных запросов
                    try:
                        grant, created = CaseAccessGrant.objects.get_or_create(
                            external_user=external_user,
                            content_type=ContentTypeCase,
                            object_id=case.id,
                            defaults={
                                'side_type': side_type,
                                'side_name': side_name,
                                'access_level': 'full',
                                'side_content_type': ContentType.objects.get_for_model(SideModel),
                                'side_object_id': side.id,
                                'is_active': True,
                            }
                        )
                        
                        if created:
                            cases_added += 1
                            print(f"    + Создан доступ к {case_number}")
                        elif not grant.is_active:
                            grant.is_active = True
                            grant.save()
                            print(f"    * Активирован доступ к {case_number}")
                        else:
                            print(f"    - Доступ уже существует")
                    except Exception as e:
                        print(f"    ! Ошибка при создании доступа: {e}")
                    
                    # Обновляем SideCaseLink
                    try:
                        SideCaseLink.objects.update_or_create(
                            side_type=side_type,
                            side_id=side.id,
                            defaults={
                                'case_content_type': ContentTypeCase,
                                'case_object_id': case.id,
                                'side_info': config['get_side_info'](side),
                            }
                        )
                    except Exception as e:
                        print(f"    ! Ошибка при обновлении SideCaseLink: {e}")
                    
            except Exception as e:
                print(f"  ! Ошибка при обработке {side_type}: {e}")
                logger.error(f"Error syncing {side_type}: {e}")
        
        # Деактивируем недоступные дела
        for ct_id, obj_id in (existing_grants - new_grants):
            CaseAccessGrant.objects.filter(
                external_user=external_user,
                content_type_id=ct_id,
                object_id=obj_id,
                is_active=True
            ).update(is_active=False)
            cases_removed += 1
        
        # Логируем
        try:
            SyncLog.objects.create(
                external_user=external_user,
                cases_found=cases_found,
                cases_added=cases_added,
                cases_removed=cases_removed,
                triggered_by=triggered_by,
                notes=f"Найдено: {cases_found}, добавлено: {cases_added}, удалено: {cases_removed}"
            )
        except Exception as e:
            print(f"Ошибка создания SyncLog: {e}")
        
        CaseAccessGrant.objects.filter(external_user=external_user).update(last_synced_at=timezone.now())
        
        print(f"\n=== ИТОГ: найдено={cases_found}, добавлено={cases_added} ===\n")
        
        return {
            'cases_found': cases_found,
            'cases_added': cases_added,
            'cases_removed': cases_removed,
        }


def handle_side_deletion(sender, instance, **kwargs):
    side_type = None
    from django.apps import apps
    for stype, config in CaseAccessSyncService.SIDE_MODELS.items():
        try:
            SideModel = apps.get_model(config['app_label'], config['model'])
            if isinstance(instance, SideModel):
                side_type = stype
                break
        except:
            pass
    
    if side_type:
        CaseAccessGrant.objects.filter(
            side_content_type=ContentType.objects.get_for_model(instance),
            side_object_id=instance.id
        ).delete()
        SideCaseLink.objects.filter(side_type=side_type, side_id=instance.id).delete()


class CaseCreationService:
    """
    Сервис для автоматического создания дел из исковых заявлений
    """
    
# side_case_access/services.py

class CaseCreationService:
    """
    Сервис для автоматического создания дел из исковых заявлений
    """
    
    @classmethod
    def create_civil_case_from_claim(cls, claim_data, external_user=None):
        """
        Создает гражданское дело из данных искового заявления (БЫСТРО)
        """
        from django.db import transaction
        from django.utils import timezone
        from civil_proceedings.models import (
            CivilProceedings, CivilProceedingsType,
            CivilSidesCaseInCase
        )
        from business_card.models import SidesCase, SidesCaseInCase
        from users.models import User
        
        with transaction.atomic():
            # 1. Получаем или создаем стороны (истец, ответчик)
            plaintiff_side = cls._get_or_create_side(
                name=claim_data['plaintiff_name'],
                address=claim_data['plaintiff_address'],
                phone=claim_data.get('plaintiff_phone', ''),
                email=claim_data.get('plaintiff_email', ''),
                birth_date=claim_data.get('plaintiff_birth_date'),
                passport_series=claim_data.get('plaintiff_passport_series', ''),
                passport_number=claim_data.get('plaintiff_passport_number', ''),
            )
            
            defendant_side = cls._get_or_create_side(
                name=claim_data['defendant_name'],
                address=claim_data['defendant_address'],
                phone=claim_data.get('defendant_phone', ''),
                email=claim_data.get('defendant_email', ''),
            )
            
            # 2. Получаем роли сторон
            plaintiff_role, _ = SidesCase.objects.get_or_create(
                sides_case='Истец',
                defaults={'sides_case': 'Истец'}
            )
            defendant_role, _ = SidesCase.objects.get_or_create(
                sides_case='Ответчик',
                defaults={'sides_case': 'Ответчик'}
            )
            
            # 3. Получаем председательствующего судью
            presiding_judge = User.objects.filter(role='judge', is_active=True).first()
            
            # 4. Генерируем номер дела (используем get_next_number)
            from case_registry.managers import case_registry
            next_number = case_registry.get_next_number('2')
            year = timezone.now().year
            case_number = f"2-{next_number}/{year}"
            
            print(f"Сгенерирован номер дела: {case_number}")
            
            # 5. Создаем гражданское производство
            civil_case = CivilProceedings.objects.create(
                case_number_civil=case_number,
                incoming_date=claim_data.get('submission_date', timezone.now().date()),
                incoming_from='Подано через портал',
                presiding_judge=presiding_judge,
                status='active',
                special_notes=cls._generate_claim_decision_text(claim_data),
                case_type=CivilProceedingsType.objects.filter(code='1').first(),
                category=claim_data.get('claim_subject', '')[:255],
            )
            
            print(f"Создано гражданское дело: ID={civil_case.id}, номер={civil_case.case_number_civil}")
            
            # 6. Связываем стороны с делом
            CivilSidesCaseInCase.objects.create(
                civil_proceedings=civil_case,
                sides_case_incase=plaintiff_side,
                sides_case_role=plaintiff_role
            )
            
            CivilSidesCaseInCase.objects.create(
                civil_proceedings=civil_case,
                sides_case_incase=defendant_side,
                sides_case_role=defendant_role
            )
            
            # 7. Добавляем третьих лиц
            for third_person_name in claim_data.get('third_persons', []):
                if third_person_name.strip():
                    third_side = cls._get_or_create_side(
                        name=third_person_name.strip(),
                        address='',
                    )
                    third_role, _ = SidesCase.objects.get_or_create(
                        sides_case='Третье лицо',
                        defaults={'sides_case': 'Третье лицо'}
                    )
                    CivilSidesCaseInCase.objects.create(
                        civil_proceedings=civil_case,
                        sides_case_incase=third_side,
                        sides_case_role=third_role
                    )
            
            # 8. Если есть внешний пользователь - связываем с делом
            if external_user:
                cls._grant_access_to_user(external_user, civil_case, plaintiff_side)
            
            # 9. Прикрепляем документы
            for doc_id in claim_data.get('uploaded_document_ids', []):
                try:
                    from case_documents.models import CaseDocument
                    from django.contrib.contenttypes.models import ContentType
                    doc = CaseDocument.objects.get(id=doc_id)
                    doc.content_type = ContentType.objects.get_for_model(civil_case)
                    doc.object_id = civil_case.id
                    doc.save()
                    print(f"Прикреплен документ {doc_id} к делу {civil_case.id}")
                except Exception as e:
                    print(f"Ошибка привязки документа {doc_id}: {e}")
            
            print(f"Дело {civil_case.case_number_civil} создано. Регистрация выполняется автоматически.")
            
            return civil_case
    
    @classmethod
    def _get_or_create_side(cls, name, address='', phone='', email='', 
                           birth_date=None, passport_series='', passport_number=''):
        """Получить или создать сторону"""
        side = SidesCaseInCase.objects.filter(
            name=name,
            address=address,
        ).first()
        
        if not side:
            side = SidesCaseInCase.objects.create(
                name=name,
                address=address,
                phone=phone,
                email=email,
                birth_date=birth_date,
                document_series=passport_series,
                document_number=passport_number,
            )
        
        return side
    
    @classmethod
    def _generate_claim_decision_text(cls, claim_data):
        """Генерирует текст решения из данных иска"""
        text = f"""
ИСКОВОЕ ЗАЯВЛЕНИЕ

Истец: {claim_data['plaintiff_name']}
Адрес: {claim_data['plaintiff_address']}

Ответчик: {claim_data['defendant_name']}
Адрес: {claim_data['defendant_address']}

Предмет иска: {claim_data['claim_subject']}
Цена иска: {claim_data.get('claim_amount', 0)} руб.

Требования истца:
{claim_data['claim_requirements']}

"""
        return text.strip()
    
    @classmethod
    def _grant_access_to_user(cls, external_user, civil_case, plaintiff_side):
        """Предоставляет доступ внешнему пользователю к делу"""
        from .models import CaseAccessGrant
        from django.contrib.contenttypes.models import ContentType
        
        content_type = ContentType.objects.get_for_model(civil_case)
        
        grant, created = CaseAccessGrant.objects.get_or_create(
            external_user=external_user,
            content_type=content_type,
            object_id=civil_case.id,
            defaults={
                'side_type': 'civil_plaintiff',
                'side_name': plaintiff_side.name,
                'access_level': 'full',
                'side_content_type': ContentType.objects.get_for_model(type(plaintiff_side)),
                'side_object_id': plaintiff_side.id,
                'is_active': True,
            }
        )
        return grant
    
    @classmethod
    def _generate_case_number(cls):
        """Генерирует номер гражданского дела"""
        year = timezone.now().year
        from case_registry.models import RegistryIndex, RegistryCounter
        
        index, _ = RegistryIndex.objects.get_or_create(
            index='2',
            defaults={'name': 'Гражданские дела'}
        )
        
        counter, _ = RegistryCounter.objects.get_or_create(
            index=index,
            defaults={'current_number': 0, 'total_registered': 0}
        )
        
        counter.current_number += 1
        counter.total_registered += 1
        counter.save()

        return f"2-{counter.current_number}/{year}"
