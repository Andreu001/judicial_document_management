# citizen_access/pipeline.py (полностью замените)

from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


def save_social_id(strategy, details, backend, user=None, *args, **kwargs):
    """Сохраняем ID из социальной сети"""
    if not user:
        return
    
    response = kwargs.get('response', {})
    
    if backend.name == 'yandex-oauth2':
        yandex_id = str(response.get('id', ''))
        if yandex_id:
            user.yandex_id = yandex_id
            logger.info(f"Saved Yandex ID {yandex_id} for user {user.username}")
    
    elif backend.name == 'vk-oauth2':
        vk_id = str(response.get('id', ''))
        if vk_id:
            user.vk_id = vk_id
            logger.info(f"Saved VK ID {vk_id} for user {user.username}")
    
    user.save()
    return {'user': user}


def set_citizen_role(strategy, details, backend, user=None, *args, **kwargs):
    """Устанавливаем роль гражданина"""
    if not user:
        return
    
    if user.role != 'citizen':
        user.role = 'citizen'
        user.save()
        logger.info(f"Set role 'citizen' for user {user.username}")
    
    return {'user': user}


# citizen_access/pipeline.py - замените функцию auto_verify_from_yandex на эту

def auto_verify_from_yandex(strategy, details, backend, user=None, *args, **kwargs):
    """
    Автоматическая верификация для Яндекс ID
    Привязывает существующего пользователя по email, если он есть
    """
    if not user:
        return
    
    if backend.name == 'yandex-oauth2':
        # Получаем email из details (он уже есть от Яндекса)
        email = details.get('email')
        
        if email:
            # Ищем существующего пользователя с таким же email
            from django.contrib.auth import get_user_model
            User = get_user_model()
            existing_user = User.objects.filter(email=email).exclude(id=user.id).first()
            
            if existing_user:
                logger.info(f"🔍 Found existing user with email {email}: {existing_user.username}")
                
                # Переносим социальную связь на существующего пользователя
                from social_django.models import UserSocialAuth
                social = UserSocialAuth.objects.filter(user=user).first()
                if social:
                    social.user = existing_user
                    social.save()
                    logger.info(f"✅ Moved social auth from {user.username} to {existing_user.username}")
                
                # Переносим yandex_id
                existing_user.yandex_id = user.yandex_id
                existing_user.is_verified = True
                existing_user.verification_date = timezone.now()
                # Обновляем имя/фамилию если они были пустые
                if not existing_user.first_name and user.first_name:
                    existing_user.first_name = user.first_name
                if not existing_user.last_name and user.last_name:
                    existing_user.last_name = user.last_name
                existing_user.save()
                
                # Удаляем дубликат
                user.delete()
                user = existing_user
                logger.info(f"✅ Merged duplicate user into {existing_user.username}")
            else:
                # Новый пользователь — просто верифицируем
                if not user.is_verified:
                    user.is_verified = True
                    user.verification_date = timezone.now()
                    user.save()
                    logger.info(f"✅ Verified new user {user.username} via Yandex")
        else:
            # Нет email — просто верифицируем
            if not user.is_verified:
                user.is_verified = True
                user.verification_date = timezone.now()
                user.save()
                logger.info(f"✅ Verified user {user.username} via Yandex (no email)")
        
        # ✅ Привязываем дела по ФИО (теперь с правильным пользователем)
        auto_link_user_cases(user)
    
    return {'user': user}

