# legal_codes/parsers/coap_parser.py
import re
import json
import sys
import os
from pathlib import Path

# Настройка Django перед импортом
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'judicial_document_management.settings')

from docx import Document

def extract_clauses_from_text(text):
    """
    Извлекает нумерованные пункты из текста части статьи.
    КоАП использует: 1) 2) 3) и т.д., а также 1. 2. 3.
    Возвращает список номеров пунктов.
    """
    clauses = []
    
    # Ищем пункты вида "1) текст", "2) текст" (основной формат КоАП)
    numbered_clauses = re.findall(r'(?:^|\n)(\d+)\)\s*([^\n]+)', text)
    if numbered_clauses:
        clauses = [c[0] for c in numbered_clauses]
    else:
        # Ищем пункты с точкой: 1., 2.
        dot_clauses = re.findall(r'(?:^|\n)(\d+)\.\s+([^\n]+)', text)
        if dot_clauses:
            clauses = [c[0] for c in dot_clauses]
        else:
            # Ищем буквенные подпункты а), б), в)
            letter_clauses = re.findall(r'(?:^|\n)([а-яё])\s*\)\s*([^\n]+)', text)
            if letter_clauses:
                clauses = [c[0] for c in letter_clauses]
    
    return clauses

def extract_parts_and_clauses(full_text):
    """
    Извлекает структуру частей и пунктов из текста статьи КоАП РФ.
    Возвращает: {"parts": [{"number": "1", "clauses": ["1","2","3"]}, ...]}
    """
    structure = {"parts": []}
    
    # Убираем примечания, так как они не являются частью основного текста статьи
    note_match = re.search(r'\n\s*Примечание\.', full_text)
    if note_match:
        full_text = full_text[:note_match.start()]
    
    parts = []
    
    # Ищем части с точкой: "1. текст" (часто используется в КоАП, например, ч.1 ст. 6.13)
    dot_parts = re.findall(r'(?:^|\n)(\d+)\.\s+([^\n]+(?:[^\n]|\n(?!\d+\.|\n\d+\)))*?)(?=(?:\n\d+\.|\n\d+\)|\Z))', full_text, re.DOTALL)
    if len(dot_parts) > 1:
        parts = dot_parts
    else:
        # Ищем части со скобкой: "1) текст"
        paren_parts = re.findall(r'(?:^|\n)(\d+)\)\s+([^\n]+(?:[^\n]|\n(?!\d+\)))*?)(?=(?:\n\d+\)|\Z))', full_text, re.DOTALL)
        if len(paren_parts) > 1:
            parts = paren_parts
        else:
            # Ищем части с явным указанием "часть 1.", "часть 1) "
            named_parts = re.findall(r'(?:^|\n)[Чч]асть\s+(\d+)[\.:\)]?\s*([^\n]+(?:[^\n]|\n(?!Часть\s+\d+|\n\d+[\.\)]))*?)(?=(?:\nЧасть\s+\d+|\n\d+[\.\)]|\Z))', full_text, re.DOTALL)
            if len(named_parts) > 1:
                parts = named_parts
    
    # Если нет явных частей, вся статья считается одной частью
    if not parts:
        parts = [('1', full_text)]
    
    for part_num, part_text in parts:
        clauses = extract_clauses_from_text(part_text)
        structure["parts"].append({
            "number": part_num,
            "clauses": clauses
        })
    
    return structure

