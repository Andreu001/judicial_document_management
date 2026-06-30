# court_registry/management/commands/fix_user_court_employees.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from court_registry.models import Court, CourtDepartment, CourtEmployee

User = get_user_model()

class Command(BaseCommand):
    help = 'Привязывает всех пользователей к суду через CourtEmployee'

    def handle(self, *args, **options):
        court = Court.objects.first()
        if not court:
            self.stdout.write(self.style.ERROR('Текущий суд не зарегистрирован'))
            return

        department, _ = CourtDepartment.objects.get_or_create(
            court=court,
            name="Общий отдел",
            defaults={'is_active': True}
        )

        STAFF_ROLES = ['admin', 'judge', 'secretary', 'assistant_referee', 'hr']
        users = User.objects.filter(role__in=STAFF_ROLES, is_active=True)
        
        created_count = 0
        for user in users:
            emp, created = CourtEmployee.objects.get_or_create(
                employee=user,
                department=department,
                defaults={
                    'position': user.get_role_display() if hasattr(user, 'get_role_display') else user.role,
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Добавлен: {user.username}")

        self.stdout.write(self.style.SUCCESS(f'Привязано {created_count} пользователей'))