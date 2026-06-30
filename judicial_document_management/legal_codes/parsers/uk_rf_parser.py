import re
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from docx import Document

def extract_parts_and_clauses(full_text):
    """
    Извлекает структуру частей и пунктов из текста статьи
    Возвращает: {"parts": [{"number": "1", "clauses": ["а","б","в"]}, {"number": "2", "clauses": ["1","2"]}]}
    """
    structure = {"parts": []}
    
    # Убираем всё, что идет после "Примечание" или "Примечания", так как это не часть статьи
    # Ищем первое вхождение слова "Примечание" в начале строки или после переноса
    note_match = re.search(r'\n\s*Примечани[её]', full_text)
    if note_match:
        full_text = full_text[:note_match.start()]
    
    # Ищем части: "1. текст...", "2. текст..."
    numbered_parts = re.findall(r'(?:^|\n)(\d+)\.\s+([^\n]+(?:[^\n]|\n(?!\d+\.|\n[Чч]асть))*?)(?=(?:\n\d+\.|\n[Чч]асть|\Z))', full_text, re.DOTALL)
    
    # Ищем части: "Часть 1. текст...", "Часть 2. текст..."
    named_parts = re.findall(r'(?:^|\n)[Чч]асть\s+(\d+)[\.:]\s+([^\n]+(?:[^\n]|\n(?!Часть\s+\d+[\.:]|\n\d+\.|\Z))*?)', full_text, re.DOTALL)
    
    parts = []
    if len(numbered_parts) > 1:
        parts = numbered_parts
    elif len(named_parts) > 1:
        parts = named_parts
    else:
        # Если нет явных частей, вся статья - одна часть
        parts = [('1', full_text)]
    
    for part_num, part_text in parts:
        # Извлекаем пункты из текста части
        clauses = []
        
        # Ищем пункты вида: а), б), в) или 1), 2), 3)
        # Буквенные пункты
        letter_clauses = re.findall(r'(?:^|\n)([а-яё])\s*\)\s*([^\n]+)', part_text)
        if letter_clauses:
            clauses = [c[0] for c in letter_clauses]
        else:
            # Цифровые пункты 1), 2), 3)
            number_clauses = re.findall(r'(?:^|\n)(\d+)\s*\)\s*([^\n]+)', part_text)
            if number_clauses:
                clauses = [c[0] for c in number_clauses]
            else:
                # Пункты с точкой а., б., 1., 2.
                dot_clauses = re.findall(r'(?:^|\n)([а-яё\d]+)\.\s+([^\n]+)', part_text)
                if dot_clauses:
                    clauses = [c[0] for c in dot_clauses]
        
        structure["parts"].append({
            "number": part_num,
            "clauses": clauses
        })
    
    return structure

def parse_uk_rf(docx_path):
    """Парсинг УК РФ из docx файла"""
    doc = Document(docx_path)
    articles = []
    
    current_article = None
    current_text = []
    current_chapter = None
    current_section = None
    
    article_pattern = re.compile(r'^Статья\s+(\d+(?:\.\d+)?)\s*\.\s*(.*)$')
    chapter_pattern = re.compile(r'^Глава\s+\d+\.\s*(.*)$')
    section_pattern = re.compile(r'^Раздел\s+[IVX]+\.\s*(.*)$')
    
    print("Начинаем парсинг УК РФ...\n")
    
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        
        # Пропускаем список изменяющих документов
        if 'Список изменяющих документов' in text or text.startswith('от '):
            continue
            
        if section_pattern.match(text):
            current_section = text[:200]
            print(f"Раздел: {current_section}")
            continue
        
        if chapter_pattern.match(text):
            current_chapter = text[:200]
            print(f"Глава: {current_chapter}")
            continue
        
        article_match = article_pattern.match(text)
        
        if article_match:
            if current_article:
                full_text = '\n'.join(current_text).strip()
                structure = extract_parts_and_clauses(full_text)
                
                articles.append({
                    'full_number': current_article['full_number'],
                    'number': current_article['number'],
                    'title': current_article['title'],
                    'full_text': full_text,
                    'chapter': current_chapter,
                    'section': current_section,
                    'structure': structure
                })
            
            article_num = article_match.group(1)
            article_title = article_match.group(2)
            article_title = re.sub(r'^\s*[-–]\s*', '', article_title)
            
            number = article_num.split('.')[0] if '.' in article_num else article_num
            
            current_article = {
                'full_number': article_num,
                'number': number,
                'title': article_title
            }
            current_text = []
            
            print(f"  Статья {article_num}: {article_title[:50]}...")
        else:
            if current_article:
                current_text.append(text)
    
    if current_article:
        full_text = '\n'.join(current_text).strip()
        structure = extract_parts_and_clauses(full_text)
        
        articles.append({
            'full_number': current_article['full_number'],
            'number': current_article['number'],
            'title': current_article['title'],
            'full_text': full_text,
            'chapter': current_chapter,
            'section': current_section,
            'structure': structure
        })
    
    return articles

def import_to_django(json_path):
    """Импорт статей в Django"""
    import django
    django.setup()
    
    from legal_codes.models import CriminalCodeArticle
    
    with open(json_path, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    
    created_count = 0
    updated_count = 0
    
    for article_data in articles_data:
        obj, created = CriminalCodeArticle.objects.update_or_create(
            full_number=article_data['full_number'],
            defaults={
                'number': article_data['number'],
                'title': article_data['title'][:500],
                'full_text': article_data['full_text'][:15000],
                'chapter': article_data.get('chapter', ''),
                'section': article_data.get('section', ''),
                'structure': article_data.get('structure', {'parts': []})
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
    
    print(f"Импортировано: {created_count} новых, обновлено: {updated_count}")

if __name__ == '__main__':
    docx_folder = Path(__file__).resolve().parent.parent / 'codes_rf_docx'
    docx_file = docx_folder / 'УК РФ.docx'
    
    if not docx_file.exists():
        print(f"❌ Файл не найден: {docx_file}")
        sys.exit(1)
    
    print(f"📖 Парсинг файла: {docx_file}\n")
    articles = parse_uk_rf(str(docx_file))
    
    json_file = PROJECT_ROOT / 'uk_rf_articles.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        articles_for_json = []
        for a in articles:
            a_copy = a.copy()
            articles_for_json.append(a_copy)
        json.dump(articles_for_json, f, ensure_ascii=False, indent=2)
    
    print(f"\nСохранено {len(articles)} статей в {json_file}")
    
    print("\n💾 Импорт в базу данных...")
    import_to_django(str(json_file))
    
    print("\n✅ Готово!")