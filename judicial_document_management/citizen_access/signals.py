# citizen_access/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from django.apps import apps
import logging
from .models import CitizenCaseAccess

logger = logging.getLogger(__name__)
User = get_user_model()


def get_model_if_exists(app_label, model_name):
    """Безопасное получение модели по app_label и имени."""
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        logger.warning(f"Model {app_label}.{model_name} not found")
        return None


@receiver(post_save, sender=User)
def auto_link_cases_on_verification(sender, instance, created, **kwargs):
    """При верификации пользователя автоматически выдаём доступ к его делам."""
    if not instance.is_verified:
        return

    # Паспортные данные не требуются, но нужно имя/фамилия
    if not instance.first_name or not instance.last_name:
        logger.info(f"User {instance.username} has no name, skip auto-linking cases")
        return

    full_name = f"{instance.last_name} {instance.first_name} {instance.middle_name}".strip()

    # 1. Уголовные дела
    Defendant = get_model_if_exists('criminal_proceedings', 'Defendant')
    CriminalSidesCaseInCase = get_model_if_exists('criminal_proceedings', 'CriminalSidesCaseInCase')

    if Defendant:
        defendants = Defendant.objects.filter(full_name_criminal__icontains=instance.last_name)
        for defendant in defendants:
            if defendant.full_name_criminal == full_name or instance.last_name in defendant.full_name_criminal:
                ct = ContentType.objects.get(app_label='criminal_proceedings', model='criminalproceedings')
                CitizenCaseAccess.objects.get_or_create(
                    citizen=instance,
                    content_type=ct,
                    object_id=defendant.criminal_proceedings.id,
                    defaults={'access_type': 'full', 'role_in_case': 'Подсудимый'}
                )

    if CriminalSidesCaseInCase:
        criminal_sides = CriminalSidesCaseInCase.objects.filter(
            criminal_side_case__name__icontains=instance.last_name
        )
        for side in criminal_sides:
            if side.criminal_side_case and side.criminal_proceedings:
                ct = ContentType.objects.get(app_label='criminal_proceedings', model='criminalproceedings')
                CitizenCaseAccess.objects.get_or_create(
                    citizen=instance,
                    content_type=ct,
                    object_id=side.criminal_proceedings.id,
                    defaults={'access_type': 'full', 'role_in_case': str(side.sides_case_criminal)}
                )

    # 2. Гражданские дела
    CivilSidesCaseInCase = get_model_if_exists('civil_proceedings', 'CivilSidesCaseInCase')
    if CivilSidesCaseInCase:
        civil_sides = CivilSidesCaseInCase.objects.filter(
            sides_case_incase__name__icontains=instance.last_name
        )
        for side in civil_sides:
            if side.civil_proceedings:
                ct = ContentType.objects.get(app_label='civil_proceedings', model='civilproceedings')
                CitizenCaseAccess.objects.get_or_create(
                    citizen=instance,
                    content_type=ct,
                    object_id=side.civil_proceedings.id,
                    defaults={'access_type': 'full', 'role_in_case': str(side.sides_case_role)}
                )

    # 3. Административные дела (КоАП)
    AdministrativeSidesCaseInCase = get_model_if_exists('administrative_proceedings', 'AdministrativeSidesCaseInCase')
    if AdministrativeSidesCaseInCase:
        admin_sides = AdministrativeSidesCaseInCase.objects.filter(
            sides_case_incase__name__icontains=instance.last_name
        )
        for side in admin_sides:
            if side.administrative_proceedings:
                ct = ContentType.objects.get(app_label='administrative_proceedings', model='administrativeproceedings')
                CitizenCaseAccess.objects.get_or_create(
                    citizen=instance,
                    content_type=ct,
                    object_id=side.administrative_proceedings.id,
                    defaults={'access_type': 'full', 'role_in_case': str(side.sides_case_role)}
                )

    # 4. Дела КАС
    KasSidesCaseInCase = get_model_if_exists('administrative_code', 'KasSidesCaseInCase')
    if KasSidesCaseInCase:
        kas_sides = KasSidesCaseInCase.objects.filter(
            sides_case_incase__name__icontains=instance.last_name
        )
        for side in kas_sides:
            if side.kas_proceedings:
                ct = ContentType.objects.get(app_label='administrative_code', model='kasproceedings')
                CitizenCaseAccess.objects.get_or_create(
                    citizen=instance,
                    content_type=ct,
                    object_id=side.kas_proceedings.id,
                    defaults={'access_type': 'full', 'role_in_case': str(side.sides_case_role)}
                )