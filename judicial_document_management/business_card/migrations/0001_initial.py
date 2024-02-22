# Generated by Django 4.2.7 on 2024-02-21 16:50

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BusinessCard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('original_name', models.CharField(max_length=100, unique=True, verbose_name='номер дела')),
                ('article', models.PositiveSmallIntegerField(verbose_name='Статья УК РФ')),
                ('pub_date', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания/изменения карточки')),
                ('preliminary_hearing', models.DateField(verbose_name='Дата предварительного слушания/(с/з)')),
                ('name_case', models.CharField(max_length=200, verbose_name='Решение по поступившему делу')),
                ('author', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cards', to=settings.AUTH_USER_MODEL, verbose_name='Автор карточки')),
            ],
            options={
                'verbose_name': 'Карточка на дело',
                'verbose_name_plural': 'карточка на дело',
                'ordering': ('pub_date',),
            },
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title_category', models.CharField(max_length=200, verbose_name='Название категории')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Описание')),
                ('slug', models.SlugField(max_length=255, unique=True)),
            ],
            options={
                'verbose_name': 'Категория дела',
                'verbose_name_plural': 'Категория дела',
                'ordering': ('title_category',),
            },
        ),
        migrations.CreateModel(
            name='Decisions',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name_case', models.CharField(max_length=200, verbose_name='Решение по поступившему делу')),
                ('date_consideration', models.DateField(null=True, verbose_name='Дата вынесения')),
                ('notation', models.TextField(max_length=300, verbose_name='примечания')),
            ],
            options={
                'verbose_name': 'Вынесенное решение',
                'verbose_name_plural': 'Вынесенные решения',
                'ordering': ('date_consideration',),
            },
        ),
        migrations.CreateModel(
            name='Petitions',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('petitions', models.CharField(max_length=150, verbose_name='наименование ходатайства')),
            ],
            options={
                'verbose_name': 'Ходатайство',
                'verbose_name_plural': 'Ходатайства',
                'ordering': ('petitions',),
            },
        ),
        migrations.CreateModel(
            name='SidesCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sides_case', models.CharField(max_length=100, verbose_name='Сторона по делу')),
            ],
            options={
                'verbose_name': 'Сторона по делу',
                'verbose_name_plural': 'Стороны по делу',
                'ordering': ('sides_case',),
            },
        ),
        migrations.CreateModel(
            name='SidesCaseInCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, verbose_name='ФИО')),
                ('under_arrest', models.BooleanField(blank=True, null=True, verbose_name='под стражей')),
                ('date_sending_agenda', models.DateField(blank=True, null=True, verbose_name='Дата направления повестки')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, related_name='sidescaseincase', to='business_card.businesscard', verbose_name='Карточка на дело')),
                ('sides_case', models.ManyToManyField(to='business_card.sidescase', verbose_name='Стороны по делу')),
            ],
            options={
                'verbose_name': 'Новое лицо',
                'verbose_name_plural': 'Новое лицо',
            },
        ),
        migrations.CreateModel(
            name='PetitionsInCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_application', models.DateField(verbose_name='Дата ходатайства')),
                ('decision_rendered', models.CharField(max_length=150, null=True, verbose_name='наименование вынесенного решения')),
                ('date_decision', models.DateField(null=True, verbose_name='Дата решения по ходатайству')),
                ('notation', models.TextField(max_length=300, null=True, verbose_name='примечания')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='petitionsincase', to='business_card.businesscard', verbose_name='Карточка на дело')),
                ('notification_parties', models.ManyToManyField(to='business_card.sidescaseincase', verbose_name='Кто заявил ходатайство')),
                ('petitions', models.ManyToManyField(to='business_card.petitions', verbose_name='ходатайства по делу')),
                ('sides_case', models.ManyToManyField(to='business_card.sidescase', verbose_name='Сторона по делу')),
            ],
            options={
                'verbose_name': 'Ходатайство',
                'verbose_name_plural': 'Ходатайства',
                'ordering': ('date_application',),
            },
        ),
        migrations.CreateModel(
            name='FamiliarizationCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('petition', models.BooleanField(verbose_name='заявлено ходатайство об ознакомлении')),
                ('start_date', models.DateField(verbose_name='дата начала')),
                ('end_date', models.DateField(blank=True, null=True, verbose_name='дата окончания')),
                ('number_days', models.IntegerField(blank=True, null=True, verbose_name='количество дней')),
                ('amount_one_day', models.IntegerField(blank=True, null=True, verbose_name='сумма за один день ознакомления')),
                ('total_amount', models.IntegerField(blank=True, null=True, verbose_name='общая сумма вознаграждения по постановлению')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='familiarizationcase', to='business_card.businesscard', verbose_name='Карточка на дело')),
                ('notification_parties', models.ManyToManyField(to='business_card.sidescaseincase', verbose_name='Кто заявил ходатайство')),
            ],
            options={
                'verbose_name': 'Ознакомление с материаламми дела',
                'ordering': ('-start_date',),
            },
        ),
        migrations.CreateModel(
            name='ExecutionCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_notification', models.DateField(verbose_name='Дата уведомления')),
                ('executive_lists', models.DateField(blank=True, null=True, verbose_name='Дата исполнения дела')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='executioncase', to='business_card.businesscard', verbose_name='Карточка на дело')),
                ('notification_parties', models.ManyToManyField(to='business_card.sidescaseincase', verbose_name='Уведомление сторон об исполнении')),
            ],
            options={
                'verbose_name': 'Дело рассмотрено',
            },
        ),
        migrations.CreateModel(
            name='ConsideredCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name_case', models.CharField(max_length=200, verbose_name='Решение по делу')),
                ('date_consideration', models.DateField(verbose_name='Дата рассмотрения')),
                ('effective_date', models.DateField(blank=True, null=True, verbose_name='дата вступления в законную силу')),
                ('executive_lists', models.DateField(blank=True, null=True, verbose_name='Дата исполнения дела')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consideredcase', to='business_card.businesscard', verbose_name='Карточка на дело')),
                ('notification_parties', models.ManyToManyField(to='business_card.sidescaseincase', verbose_name='Уведомление сторон')),
            ],
            options={
                'verbose_name': 'Дело рассмотренно',
            },
        ),
        migrations.CreateModel(
            name='BusinessMovement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_meeting', models.DateField(verbose_name='Дата заседания')),
                ('meeting_time', models.TimeField(verbose_name='Время заседания')),
                ('decision_case', models.CharField(blank=True, max_length=50, null=True, verbose_name='Решение по поступившему делу')),
                ('composition_colleges', models.CharField(blank=True, max_length=50, null=True, verbose_name='Состав коллегии')),
                ('result_court_session', models.CharField(blank=True, max_length=200, null=True, verbose_name='Результат судебного заседания')),
                ('reason_deposition', models.CharField(blank=True, max_length=200, null=True, verbose_name='причина отложения')),
                ('notation', models.TextField(blank=True, max_length=300, null=True, verbose_name='примечания')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='businessmovement', to='business_card.businesscard', verbose_name='Карточка на дело')),
            ],
            options={
                'verbose_name': 'Новое дело',
                'verbose_name_plural': 'Новое дело',
                'ordering': ('date_meeting',),
            },
        ),
        migrations.AddField(
            model_name='businesscard',
            name='case_category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cards', to='business_card.category', verbose_name='Категория дела'),
        ),
        migrations.CreateModel(
            name='Appeal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_appeal', models.DateField(verbose_name='дата апелляции')),
                ('decision_appeal', models.CharField(blank=True, max_length=20, null=True, verbose_name='в апелляции отказано/удовлетворенно')),
                ('meeting_requirements', models.CharField(blank=True, max_length=50, null=True, verbose_name='выполнение требований УПК, перед направлением дела')),
                ('business_card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appeal', to='business_card.businesscard', verbose_name='Карточка на дело')),
                ('notification_parties', models.ManyToManyField(to='business_card.sidescaseincase', verbose_name='Уведомление сторон об апелляции')),
            ],
            options={
                'verbose_name': 'Апелляция',
                'verbose_name_plural': 'Апелляции',
            },
        ),
    ]
