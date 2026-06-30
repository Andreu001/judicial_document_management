# management/commands/sync_courts_network.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from court_registry.models import CourtDirectory, Court
from court_registry.intercourt_service import InterCourtAPIClient

class Command(BaseCommand):
    help = 'Синхронизация данных с сетью судов'

    def handle(self, *args, **options):
        current_court = Court.objects.first()
        if not current_court:
            return

        # Получаем список судов, с которыми будем синхронизироваться
        # (например, те, у которых есть API)
        courts = CourtDirectory.objects.filter(
            is_active=True,
            api_base_url__isnull=False
        )

        for court in courts:
            # Проверяем доступность
            client = InterCourtAPIClient(court)
            is_online = client.ping()
            court.is_online = is_online
            court.last_health_check = timezone.now()
            court.save(update_fields=['is_online', 'last_health_check'])
            
            if is_online:
                # Здесь можно запросить и обновить данные о суде
                # (например, список сотрудников, отделов и т.д.)
                pass

        self.stdout.write(self.style.SUCCESS(f"Синхронизация завершена"))