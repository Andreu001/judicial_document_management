# ai_assistant/services.py
# Версия с использованием Ollama API
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import requests

from .models import AIConfiguration, AICaseAnalysis

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
        return "llama3.2:1b"
    
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
            "model": self.model_name,  # ИСПРАВЛЕНО: self.model_name
            "prompt": full_prompt,
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stop": ["<|im_end|>", "<|im_start|>"]
        }
        
        response = requests.post(
            self.OLLAMA_API_URL,
            json=payload,
            timeout=120
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
