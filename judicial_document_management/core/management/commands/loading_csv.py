import csv

from django.conf import settings
from django.core.management import BaseCommand

from business_card.models import Category, Decisions, Petitions, SidesCase, Appeal


TABLES = {
    Category: 'category.csv',
    Decisions: 'decisions.csv',
    Petitions: 'petitions.csv',
    SidesCase: 'sidescase.csv',
    Appeal: 'appeal.csv',
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
                reader = csv.DictReader(csv_file)
                model.objects.bulk_create(
                    model(**data) for data in reader)
        self.stdout.write(self.style.SUCCESS('Все данные загружены'))
