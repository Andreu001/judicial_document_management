# ai_assistant/management/commands/check_model.py
from django.core.management.base import BaseCommand
import os
import json
import requests


class Command(BaseCommand):
    help = 'Проверка файлов модели и Ollama'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Проверка AI ассистента...')
        
        # 1. Проверяем Ollama
        self.stdout.write('\n📡 Проверка Ollama...')
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                models = response.json().get('models', [])
                self.stdout.write(self.style.SUCCESS(f'✅ Ollama запущен'))
                self.stdout.write(f'📋 Доступные модели:')
                for m in models:
                    name = m.get('name', 'unknown')
                    size = m.get('size', 0) / 1024 / 1024 / 1024
                    self.stdout.write(f'  - {name} ({size:.1f} GB)')
                
                # Проверяем наличие saiga-gemma-9b
                model_names = [m.get('name', '') for m in models]
                if any('saiga-gemma' in name for name in model_names):
                    self.stdout.write(self.style.SUCCESS('✅ Модель saiga-gemma-9b найдена'))
                else:
                    self.stdout.write(self.style.ERROR('❌ Модель saiga-gemma-9b не найдена'))
                    self.stdout.write('Импортируйте модель:')
                    self.stdout.write('  cd models/saiga-7b')
                    self.stdout.write('  ollama create saiga-gemma-9b -f Modelfile')
            else:
                self.stdout.write(self.style.ERROR('❌ Ollama не отвечает'))
                self.stdout.write('Запустите Ollama: ollama serve')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Ошибка: {e}'))
            self.stdout.write('Запустите Ollama: ollama serve')
        
        # 2. Проверяем модель
        model_path = './models/saiga-7b'
        self.stdout.write(f'\n📁 Проверка папки модели: {model_path}')
        
        if not os.path.exists(model_path):
            self.stdout.write(self.style.ERROR('❌ Папка модели не найдена'))
            return
        
        files = os.listdir(model_path)
        self.stdout.write(f'📁 Найдено файлов: {len(files)}')
        
        # Проверяем наличие .gguf файла
        gguf_files = [f for f in files if f.endswith('.gguf')]
        if gguf_files:
            for f in gguf_files:
                size = os.path.getsize(os.path.join(model_path, f))
                self.stdout.write(self.style.SUCCESS(f'✅ {f} ({size/1024/1024/1024:.2f} GB)'))
        else:
            self.stdout.write(self.style.ERROR('❌ .gguf файл не найден'))
