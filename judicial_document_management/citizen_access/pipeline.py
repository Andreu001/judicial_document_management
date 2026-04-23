from django.contrib.auth import get_user_model

User = get_user_model()


def save_social_id(strategy, details, user=None, *args, **kwargs):
    """Сохраняем VK ID или Яндекс ID в профиль пользователя"""
    if not user:
        return
    
    backend = strategy.backend.name
    
    if backend == 'vk-oauth2':
        # Получаем VK ID
        response = kwargs.get('response', {})
        vk_id = str(response.get('user_id', ''))
        if vk_id:
            user.vk_id = vk_id
            user.save()
    
    elif backend == 'yandex-oauth2':
        # Получаем Яндекс ID
        response = kwargs.get('response', {})
        yandex_id = response.get('id', '')
        if yandex_id:
            user.yandex_id = str(yandex_id)
            user.save()
    
    return {'user': user}