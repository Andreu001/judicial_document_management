# legal_codes/parsers/kas_parser.py
import re
import json
import sys
import os
from pathlib import Path

# Настройка Django
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'judicial_document_management.settings')

from docx import Document

def extract_clauses_from_text(text):
    """
    Извлекает нумерованные пункты из текста части статьи КАС.
    КАС использует в основном пункты вида: 1), 2), 3)
    """
    clauses = []
    # Ищем пункты вида "1) текст", "2) текст" (основной формат КАС)
    # Используем регулярное выражение, которое ищет цифры, за которыми следует ')'
    numbered_clauses = re.findall(r'(?:^|\n)(\d+)\)\s*([^\n]+)', text)
    if numbered_clauses:
        clauses = [c[0] for c in numbered_clauses]
    else:
        # Резервный вариант: ищем пункты с точкой 1., 2.
        dot_clauses = re.findall(r'(?:^|\n)(\d+)\.\s+([^\n]+)', text)
        if dot_clauses:
            clauses = [c[0] for c in dot_clauses]
        else:
            # Ищем буквенные подпункты а), б), в) (могут быть внутри пунктов)
            letter_clauses = re.findall(r'(?:^|\n)([а-яё])\s*\)\s*([^\n]+)', text)
            if letter_clauses:
                clauses = [c[0] for c in letter_clauses]
    return clauses

def extract_parts_and_clauses(full_text):
    """
    Извлекает структуру частей и пунктов из текста статьи КАС.
    Возвращает: {"parts": [{"number": "1", "clauses": ["1","2","3"]}, ...]}
    """
    structure = {"parts": []}

    # Убираем примечания, если они есть (иногда бывают в конце статей)
    note_match = re.search(r'\n\s*Примечание\.', full_text)
    if note_match:
        full_text = full_text[:note_match.start()]

    parts = []

    # 1. Ищем части с явным указанием "Часть 1.", "Часть 2." (основной формат КАС)
    named_parts = re.findall(
        r'(?:^|\n)[Чч]асть\s+(\d+)[\.:]?\s*([^\n]+(?:[^\n]|\n(?!Часть\s+\d+[\.:]|\n\d+[\.\)]))*?)',
        full_text, re.DOTALL
    )
    if len(named_parts) > 1:
        parts = named_parts
    else:
        # 2. Ищем части с точкой: "1. текст", "2. текст" (альтернативный формат)
        dot_parts = re.findall(
            r'(?:^|\n)(\d+)\.\s+([^\n]+(?:[^\n]|\n(?!\d+\.|\n\d+\)))*?)(?=(?:\n\d+\.|\n\d+\)|\Z))',
            full_text, re.DOTALL
        )
        if len(dot_parts) > 1:
            parts = dot_parts
        else:
            # 3. Ищем части со скобкой: "1) текст", "2) текст"
            paren_parts = re.findall(
                r'(?:^|\n)(\d+)\)\s+([^\n]+(?:[^\n]|\n(?!\d+\)))*?)(?=(?:\n\d+\)|\Z))',
                full_text, re.DOTALL
            )
            if len(paren_parts) > 1:
                parts = paren_parts

    # Если нет явных частей, вся статья считается одной частью (часть 1)
    if not parts:
        parts = [('1', full_text)]

    for part_num, part_text in parts:
        # Для каждой части извлекаем список пунктов
        clauses = extract_clauses_from_text(part_text)
        structure["parts"].append({
            "number": part_num,
            "clauses": clauses
        })

    return structure

