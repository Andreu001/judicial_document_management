# load_csv.py - исправленная версия с добавлением CaseTransferType
import csv
import os
from django.conf import settings
from django.core.management import BaseCommand

# Импортируйте ваши модели (существующие)
from business_card.models import Category, Decisions, Petitions, SidesCase, Appeal
from case_registry.models import RegistryIndex
from personnel.models import AbsenceType, AbsenceRecord
from administrative_code.models import (
    CaseOrderAdmin, AdministrativeCategory, ExecutionStageAdmin,
    PostponementReasonAdmin, SuspensionReasonAdmin, ReferringAuthorityAdmin
)
from civil_proceedings.models import CivilProceedingsType, ReferringAuthorityCivil
from criminal_proceedings.models import (
    CriminalAppeal, CriminalExpertiseType, ReferringAuthority
)
from administrative_proceedings.models import (
    AdmissionOrder, PostponementReason, SuspensionReason,
    PreliminaryProtection, ExpertiseType, AppealResult,
    CassationResult, TermCompliance, Outcome, ReferringAuthorityKas,
    KasProceedings
)
from other_materials.models import OtherMaterialType
from notifications.models import LegalReference
from legal_documents.models import LegalDocument
from users.models import User
from statistics_app.models import SavedQuery, StatisticsCache
from side_case_access.models import ExternalUser, CaseAccessGrant, SyncLog
from court_registry.models import (
    Region, CourtLevel, CourtDirectory, CourtDepartment,
    CaseTransferType, CaseTransferStatus
)


