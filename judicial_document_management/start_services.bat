@echo off
chcp 65001 > nul
title Судебная система - Запуск всех сервисов

echo ========================================
echo    ЗАПУСК СУДЕБНОЙ СИСТЕМЫ
echo ========================================
echo.

:: Переходим в папку проекта
cd /d "D:\Dev_2\judicial_document_management"

:: Активируем виртуальное окружение
echo Активация виртуального окружения...
call "D:\Dev_2\venv\Scripts\activate.bat"

if errorlevel 1 (
    echo ОШИБКА: Не удалось активировать виртуальное окружение!
    pause
    exit /b 1
)

echo Виртуальное окружение активировано!

:: 1. Запускаем Redis (из C:\Redis)
echo [1/4] Запуск Redis...
if exist "C:\Redis\redis-server.exe" (
    echo Запуск Redis из C:\Redis
    start "Redis Server" /B "C:\Redis\redis-server.exe"
) else if exist "C:\Program Files\Redis\redis-server.exe" (
    echo Запуск Redis из C:\Program Files\Redis
    start "Redis Server" /B "C:\Program Files\Redis\redis-server.exe"
) else (
    echo Redis не найден! Пытаюсь через PATH...
    start "Redis Server" /B redis-server
)
timeout /t 3 /nobreak > nul

:: 2. Запускаем Celery Worker
echo [2/4] Запуск Celery Worker...
start "Celery Worker" /B celery -A judicial_document_management worker --loglevel=info --pool=solo --concurrency=1

timeout /t 5 /nobreak > nul

:: 3. Запускаем Daphne
echo [3/4] Запуск Daphne сервера...
start "Daphne Server" /B daphne -b 0.0.0.0 -p 8000 judicial_document_management.asgi:application

timeout /t 3 /nobreak > nul

:: 4. Открываем браузер
echo [4/4] Открытие браузера...
start http://localhost:8000

echo.
echo ========================================
echo    ВСЕ СЕРВИСЫ ЗАПУЩЕНЫ!
echo    Django: http://localhost:8000
echo    Celery: активен
echo    Redis: активен
echo ========================================
echo.
echo Нажмите любую клавишу для выхода...
pause > nul