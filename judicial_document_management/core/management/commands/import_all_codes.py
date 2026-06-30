# legal_codes/management/commands/import_all_codes.py

from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Импорт всех кодексов РФ (ГК, УК, КоАП, КАС) из DOCX файлов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--silent',
            action='store_true',
            help='Не выводить детали парсинга в терминал'
        )
        parser.add_argument(
            '--skip-civil',
            action='store_true',
            help='Пропустить импорт ГК РФ'
        )
        parser.add_argument(
            '--skip-criminal',
            action='store_true',
            help='Пропустить импорт УК РФ'
        )
        parser.add_argument(
            '--skip-coap',
            action='store_true',
            help='Пропустить импорт КоАП РФ'
        )
        parser.add_argument(
            '--skip-kas',
            action='store_true',
            help='Пропустить импорт КАС РФ'
        )
        parser.add_argument(
            '--civil-file',
            type=str,
            help='Путь к DOCX файлу ГК РФ (опционально)'
        )
        parser.add_argument(
            '--criminal-file',
            type=str,
            help='Путь к DOCX файлу УК РФ (опционально)'
        )
        parser.add_argument(
            '--coap-file',
            type=str,
            help='Путь к DOCX файлу КоАП РФ (опционально)'
        )
        parser.add_argument(
            '--kas-file',
            type=str,
            help='Путь к DOCX файлу КАС РФ (опционально)'
        )

    def handle(self, *args, **options):
        silent = options.get('silent', False)
        
        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS("🚀 НАЧАЛО ИМПОРТА ВСЕХ КОДЕКСОВ РФ"))
        self.stdout.write(self.style.SUCCESS("="*60))
        
        results = {}
        
        # 1. Импорт ГК РФ
        if not options.get('skip_civil'):
            self.stdout.write("\n📚 " + self.style.MIGRATE_HEADING("1. Гражданский кодекс РФ (ГК РФ)"))
            try:
                civil_file = options.get('civil_file')
                if civil_file:
                    call_command('import_civil_code', part1=civil_file, part2=civil_file, 
                                part3=civil_file, part4=civil_file, silent=silent)
                else:
                    call_command('import_civil_code', silent=silent)
                results['ГК РФ'] = "✅ УСПЕШНО"
                self.stdout.write(self.style.SUCCESS("   ✅ ГК РФ импортирован"))
            except Exception as e:
                results['ГК РФ'] = f"❌ ОШИБКА: {str(e)}"
                self.stdout.write(self.style.ERROR(f"   ❌ Ошибка при импорте ГК РФ: {e}"))
        else:
            results['ГК РФ'] = "⏭️ ПРОПУЩЕН"
            self.stdout.write("   ⏭️ ГК РФ пропущен")
        
        # 2. Импорт УК РФ
        if not options.get('skip_criminal'):
            self.stdout.write("\n📚 " + self.style.MIGRATE_HEADING("2. Уголовный кодекс РФ (УК РФ)"))
            try:
                criminal_file = options.get('criminal_file')
                if criminal_file:
                    call_command('import_uk_rf', file=criminal_file)
                else:
                    call_command('import_uk_rf')
                results['УК РФ'] = "✅ УСПЕШНО"
                self.stdout.write(self.style.SUCCESS("   ✅ УК РФ импортирован"))
            except Exception as e:
                results['УК РФ'] = f"❌ ОШИБКА: {str(e)}"
                self.stdout.write(self.style.ERROR(f"   ❌ Ошибка при импорте УК РФ: {e}"))
        else:
            results['УК РФ'] = "⏭️ ПРОПУЩЕН"
            self.stdout.write("   ⏭️ УК РФ пропущен")
        
        # 3. Импорт КоАП РФ
        if not options.get('skip_coap'):
            self.stdout.write("\n📚 " + self.style.MIGRATE_HEADING("3. Кодекс об административных правонарушениях РФ (КоАП РФ)"))
            try:
                coap_file = options.get('coap_file')
                if coap_file:
                    call_command('import_coap', file=coap_file, silent=silent)
                else:
                    call_command('import_coap', silent=silent)
                results['КоАП РФ'] = "✅ УСПЕШНО"
                self.stdout.write(self.style.SUCCESS("   ✅ КоАП РФ импортирован"))
            except Exception as e:
                results['КоАП РФ'] = f"❌ ОШИБКА: {str(e)}"
                self.stdout.write(self.style.ERROR(f"   ❌ Ошибка при импорте КоАП РФ: {e}"))
        else:
            results['КоАП РФ'] = "⏭️ ПРОПУЩЕН"
            self.stdout.write("   ⏭️ КоАП РФ пропущен")
        
        # 4. Импорт КАС РФ
        if not options.get('skip_kas'):
            self.stdout.write("\n📚 " + self.style.MIGRATE_HEADING("4. Кодекс административного судопроизводства РФ (КАС РФ)"))
            try:
                kas_file = options.get('kas_file')
                if kas_file:
                    call_command('import_kas', file=kas_file, silent=silent)
                else:
                    call_command('import_kas', silent=silent)
                results['КАС РФ'] = "✅ УСПЕШНО"
                self.stdout.write(self.style.SUCCESS("   ✅ КАС РФ импортирован"))
            except Exception as e:
                results['КАС РФ'] = f"❌ ОШИБКА: {str(e)}"
                self.stdout.write(self.style.ERROR(f"   ❌ Ошибка при импорте КАС РФ: {e}"))
        else:
            results['КАС РФ'] = "⏭️ ПРОПУЩЕН"
            self.stdout.write("   ⏭️ КАС РФ пропущен")
        
        # Вывод итогов
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("📊 ИТОГИ ИМПОРТА"))
        self.stdout.write("="*60)
        
        for codex, status in results.items():
            if "✅" in status:
                self.stdout.write(self.style.SUCCESS(f"  {codex}: {status}"))
            elif "⏭️" in status:
                self.stdout.write(self.style.WARNING(f"  {codex}: {status}"))
            else:
                self.stdout.write(self.style.ERROR(f"  {codex}: {status}"))
        
        self.stdout.write("="*60)
        
        # Проверка успешности
        failed = [k for k, v in results.items() if "❌" in v]
        if failed:
            self.stdout.write(self.style.WARNING(f"\n⚠️ Импорт завершен с ошибками в: {', '.join(failed)}"))
        else:
            self.stdout.write(self.style.SUCCESS("\n✅ ВСЕ КОДЕКСЫ УСПЕШНО ИМПОРТИРОВАНЫ!"))