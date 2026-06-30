import re
import json
import sys
import os
from pathlib import Path

# Настройка Django перед импортом - ПРАВИЛЬНЫЙ ПУТЬ
# civil_code_parser.py находится в legal_codes/parsers/
# PROJECT_ROOT должен указывать на папку judicial_document_management (где manage.py)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # поднимаемся на 3 уровня
sys.path.insert(0, str(PROJECT_ROOT))

# Устанавливаем настройки Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'judicial_document_management.settings')

# Теперь можно импортировать Django
from docx import Document

def extract_clauses_from_text(text):
    """
    Извлекает нумерованные пункты из текста части статьи.
    ГК РФ использует: 1), 2), 3) и т.д., а также а), б), в) внутри некоторых пунктов.
    Возвращает список номеров пунктов.
    """
    clauses = []
    
    # Сначала ищем пункты вида "1) текст", "2) текст"
    numbered_clauses = re.findall(r'(?:^|\n)(\d+)\)\s*([^\n]+(?:[^\n]|\n(?!\d+\)|\n[а-яё]\)))*?)', text, re.DOTALL)
    if numbered_clauses:
        clauses = [c[0] for c in numbered_clauses]
    else:
        # Если нет цифровых пунктов, ищем буквенные подпункты а), б), в)
        letter_clauses = re.findall(r'(?:^|\n)([а-яё])\s*\)\s*([^\n]+)', text)
        if letter_clauses:
            clauses = [c[0] for c in letter_clauses]
        else:
            # Ищем пункты с точкой: 1., 2. или а., б.
            dot_clauses = re.findall(r'(?:^|\n)([а-яё\d]+)\.\s+([^\n]+)', text)
            if dot_clauses:
                clauses = [c[0] for c in dot_clauses]
    
    return clauses

def extract_parts_and_clauses(full_text):
    """
    Извлекает структуру частей и пунктов из текста статьи ГК РФ.
    Возвращает: {"parts": [{"number": "1", "clauses": ["1","2","3"]}, {"number": "2", "clauses": ["1","2"]}]}
    """
    structure = {"parts": []}
    
    # Убираем примечания, если они есть
    note_match = re.search(r'\n\s*Примечание', full_text)
    if note_match:
        full_text = full_text[:note_match.start()]
    
    # Паттерн для поиска частей: "1. текст" или "1) текст"
    parts = []
    
    # Сначала ищем части с точкой: "1. текст"
    dot_parts = re.findall(r'(?:^|\n)(\d+)\.\s+([^\n]+(?:[^\n]|\n(?!\d+\.|\n[Чч]асть|\n\d+\)))*?)(?=(?:\n\d+\.|\n[Чч]асть|\n\d+\)|\Z))', full_text, re.DOTALL)
    if len(dot_parts) > 1:
        parts = dot_parts
    else:
        # Ищем части со скобкой: "1) текст"
        paren_parts = re.findall(r'(?:^|\n)(\d+)\)\s+([^\n]+(?:[^\n]|\n(?!\d+\)|\n[Чч]асть))*?)(?=(?:\n\d+\)|\n[Чч]асть|\Z))', full_text, re.DOTALL)
        if len(paren_parts) > 1:
            parts = paren_parts
        else:
            # Ищем части с явным указанием "Часть 1."
            named_parts = re.findall(r'(?:^|\n)[Чч]асть\s+(\d+)[\.:]\s+([^\n]+(?:[^\n]|\n(?!Часть\s+\d+[\.:]|\n\d+\.))*?)(?=(?:\nЧасть\s+\d+[\.:]|\n\d+\.|\Z))', full_text, re.DOTALL)
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

