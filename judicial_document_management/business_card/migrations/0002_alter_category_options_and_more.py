# Generated by Django 4.2.7 on 2023-12-07 11:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('business_card', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='category',
            options={'ordering': ('title_category',), 'verbose_name': 'Категория дела', 'verbose_name_plural': 'Категория дела'},
        ),
        migrations.RenameField(
            model_name='category',
            old_name='title',
            new_name='title_category',
        ),
    ]
