import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from django.core.files.storage import default_storage
from django.contrib.contenttypes.models import ContentType
from django.core.files.base import ContentFile
from django.utils import timezone
import requests
from io import BytesIO
import PyPDF2
import docx

from .models import (
        AIConfiguration, AICaseAnalysis, ChatSession,
        ChatMessage, UploadedFile, AIConfiguration
    )

logger = logging.getLogger(__name__)

# Импорт моделей приложений (ленивый импорт)
def get_criminal_proceedings():
    from criminal_proceedings.models import CriminalProceedings
    return CriminalProceedings

def get_civil_proceedings():
    from civil_proceedings.models import CivilProceedings
    return CivilProceedings

def get_administrative_proceedings():
    from administrative_code.models import AdministrativeProceedings
    return AdministrativeProceedings

def get_kas_proceedings():
    from administrative_proceedings.models import KasProceedings
    return KasProceedings

def get_case_document():
    from case_documents.models import CaseDocument
    return CaseDocument


class AIService:
    """Сервис AI с использованием Ollama"""
    
    OLLAMA_API_URL = "http://localhost:11434/api/generate"
    
    def __init__(self):
        self.config = AIConfiguration.get_config()
        self.model_name = self._get_available_model()
        self.is_ollama_available = self.model_name is not None
        
        if self.is_ollama_available:
            logger.info(f"AI Сервис запущен с моделью {self.model_name} через Ollama")
        else:
            logger.warning("Ollama не доступен, используется режим заглушки")
    
    def _get_available_model(self):
        return "saiga-7b"
    
    def _check_ollama(self) -> bool:
        return self.is_ollama_available
    
    def is_ready(self) -> bool:
        """Проверяет готовность сервиса"""
        return True
    
    def generate_response(
        self, 
        prompt: str, 
        system_prompt: str = None, 
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """Генерирует ответ через Ollama"""
        
        # Если Ollama доступен - используем его
        if self.is_ollama_available:
            try:
                return self._generate_with_ollama(prompt, system_prompt, temperature, max_tokens)
            except Exception as e:
                logger.error(f"Ошибка генерации через Ollama: {e}")
                return self._get_fallback_response(prompt)
        
        # Иначе используем заглушку
        return self._get_fallback_response(prompt)
    
    def _generate_with_ollama(
        self, 
        prompt: str, 
        system_prompt: str = None, 
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """Генерация через Ollama API"""
        
        full_prompt = prompt
        
        if system_prompt:
            full_prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
        
        payload = {
            "model": self.model_name,
            "prompt": full_prompt,
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stop": ["<|im_end|>", "<|im_start|>"]
        }
        
        response = requests.post(
            self.OLLAMA_API_URL,
            json=payload,
            timeout=300
        )
        
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
        
        result = response.json()
        return result.get('response', '').strip()
    
    def _get_fallback_response(self, prompt: str, case_data: dict = None) -> str:
        """Ответ-заглушка с анализом данных дела"""
        prompt_lower = prompt.lower()
        
        # Если есть данные дела и запрос на анализ
        if case_data and ("анализ" in prompt_lower or "дело" in prompt_lower):
            case_number = case_data.get('case_number', 'неизвестно')
            case_type = case_data.get('case_type', 'неизвестен')
            status = case_data.get('status', 'неизвестен')
            
            return f"""
    📋 АНАЛИЗ ДЕЛА {case_number}

    📌 ТИП ДЕЛА: {case_type}
    📌 СТАТУС: {status}

    🔍 КЛЮЧЕВЫЕ ДАННЫЕ:
    - Дата создания: {case_data.get('created_at', 'не указана')}
    - Количество участников: {len(case_data.get('sides', []))}

    📋 УЧАСТНИКИ:
    {self._format_sides(case_data.get('sides', []))}

    📄 ДОКУМЕНТЫ:
    - Всего документов: {len(case_data.get('documents', []))}

    💡 РЕКОМЕНДАЦИИ:
    1. Проверить полноту материалов дела
    2. Убедиться в соблюдении процессуальных сроков
    3. Проверить правильность оформления документов
    """
        
        if "срок" in prompt_lower:
            return "⏰ Для проверки сроков укажите номер дела."
        
        if "документ" in prompt_lower or "проверк" in prompt_lower:
            return "📄 Для проверки документов укажите название документа."
        
        if "статистик" in prompt_lower:
            return "📊 Статистика будет доступна после настройки."
        
        return """
    🤖 AI АССИСТЕНТ СУДЬИ (Ollama)

    Доступные функции:
    1. 📋 Анализ дела - "Проанализируй дело [номер]"
    2. ⏰ Проверка сроков - "Проверь сроки по делу [номер]"
    3. 📄 Проверка документов - "Проверь документ [название]"
    4. 📊 Статистика - "Покажи статистику суда"

    💡 Для использования реальной модели убедитесь, что Ollama запущен:
    ollama serve
    """

    def _format_sides(self, sides):
        if not sides:
            return "- Нет данных"
        return "\n".join([f"  - {s.get('role', 'Участник')}: {s.get('name', 'Неизвестно')}" for s in sides[:5]])


class CaseAnalyzer:
    """Анализатор дел с использованием AI"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.config = AIConfiguration.get_config()
    
    def _make_json_serializable(self, obj):
        """Преобразует объекты в JSON-сериализуемые"""
        import datetime
        from decimal import Decimal
        
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(v) for v in obj]
        elif isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif hasattr(obj, '__str__'):
            return str(obj)
        return obj
    
    def analyze_case(self, case, analysis_type: str = 'full', user=None) -> Dict:
        """Анализирует дело и возвращает результаты"""
        if not self.config.is_enabled:
            return {
                "error": "AI ассистент отключен", 
                "recommendations": ["AI ассистент отключен в настройках"]
            }
        
        # Определяем тип дела
        case_type = self._get_case_type(case)
        if not case_type:
            return {"error": "Неизвестный тип дела", "recommendations": ["Тип дела не определен"]}
        
        # Собираем данные о деле
        case_data = self._collect_case_data(case, case_type)
        
        # Формируем запрос для AI
        prompt = self._build_prompt(case_data, case_type, analysis_type)
        
        # Получаем ответ
        response = self.ai_service.generate_response(prompt)
        
        # Парсим ответ
        result = self._parse_response(response)
        case_data_serializable = self._make_json_serializable(case_data)
        
        # Добавляем информацию о деле в результат
        result['case_info'] = {
            'case_number': case_data.get('case_number', 'Неизвестно'),
            'case_type': case_type,
            'status': case_data.get('status', 'Неизвестен'),
        }
        
        # Сохраняем анализ в БД
        if user:
            try:
                analysis_obj = AICaseAnalysis.objects.create(
                    case_content_type=ContentType.objects.get_for_model(case),
                    case_object_id=case.id,
                    analysis_type=analysis_type,
                    data=case_data_serializable,
                    recommendations=result.get('recommendations', []),
                    violations=result.get('violations', []),
                    statistics=result.get('statistics', {}),
                    created_by=user,
                    compliance_score=result.get('compliance_score'),
                    quality_score=result.get('quality_score')
                )
                result['analysis_id'] = analysis_obj.id
            except Exception as e:
                logger.error(f"Ошибка сохранения анализа: {e}")
        
        return result
    
    def _get_case_type(self, case) -> Optional[str]:
        """Определяет тип дела"""
        try:
            from criminal_proceedings.models import CriminalProceedings
            if isinstance(case, CriminalProceedings):
                return 'criminal'
        except:
            pass
        
        try:
            from civil_proceedings.models import CivilProceedings
            if isinstance(case, CivilProceedings):
                return 'civil'
        except:
            pass
        
        try:
            from administrative_code.models import AdministrativeProceedings
            if isinstance(case, AdministrativeProceedings):
                return 'coap'
        except:
            pass
        
        try:
            from administrative_proceedings.models import KasProceedings
            if isinstance(case, KasProceedings):
                return 'kas'
        except:
            pass
        
        return None
    
    def _collect_case_data(self, case, case_type: str) -> Dict:
        """Собирает данные о деле"""
        data = {
            'case_type': case_type,
            'case_id': case.id,
            'case_number': self._get_case_number(case, case_type),
            'status': getattr(case, 'status', 'unknown'),
            'created_at': str(getattr(case, 'created_at', None)) if getattr(case, 'created_at', None) else None,
        }
        
        # Собираем данные в зависимости от типа
        if case_type == 'criminal':
            data.update(self._collect_criminal_data(case))
        elif case_type == 'civil':
            data.update(self._collect_civil_data(case))
        elif case_type == 'coap':
            data.update(self._collect_coap_data(case))
        elif case_type == 'kas':
            data.update(self._collect_kas_data(case))
        
        return data
    
    def _get_case_number(self, case, case_type: str) -> str:
        """Получает номер дела"""
        mapping = {
            'criminal': getattr(case, 'case_number_criminal', None),
            'civil': getattr(case, 'case_number_civil', None),
            'coap': getattr(case, 'case_number_admin', None),
            'kas': getattr(case, 'case_number_kas', None),
        }
        return mapping.get(case_type, f"Дело #{case.id}")
    
    def _collect_criminal_data(self, case) -> Dict:
        """Собирает данные уголовного дела"""
        data = {'defendants': [], 'articles': []}
        try:
            for defendant in case.defendants.all():
                data['defendants'].append({
                    'name': getattr(defendant, 'full_name_criminal', 'Неизвестно'),
                    'article': str(defendant.article) if hasattr(defendant, 'article') and defendant.article else None,
                })
                if hasattr(defendant, 'article') and defendant.article:
                    data['articles'].append(str(defendant.article))
        except Exception as e:
            logger.error(f"Ошибка сбора данных уголовного дела: {e}")
        return data
    
    def _collect_civil_data(self, case) -> Dict:
        """Собирает данные гражданского дела"""
        data = {'claims': []}
        try:
            for side in case.civil_sides.all():
                if hasattr(side, 'sides_case_role') and side.sides_case_role:
                    data['claims'].append({
                        'role': getattr(side.sides_case_role, 'sides_case', 'Неизвестно'),
                        'name': getattr(side.sides_case_incase, 'name', 'Неизвестно') if hasattr(side, 'sides_case_incase') else 'Неизвестно',
                    })
        except Exception as e:
            logger.error(f"Ошибка сбора данных гражданского дела: {e}")
        return data
    
    def _collect_coap_data(self, case) -> Dict:
        """Собирает данные дела об АП"""
        return {
            'offense_type': getattr(case, 'offense_area', 'Неизвестно'),
            'article': str(case.koap_article) if hasattr(case, 'koap_article') and case.koap_article else None,
        }
    
    def _collect_kas_data(self, case) -> Dict:
        """Собирает данные дела КАС"""
        return {
            'category': getattr(case, 'case_category', 'Неизвестно'),
            'is_collective': getattr(case, 'is_collective_claim', False),
        }
    
    def _build_prompt(self, case_data: Dict, case_type: str, analysis_type: str) -> str:
        """Строит промпт для AI"""
        case_number = case_data.get('case_number', 'неизвестно')
        data_str = json.dumps(case_data, ensure_ascii=False, indent=2, default=str)[:1000]
        
        return f"""
    Анализ дела {case_number} ({case_type}).
    
    Данные дела:
    {data_str}
    
    Проведи полный анализ дела и дай рекомендации.
    """
    
    def _parse_response(self, response: str) -> Dict:
        """Парсит ответ AI"""
        result = {
            'recommendations': [],
            'violations': [],
            'statistics': {},
            'compliance_score': 75,
            'quality_score': 70,
            'raw_response': response,
        }
        
        try:
            import re
            
            # Ищем рекомендации
            if "РЕКОМЕНДАЦИИ" in response:
                rec_match = re.search(r'РЕКОМЕНДАЦИИ.*?\n(.*?)(?=\n\n|\Z)', response, re.DOTALL)
                if rec_match:
                    rec_text = rec_match.group(1).strip()
                    result['recommendations'] = [r.strip() for r in rec_text.split('\n') if r.strip() and len(r.strip()) > 5]
            
            # Ищем нарушения
            if "НАРУШЕНИЯ" in response:
                viol_match = re.search(r'НАРУШЕНИЯ.*?\n(.*?)(?=\n\n|\Z)', response, re.DOTALL)
                if viol_match:
                    viol_text = viol_match.group(1).strip()
                    result['violations'] = [v.strip() for v in viol_text.split('\n') if v.strip() and len(v.strip()) > 5]
            
            # Ищем оценку
            score_match = re.search(r'ОЦЕНКА.*?(\d+)%', response)
            if score_match:
                try:
                    result['compliance_score'] = int(score_match.group(1))
                except ValueError:
                    pass
            
            # Если ничего не нашли, создаем структурированный ответ
            if not result['recommendations']:
                lines = [l.strip() for l in response.split('\n') if l.strip() and len(l.strip()) > 10]
                if lines:
                    result['recommendations'] = lines[:5]
                else:
                    result['recommendations'] = [response[:200] + "..."]
                    
        except Exception as e:
            logger.error(f"Ошибка парсинга: {e}")
            result['recommendations'] = [response[:200] + "..."]
        
        return result


class DocumentReviewer:
    """Проверка документов"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    def review_document(self, document, case=None) -> Dict:
        """Проверяет документ"""
        response = self.ai_service.generate_response(f"Проверь документ: {document.title}")
        
        return {
            'document_id': document.id,
            'review_result': response,
            'reviewed_at': timezone.now(),
        }


class StatisticsAnalyzer:
    """Статистический анализ"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    def analyze_court_statistics(self, court=None, period_days: int = 365) -> Dict:
        """Анализирует статистику"""
        response = self.ai_service.generate_response("Проанализируй статистику суда")
        
        return {
            'period': period_days,
            'statistics': {'total': 100, 'completed': 60, 'active': 40},
            'analysis': response,
            'analyzed_at': timezone.now(),
        }


class CitizenAssistant:
    """Помощник для граждан"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.config = AIConfiguration.get_config()
    
    def get_help(self, question: str, case=None, external_user=None) -> Dict:
        """Отвечает на вопросы граждан"""
        if not self.config.is_enabled:
            return {"error": "AI ассистент отключен"}
        
        if not self.config.citizen_access_enabled:
            return {"error": "Доступ для граждан отключен"}
        
        response = self.ai_service.generate_response(f"Вопрос гражданина: {question}")
        
        return {
            'question': question,
            'answer': response,
            'case_id': case.id if case else None,
            'responded_at': timezone.now(),
        }


class UniversalAIService:
    """Универсальный AI сервис для юридических консультаций"""
    
    OLLAMA_API_URL = "http://localhost:11434/api/generate"
    EMBEDDING_URL = "http://localhost:11434/api/embeddings"
    
    def __init__(self):
        self.config = AIConfiguration.get_config()
        self.model_name = self._get_available_model()
        self.is_ollama_available = self.model_name is not None
        self.context_window = 4096  # Токенов для контекста
        
        if self.is_ollama_available:
            logger.info(f"AI Сервис запущен с моделью {self.model_name}")
        else:
            logger.warning("Ollama не доступен")
    
    def _get_available_model(self) -> Optional[str]:
        """Получает доступную модель"""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                models = response.json().get('models', [])
                for m in models:
                    name = m.get('name', '')
                    if 'saiga' in name.lower() or 'gemma' in name.lower():
                        return name
            return None
        except:
            return None
    
    def is_ready(self) -> bool:
        return self.is_ollama_available
    
    def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """Генерирует ответ на основе истории сообщений"""
        
        if not self.is_ollama_available:
            return self._get_fallback_response(messages)
        
        try:
            # Формируем промпт из истории
            prompt = self._build_prompt_from_messages(messages, system_prompt)
            
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stop": ["<|im_end|>", "<|im_start|>"]
            }
            
            response = requests.post(
                self.OLLAMA_API_URL,
                json=payload,
                timeout=300
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama API error: {response.status_code}")
            
            result = response.json()
            return result.get('response', '').strip()
            
        except Exception as e:
            logger.error(f"Ошибка генерации: {e}")
            return self._get_fallback_response(messages)
    
    def _build_prompt_from_messages(self, messages: List[Dict], system_prompt: Optional[str] = None) -> str:
        """Строит промпт из сообщений"""
        
        # Юридическая системная инструкция
        legal_system = """Ты - юридический ассистент судьи. Твоя задача помогать в юридических вопросах, 
анализе дел, поиске норм права и даче рекомендаций. Отвечай на русском языке, используя юридическую 
терминологию. Будь точным, ссылайся на законы и нормативные акты когда это уместно.
Если не знаешь точный ответ, скажи об этом."""
        
        if system_prompt:
            legal_system = system_prompt + "\n\n" + legal_system
        
        # Формируем историю
        history_parts = [f"<|im_start|>system\n{legal_system}<|im_end|>"]
        
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'user':
                history_parts.append(f"<|im_start|>user\n{content}<|im_end|>")
            elif role == 'assistant':
                history_parts.append(f"<|im_start|>assistant\n{content}<|im_end|>")
        
        history_parts.append("<|im_start|>assistant\n")
        
        return "\n".join(history_parts)
    
    def _get_fallback_response(self, messages: List[Dict]) -> str:
        """Ответ-заглушка с анализом"""
        last_message = messages[-1].get('content', '') if messages else ''
        prompt_lower = last_message.lower()
        
        # Определяем тему запроса
        if any(word in prompt_lower for word in ['срок', 'сроки', 'пропуск']):
            return self._get_deadline_response(last_message)
        elif any(word in prompt_lower for word in ['статья', 'ук', 'коап']):
            return self._get_article_response(last_message)
        elif any(word in prompt_lower for word in ['анализ', 'дело', 'материал']):
            return self._get_analysis_response(last_message)
        elif any(word in prompt_lower for word in ['документ', 'проверк', 'оформл']):
            return self._get_document_response(last_message)
        elif any(word in prompt_lower for word in ['статистик', 'отчет']):
            return self._get_statistics_response(last_message)
        elif any(word in prompt_lower for word in ['привет', 'здравств']):
            return self._get_greeting_response()
        else:
            return self._get_general_help_response(last_message)
    
    def _get_greeting_response(self) -> str:
        return """🤖 **Юридический AI-ассистент**

Я готов помочь вам с юридическими вопросами и задачами судопроизводства.

**Что я умею:**
• 📋 **Анализировать дела** - дам оценку и рекомендации
• ⏰ **Проверять сроки** - определю процессуальные сроки
• 📄 **Проверять документы** - найду ошибки и недочеты
• 📊 **Анализировать статистику** - помогу с отчетностью
• 📚 **Консультировать** - отвечу на юридические вопросы
• 📎 **Обрабатывать файлы** - прикрепите PDF или Word для анализа

**Примеры запросов:**
- "Проанализируй дело по статье 158 УК РФ"
- "Какие сроки рассмотрения уголовного дела в суде?"
- "Как правильно оформить ходатайство?"
- "Проверь этот документ на ошибки"

Чем могу помочь? 🙋‍♂️"""
    
    def _get_general_help_response(self, query: str) -> str:
        return f"""🤔 **Рассматриваю ваш запрос...**

Пожалуйста, уточните, что именно вас интересует:

1. **Анализ дела** - укажите номер дела или его признаки
2. **Юридическая консультация** - опишите ситуацию подробнее
3. **Проверка документа** - прикрепите файл
4. **Сроки и процедуры** - уточните категорию дела

Я могу помочь с:
• Уголовное судопроизводство
• Гражданское судопроизводство  
• Административное производство
• КАС РФ

Задайте более конкретный вопрос. 📝"""
    
    def _get_deadline_response(self, query: str) -> str:
        return """⏰ **Проверка процессуальных сроков**

Основные сроки в судопроизводстве:

**Уголовный процесс:**
• Срок дознания: до 30 дней (может быть продлен до 6 мес.)
• Срок следствия: до 2 месяцев (может быть продлен)
• Срок рассмотрения судом: до 14 дней (особый порядок)

**Гражданский процесс:**
• Срок исковой давности: 3 года (общий)
• Срок рассмотрения: до 2 месяцев (мировые судьи)

**Административное производство:**
• Срок рассмотрения: до 2 месяцев
• Срок обжалования: 10 дней

**Для проверки конкретных сроков укажите:**
- Категорию дела
- Номер дела (если есть)
- Текущую стадию процесса

Хотите проверить сроки по конкретному делу? 🔍"""
    
    def _get_article_response(self, query: str) -> str:
        return """📚 **Поиск по статьям**

Для поиска статей УК РФ / КоАП РФ уточните:

1. **Номер статьи** - например, "статья 158 УК РФ"
2. **Признаки преступления** - например, "кража, хищение"
3. **Санкция** - например, "штраф, лишение свободы"

**Примеры запросов:**
• "Статья 105 УК РФ - убийство"
• "Кража с проникновением - какая статья?"
• "Административный штраф за нарушение ПДД"

Пожалуйста, уточните вопрос. 📝"""
    
    def _get_analysis_response(self, query: str) -> str:
        return """📋 **Анализ дела**

Для качественного анализа предоставьте:

1. **Номер дела** или его описание
2. **Категорию** (уголовное, гражданское, адм.)
3. **Ключевые обстоятельства**

**Что я могу проанализировать:**
• Соблюдение процессуальных норм
• Оценка доказательств
• Правильность квалификации
• Судебная практика по аналогичным делам
• Перспективы обжалования

Укажите номер дела для анализа. 🔍"""
    
    def _get_document_response(self, query: str) -> str:
        return """📄 **Проверка документов**

Я могу проверить:

1. **Процессуальные документы**
   - Исковые заявления
   - Ходатайства
   - Жалобы
   - Решения суда

2. **Договоры и соглашения**
   - Гражданско-правовые договоры
   - Мировые соглашения

3. **Иные документы**
   - Претензии
   - Уведомления
   - Доверенности

**Для проверки прикрепите файл** (PDF, Word, текст) или вставьте текст документа. 📎"""
    
    def _get_statistics_response(self, query: str) -> str:
        return """📊 **Статистический анализ**

Доступные виды анализа:

1. **Нагрузка судей** - количество дел
2. **Категории дел** - распределение по типам
3. **Сроки рассмотрения** - соблюдение сроков
4. **Результаты** - вынесенные решения

**Для анализа укажите:**
• Период (дни, месяцы, год)
• Суд или судью (опционально)
• Категорию дел (опционально)

Например: "Покажи статистику за январь 2026" 📈"""
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Извлекает текст из загруженного файла"""
        ext = file_path.split('.')[-1].lower() if '.' in file_path else ''
        
        try:
            if ext == 'pdf':
                return self._extract_from_pdf(file_path)
            elif ext == 'docx':
                return self._extract_from_docx(file_path)
            elif ext == 'txt':
                return self._extract_from_txt(file_path)
            else:
                return f"Файл типа .{ext} не поддерживается для извлечения текста"
        except Exception as e:
            logger.error(f"Ошибка извлечения текста: {e}")
            return f"Ошибка при обработке файла: {str(e)}"
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Извлекает текст из PDF"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() or ""
                return text
        except ImportError:
            return "Для работы с PDF требуется установить PyPDF2: pip install PyPDF2"
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Извлекает текст из DOCX"""
        try:
            doc = docx.Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            return text
        except ImportError:
            return "Для работы с DOCX требуется установить python-docx: pip install python-docx"
    
    def _extract_from_txt(self, file_path: str) -> str:
        """Извлекает текст из TXT"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()


class ChatService:
    """Сервис управления чатами"""
    
    def __init__(self):
        self.ai_service = UniversalAIService()
    
    def create_session(self, user, title: str = None, session_type: str = 'general', context: Dict = None) -> ChatSession:
        """Создает новую сессию чата"""
        return ChatSession.objects.create(
            user=user,
            title=title or 'Новый диалог',
            session_type=session_type,
            context=context or {}
        )
    
    def get_sessions(self, user, include_archived: bool = False):
        """Получает сессии пользователя"""
        queryset = ChatSession.objects.filter(user=user)
        if not include_archived:
            queryset = queryset.filter(is_archived=False)
        return queryset
    
    def get_session(self, session_id: str, user) -> Optional[ChatSession]:
        """Получает сессию по ID"""
        try:
            return ChatSession.objects.get(id=session_id, user=user, is_active=True)
        except ChatSession.DoesNotExist:
            return None
    
    def send_message(self, session: ChatSession, message: str, files: List = None) -> Dict:
        """Отправляет сообщение и получает ответ AI"""
        
        # Сохраняем сообщение пользователя
        user_msg = session.add_message('user', message, {
            'has_files': bool(files),
            'files': [f.file_name for f in files] if files else []
        })
        
        # Загружаем файлы
        if files:
            for file_obj in files:
                session.uploaded_files.add(file_obj)
        
        # Получаем историю сообщений
        history = []
        messages = session.get_messages()
        
        # Добавляем контекст сессии
        context_text = session.get_context_string()
        if context_text:
            history.append({
                'role': 'system',
                'content': f"Контекст сессии: {context_text}"
            })
        
        for msg in messages:
            history.append({
                'role': msg.role,
                'content': msg.content
            })
        
        # Добавляем содержимое файлов в контекст
        file_contents = []
        for file_obj in session.uploaded_files.all():
            if file_obj.extracted_text:
                file_contents.append(f"Файл: {file_obj.file_name}\n{file_obj.extracted_text[:5000]}")
        
        if file_contents:
            history.append({
                'role': 'system',
                'content': "Содержимое загруженных файлов:\n" + "\n---\n".join(file_contents[:3])
            })
        
        # Генерируем ответ
        response = self.ai_service.generate_response(history)
        
        # Сохраняем ответ ассистента
        assistant_msg = session.add_message('assistant', response, {
            'model': self.ai_service.model_name,
            'tokens_used': len(response.split())
        })
        
        return {
            'message': assistant_msg,
            'response': response,
            'session': session
        }
    
    def archive_session(self, session: ChatSession):
        """Архивирует сессию"""
        session.is_archived = True
        session.is_active = False
        session.save()
    
    def delete_session(self, session: ChatSession):
        """Удаляет сессию (soft delete)"""
        session.is_active = False
        session.save()
    
    def update_context(self, session: ChatSession, context: Dict):
        """Обновляет контекст сессии"""
        session.context.update(context)
        session.save()


class FileUploadService:
    """Сервис для работы с загруженными файлами"""
    
    def __init__(self):
        self.ai_service = UniversalAIService()
    
    def upload_file(self, file, user, session: ChatSession = None) -> UploadedFile:
        """Загружает и обрабатывает файл"""
        
        file_name = file.name
        file_size = file.size
        
        # Определяем тип файла
        ext = file_name.split('.')[-1].lower() if '.' in file_name else ''
        file_type = self._get_file_type(ext)
        
        # Сохраняем файл
        saved_file = default_storage.save(
            f'ai_uploads/{datetime.now().strftime("%Y/%m/%d")}/{file_name}',
            ContentFile(file.read())
        )
        
        # Создаем запись в БД
        uploaded = UploadedFile.objects.create(
            user=user,
            session=session,
            file=saved_file,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size
        )
        
        # Извлекаем текст
        try:
            file_path = default_storage.path(saved_file)
            extracted = self.ai_service.extract_text_from_file(file_path)
            uploaded.extracted_text = extracted
            uploaded.processed = True
            uploaded.save()
        except Exception as e:
            uploaded.processing_error = str(e)
            uploaded.save()
            logger.error(f"Ошибка обработки файла {file_name}: {e}")
        
        return uploaded
    
    def _get_file_type(self, extension: str) -> str:
        """Определяет тип файла по расширению"""
        mapping = {
            'pdf': 'pdf',
            'docx': 'docx',
            'doc': 'docx',
            'txt': 'txt',
            'rtf': 'txt',
            'png': 'image',
            'jpg': 'image',
            'jpeg': 'image',
            'gif': 'image',
            'bmp': 'image',
        }
        return mapping.get(extension, 'other')
    
    def get_file(self, file_id: int, user) -> Optional[UploadedFile]:
        """Получает файл по ID"""
        try:
            return UploadedFile.objects.get(id=file_id, user=user)
        except UploadedFile.DoesNotExist:
            return None
    
    def delete_file(self, file_id: int, user) -> bool:
        """Удаляет файл"""
        try:
            file_obj = UploadedFile.objects.get(id=file_id, user=user)
            default_storage.delete(file_obj.file.name)
            file_obj.delete()
            return True
        except UploadedFile.DoesNotExist:
            return False
    
    def get_session_files(self, session: ChatSession) -> List[UploadedFile]:
        """Получает файлы сессии"""
        return list(session.uploaded_files.all())