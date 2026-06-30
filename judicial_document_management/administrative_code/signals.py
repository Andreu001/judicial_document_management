# administrative_code/signals.py - НОВЫЙ ФАЙЛ или добавьте в существующий

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdministrativePetition
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=AdministrativePetition)
def create_activity_for_admin_petition(sender, instance, created, **kwargs):
    """
    Создает активность при создании нового ходатайства по делу об АП.
    """
    if not created:
        return
    
    from notifications.activity_service import CaseActivityService
    
    case = instance.administrative_proceedings
    
    # Получаем информацию о заявителе
    petitioner_info = instance.petitioner_info
    petitioner_name = petitioner_info.get('name') if petitioner_info else "Участник процесса"
    
    # Получаем текст ходатайства
    petition_text = ""
    if instance.petitions_incase:
        petition_text = instance.petitions_incase.notation[:200]
        
        # Названия ходатайств
        petitions_names = []
        for p in instance.petitions_incase.petitions_name.all():
            petitions_names.append(p.petitions)
        if petitions_names:
            petition_text = f"Ходатайство: {', '.join(petitions_names)}. {petition_text}"
    
    title = f"Новое ходатайство от {petitioner_name}"
    
    CaseActivityService.create_activity(
        case=case,
        activity_type='new_petition',
        title=title,
        description=petition_text,
        related_object=instance,
        link=f"/administrative-proceedings/{case.id}/petitions/{instance.id}/"
    )
    
    # Уведомляем участника (если есть external_user)
    if petitioner_info and petitioner_info.get('type') == 'admin_sides':
        side = None
        if petitioner_info.get('id'):
            try:
                from .models import AdministrativeSidesCaseInCase
                side = AdministrativeSidesCaseInCase.objects.get(id=petitioner_info['id'])
                if side.sides_case_incase:
                    # Ищем ExternalUser по email или ФИО
                    from side_case_access.models import ExternalUser
                    email = side.sides_case_incase.email
                    full_name = side.sides_case_incase.name
                    
                    external_user = None
                    if email:
                        external_user = ExternalUser.objects.filter(email=email).first()
                    if not external_user and full_name:
                        external_user = ExternalUser.objects.filter(full_name=full_name).first()
                    
                    if external_user:
                        from notifications.activity_service import PartyResponseService
                        PartyResponseService.notify_party_petition_received(
                            instance, external_user, case
                        )
            except Exception as e:
                logger.error(f"Ошибка уведомления участника: {e}")