def parse_coap(docx_path, silent=False):
    """Парсинг КоАП РФ из docx файла."""
    doc = Document(docx_path)
    articles = []
    
    current_article = None
    current_text = []
    current_section = None
    current_chapter = None
    
    # Паттерны для разных уровней иерархии
    section_pattern = re.compile(r'^Раздел\s+[IVX]+\.\s*(.*)$')
    chapter_pattern = re.compile(r'^Глава\s+(\d+)\.\s*(.*)$')
    # Паттерн для статьи: может быть "Статья 1.1.", "Статья 5.1.", "Статья 19.3."
    article_pattern = re.compile(r'^Статья\s+(\d+(?:\.\d+)?)\s*\.\s*(.*)$')
    
    if not silent:
        print(f"\nНачинаем парсинг КоАП РФ...")
    
    article_count = 0
    
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        
        # Пропускаем служебные строки (шапку документа, списки изменений)
        if ('Список изменяющих документов' in text or 
            text.startswith('(в ред.') or 
            'КонсультантПлюс' in text or
            text.startswith('от ') or
            text == 'РОССИЙСКАЯ ФЕДЕРАЦИЯ' or
            'Принят' in text and 'Государственной Думой' in text or
            'Одобрен' in text and 'Советом Федерации' in text):
            continue
            
        if section_pattern.match(text):
            current_section = text[:300]
            if not silent:
                print(f"\n{current_section[:80]}...")
            continue
        
        chapter_match = chapter_pattern.match(text)
        if chapter_match:
            current_chapter = text[:300]
            if not silent:
                print(f"  {current_chapter[:60]}...")
            continue
        
        article_match = article_pattern.match(text)
        
        if article_match:
            # Сохраняем предыдущую статью
            if current_article:
                full_text = '\n'.join(current_text).strip()
                structure = extract_parts_and_clauses(full_text)
                
                articles.append({
                    'full_number': current_article['full_number'],
                    'number': current_article['number'],
                    'title': current_article['title'],
                    'full_text': full_text,
                    'section': current_section,
                    'chapter': current_chapter,
                    'structure': structure
                })
                article_count += 1
            
            # Начинаем новую статью
            article_num = article_match.group(1)
            article_title = article_match.group(2)
            article_title = re.sub(r'^\s*[-–]\s*', '', article_title)
            
            # Базовая часть номера для сортировки
            number = article_num.split('.')[0] if '.' in article_num else article_num
            
            current_article = {
                'full_number': article_num,
                'number': number,
                'title': article_title
            }
            current_text = []
            
            # Выводим каждую 50-ю статью для отслеживания прогресса
            if not silent and article_count % 50 == 0 and article_count > 0:
                print(f"      ... обработано {article_count} статей")
        else:
            if current_article:
                current_text.append(text)
    
    # Сохраняем последнюю статью
    if current_article:
        full_text = '\n'.join(current_text).strip()
        structure = extract_parts_and_clauses(full_text)
        
        articles.append({
            'full_number': current_article['full_number'],
            'number': current_article['number'],
            'title': current_article['title'],
            'full_text': full_text,
            'section': current_section,
            'chapter': current_chapter,
            'structure': structure
        })
        article_count += 1
    
    if not silent:
        print(f"\n   Найдено статей: {article_count}")
    
    return articles

def import_to_django(articles_data):
    """Импорт статей КоАП РФ в Django"""
    try:
        import django
        django.setup()
    except Exception as e:
        print(f"Ошибка при настройке Django: {e}")
        return
    
    from legal_codes.models import AdministrativeCodeArticle
    
    created_count = 0
    updated_count = 0
    total = len(articles_data)
    
    print(f"\nИмпорт в БД ({total} статей)...")
    
    for i, article_data in enumerate(articles_data):
        obj, created = AdministrativeCodeArticle.objects.update_or_create(
            full_number=article_data['full_number'],
            defaults={
                'number': article_data['number'],
                'title': article_data['title'][:500] if article_data['title'] else '',
                'full_text': article_data['full_text'][:15000] if article_data['full_text'] else '',
                'section': article_data.get('section', ''),
                'chapter': article_data.get('chapter', ''),
                'structure': article_data.get('structure', {'parts': []})
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
        
        if (i + 1) % 100 == 0:
            print(f"   ... импортировано {i + 1}/{total} статей")
    
    print(f"\n✅ Импортировано в БД: {created_count} новых, обновлено: {updated_count}")

def parse_and_import_coap(docx_path=None, silent=False):
    """Основная функция для парсинга и импорта КоАП РФ."""
    if docx_path is None:
        # Путь к папке с файлами кодексов
        docx_folder = Path(__file__).resolve().parent.parent / 'codes_rf_docx'
        docx_path = docx_folder / 'КоАП РФ.docx'
    
    docx_path = Path(docx_path)
    
    if not docx_path.exists():
        print(f"❌ Файл не найден: {docx_path}")
        return
    
    print(f"\n📖 Парсинг файла: {docx_path.name}")
    articles = parse_coap(str(docx_path), silent=silent)
    
    # Сохраняем в JSON (опционально)
    json_file = PROJECT_ROOT / 'coap_articles.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Сохранено {len(articles)} статей в {json_file}")
    
    # Импортируем в БД
    import_to_django(articles)
    
    print("\n✅ Парсинг КоАП РФ завершен!")

if __name__ == '__main__':
    # Если нужно указать конкретный путь к файлу
    # parse_and_import_coap('/path/to/КоАП РФ.docx')
    parse_and_import_coap()