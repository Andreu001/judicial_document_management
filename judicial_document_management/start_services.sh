#!/bin/bash
# start_services.sh - для Git Bash (MINGW64)

echo "========================================"
echo "   ЗАПУСК СУДЕБНОЙ СИСТЕМЫ"
echo "========================================"
echo ""

# Переходим в папку проекта
cd "/d/Dev_2/judicial_document_management" || exit 1

# Активируем виртуальное окружение
echo "Активация виртуального окружения..."
source "/d/Dev_2/venv/Scripts/activate" || {
    echo "ОШИБКА: Не удалось активировать виртуальное окружение!"
    exit 1
}

echo "Виртуальное окружение активировано!"

# 1. Запускаем Redis
echo "[1/4] Запуск Redis..."
cd "/c/Redis" && ./redis-server.exe &
cd "/d/Dev_2/judicial_document_management"
sleep 3

# 2. Запускаем Celery Worker
echo "[2/4] Запуск Celery Worker..."
celery -A judicial_document_management worker --loglevel=info --pool=solo --concurrency=1 &
sleep 5

# 3. Запускаем Daphne
echo "[3/4] Запуск Daphne сервера..."
daphne -b 0.0.0.0 -p 8000 judicial_document_management.asgi:application &
sleep 3

# 4. Открываем браузер
echo "[4/4] Открытие браузера..."
start http://localhost:8000

echo ""
echo "========================================"
echo "   ВСЕ СЕРВИСЫ ЗАПУЩЕНЫ!"
echo "   Django: http://localhost:8000"
echo "   Celery: активен"
echo "   Redis: активен"
echo "========================================"
echo ""
echo "Нажмите Ctrl+C для остановки всех сервисов"
echo "Для выхода из этого окна закройте терминал"

# Ждем нажатия Ctrl+C
wait