def parse_kas(docx_path, silent=False):
    """Парсинг КАС РФ из docx файла."""
    doc = Document(docx_path)
    articles = []

    current_article = None
    current_text = []
    current_section = None
    current_chapter = None

    # Паттерны для иерархии КАС
    # Раздел: "РАЗДЕЛ I. ОБЩИЕ ПОЛОЖЕНИЯ" или "Раздел I. ОБЩИЕ ПОЛОЖЕНИЯ"
    section_pattern = re.compile(r'^(РАЗДЕЛ|Раздел)\s+[IVX]+\.\s*(.*)$')
    # Глава: "Глава 1. ОСНОВНЫЕ ПОЛОЖЕНИЯ"
    chapter_pattern = re.compile(r'^Глава\s+(\d+)\.\s*(.*)$')
    # Статья: "Статья 1. Предмет регулирования настоящего Кодекса"
    article_pattern = re.compile(r'^Статья\s+(\d+(?:\.\d+)?)\s*\.\s*(.*)$')

    if not silent:
        print(f"\nНачинаем парсинг КАС РФ...")

    article_count = 0

    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue

        # Пропускаем служебные строки (шапку, списки изменений)
        if ('Список изменяющих документов' in text or
            'КонсультантПлюс' in text or
            text.startswith('(в ред.') or
            text == 'РОССИЙСКАЯ ФЕДЕРАЦИЯ' or
            ('Принят' in text and 'Государственной Думой' in text) or
            ('Одобрен' in text and 'Советом Федерации' in text) or
            text.startswith('от ') or
            'Президент' in text and 'Российской Федерации' in text):
            continue

        # Проверка на Раздел
        section_match = section_pattern.match(text)
        if section_match:
            # В зависимости от группы сохраняем полное название
            if section_match.group(2):
                current_section = f"{section_match.group(1)} {section_match.group(2)}" # "Раздел I. ОБЩИЕ ПОЛОЖЕНИЯ"
            else:
                current_section = text[:300]
            if not silent:
                print(f"\n{current_section[:80]}...")
            continue

        # Проверка на Главу
        chapter_match = chapter_pattern.match(text)
        if chapter_match:
            current_chapter = text[:300]
            if not silent:
                print(f"  {current_chapter[:60]}...")
            continue

        # Проверка на Статью
        article_match = article_pattern.match(text)
        if article_match:
            # Сохраняем предыдущую статью
            if current_article:
                full_text = '\n'.join(current_text).strip()
                if full_text: # Сохраняем только если есть текст
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
                    if not silent and article_count % 50 == 0:
                        print(f"      ... обработано {article_count} статей")

            # Начинаем новую статью
            article_num = article_match.group(1)
            article_title = article_match.group(2)
            # Убираем начальные тире/дефисы из названия, если есть
            article_title = re.sub(r'^\s*[-–]\s*', '', article_title)

            # Базовая часть номера для сортировки
            number = article_num.split('.')[0] if '.' in article_num else article_num

            current_article = {
                'full_number': article_num,
                'number': number,
                'title': article_title
            }
            current_text = []
        else:
            # Собираем текст текущей статьи
            if current_article:
                current_text.append(text)

    # Сохраняем последнюю статью
    if current_article:
        full_text = '\n'.join(current_text).strip()
        if full_text:
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

def import_kas_to_django(articles_data):
    """Импорт статей КАС РФ в Django"""
    try:
        import django
        django.setup()
    except Exception as e:
        print(f"Ошибка при настройке Django: {e}")
        return

    from legal_codes.models import KASCodeArticle

    created_count = 0
    updated_count = 0
    total = len(articles_data)

    print(f"\nИмпорт в БД ({total} статей)...")

    for i, article_data in enumerate(articles_data):
        # Ограничиваем длину текста, если нужно (можно убрать или увеличить)
        full_text = article_data['full_text']
        if len(full_text) > 15000:
            full_text = full_text[:15000] + "..." # Обрезаем, если модель ограничена

        obj, created = KASCodeArticle.objects.update_or_create(
            full_number=article_data['full_number'],
            defaults={
                'number': article_data['number'],
                'title': article_data['title'][:500] if article_data['title'] else '',
                'full_text': full_text,
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

def parse_and_import_kas(docx_path=None, silent=False):
    """Основная функция для парсинга и импорта КАС РФ."""
    if docx_path is None:
        # Путь к папке с файлами кодексов (настройте под свою структуру)
        docx_folder = Path(__file__).resolve().parent.parent / 'codes_rf_docx'
        docx_path = docx_folder / 'КАС РФ.docx'  # Убедитесь, что имя файла совпадает

    docx_path = Path(docx_path)

    if not docx_path.exists():
        print(f"❌ Файл не найден: {docx_path}")
        return

    print(f"\n📖 Парсинг файла: {docx_path.name}")
    articles = parse_kas(str(docx_path), silent=silent)

    if not articles:
        print("⚠️ Статей не найдено. Проверьте формат файла.")
        return

    # Сохраняем в JSON (опционально)
    json_file = PROJECT_ROOT / 'kas_articles.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Сохранено {len(articles)} статей в {json_file}")

    # Импортируем в БД
    import_kas_to_django(articles)

    print("\n✅ Парсинг КАС РФ завершен!")

if __name__ == '__main__':
    # Запуск парсера
    parse_and_import_kas()