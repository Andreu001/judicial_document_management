import csv
import os
from django.conf import settings
from django.core.management import BaseCommand
from django.db import models

# Импортируйте ваши модели
from business_card.models import Category, Decisions, Petitions, SidesCase, Appeal
from case_registry.models import RegistryIndex
# Добавьте импорты для других моделей, если они нужны

# Словарь: модель -> имя CSV файла
TABLES = {
    Category: 'category.csv',
    Decisions: 'decisions.csv',
    Petitions: 'petitions.csv',
    SidesCase: 'sidescase.csv',
    Appeal: 'appeal.csv',
    RegistryIndex: 'case_registry.csv',
}

# Дополнительные CSV файлы
ADDITIONAL_CSV_FILES = [
    'absence_records.csv',
    'administrative_appeal_result.csv',
    'administrative_case_order.csv',
    'administrative_category.csv',
    'administrative_execution_stage.csv',
    'administrative_supervisory_outcome.csv',
    'appeal_old.csv',
    'cassation_outcome.csv',
    'civil_proceeding_types.csv',
    'criminal_appeal_applicant_statuses.csv',
    'criminal_appeal_instance_outcomes.csv',
    'criminal_case_order.csv',
    'criminal_cassation_outcomes.csv',
    'criminal_civil_claim_results.csv',
    'criminal_copied_actions.csv',
    'criminal_copy_recipients.csv',
    'criminal_expertise_types.csv',
    'criminal_judge_decisions.csv',
    'criminal_postponement_reasons.csv',
    'criminal_preliminary_hearing_grounds.csv',
    'criminal_supervisory_outcomes.csv',
    'criminal_suspension_reasons.csv',
    'expertise_types.csv',
    'kas_admission_order.csv',
    'kas_appeal_result.csv',
    'kas_cassation_result.csv',
    'kas_outcome.csv',
    'kas_postponement_reason.csv',
    'other_material_types.csv',
    'preliminary_protection.csv',
    'punishment_types.csv',
    'suspension_reason.csv',
    'term_compliance.csv',
]


