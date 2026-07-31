# ai_assistant/management/commands/test_ai_assistant.py
from django.core.management.base import BaseCommand
from ai_assistant.services import AIService, CaseAnalyzer
from criminal_proceedings.models import CriminalProceedings
import os
import requests


class Command(BaseCommand):
    help = 'Тестирование AI ассистента'
    
    def add_arguments(self, parser):
        parser.add_argument('--case-id', type=int, help='ID дела для анализа')
    
    def handle(self, *args, **options):
        self.stdout.write('🧪 Тестирование AI ассистента...\n')
        
        # Проверяем Ollama
        self.stdout.write('📡 Проверка Ollama...')
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✅ Ollama запущен'))
            else:
                self.stdout.write(self.style.ERROR('❌ Ollama не отвечает'))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Ollama не доступен: {e}'))
            self.stdout.write('Запустите: ollama serve')
            return
        
        # Инициализируем AI сервис
        self.stdout.write('\n🤖 Инициализация AI сервиса...')
        ai_service = AIService()
        
        if ai_service.is_ready():
            self.stdout.write(self.style.SUCCESS('✅ AI сервис готов'))
            
            if ai_service.is_ollama_available:
                self.stdout.write(self.style.SUCCESS(f'✅ Модель {ai_service.model_name} загружена'))
            else:
                self.stdout.write(self.style.WARNING('⚠️ Используется режим заглушки'))
        else:
            self.stdout.write(self.style.ERROR('❌ AI сервис не готов'))
            return
        
        # Тест генерации
        self.stdout.write('\n💬 Тест генерации ответа...')
        try:
            response = ai_service.generate_response('Привет! Расскажи кратко о своих возможностях.')
            self.stdout.write(self.style.SUCCESS('✅ Ответ получен:'))
            self.stdout.write(f'\n{response[:500]}...\n')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Ошибка: {e}'))
        
        # Анализ дела, если указан ID
        case_id = options.get('case_id')
        if case_id:
            try:
                case = CriminalProceedings.objects.get(id=case_id)
                self.stdout.write(f'\n📋 Анализ дела #{case_id}...')
                analyzer = CaseAnalyzer()
                result = analyzer.analyze_case(case, 'full')
                self.stdout.write(self.style.SUCCESS('✅ Анализ выполнен'))
                self.stdout.write(f'Рекомендации: {len(result.get("recommendations", []))}')
                self.stdout.write(f'Нарушения: {len(result.get("violations", []))}')
                
                if result.get('recommendations'):
                    self.stdout.write('\n💡 Рекомендации:')
                    for r in result['recommendations'][:3]:
                        self.stdout.write(f'  - {r}')
            except CriminalProceedings.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'❌ Дело #{case_id} не найдено'))
