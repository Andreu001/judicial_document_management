from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from .models import CitizenCaseAccess

User = get_user_model()


@receiver(post_save, sender=User)
def auto_link_cases_on_verification(sender, instance, created, **kwargs):
    """
    При верификации пользователя (заполнены паспортные данные и ФИО)
    автоматически ищем дела, где он участвует, и выдаем доступ
    """
    if not instance.is_verified:
        return
    
    if not instance.passport_series or not instance.passport_number:
        return
    
    # Импортируем модели дел
    from criminal_proceedings.models import CriminalProceedings, Defendant, CriminalSidesCaseInCase
    from civil_proceedings.models import CivilProceedings, CivilSidesCaseInCase
    from administrative_proceedings.models import AdministrativeProceedings, AdministrativeSidesCaseInCase
    
    full_name = f"{instance.last_name} {instance.first_name} {instance.middle_name}".strip()
    
    # 1. Поиск в уголовных делах
    # Проверяем таблицу подсудимых
    defendants = Defendant.objects.filter(full_name_criminal__icontains=instance.last_name)
    for defendant in defendants:
        if defendant.full_name_criminal == full_name or instance.last_name in defendant.full_name_criminal:
            content_type = ContentType.objects.get(app_label='criminal_proceedings', model='criminalproceedings')
            CitizenCaseAccess.objects.get_or_create(
                citizen=instance,
                content_type=content_type,
                object_id=defendant.criminal_proceedings.id,
                defaults={
                    'access_type': 'full',
                    'role_in_case': 'Подсудимый'
                }
            )
    
    # Проверяем стороны по делу
    criminal_sides = CriminalSidesCaseInCase.objects.filter(
        criminal_side_case__name__icontains=instance.last_name
    )
    for side in criminal_sides:
        if side.criminal_side_case and side.criminal_proceedings:
            content_type = ContentType.objects.get(app_label='criminal_proceedings', model='criminalproceedings')
            CitizenCaseAccess.objects.get_or_create(
                citizen=instance,
                content_type=content_type,
                object_id=side.criminal_proceedings.id,
                defaults={
                    'access_type': 'full',
                    'role_in_case': str(side.sides_case_criminal)
                }
            )
    
    # 2. Поиск в гражданских делах
    civil_sides = CivilSidesCaseInCase.objects.filter(
        sides_case_incase__name__icontains=instance.last_name
    )
    for side in civil_sides:
        if side.civil_proceedings:
            content_type = ContentType.objects.get(app_label='civil_proceedings', model='civilproceedings')
            CitizenCaseAccess.objects.get_or_create(
                citizen=instance,
                content_type=content_type,
                object_id=side.civil_proceedings.id,
                defaults={
                    'access_type': 'full',
                    'role_in_case': str(side.sides_case_role)
                }
            )
    
    # 3. Поиск в административных делах (КоАП)
    admin_sides = AdministrativeSidesCaseInCase.objects.filter(
        sides_case_incase__name__icontains=instance.last_name
    )
    for side in admin_sides:
        if side.administrative_proceedings:
            content_type = ContentType.objects.get(app_label='administrative_proceedings', model='administrativeproceedings')
            CitizenCaseAccess.objects.get_or_create(
                citizen=instance,
                content_type=content_type,
                object_id=side.administrative_proceedings.id,
                defaults={
                    'access_type': 'full',
                    'role_in_case': str(side.sides_case_role)
                }
            )
    
    # 4. Поиск в делах КАС
    kas_sides = getattr(__import__('administrative_code.models', fromlist=['KasSidesCaseInCase']), 'KasSidesCaseInCase', None)
    if kas_sides:
        kas_sides_instances = kas_sides.objects.filter(
            sides_case_incase__name__icontains=instance.last_name
        )
        for side in kas_sides_instances:
            if side.kas_proceedings:
                content_type = ContentType.objects.get(app_label='administrative_code', model='kasproceedings')
                CitizenCaseAccess.objects.get_or_create(
                    citizen=instance,
                    content_type=content_type,
                    object_id=side.kas_proceedings.id,
                    defaults={
                        'access_type': 'full',
                        'role_in_case': str(side.sides_case_role)
                    }
                )