class Command(BaseCommand):
    help = 'Загрузка данных из CSV файлов'

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
        # Базовый путь к CSV файлам
        csv_base_path = f'{settings.BASE_DIR}/static/data/'
        
        # Проверяем, существует ли директория
        if not os.path.exists(csv_base_path):
            self.stdout.write(
                self.style.ERROR(f'Директория {csv_base_path} не найдена')
            )
            return
        
        # Загружаем данные для основных моделей
        for model, csv_file in TABLES.items():
            if options['model'] and options['model'] != model.__name__:
                continue
            if options['file'] and options['file'] != csv_file:
                continue
            
            file_path = os.path.join(csv_base_path, csv_file)
            if os.path.exists(file_path):
                self.load_csv_data(model, file_path, options['clear'])
            else:
                self.stdout.write(
                    self.style.WARNING(f'Файл {csv_file} не найден')
                )
        
        # Загружаем дополнительные CSV файлы
        # Для них нужно будет создать модели или использовать существующие
        for csv_file in ADDITIONAL_CSV_FILES:
            if options['file'] and options['file'] != csv_file:
                continue
            
            file_path = os.path.join(csv_base_path, csv_file)
            if os.path.exists(file_path):
                self.load_generic_csv(file_path, options['clear'])
            else:
                self.stdout.write(
                    self.style.WARNING(f'Файл {csv_file} не найден')
                )
        
        self.stdout.write(self.style.SUCCESS('Загрузка данных завершена'))

    def load_csv_data(self, model, file_path, clear=False):
        """Загрузка данных для конкретной модели"""
        try:
            # Очищаем таблицу если нужно
            if clear:
                model.objects.all().delete()
                self.stdout.write(f'Очищена таблица {model.__name__}')

            with open(file_path, 'r', encoding='utf-8') as csv_file:
                reader = csv.reader(csv_file)
                headers = next(reader)
                
                # Очищаем заголовки
                headers = [str(header).strip() for header in headers]
                
                objects_to_create = []
                errors = []
                
                for row_num, row in enumerate(reader, start=2):
                    # Очищаем значения в строке
                    cleaned_row = [
                        str(item).strip() if item and item != '' else None 
                        for item in row
                    ]
                    
                    # Создаем словарь из заголовков и значений
                    data = dict(zip(headers, cleaned_row))
                    
                    # Преобразуем строки 'True'/'False' в булевы значения
                    for key, value in data.items():
                        if isinstance(value, str):
                            if value.lower() == 'true':
                                data[key] = True
                            elif value.lower() == 'false':
                                data[key] = False
                    
                    try:
                        obj = model(**data)
                        objects_to_create.append(obj)
                    except Exception as e:
                        errors.append(f'Строка {row_num}: {e}')
                
                # Сохраняем объекты в базу данных
                if objects_to_create:
                    model.objects.bulk_create(objects_to_create, ignore_conflicts=True)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {model.__name__}: загружено {len(objects_to_create)} записей'
                        )
                    )
                
                if errors:
                    self.stdout.write(
                        self.style.WARNING(
                            f'! {model.__name__}: {len(errors)} ошибок'
                        )
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка загрузки {model.__name__}: {e}')
            )

    def load_generic_csv(self, file_path, clear=False):
        """Универсальная загрузка CSV в динамическую модель"""
        try:
            # Получаем имя файла без расширения
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            
            with open(file_path, 'r', encoding='utf-8') as csv_file:
                reader = csv.DictReader(csv_file)
                headers = reader.fieldnames
                
                if not headers:
                    self.stdout.write(
                        self.style.WARNING(f'Файл {base_name} не имеет заголовков')
                    )
                    return
                
                # Определяем имя модели по имени файла
                model_name = ''.join(
                    word.capitalize() 
                    for word in base_name.replace('_', ' ').split()
                )
                
                # Проверяем, существует ли уже модель
                from django.apps import apps
                try:
                    model = apps.get_model('your_app_name', model_name)
                except LookupError:
                    # Если модель не найдена, создаем временную или пропускаем
                    self.stdout.write(
                        self.style.WARNING(
                            f'Модель {model_name} не найдена. Создайте её для файла {base_name}.csv'
                        )
                    )
                    self.display_csv_preview(file_path, headers)
                    return
                
                # Очищаем если нужно
                if clear:
                    model.objects.all().delete()
                
                objects_to_create = []
                
                for row in reader:
                    # Очищаем данные
                    cleaned_row = {}
                    for key, value in row.items():
                        if value == '':
                            cleaned_row[key] = None
                        elif value and value.strip():
                            if value.lower() == 'true':
                                cleaned_row[key] = True
                            elif value.lower() == 'false':
                                cleaned_row[key] = False
                            else:
                                cleaned_row[key] = value.strip()
                        else:
                            cleaned_row[key] = None
                    
                    try:
                        obj = model(**cleaned_row)
                        objects_to_create.append(obj)
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Ошибка создания объекта: {e}')
                        )
                
                if objects_to_create:
                    model.objects.bulk_create(objects_to_create, ignore_conflicts=True)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {model_name}: загружено {len(objects_to_create)} записей'
                        )
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка загрузки {file_path}: {e}')
            )

    def display_csv_preview(self, file_path, headers):
        """Показывает структуру CSV для создания модели"""
        self.stdout.write(f'\nСтруктура CSV файла {os.path.basename(file_path)}:')
        self.stdout.write(f'Заголовки: {", ".join(headers)}')
        self.stdout.write('\nПример модели Django:')
        
        model_name = ''.join(
            word.capitalize() 
            for word in os.path.splitext(os.path.basename(file_path))[0].replace('_', ' ').split()
        )
        
        self.stdout.write(f'\nclass {model_name}(models.Model):')
        for header in headers:
            field_type = 'CharField(max_length=255)'
            if header == 'id':
                field_type = 'AutoField(primary_key=True)'
            elif header == 'is_active':
                field_type = 'BooleanField(default=True)'
            elif 'code' in header:
                field_type = 'CharField(max_length=50)'
            
            self.stdout.write(f'    {header} = models.{field_type}')
        
        self.stdout.write(f'\n    class Meta:')
        self.stdout.write(f"        db_table = '{os.path.splitext(os.path.basename(file_path))[0]}'")
        self.stdout.write('')