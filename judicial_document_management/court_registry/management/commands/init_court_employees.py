# court_registry/management/commands/init_court_employees.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from court_registry.models import (
    Court, CourtDepartment, CourtEmployee
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Первичная привязка всех существующих пользователей к суду'

    def handle(self, *args, **options):
        court = Court.objects.first()
        if not court:
            self.stdout.write(self.style.ERROR('❌ Текущий суд не зарегистрирован'))
            return

        department = CourtDepartment.objects.filter(
            court=court,
            is_active=True
        ).first()
        
        if not department:
            department = CourtDepartment.objects.create(
                court=court,
                name="Общий отдел",
                is_active=True,
                sort_order=0
            )
            self.stdout.write(f'✅ Создан общий отдел для суда {court.code}')

        STAFF_ROLES = ['admin', 'judge', 'secretary', 'assistant_referee', 'hr']
        users = User.objects.filter(role__in=STAFF_ROLES, is_active=True)

        role_position_map = {
            'admin': 'Администратор',
            'judge': 'Судья',
            'secretary': 'Секретарь',
            'assistant_referee': 'Помощник судьи',
            'hr': 'Сотрудник кадров',
        }

        created_count = 0
        updated_count = 0

        for user in users:
            position = role_position_map.get(user.role, user.role)
            emp, created = CourtEmployee.objects.get_or_create(
                employee=user,
                department=department,
                defaults={
                    'position': position,
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'  ➕ Добавлен: {user.username} ({position})')
            elif not emp.is_active:
                emp.is_active = True
                emp.save(update_fields=['is_active', 'updated_at'])
                updated_count += 1
                self.stdout.write(f'  🔄 Активирован: {user.username} ({position})')

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Готово! Привязано пользователей: {created_count}, активировано: {updated_count}'
        ))