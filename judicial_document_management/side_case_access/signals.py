from django.db.models.signals import post_delete
from django.dispatch import receiver
from .services import handle_side_deletion

# Подключаем сигналы для всех моделей сторон
from criminal_proceedings.models import Defendant, CriminalSidesCaseInCase
from civil_proceedings.models import CivilSidesCaseInCase
from administrative_proceedings.models import KasSidesCaseInCase
from administrative_code.models import AdministrativeSidesCaseInCase

@receiver(post_delete, sender=Defendant)
def on_defendant_delete(sender, instance, **kwargs):
    handle_side_deletion(sender, instance, **kwargs)

@receiver(post_delete, sender=CriminalSidesCaseInCase)
def on_criminal_side_delete(sender, instance, **kwargs):
    handle_side_deletion(sender, instance, **kwargs)

@receiver(post_delete, sender=CivilSidesCaseInCase)
def on_civil_side_delete(sender, instance, **kwargs):
    handle_side_deletion(sender, instance, **kwargs)

@receiver(post_delete, sender=KasSidesCaseInCase)
def on_kas_side_delete(sender, instance, **kwargs):
    handle_side_deletion(sender, instance, **kwargs)

@receiver(post_delete, sender=AdministrativeSidesCaseInCase)
def on_admin_side_delete(sender, instance, **kwargs):
    handle_side_deletion(sender, instance, **kwargs)