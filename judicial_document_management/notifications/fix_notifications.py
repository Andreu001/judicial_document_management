# notifications/management/commands/fix_notifications.py
from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from notifications.models import CaseActivity, CaseNotificationSummary
from django.apps import apps

class Command(BaseCommand):
    help = 'Fix notification counts'

    def handle(self, *args, **options):
        # Получаем все сводки
        summaries = CaseNotificationSummary.objects.all()
        
        for summary in summaries:
            old_total = summary.total_unread
            summary.update_summary()
            summary.refresh_from_db()
            self.stdout.write(
                f"Updated summary for case {summary.case_object_id}: {old_total} -> {summary.total_unread}"
            )
        
        self.stdout.write(self.style.SUCCESS(f'Updated {summaries.count()} summaries'))