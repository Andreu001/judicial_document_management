# management/commands/setup_network.py
from django.core.management.base import BaseCommand
from court_registry.models import CourtDirectory, Court
from court_registry.intercourt_service import InterCourtAPIClient

class Command(BaseCommand):
    help = 'Настройка сетевого взаимодействия судов'

    def add_arguments(self, parser):
        parser.add_argument('--generate-keys', action='store_true', help='Сгенерировать API ключи для всех судов')
        parser.add_argument('--ping-all', action='store_true', help='Проверить доступность всех судов')

    def handle(self, *args, **options):
        current_court = Court.objects.first()
        if not current_court:
            self.stdout.write(self.style.ERROR('Текущий суд не зарегистрирован'))
            return

        self.stdout.write(f"Текущий суд: {current_court.code} - {current_court.name}")
        
        if options['generate_keys']:
            self.generate_keys()
        
        if options['ping_all']:
            self.ping_all()

    def generate_keys(self):
        import secrets
        courts = CourtDirectory.objects.filter(is_active=True)
        for court in courts:
            if not court.api_key:
                court.api_key = secrets.token_urlsafe(32)
                court.api_key_public = secrets.token_urlsafe(16)
                court.save()
                self.stdout.write(f"  {court.code}: ключ сгенерирован")
        self.stdout.write(self.style.SUCCESS(f"Ключи сгенерированы для {courts.count()} судов"))

    def ping_all(self):
        from court_registry.intercourt_service import InterCourtAPIClient
        online = 0
        for court in CourtDirectory.objects.filter(is_active=True, api_base_url__isnull=False):
            client = InterCourtAPIClient(court)
            if client.ping():
                court.is_online = True
                court.last_health_check = timezone.now()
                court.save(update_fields=['is_online', 'last_health_check'])
                online += 1
                self.stdout.write(f"  {court.code}: ✅ онлайн")
            else:
                self.stdout.write(f"  {court.code}: ❌ офлайн")
        self.stdout.write(self.style.SUCCESS(f"Онлайн: {online} судов"))