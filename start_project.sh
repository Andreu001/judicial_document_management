#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Запуск судебной системы${NC}"
echo -e "${GREEN}========================================${NC}"

# Пути к компонентам
REDIS_PATH="/c/Redis/redis-server.exe"
PROJECT_DIR="/d/Dev_2/judicial_document_management"
VENV_DIR="$PROJECT_DIR/venv/Scripts/activate"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Функция для проверки запуска Redis
check_redis() {
    echo -e "${YELLOW}Проверка Redis...${NC}"
    if ! curl -s http://localhost:6379 > /dev/null; then
        echo -e "${RED}Redis не запущен! Запускаем...${NC}"
        "$REDIS_PATH" &
        sleep 3
    else
        echo -e "${GREEN}Redis уже запущен${NC}"
    fi
}

# Функция для запуска Celery
start_celery() {
    echo -e "${YELLOW}Запуск Celery worker...${NC}"
    cd "$PROJECT_DIR/judicial_document_management" || exit
    source "$VENV_DIR"
    celery -A judicial_document_management worker --pool=solo --loglevel=info &
    CELERY_PID=$!
    echo -e "${GREEN}Celery запущен (PID: $CELERY_PID)${NC}"
}

# Функция для запуска Daphne
start_daphne() {
    echo -e "${YELLOW}Запуск Daphne сервера...${NC}"
    cd "$PROJECT_DIR/judicial_document_management" || exit
    source "$VENV_DIR"
    daphne -b 0.0.0.0 -p 8000 judicial_document_management.asgi:application &
    DAPHNE_PID=$!
    echo -e "${GREEN}Daphne запущен (PID: $DAPHNE_PID)${NC}"
}

# Функция для запуска фронтенда
start_frontend() {
    echo -e "${YELLOW}Запуск React фронтенда...${NC}"
    cd "$FRONTEND_DIR" || exit
    npm start &
    FRONTEND_PID=$!
    echo -e "${GREEN}Фронтенд запущен (PID: $FRONTEND_PID)${NC}"
}

# Функция для завершения всех процессов
cleanup() {
    echo -e "${YELLOW}Остановка всех процессов...${NC}"
    kill $CELERY_PID $DAPHNE_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Все процессы остановлены${NC}"
    exit 0
}

# Обработка сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

# Запуск компонентов
check_redis
start_celery
sleep 2
start_daphne
sleep 2
start_frontend

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Все компоненты запущены!${NC}"
echo -e "${GREEN}   Daphne: http://localhost:8000${NC}"
echo -e "${GREEN}   Фронтенд: http://localhost:3000${NC}"
echo -e "${GREEN}   Нажмите Ctrl+C для остановки${NC}"
echo -e "${GREEN}========================================${NC}"

# Ожидание завершения
wait