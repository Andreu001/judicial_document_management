import re
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from legal_codes.models import CriminalCodeArticle
from docx import Document

class Command(BaseCommand):
    help = 'Импорт статей УК РФ из DOCX файла'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Путь к DOCX файлу (по умолчанию: legal_codes/codes_rf_docx/УК РФ.docx)'
        )
    
    def handle(self, *args, **options):
        if options.get('file'):
            docx_path = Path(options['file'])
        else:
            docx_path = Path(__file__).resolve().parent.parent.parent / 'codes_rf_docx' / 'УК РФ.docx'
        
        if not docx_path.exists():
            self.stdout.write(self.style.ERROR(f'❌ Файл не найден: {docx_path}'))
            return
        
        self.stdout.write(f'📖 Парсинг файла: {docx_path}')
        
        articles = self.parse_docx(docx_path)
        self.stdout.write(f'📊 Найдено статей: {len(articles)}')
        
        created_count = 0
        updated_count = 0
        
        for article_data in articles:
            obj, created = CriminalCodeArticle.objects.update_or_create(
                full_number=article_data['full_number'],
                defaults={
                    'number': article_data['number'],
                    'title': article_data['title'][:500] if article_data['title'] else '',
                    'full_text': article_data['full_text'][:15000] if article_data['full_text'] else '',
                    'chapter': article_data.get('chapter', ''),
                    'section': article_data.get('section', ''),
                    'structure': article_data.get('structure', {'parts': []})
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'✅ Импортировано: {created_count} новых, обновлено: {updated_count}'
        ))
    
    def parse_docx(self, docx_path):
        doc = Document(docx_path)
        articles = []
        
        current_article = None
        current_text = []
        current_chapter = None
        current_section = None
        
        article_pattern = re.compile(r'^Статья\s+(\d+(?:\.\d+)?)\s*\.\s*(.*)$')
        chapter_pattern = re.compile(r'^Глава\s+\d+\.\s*(.*)$')
        section_pattern = re.compile(r'^Раздел\s+[IVX]+\.\s*(.*)$')
        
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if not text:
                continue
            
            # Пропускаем список изменяющих документов
            if 'Список изменяющих документов' in text or text.startswith('от '):
                continue
            
            if section_pattern.match(text):
                current_section = text[:200]
                continue
            
            if chapter_pattern.match(text):
                current_chapter = text[:200]
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
                'chapter': current_chapter,
                'section': current_section,
                'structure': structure
            })
        
        return articles
    
    def extract_parts_and_clauses(self, full_text):
        """Извлекает структуру частей и пунктов из текста статьи"""
        structure = {"parts": []}
        
        # Убираем всё, что идет после "Примечание" или "Примечания"
        note_match = re.search(r'\n\s*Примечани[её]', full_text)
        if note_match:
            full_text = full_text[:note_match.start()]
        
        parts = []
        
        # Паттерн для поиска "1. текст", "2. текст"
        numbered_parts = re.findall(r'(?:^|\n)(\d+)\.\s+([^\n]+(?:[^\n]|\n(?!\d+\.|\n[Чч]асть))*?)(?=(?:\n\d+\.|\n[Чч]асть|\Z))', full_text, re.DOTALL)
        
        # Паттерн для поиска "Часть 1. текст", "Часть 2. текст"
        named_parts = re.findall(r'(?:^|\n)[Чч]асть\s+(\d+)[\.:]\s+([^\n]+(?:[^\n]|\n(?!Часть\s+\d+[\.:]|\n\d+\.|\Z))*?)(?=(?:\nЧасть\s+\d+[\.:]|\n\d+\.|\Z))', full_text, re.DOTALL)
        
        if len(numbered_parts) > 1:
            parts = numbered_parts
        elif len(named_parts) > 1:
            parts = named_parts
        else:
            parts = [('1', full_text)]
        
        for part_num, part_text in parts:
            clauses = []
            
            # Буквенные пункты а), б), в)
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