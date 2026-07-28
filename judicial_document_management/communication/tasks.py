from celery import shared_task

from django.utils import timezone

from .models import (Task)

@shared_task
def check_expired_tasks():

    now = timezone.now()

    tasks = Task.objects.filter(
        status__in=["new", "progress"],
        due_date__lt=now
    )

    count = 0

    for task in tasks:

        task.status = "expired"

        task.save(
            update_fields=["status"]
        )

        count += 1

    return count


@shared_task
def daily_task_summary():

    total = Task.objects.count()

    completed = Task.objects.filter(
        status="done"
    ).count()

    expired = Task.objects.filter(
        status="expired"
    ).count()

    return {
        "total": total,
        "completed": completed,
        "expired": expired
    }