class Command(BaseCommand):
    help = 'Загрузка данных из CSV файлов в существующие модели'

    def add_arguments(self, parser):
        parser.add_argument(
            '--model',
            type=str,
            help='Загрузить только указанную модель (название класса)'
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Загрузить только указанный CSV файл'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить таблицу перед загрузкой'
        )

    def handle(self, *args, **options):
        csv_base_path = f'{settings.BASE_DIR}/static/data/'
        
        if not os.path.exists(csv_base_path):
            self.stdout.write(self.style.ERROR(f'Директория {csv_base_path} не найдена'))
            return
        
        # Словарь: модель -> имя CSV файла
        models_mapping = {
            # business_card
            Category: 'category.csv',
            Decisions: 'decisions.csv',
            Petitions: 'petitions.csv',
            SidesCase: 'sidescase.csv',
            Appeal: 'appeal.csv',
            
            # case_registry
            RegistryIndex: 'case_registry.csv',
            
            # judge_absence
            AbsenceType: 'absence_records.csv',
            
            # administrative_code (КоАП)
            CaseOrderAdmin: 'administrative_case_order.csv',
            AdministrativeCategory: 'administrative_category.csv',
            ExecutionStageAdmin: 'administrative_execution_stage.csv',
            PostponementReasonAdmin: 'kas_postponement_reason.csv',
            SuspensionReasonAdmin: 'suspension_reason.csv',
            ReferringAuthorityAdmin: 'referring_authority_admin.csv',
            
            # civil_proceedings
            CivilProceedingsType: 'civil_proceeding_types.csv',
            ReferringAuthorityCivil: 'referring_authority_civil.csv',
            
            # criminal_proceedings
            CriminalAppeal: 'criminal_appeal_instance_outcomes.csv',
            CriminalExpertiseType: 'criminal_expertise_types.csv',
            ReferringAuthority: 'referring_authority_criminal.csv',
            
            # kas_proceedings
            AdmissionOrder: 'kas_admission_order.csv',
            PostponementReason: 'kas_postponement_reason.csv',
            SuspensionReason: 'suspension_reason.csv',
            PreliminaryProtection: 'preliminary_protection.csv',
            ExpertiseType: 'expertise_types.csv',
            AppealResult: 'kas_appeal_result.csv',
            CassationResult: 'kas_cassation_result.csv',
            TermCompliance: 'term_compliance.csv',
            Outcome: 'kas_outcome.csv',
            ReferringAuthorityKas: 'referring_authority_kas.csv',
            
            # other_materials
            OtherMaterialType: 'other_material_types.csv',
            
            # notifications
            LegalReference: 'legal_references.csv',
            
            # documents
            LegalDocument: 'legal_documents.csv',
            
            # users
            User: 'users.csv',
            
            # statistics
            SavedQuery: 'saved_queries.csv',
            StatisticsCache: 'statistics_cache.csv',
            
            # external_auth
            ExternalUser: 'external_users.csv',
            CaseAccessGrant: 'case_access_grants.csv',
            SyncLog: 'sync_logs.csv',
            
            # court_registry
            Region: 'regions.csv',
            CourtLevel: 'court_levels.csv',
            CourtDirectory: 'courts_initial.csv',
            CourtDepartment: 'court_departments.csv',
            CaseTransferType: 'case_transfer_types.csv',
            CaseTransferStatus: 'case_transfer_statuses.csv',
        }
        
        # Загружаем
        for model, csv_file in models_mapping.items():
            if options['model'] and options['model'] != model.__name__:
                continue
            if options['file'] and options['file'] != csv_file:
                continue
            
            file_path = os.path.join(csv_base_path, csv_file)
            if os.path.exists(file_path):
                self.load_csv_data(model, file_path, options['clear'])
            else:
                self.stdout.write(self.style.WARNING(f'Файл {csv_file} не найден'))
        
        self.stdout.write(self.style.SUCCESS('Загрузка данных завершена'))

    def load_csv_data(self, model, file_path, clear=False):
        """Загрузка данных для конкретной модели"""
        try:
            if clear:
                model.objects.all().delete()
                self.stdout.write(f'Очищена таблица {model.__name__}')

            with open(file_path, 'r', encoding='utf-8') as csv_file:
                reader = csv.DictReader(csv_file)
                headers = reader.fieldnames
                
                if not headers:
                    self.stdout.write(self.style.WARNING(f'Файл {file_path} не имеет заголовков'))
                    return
                
                objects_to_create = []
                errors = []
                model_fields = [f.name for f in model._meta.get_fields() if f.name != 'id']
                
                # Получаем список ForeignKey полей
                foreign_key_fields = {}
                for field in model._meta.get_fields():
                    if field.many_to_many:
                        continue
                    if field.one_to_many:
                        continue
                    if field.is_relation and hasattr(field, 'remote_field'):
                        # Это ForeignKey
                        foreign_key_fields[field.name] = field.remote_field.model
                
                for row_num, row in enumerate(reader, start=2):
                    # Очищаем данные
                    cleaned_data = {}
                    
                    # Для модели CourtDirectory обрабатываем ForeignKey особо
                    if model == CourtDirectory:
                        region_code = row.get('region_code', '').strip()
                        level_code = row.get('level_code', '').strip()
                        
                        # Получаем объекты Region и CourtLevel
                        region = None
                        level = None
                        
                        if region_code:
                            try:
                                region = Region.objects.get(code=region_code)
                            except Region.DoesNotExist:
                                errors.append(f'Строка {row_num}: регион с кодом "{region_code}" не найден')
                                continue
                        
                        if level_code:
                            try:
                                level = CourtLevel.objects.get(code=level_code)
                            except CourtLevel.DoesNotExist:
                                errors.append(f'Строка {row_num}: уровень суда с кодом "{level_code}" не найден')
                                continue
                        
                        # Собираем данные для CourtDirectory
                        cleaned_data = {
                            'code': row.get('code', '').strip(),
                            'name': row.get('name', '').strip(),
                            'region': region,
                            'level': level,
                            'is_active': True,
                            'data_source': 'csv',
                        }
                        
                        # Проверяем обязательные поля
                        if not cleaned_data['code']:
                            errors.append(f'Строка {row_num}: отсутствует код суда')
                            continue
                        if not cleaned_data['name']:
                            errors.append(f'Строка {row_num}: отсутствует наименование суда')
                            continue
                        if not region:
                            errors.append(f'Строка {row_num}: отсутствует регион')
                            continue
                        if not level:
                            errors.append(f'Строка {row_num}: отсутствует уровень суда')
                            continue
                        
                        try:
                            obj = CourtDirectory(**cleaned_data)
                            objects_to_create.append(obj)
                        except Exception as e:
                            errors.append(f'Строка {row_num}: {e}')
                        
                        continue
                    
                    # Для модели CaseTransferType - простая загрузка (нет ForeignKey)
                    if model == CaseTransferType:
                        code = row.get('code', '').strip()
                        name = row.get('name', '').strip()
                        description = row.get('description', '').strip() or None
                        
                        if not code:
                            errors.append(f'Строка {row_num}: отсутствует код типа передачи')
                            continue
                        if not name:
                            errors.append(f'Строка {row_num}: отсутствует название типа передачи')
                            continue
                        
                        try:
                            # Используем update_or_create для обновления существующих
                            obj, created = CaseTransferType.objects.update_or_create(
                                code=code,
                                defaults={'name': name, 'description': description}
                            )
                            objects_to_create.append(obj)
                        except Exception as e:
                            errors.append(f'Строка {row_num}: {e}')
                        
                        continue
                    
                    # Для остальных моделей - стандартная обработка
                    for key, value in row.items():
                        # Пропускаем поля, которых нет в модели
                        if key not in model_fields and key != 'id':
                            continue
                        
                        # Пропускаем поля, которые мы обработаем отдельно (Foreign Keys)
                        if key in foreign_key_fields:
                            continue
                        
                        # Обрабатываем пустые значения
                        if value == '' or value is None:
                            cleaned_data[key] = None
                        elif value and value.strip():
                            value = value.strip()
                            # Преобразуем булевы значения
                            if value.lower() == 'true':
                                cleaned_data[key] = True
                            elif value.lower() == 'false':
                                cleaned_data[key] = False
                            # Преобразуем числовые значения
                            elif key in ['order', 'pages_count', 'block_before_days', 'block_after_days', 'hierarchy_level']:
                                try:
                                    cleaned_data[key] = int(value)
                                except ValueError:
                                    cleaned_data[key] = value
                            else:
                                cleaned_data[key] = value
                        else:
                            cleaned_data[key] = None
                    
                    # Обрабатываем ForeignKey поля
                    for fk_field, fk_model in foreign_key_fields.items():
                        if fk_field in row and row[fk_field] and row[fk_field].strip():
                            try:
                                # Пытаемся найти объект по полю 'code' или 'id'
                                fk_value = row[fk_field].strip()
                                if hasattr(fk_model, 'objects'):
                                    # Сначала пробуем по code
                                    if hasattr(fk_model, 'code'):
                                        fk_obj = fk_model.objects.get(code=fk_value)
                                    elif fk_value.isdigit():
                                        fk_obj = fk_model.objects.get(id=int(fk_value))
                                    else:
                                        # Пробуем по name
                                        fk_obj = fk_model.objects.get(name=fk_value)
                                    cleaned_data[fk_field] = fk_obj
                            except Exception as e:
                                errors.append(f'Строка {row_num}: ошибка загрузки ForeignKey {fk_field}: {e}')
                    
                    try:
                        obj = model(**cleaned_data)
                        objects_to_create.append(obj)
                    except Exception as e:
                        errors.append(f'Строка {row_num}: {e}')
                
                if objects_to_create:
                    # Для разных моделей используем разные стратегии
                    if model == CaseTransferType:
                        # Для CaseTransferType уже использовали update_or_create
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ {model.__name__}: загружено/обновлено {len(objects_to_create)} записей'
                            )
                        )
                    else:
                        # Для остальных используем bulk_create
                        model.objects.bulk_create(objects_to_create, ignore_conflicts=True)
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ {model.__name__}: загружено {len(objects_to_create)} записей'
                            )
                        )
                
                if errors:
                    self.stdout.write(
                        self.style.WARNING(f'! {model.__name__}: {len(errors)} ошибок')
                    )
                    for err in errors[:10]:  # Показываем первые 10 ошибок
                        self.stdout.write(f'  - {err}')
                    if len(errors) > 10:
                        self.stdout.write(f'  ... и еще {len(errors) - 10} ошибок')
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка загрузки {model.__name__}: {e}'))