def auto_link_user_cases(user):
    if not user.first_name or not user.last_name:
        logger.info(f"User {user.username} has no name, skip auto-linking")
        return
    
    from django.contrib.contenttypes.models import ContentType
    from citizen_access.models import CitizenCaseAccess
    
    full_name = f"{user.last_name} {user.first_name}"
    if user.middle_name:
        full_name += f" {user.middle_name}"
    full_name = full_name.strip()
    
    logger.info(f"🔍 Searching cases for user: {user.username}")
    logger.info(f"   Full name: '{full_name}'")
    logger.info(f"   Last name: '{user.last_name}'")
    logger.info(f"   First name: '{user.first_name}'")
    
    # Добавим проверку всех сторон в базе
    from business_card.models import SidesCaseInCase
    all_sides = SidesCaseInCase.objects.all()
    logger.info(f"   Total sides in DB: {all_sides.count()}")
    for side in all_sides[:10]:  # покажем первые 10
        logger.info(f"     Side: '{side.name}'")
    
    linked_count = 0
    
    # 1. УГОЛОВНЫЕ ДЕЛА
    try:
        from criminal_proceedings.models import CriminalSidesCaseInCase, Defendant
        
        # Получаем ContentType для уголовных дел
        ct_criminal = ContentType.objects.get(app_label='criminal_proceedings', model='criminalproceedings')
        
        # Поиск по сторонам (CriminalSidesCaseInCase)
        sides = CriminalSidesCaseInCase.objects.select_related('criminal_side_case', 'criminal_proceedings')
        for side in sides:
            side_name = None
            if side.criminal_side_case:
                side_name = side.criminal_side_case.name
            elif hasattr(side, 'criminal_side_case_detail') and side.criminal_side_case_detail:
                side_name = side.criminal_side_case_detail.get('name')
            
            if side_name:
                logger.info(f"  Checking criminal side: '{side_name}' against '{full_name}'")
                if full_name.lower() in side_name.lower() or user.last_name.lower() in side_name.lower():
                    obj, created = CitizenCaseAccess.objects.get_or_create(
                        citizen=user,
                        content_type=ct_criminal,
                        object_id=side.criminal_proceedings.id,
                        defaults={
                            'access_type': 'full',
                            'role_in_case': str(side.sides_case_criminal) if side.sides_case_criminal else 'Участник',
                            'is_active': True
                        }
                    )
                    if created:
                        linked_count += 1
                        logger.info(f"✅ Linked criminal case {side.criminal_proceedings.case_number_criminal} to {full_name}")
        
        # Поиск по подсудимым (Defendant)
        defendants = Defendant.objects.select_related('criminal_proceedings')
        for defendant in defendants:
            if defendant.full_name_criminal:
                logger.info(f"  Checking defendant: '{defendant.full_name_criminal}' against '{full_name}'")
                if full_name.lower() in defendant.full_name_criminal.lower():
                    obj, created = CitizenCaseAccess.objects.get_or_create(
                        citizen=user,
                        content_type=ct_criminal,
                        object_id=defendant.criminal_proceedings.id,
                        defaults={
                            'access_type': 'full',
                            'role_in_case': 'Подсудимый',
                            'is_active': True
                        }
                    )
                    if created:
                        linked_count += 1
                        logger.info(f"✅ Linked criminal case via defendant {defendant.criminal_proceedings.case_number_criminal}")
                        
    except Exception as e:
        logger.error(f"Error linking criminal cases: {e}", exc_info=True)
    
    # 2. ГРАЖДАНСКИЕ ДЕЛА
    try:
        from civil_proceedings.models import CivilSidesCaseInCase
        
        ct_civil = ContentType.objects.get(app_label='civil_proceedings', model='civilproceedings')
        
        sides = CivilSidesCaseInCase.objects.select_related('sides_case_incase', 'civil_proceedings')
        for side in sides:
            if side.sides_case_incase and side.sides_case_incase.name:
                logger.info(f"  Checking civil side: '{side.sides_case_incase.name}' against '{full_name}'")
                if full_name.lower() in side.sides_case_incase.name.lower() or \
                   user.last_name.lower() in side.sides_case_incase.name.lower():
                    obj, created = CitizenCaseAccess.objects.get_or_create(
                        citizen=user,
                        content_type=ct_civil,
                        object_id=side.civil_proceedings.id,
                        defaults={
                            'access_type': 'full',
                            'role_in_case': str(side.sides_case_role) if side.sides_case_role else 'Участник',
                            'is_active': True
                        }
                    )
                    if created:
                        linked_count += 1
                        logger.info(f"✅ Linked civil case {side.civil_proceedings.case_number_civil}")
                        
    except Exception as e:
        logger.error(f"Error linking civil cases: {e}", exc_info=True)
    
    # 3. АДМИНИСТРАТИВНЫЕ ПРАВОНАРУШЕНИЯ (КоАП)
    try:
        from administrative_proceedings.models import AdministrativeSidesCaseInCase
        
        ct_admin = ContentType.objects.get(app_label='administrative_proceedings', model='administrativeproceedings')
        
        sides = AdministrativeSidesCaseInCase.objects.select_related('sides_case_incase', 'administrative_proceedings')
        for side in sides:
            if side.sides_case_incase and side.sides_case_incase.name:
                logger.info(f"  Checking admin side: '{side.sides_case_incase.name}' against '{full_name}'")
                if full_name.lower() in side.sides_case_incase.name.lower() or \
                   user.last_name.lower() in side.sides_case_incase.name.lower():
                    obj, created = CitizenCaseAccess.objects.get_or_create(
                        citizen=user,
                        content_type=ct_admin,
                        object_id=side.administrative_proceedings.id,
                        defaults={
                            'access_type': 'full',
                            'role_in_case': str(side.sides_case_role) if side.sides_case_role else 'Участник',
                            'is_active': True
                        }
                    )
                    if created:
                        linked_count += 1
                        logger.info(f"✅ Linked admin offense case {side.administrative_proceedings.case_number_admin}")
                        
    except Exception as e:
        logger.error(f"Error linking admin offense cases: {e}", exc_info=True)
    
    # 4. ДЕЛА КАС
    try:
        from administrative_code.models import KasSidesCaseInCase
        
        ct_kas = ContentType.objects.get(app_label='administrative_code', model='kasproceedings')
        
        sides = KasSidesCaseInCase.objects.select_related('sides_case_incase', 'kas_proceedings')
        for side in sides:
            if side.sides_case_incase and side.sides_case_incase.name:
                logger.info(f"  Checking KAS side: '{side.sides_case_incase.name}' against '{full_name}'")
                if full_name.lower() in side.sides_case_incase.name.lower() or \
                   user.last_name.lower() in side.sides_case_incase.name.lower():
                    obj, created = CitizenCaseAccess.objects.get_or_create(
                        citizen=user,
                        content_type=ct_kas,
                        object_id=side.kas_proceedings.id,
                        defaults={
                            'access_type': 'full',
                            'role_in_case': str(side.sides_case_role) if side.sides_case_role else 'Участник',
                            'is_active': True
                        }
                    )
                    if created:
                        linked_count += 1
                        logger.info(f"✅ Linked KAS case {side.kas_proceedings.case_number_kas}")
                        
    except Exception as e:
        logger.error(f"Error linking KAS cases: {e}", exc_info=True)
    
    logger.info(f"🎯 Auto-linked TOTAL {linked_count} cases for user {user.username} ({full_name})")
    
    # Если не нашлось дел, логируем список всех сторон для отладки
    if linked_count == 0:
        logger.warning("⚠️ No cases found! Here are all sides in the system:")
        try:
            from criminal_proceedings.models import CriminalSidesCaseInCase
            all_sides = CriminalSidesCaseInCase.objects.select_related('criminal_side_case')
            for side in all_sides:
                if side.criminal_side_case:
                    logger.warning(f"  - Criminal side: '{side.criminal_side_case.name}'")
        except Exception as e:
            logger.error(f"Error listing sides: {e}")