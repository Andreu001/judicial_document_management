# side_case_access/pipeline.py

import logging
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone
from business_card.models import SidesCaseInCase
from criminal_proceedings.models import Defendant
from .models import SideCaseUser

User = get_user_model()
logger = logging.getLogger(__name__)


def save_social_id(strategy, details, user=None, *args, **kwargs):
    """
    Сохраняем social_id в профиль пользователя (соц. сеть, uid).
    """
    if user and kwargs.get('is_new'):
        backend = kwargs.get('backend')
        if backend:
            social = kwargs.get('response')
            uid = kwargs.get('uid')
            # Сохраняем информацию о соц. сети
            user.provider = backend.name  # Добавьте поле provider в модель User, если нужно
            user.social_uid = uid
            user.save()
    
    return {'user': user}


def match_and_connect_side(strategy, details, user=None, *args, **kwargs):
    """
    Автоматически связываем пользователя со стороной по делу.
    Ищем по email, ФИО, дате рождения (если есть).
    """
    if not user:
        return
    
    # Получаем данные из соц. сети
    email = details.get('email', '').lower()
    first_name = details.get('first_name', '')
    last_name = details.get('last_name', '')
    full_name = f"{first_name} {last_name}".strip()
    
    # Если есть email, пытаемся найти стороны с таким email
    if email:
        # Ищем в SidesCaseInCase (гражданские, КАС, КоАП)
        sides_qs = SidesCaseInCase.objects.filter(email__iexact=email)
        for side in sides_qs:
            connect_user_to_side(user, side)
    
    # Если есть ФИО, пытаемся найти стороны с таким именем
    if full_name and len(full_name) > 3:
        # Ищем в SidesCaseInCase
        sides_by_name = SidesCaseInCase.objects.filter(name__icontains=full_name)
        for side in sides_by_name:
            connect_user_to_side(user, side)
        
        # Ищем в Defendant (уголовные дела)
        defendants = Defendant.objects.filter(full_name_criminal__icontains=full_name)
        for defendant in defendants:
            connect_user_to_side(user, defendant, is_defendant=True)
    
    logger.info(f"Auto-match for user {user.id}: found {SideCaseUser.objects.filter(user=user).count()} connections")
    return


def connect_user_to_side(user, side, is_defendant=False):
    """
    Вспомогательная функция для создания связи пользователь -> сторона.
    """
    if is_defendant:
        content_type = ContentType.objects.get_for_model(Defendant)
        obj_id = side.id
    else:
        content_type = ContentType.objects.get_for_model(SidesCaseInCase)
        obj_id = side.id
    
    # Проверяем, не существует ли уже активная связь
    existing, created = SideCaseUser.objects.get_or_create(
        user=user,
        side_content_type=content_type,
        side_object_id=obj_id,
        defaults={'is_active': True}
    )
    
    if not created and not existing.is_active:
        # Если связь была деактивирована, активируем снова
        existing.is_active = True
        existing.disconnected_at = None
        existing.save()
        logger.info(f"Re-activated connection user={user.id} side={obj_id}")
    elif created:
        logger.info(f"Created new connection user={user.id} side={obj_id}")


def auto_verify_from_yandex(strategy, details, user=None, *args, **kwargs):
    """
    Для Яндекс: если пользователь авторизовался через Яндекс, 
    автоматически подтверждаем его статус (можно убрать флаг is_verified).
    """
    if user and kwargs.get('backend') and kwargs['backend'].name == 'yandex':
        # Если пользователь пришел из Яндекса, считаем его верифицированным
        if not user.is_verified:  # Добавьте поле is_verified в модель User, если нужно
            user.is_verified = True
            user.save()
            logger.info(f"User {user.id} auto-verified via Yandex")
    
    return