def parse_civil_code(docx_path, part_name, silent=False):
    """
    Парсинг конкретной части ГК РФ из docx файла.
    part_name: "Часть первая", "Часть вторая" и т.д.
    silent: если True, не выводить прогресс в терминал
    """
    doc = Document(docx_path)
    articles = []
    
    current_article = None
    current_text = []
    current_section = None
    current_subsection = None
    current_chapter = None
    current_part = part_name
    
    # Паттерны для разных уровней иерархии
    section_pattern = re.compile(r'^Раздел\s+[IVX]+\.\s*(.*)$')
    subsection_pattern = re.compile(r'^Подраздел\s+\d+\.\s*(.*)$')
    chapter_pattern = re.compile(r'^Глава\s+\d+\.\s*(.*)$')
    article_pattern = re.compile(r'^Статья\s+(\d+(?:\.\d+)?)\s*\.\s*(.*)$')
    
    if not silent:
        print(f"\nНачинаем парсинг {part_name}...")
    
    article_count = 0
    
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        
        # Пропускаем служебные строки
        if 'Список изменяющих документов' in text or text.startswith('от ') or text.startswith('(в ред.'):
            continue
            
        if section_pattern.match(text):
            current_section = text[:300]
            current_subsection = None
            if not silent:
                print(f"\n{current_section[:80]}...")
            continue
        
        if subsection_pattern.match(text):
            current_subsection = text[:300]
            if not silent:
                print(f"  {current_subsection[:70]}...")
            continue
        
        if chapter_pattern.match(text):
            current_chapter = text[:300]
            if not silent:
                print(f"    {current_chapter[:60]}...")
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
                    'part': current_part,
                    'section': current_section,
                    'subsection': current_subsection,
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
            'part': current_part,
            'section': current_section,
            'subsection': current_subsection,
            'chapter': current_chapter,
            'structure': structure
        })
        article_count += 1
    
    if not silent:
        print(f"   Найдено статей: {article_count}")
    
    return articles

def import_to_django(json_path):
    """Импорт статей ГК РФ в Django"""
    try:
        import django
        django.setup()
    except Exception as e:
        print(f"Ошибка при настройке Django: {e}")
        print("Убедитесь, что:")
        print("1. Вы запускаете скрипт из правильной директории")
        print("2. Установлены все зависимости Django")
        print("3. Путь к проекту добавлен в PYTHONPATH")
        return
    
    from legal_codes.models import CivilCodeArticle
    
    with open(json_path, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    
    created_count = 0
    updated_count = 0
    total = len(articles_data)
    
    print(f"\nИмпорт в БД ({total} статей)...")
    
    for i, article_data in enumerate(articles_data):
        obj, created = CivilCodeArticle.objects.update_or_create(
            full_number=article_data['full_number'],
            defaults={
                'number': article_data['number'],
                'title': article_data['title'][:500] if article_data['title'] else '',
                'full_text': article_data['full_text'][:15000] if article_data['full_text'] else '',
                'part': article_data.get('part', ''),
                'section': article_data.get('section', ''),
                'subsection': article_data.get('subsection', ''),
                'chapter': article_data.get('chapter', ''),
                'structure': article_data.get('structure', {'parts': []})
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
        
        # Выводим прогресс каждые 100 статей
        if (i + 1) % 100 == 0:
            print(f"   ... импортировано {i + 1}/{total} статей")
    
    print(f"\n✅ Импортировано в БД: {created_count} новых, обновлено: {updated_count}")

def parse_all_civil_codes(silent=False):
    """Парсинг всех частей ГК РФ"""
    # Путь к папке с файлами ГК РФ
    docx_folder = Path(__file__).resolve().parent.parent / 'codes_rf_docx'
    
    # Файлы ГК РФ
    civil_files = {
        'ГК РФ 4.docx': 'Часть первая',   # от 30.11.1994
        'ГК РФ 3.docx': 'Часть вторая',   # от 26.01.1996
        'ГК РФ 2.docx': 'Часть третья',   # от 26.11.2001
        'ГК РФ 1.docx': 'Часть четвертая' # от 18.12.2006
    }
    
    all_articles = []
    
    for filename, part_name in civil_files.items():
        docx_file = docx_folder / filename
        
        if not docx_file.exists():
            print(f"❌ Файл не найден: {docx_file}")
            continue
        
        print(f"\n📖 Парсинг файла: {docx_file.name}")
        articles = parse_civil_code(str(docx_file), part_name, silent=silent)
        all_articles.extend(articles)
    
    # Сохраняем в JSON
    json_file = PROJECT_ROOT / 'civil_code_articles.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Сохранено {len(all_articles)} статей в {json_file}")
    
    # Импортируем в БД
    print("\n💾 Импорт в базу данных...")
    import_to_django(str(json_file))
    
    print("\n✅ Готово!")

if __name__ == '__main__':
    parse_all_civil_codes()