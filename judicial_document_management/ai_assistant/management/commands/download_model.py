import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
import requests
from tqdm import tqdm
import json

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Скачивает модель Saiga для AI ассистента'

    def add_arguments(self, parser):
        parser.add_argument(
            '--model-size',
            type=str,
            default='7b',
            choices=['7b', '13b'],
            help='Размер модели (7b, 13b)'
        )
        parser.add_argument(
            '--use-hf',
            action='store_true',
            help='Использовать HuggingFace для загрузки'
        )
        parser.add_argument(
            '--download-files',
            action='store_true',
            help='Скачать файлы модели вручную'
        )

    def handle(self, *args, **options):
        model_size = options['model_size']
        use_hf = options['use_hf']
        download_files = options['download_files']
        
        model_path = getattr(settings, 'SAIGA_MODEL_PATH', './models/saiga-7b')
        
        if use_hf:
            self.download_from_huggingface(model_path, model_size)
        elif download_files:
            self.download_model_files(model_path, model_size)
        else:
            self.show_instructions(model_path, model_size)
    
    def download_from_huggingface(self, model_path, model_size):
        """Скачивает модель с HuggingFace"""
        self.stdout.write('📥 Скачивание с HuggingFace...')
        
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch
            
            model_name = f"IlyaGusev/saiga_{model_size}_lora"
            
            self.stdout.write(f'Загрузка {model_name}...')
            
            # Создаем папку
            os.makedirs(model_path, exist_ok=True)
            
            # Загружаем токенизатор
            self.stdout.write('Загрузка токенизатора...')
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True,
                cache_dir=model_path
            )
            
            # Загружаем модель
            self.stdout.write('Загрузка модели (это может занять 10-30 минут)...')
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                low_cpu_mem_usage=True,
                trust_remote_code=True
            )
            
            # Сохраняем локально
            tokenizer.save_pretrained(model_path)
            model.save_pretrained(model_path)
            
            self.stdout.write(self.style.SUCCESS(f'✅ Модель сохранена в {model_path}'))
            
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'❌ Ошибка импорта: {e}'))
            self.stdout.write('Установите зависимости: pip install transformers torch accelerate')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Ошибка: {e}'))
            self.stdout.write('\n💡 Используйте ручную загрузку:')
            self.stdout.write(f'   python manage.py download_model --download-files')
    
    def download_model_files(self, model_path, model_size):
        """Скачивает файлы модели вручную"""
        self.stdout.write('📥 Ручная загрузка файлов модели...')
        
        os.makedirs(model_path, exist_ok=True)
        
        # URL для скачивания (используем официальный репозиторий)
        base_url = f"https://huggingface.co/IlyaGusev/saiga_{model_size}_lora/resolve/main/"
        
        files_to_download = [
            "config.json",
            "pytorch_model.bin.index.json",
            "pytorch_model-00001-of-00002.bin",
            "pytorch_model-00002-of-00002.bin",
            "tokenizer.model",
            "tokenizer_config.json",
            "special_tokens_map.json",
            "generation_config.json"
        ]
        
        for filename in tqdm(files_to_download, desc="Скачивание файлов"):
            url = base_url + filename
            filepath = os.path.join(model_path, filename)
            
            if os.path.exists(filepath):
                self.stdout.write(f'⏭️ {filename} уже существует')
                continue
            
            try:
                response = requests.get(url, stream=True)
                response.raise_for_status()
                
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                self.stdout.write(f'✅ {filename} загружен')
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Ошибка загрузки {filename}: {e}'))
        
        # Создаем файл с информацией о модели
        info = {
            "model_name": f"saiga_{model_size}_lora",
            "model_path": model_path,
            "files": files_to_download,
            "size": "7B" if model_size == "7b" else "13B"
        }
        
        with open(os.path.join(model_path, "model_info.json"), "w") as f:
            json.dump(info, f, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Модель сохранена в {model_path}'))
    
    def show_instructions(self, model_path, model_size):
        """Показывает инструкции по установке"""
        self.stdout.write('''
╔══════════════════════════════════════════════════════════════════╗
║                    ИНСТРУКЦИЯ ПО УСТАНОВКЕ МОДЕЛИ               ║
╚══════════════════════════════════════════════════════════════════╝

Вариант 1: Скачать с HuggingFace (рекомендуется)
    python manage.py download_model --use-hf

Вариант 2: Ручная загрузка файлов
    python manage.py download_model --download-files

Вариант 3: Использовать API (без локальной модели)
    Установите в settings.py:
    AI_USE_API = True
    AI_API_URL = "http://localhost:8000/v1"
    
    Запустите API сервер:
    python -m vllm.entrypoints.openai.api_server \\
        --model IlyaGusev/saiga_7b_lora

Путь к модели: {}
Размер модели: {}

После загрузки проверьте:
    python manage.py test_ai_assistant
'''.format(model_path, model_size))