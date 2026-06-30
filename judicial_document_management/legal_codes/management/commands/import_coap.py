# legal_codes/management/commands/import_coap.py

from pathlib import Path
from django.core.management.base import BaseCommand
from legal_codes.parsers.coap_parser import parse_and_import_coap


class Command(BaseCommand):
    help = 'Импорт Кодекса об административных правонарушениях РФ из DOCX файла'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Путь к DOCX файлу КоАП РФ'
        )
        parser.add_argument(
            '--silent',
            action='store_true',
            help='Не выводить детали парсинга в терминал'
        )
    
    def handle(self, *args, **options):
        file_path = options.get('file')
        silent = options.get('silent', False)
        
        parse_and_import_coap(docx_path=file_path, silent=silent)
        
        self.stdout.write(self.style.SUCCESS("Импорт КоАП РФ завершен успешно!"))