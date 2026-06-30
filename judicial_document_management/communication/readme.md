# Интеграция communication в проект

## 1. Скопировать приложение в проект

Скопируй папку `communication/` в корень Django-проекта (туда же, где `users/`, `court_registry/` и т.д.).

## 2. settings.py — добавить в INSTALLED_APPS

```python
INSTALLED_APPS = [
    # ... все существующие ...
    'communication',
    'channels',  # если ещё нет, добавить
]
```

## 3. settings.py — проверить ASGI и Channels

У тебя уже есть `CHANNEL_LAYERS`. Убедись что `ASGI_APPLICATION` без опечатки:

```python
ASGI_APPLICATION = 'judicial_document_management.asgi.application'
```

## 4. asgi.py — добавить WebSocket-маршрутизацию

Отредактируй `judicial_document_management/asgi.py`:

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from communication.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'judicial_document_management.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

## 5. urls.py — добавить эндпоинты API

В `judicial_document_management/urls.py` добавить:

```python
path('api/communication/', include('communication.urls')),
```

## 6. Миграции

```bash
python manage.py makemigrations communication
python manage.py migrate communication
```

## 7. Начальная настройка

После миграции зайди в админку и:
- Убедись что в `court_registry.Court` суд зарегистрирован
- Убедись что `court_registry.CourtMessengerRegistration` создана (is_registered=True)
- Это автоматически создаст чаты отделов и служебный канал (через signals)

## 8. API endpoints

Все эндпоинты: `/api/communication/`

### Чаты
- `GET    /api/communication/chats/` — список чатов пользователя
- `POST   /api/communication/chats/` — создать чат
- `GET    /api/communication/chats/{id}/` — детали чата
- `POST   /api/communication/chats/{id}/join/` — присоединиться
- `POST   /api/communication/chats/{id}/leave/` — покинуть
- `POST   /api/communication/chats/{id}/add_members/` — добавить участников
- `POST   /api/communication/chats/{id}/remove_member/` — удалить участника
- `POST   /api/communication/chats/{id}/change_role/` — изменить роль
- `POST   /api/communication/chats/{id}/toggle_pin/` — закрепить/открепить
- `POST   /api/communication/chats/{id}/toggle_mute/` — mute/unmute
- `POST   /api/communication/chats/{id}/mark_read/` — отметить прочитанным
- `POST   /api/communication/chats/direct_chat/` — личный чат с пользователем
- `GET    /api/communication/chats/available_intercourt/` — доступные суды
- `GET    /api/communication/chats/pinned/` — закреплённые чаты
- `GET    /api/communication/chats/unread/` — чаты с непрочитанными

### Сообщения
- `GET    /api/communication/messages/?chat=<id>` — сообщения чата
- `POST   /api/communication/messages/` — отправить сообщение
- `POST   /api/communication/messages/{id}/edit/` — редактировать
- `POST   /api/communication/messages/{id}/delete/` — удалить
- `POST   /api/communication/messages/{id}/pin/` — закрепить
- `POST   /api/communication/messages/{id}/forward/` — переслать
- `POST   /api/communication/messages/{id}/mark_read/` — отметить прочитанным
- `GET    /api/communication/messages/search/?q=...` — поиск
- `GET    /api/communication/messages/pinned/?chat=<id>` — закреплённые

### Вложения
- `POST   /api/communication/attachments/` — загрузить файл
- `POST   /api/communication/attachments/upload_multiple/` — загрузить несколько

### Рассылки
- `GET    /api/communication/broadcasts/` — список рассылок
- `POST   /api/communication/broadcasts/` — создать и отправить
- `POST   /api/communication/broadcasts/{id}/cancel/` — отменить
- `GET    /api/communication/broadcasts/{id}/recipients/` — получатели
- `POST   /api/communication/broadcast-recipients/{id}/mark_read/` — прочитано
- `POST   /api/communication/broadcast-recipients/{id}/confirm/` — подтвердить

### Поручения
- `GET    /api/communication/tasks/` — все поручения
- `POST   /api/communication/tasks/` — создать
- `POST   /api/communication/tasks/{id}/accept/` — принять
- `POST   /api/communication/tasks/{id}/start/` — начать работу
- `POST   /api/communication/tasks/{id}/complete/` — выполнить
- `POST   /api/communication/tasks/{id}/reject/` — отклонить
- `POST   /api/communication/tasks/{id}/comment/` — комментарий
- `POST   /api/communication/tasks/{id}/upload_attachment/` — вложение
- `GET    /api/communication/tasks/my/` — мои поручения
- `GET    /api/communication/tasks/created_by_me/` — созданные мной
- `GET    /api/communication/tasks/overdue/` — просроченные

### Межсудебный обмен
- `GET    /api/communication/document-exchanges/` — все обмены
- `POST   /api/communication/document-exchanges/` — создать
- `POST   /api/communication/document-exchanges/{id}/send/` — отправить
- `POST   /api/communication/document-exchanges/{id}/accept/` — принять
- `POST   /api/communication/document-exchanges/{id}/reject/` — отклонить
- `POST   /api/communication/document-exchanges/{id}/upload_attachment/` — вложение
- `GET    /api/communication/document-exchanges/incoming/` — входящие
- `GET    /api/communication/document-exchanges/outgoing/` — исходящие

### Маршрутизация и автоуведомления
- `GET    /api/communication/routes/` — правила маршрутизации
- `GET    /api/communication/routes/for_my_court/` — для моего суда
- `GET/POST /api/communication/auto-notifications/` — правила автоуведомлений

### Поиск
- `GET    /api/communication/courts/search/?q=...` — поиск судов
- `GET    /api/communication/departments/search/?q=...` — поиск отделов
- `GET    /api/communication/employees/search/?q=...` — поиск сотрудников

### Дашборд
- `GET    /api/communication/dashboard/` — сводка (чаты, поручения, рассылки)

## 9. WebSocket

- `ws://host/ws/chat/<chat_id>/` — чат-комната
- `ws://host/ws/global/` — глобальные уведомления

## 10. Автоматизация (signals)

При регистрации суда через `CourtMessengerRegistration`:
- Авто-создание чатов всех отделов
- Авто-создание служебного канала суда
- Авто-добавление сотрудников в чаты

При добавлении сотрудника в отдел:
- Авто-добавление в чат отдела
- Авто-добавление в канал суда

При создании/изменении сообщения:
- Авто-обновление поискового индекса
- Авто-создание поручения (если message_type='task')

## Ограничения доступа

- К чатам имеют доступ только активные сотрудники суда (`CourtEmployee.is_active=True`)
- Внешние пользователи (граждане, адвокаты) доступа к мессенджеру не имеют
- Межсудебные чаты регулируются правилами `IntercourtRoute`
