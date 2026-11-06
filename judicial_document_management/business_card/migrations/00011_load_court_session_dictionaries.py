import csv
import os
from django.db import migrations
from django.conf import settings


def load_csv(apps, schema_editor, model_name, csv_name):
    Model = apps.get_model('business_card', model_name)
    path = os.path.join(
        settings.BASE_DIR,
        'business_card', 'data', csv_name
    )
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            Model.objects.update_or_create(
                name=row['name'].strip(),
                defaults={'order': int(row.get('order', 0) or 0)}
            )


def load_data(apps, schema_editor):
    load_csv(apps, schema_editor, 'CourtSessionResult', 'court_session_results.csv')
    load_csv(apps, schema_editor, 'ReasonDeposition', 'reason_depositions.csv')


def reverse(apps, schema_editor):
    apps.get_model('business_card', 'CourtSessionResult').objects.all().delete()
    apps.get_model('business_card', 'ReasonDeposition').objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('business_card', '00010_add_court_session_result_and_reason_deposition'),
    ]
    operations = [
        migrations.RunPython(load_data, reverse),
    ]
