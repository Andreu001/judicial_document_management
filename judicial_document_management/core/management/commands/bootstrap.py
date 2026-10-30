# myapp/management/commands/bootstrap.py
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction


# Реестр шагов: (имя_шага, функция_или_кортеж(call_command, args, kwargs))
# Позволяет легко добавлять новые шаги — просто допишите в список.
STEPS = [
    ("Миграции",                  ("migrate", [], {})),
    ("Создание суперпользователя", None),  # спец-обработка ниже
    ("Уведомления",               ("loaddata", ["initial_notification_data.json"], {})),
    ("Типы действий",             ("loaddata", ["initial_action_types.json"], {})),
    ("Шаблоны",                   ("loaddata", ["initial_templates.json"], {})),
    ("CSV данные",                ("load_csv", [], {})),
    ("Импорт кодов",              ("import_all_codes", [], {})),
]


class Command(BaseCommand):
    help = "Первичная инициализация проекта одной командой"

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-superuser",
            action="store_true",
            help="Не создавать суперпользователя (если уже есть)",
        )

    def handle(self, *args, **options):
        for name, step in STEPS:
            self.stdout.write(self.style.MIGRATE_HEADING(f"→ {name}"))

            if step is None:  # суперпользователь
                if options["skip_superuser"]:
                    self.stdout.write("  пропущено (--skip-superuser)")
                else:
                    self._create_superuser()
                continue

            cmd, args_, kwargs_ = step
            try:
                call_command(cmd, *args_, **kwargs_)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"  Ошибка в шаге '{name}': {e}"))
                raise

        self.stdout.write(self.style.SUCCESS("✔ Инициализация завершена"))

    def _create_superuser(self):
        User = get_user_model()
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("  суперпользователь уже существует — пропуск")
            return
        # интерактивный ввод, как у штатного createsuperuser
        call_command("createsuperuser")