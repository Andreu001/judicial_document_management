# Generated by Django 4.2.7 on 2024-02-21 16:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('business_card', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='businesscard',
            name='preliminary_hearing',
            field=models.DateField(blank=True, null=True, verbose_name='Дата предварительного слушания/(с/з)'),
        ),
    ]
