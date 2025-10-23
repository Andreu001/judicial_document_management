import csv

from django.conf import settings
from django.core.management import BaseCommand

from business_card.models import Category, Decisions, Petitions, SidesCase, Appeal
from case_registry.models import RegistryIndex


TABLES = {
    Category: 'category.csv',
    Decisions: 'decisions.csv',
    Petitions: 'petitions.csv',
    SidesCase: 'sidescase.csv',
    Appeal: 'appeal.csv',
    RegistryIndex: 'case_registry.csv',
}


class Command(BaseCommand):
    help = 'Загрузка данных'

    def handle(self, *args, **kwargs):
        for model, csv_f in TABLES.items():
            with open(
                f'{settings.BASE_DIR}/static/data/{csv_f}',
                'r',
                encoding='utf-8'
            ) as csv_file:
                reader = csv.reader(csv_file)
                headers = next(reader)  # Получаем заголовки
                
                # Очищаем заголовки
                headers = [str(header).strip() for header in headers]
                
                objects_to_create = []
                for row in reader:
                    # Очищаем значения в строке
                    cleaned_row = [str(item).strip() if item else item for item in row]
                    
                    # Создаем словарь из заголовков и значений
                    data = dict(zip(headers, cleaned_row))
                    
                    try:
                        obj = model(**data)
                        objects_to_create.append(obj)
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f'Ошибка создания объекта {model.__name__}: {e}'
                            )
                        )
                        self.stdout.write(f"Данные: {data}")
                        continue
                
                # Сохраняем объекты в базу данных
                if objects_to_create:
                    try:
                        model.objects.bulk_create(objects_to_create)
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Успешно загружено {len(objects_to_create)} записей для {model.__name__}'
                            )
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f'Ошибка сохранения {model.__name__}: {e}'
                            )
                        )
        
        self.stdout.write(self.style.SUCCESS('Загрузка данных завершена'))