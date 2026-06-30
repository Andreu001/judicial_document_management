# management/commands/import_civil_code.py

import re
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from legal_codes.models import CivilCodeArticle
from docx import Document


class Command(BaseCommand):
    help = 'Импорт статей Гражданского кодекса РФ из DOCX файлов'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--part1',
            type=str,
            help='Путь к DOCX файлу Части первой ГК РФ'
        )
        parser.add_argument(
            '--part2',
            type=str,
            help='Путь к DOCX файлу Части второй ГК РФ'
        )
        parser.add_argument(
            '--part3',
            type=str,
            help='Путь к DOCX файлу Части третьей ГК РФ'
        )
        parser.add_argument(
            '--part4',
            type=str,
            help='Путь к DOCX файлу Части четвертой ГК РФ'
        )
        parser.add_argument(
            '--silent',
            action='store_true',
            help='Не выводить детали парсинга в терминал'
        )
    
    def handle(self, *args, **options):
        silent = options.get('silent', False)
        
        # Определение файлов
        files = {}
        part_names = {
            'part1': 'Часть первая',
            'part2': 'Часть вторая',
            'part3': 'Часть третья',
            'part4': 'Часть четвертая'
        }
        
        # Путь к папке с файлами ГК РФ (относительно папки с manage.py)
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        default_folder = base_dir / 'legal_codes' / 'codes_rf_docx'
        
        for opt_key, part_name in part_names.items():
            if options.get(opt_key):
                path = Path(options[opt_key])
            else:
                # Маппинг имен файлов
                file_map = {
                    'part1': 'ГК РФ 4.docx',
                    'part2': 'ГК РФ 3.docx',
                    'part3': 'ГК РФ 2.docx',
                    'part4': 'ГК РФ 1.docx'
                }
                path = default_folder / file_map[opt_key]
            
            if path.exists():
                files[str(path)] = part_name
                self.stdout.write(f"📄 Найден файл: {path.name} - {part_name}")
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Файл не найден: {path}"))
        
        if not files:
            self.stdout.write(self.style.ERROR("❌ Не найдено ни одного файла ГК РФ"))
            return
        
        all_articles = []
        
        for file_path, part_name in files.items():
            self.stdout.write(f"\n📖 Парсинг {part_name}...")
            articles = self.parse_civil_code(file_path, part_name, silent=silent)
            self.stdout.write(f"   Найдено статей: {len(articles)}")
            all_articles.extend(articles)
        
        # Импорт в БД
        self.stdout.write("\n💾 Импорт в базу данных...")
        
        created_count = 0
        updated_count = 0
        total = len(all_articles)
        
        with transaction.atomic():
            for i, article_data in enumerate(all_articles):
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
                
                if not silent and (i + 1) % 100 == 0:
                    self.stdout.write(f"   ... импортировано {i + 1}/{total} статей")
        
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Импортировано: {created_count} новых, обновлено: {updated_count}"
        ))
    
    def parse_civil_code(self, docx_path, part_name, silent=False):
        """Парсинг конкретной части ГК РФ"""
        doc = Document(docx_path)
        articles = []
        
        current_article = None
        current_text = []
        current_section = None
        current_subsection = None
        current_chapter = None
        current_part = part_name
        
        section_pattern = re.compile(r'^Раздел\s+[IVX]+\.\s*(.*)$')
        subsection_pattern = re.compile(r'^Подраздел\s+\d+\.\s*(.*)$')
        chapter_pattern = re.compile(r'^Глава\s+\d+\.\s*(.*)$')
        article_pattern = re.compile(r'^Статья\s+(\d+(?:\.\d+)?)\s*\.\s*(.*)$')
        
        article_count = 0
        
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if not text:
                continue
            
            if 'Список изменяющих документов' in text or text.startswith('от '):
                continue
            
            if section_pattern.match(text):
                current_section = text[:300]
                current_subsection = None
                continue
            
            if subsection_pattern.match(text):
                current_subsection = text[:300]
                continue
            
            if chapter_pattern.match(text):
                current_chapter = text[:300]
                continue
            
            article_match = article_pattern.match(text)
            
            if article_match:
                if current_article:
                    full_text = '\n'.join(current_text).strip()
                    structure = self.extract_parts_and_clauses(full_text)
                    
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
            else:
                if current_article:
                    current_text.append(text)
        
        if current_article:
            full_text = '\n'.join(current_text).strip()
            structure = self.extract_parts_and_clauses(full_text)
            
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
        
        return articles
    
    def extract_clauses_from_text(self, text):
        """Извлекает нумерованные пункты из текста части статьи"""
        clauses = []
        
        # Ищем пункты вида "1) текст", "2) текст"
        numbered_clauses = re.findall(r'(?:^|\n)(\d+)\)\s*([^\n]+(?:[^\n]|\n(?!\d+\)|\n[а-яё]\)))*?)', text, re.DOTALL)
        if numbered_clauses:
            clauses = [c[0] for c in numbered_clauses]
        else:
            # Ищем буквенные подпункты а), б), в)
            letter_clauses = re.findall(r'(?:^|\n)([а-яё])\s*\)\s*([^\n]+)', text)
            if letter_clauses:
                clauses = [c[0] for c in letter_clauses]
            else:
                # Ищем пункты с точкой: 1., 2. или а., б.
                dot_clauses = re.findall(r'(?:^|\n)([а-яё\d]+)\.\s+([^\n]+)', text)
                if dot_clauses:
                    clauses = [c[0] for c in dot_clauses]
        
        return clauses
    
    def extract_parts_and_clauses(self, full_text):
        """Извлекает структуру частей и пунктов из текста статьи ГК РФ"""
        structure = {"parts": []}
        
        note_match = re.search(r'\n\s*Примечание', full_text)
        if note_match:
            full_text = full_text[:note_match.start()]
        
        parts = []
        
        # Ищем части с точкой: "1. текст"
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
        
        if not parts:
            parts = [('1', full_text)]
        
        for part_num, part_text in parts:
            clauses = self.extract_clauses_from_text(part_text)
            structure["parts"].append({
                "number": part_num,
                "clauses": clauses
            })
        
        return structure