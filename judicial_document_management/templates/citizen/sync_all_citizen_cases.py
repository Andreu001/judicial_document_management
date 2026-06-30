# citizen_access/management/commands/sync_all_citizen_cases.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from citizen_access.pipeline import auto_link_user_cases
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Синхронизирует дела для всех верифицированных граждан'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='ID конкретного пользователя для синхронизации'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Подробный вывод'
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        user_id = options['user_id']
        
        if user_id:
            users = User.objects.filter(id=user_id, role='citizen')
        else:
            users = User.objects.filter(role='citizen', is_verified=True)
        
        total_synced = 0
        total_cases = 0
        
        self.stdout.write(f"Начинаю синхронизацию для {users.count()} пользователей...")
        
        for user in users:
            if verbose:
                self.stdout.write(f"Синхронизация для {user.get_full_name()} ({user.username})...")
            
            try:
                # Сохраняем текущее количество дел
                from citizen_access.models import CitizenCaseAccess
                before_count = CitizenCaseAccess.objects.filter(citizen=user).count()
                
                # Выполняем синхронизацию
                auto_link_user_cases(user)
                
                after_count = CitizenCaseAccess.objects.filter(citizen=user).count()
                new_cases = after_count - before_count
                
                total_synced += 1
                total_cases += after_count
                
                if verbose:
                    self.stdout.write(f"  Найдено дел: {after_count} (+{new_cases} новых)")
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Ошибка: {e}"))
        
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Синхронизация завершена!\n"
            f"Пользователей обработано: {total_synced}\n"
            f"Всего дел найдено: {total_cases}"
        ))