# legal_codes/management/commands/import_kas.py

from pathlib import Path
from django.core.management.base import BaseCommand
from legal_codes.parsers.kas_parser import parse_and_import_kas


class Command(BaseCommand):
    help = 'Импорт Кодекса административного судопроизводства РФ (КАС РФ) из DOCX файла'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Путь к DOCX файлу КАС РФ (по умолчанию: legal_codes/codes_rf_docx/КАС РФ.docx)'
        )
        parser.add_argument(
            '--silent',
            action='store_true',
            help='Не выводить детали парсинга в терминал'
        )

    def handle(self, *args, **options):
        file_path = options.get('file')
        silent = options.get('silent', False)

        if file_path:
            parse_and_import_kas(docx_path=file_path, silent=silent)
        else:
            parse_and_import_kas(silent=silent)

        self.stdout.write(self.style.SUCCESS("Импорт КАС РФ завершен успешно!"))