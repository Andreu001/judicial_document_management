from django.db import models



class CivilCodeArticle(models.Model):
    """Статья Гражданского кодекса РФ"""
    full_number = models.CharField(max_length=50, verbose_name="Полный номер статьи", unique=True)
    number = models.CharField(max_length=20, verbose_name="Номер статьи")
    title = models.TextField(verbose_name="Название статьи")
    full_text = models.TextField(verbose_name="Полный текст статьи")
    
    # Структура кодекса (иерархия)
    part = models.CharField(max_length=200, blank=True, null=True, verbose_name="Часть кодекса")  # "Часть первая", "Часть четвертая"
    section = models.CharField(max_length=200, blank=True, null=True, verbose_name="Раздел")      # "Раздел I. ОБЩИЕ ПОЛОЖЕНИЯ"
    subsection = models.CharField(max_length=200, blank=True, null=True, verbose_name="Подраздел") # "Подраздел 1. ОСНОВНЫЕ ПОЛОЖЕНИЯ"
    chapter = models.CharField(max_length=200, blank=True, null=True, verbose_name="Глава")       # "Глава 1. ГРАЖДАНСКОЕ ЗАКОНОДАТЕЛЬСТВО"
    
    is_active = models.BooleanField(default=True, verbose_name="Актуально")
    
    # JSON поле для хранения структуры пунктов
    # Теперь пункты нумеруются как "1", "2", "3" (строки), а внутри них могут быть подпункты "1)", "2)" и т.д.
    # { "parts": [{"number": "1", "clauses": ["1", "2", "3"]}, {"number": "2", "clauses": ["1", "2"]}] }
    structure = models.JSONField(default=dict, blank=True, verbose_name="Структура пунктов")
    
    sort_number = models.IntegerField(default=0, verbose_name="Число для сортировки")
    
    class Meta:
        verbose_name = "Статья ГК РФ"
        verbose_name_plural = "Статьи ГК РФ"
        ordering = ['sort_number', 'full_number']

    def __str__(self):
        return f"Ст. {self.full_number} - {self.title[:50]}"
    
    def save(self, *args, **kwargs):
        # Сортировка по числовой части номера статьи
        try:
            self.sort_number = int(self.full_number.split('.')[0]) if self.full_number else 0
        except ValueError:
            self.sort_number = 0
        super().save(*args, **kwargs)


class CriminalCodeArticle(models.Model):
    """Статья Уголовного кодекса РФ"""
    full_number = models.CharField(max_length=50, verbose_name="Полный номер статьи", unique=True)
    number = models.CharField(max_length=20, verbose_name="Номер статьи")
    title = models.TextField(verbose_name="Название статьи")
    full_text = models.TextField(verbose_name="Полный текст статьи")
    chapter = models.CharField(max_length=200, blank=True, null=True, verbose_name="Глава")
    section = models.CharField(max_length=200, blank=True, null=True, verbose_name="Раздел")
    is_active = models.BooleanField(default=True, verbose_name="Актуально")
    
    # JSON поле для хранения структуры частей и пунктов
    # Например: {"parts": [{"number": "1", "clauses": ["а", "б", "в"]}, {"number": "2", "clauses": ["1", "2"]}]}
    structure = models.JSONField(default=dict, blank=True, verbose_name="Структура частей и пунктов")
    
    # Поля для сортировки
    sort_number = models.IntegerField(default=0, verbose_name="Число для сортировки")
    
    class Meta:
        verbose_name = "Статья УК РФ"
        verbose_name_plural = "Статьи УК РФ"
        ordering = ['sort_number']

    def __str__(self):
        return f"Ст. {self.full_number} - {self.title[:50]}"
    
    def get_parts_list(self):
        """Возвращает список частей статьи"""
        return self.structure.get('parts', [])
    
    def get_clauses_for_part(self, part_number):
        """Возвращает список пунктов для указанной части"""
        for part in self.structure.get('parts', []):
            if str(part.get('number')) == str(part_number):
                return part.get('clauses', [])
        return []
    
    def save(self, *args, **kwargs):
        self.sort_number = int(self.full_number.split('.')[0]) if self.full_number else 0
        super().save(*args, **kwargs)


class AdministrativeCodeArticle(models.Model):
    """Статья Кодекса об административных правонарушениях РФ"""
    full_number = models.CharField(max_length=50, verbose_name="Полный номер статьи", unique=True)
    number = models.CharField(max_length=20, verbose_name="Номер статьи")
    title = models.TextField(verbose_name="Название статьи")
    full_text = models.TextField(verbose_name="Полный текст статьи")
    
    # Структура кодекса (иерархия)
    section = models.CharField(max_length=200, blank=True, null=True, verbose_name="Раздел")      # "Раздел I. ОБЩИЕ ПОЛОЖЕНИЯ"
    chapter = models.CharField(max_length=200, blank=True, null=True, verbose_name="Глава")       # "Глава 1. ЗАДАЧИ И ПРИНЦИПЫ ЗАКОНОДАТЕЛЬСТВА"
    
    is_active = models.BooleanField(default=True, verbose_name="Актуально")
    
    # JSON поле для хранения структуры частей и пунктов
    # { "parts": [{"number": "1", "clauses": ["1", "2", "3"]}, {"number": "2", "clauses": ["1", "2"]}] }
    structure = models.JSONField(default=dict, blank=True, verbose_name="Структура частей и пунктов")
    
    sort_number = models.IntegerField(default=0, verbose_name="Число для сортировки")
    
    class Meta:
        verbose_name = "Статья КоАП РФ"
        verbose_name_plural = "Статьи КоАП РФ"
        ordering = ['sort_number', 'full_number']

    def __str__(self):
        return f"Ст. {self.full_number} КоАП РФ - {self.title[:50]}"
    
    def save(self, *args, **kwargs):
        # Сортировка по числовой части номера статьи
        try:
            self.sort_number = int(self.full_number.split('.')[0]) if self.full_number else 0
        except ValueError:
            self.sort_number = 0
        super().save(*args, **kwargs)


# Добавьте в legal_codes/models.py

class AdministrativeProcedureCodeArticle(models.Model):
    """Статья Кодекса административного судопроизводства РФ (КАС РФ)"""
    full_number = models.CharField(max_length=50, verbose_name="Полный номер статьи", unique=True)
    number = models.CharField(max_length=20, verbose_name="Номер статьи")
    title = models.TextField(verbose_name="Название статьи")
    full_text = models.TextField(verbose_name="Полный текст статьи")
    
    # Структура кодекса (иерархия)
    section = models.CharField(max_length=300, blank=True, null=True, verbose_name="Раздел")      # "РАЗДЕЛ I. ОБЩИЕ ПОЛОЖЕНИЯ"
    section_num = models.IntegerField(default=0, verbose_name="Номер раздела для сортировки")
    chapter = models.CharField(max_length=300, blank=True, null=True, verbose_name="Глава")       # "Глава 1. ОСНОВНЫЕ ПОЛОЖЕНИЯ"
    chapter_num = models.IntegerField(default=0, verbose_name="Номер главы для сортировки")
    subchapter = models.CharField(max_length=300, blank=True, null=True, verbose_name="Подглава")  # "Глава 11.1. ..."
    
    is_active = models.BooleanField(default=True, verbose_name="Актуально")
    
    # JSON поле для хранения структуры частей и пунктов
    # { "parts": [{"number": "1", "clauses": ["1", "2", "3"]}, {"number": "2", "clauses": ["1", "2"]}] }
    structure = models.JSONField(default=dict, blank=True, verbose_name="Структура частей и пунктов")
    
    sort_number = models.IntegerField(default=0, verbose_name="Число для сортировки")
    
    class Meta:
        verbose_name = "Статья КАС РФ"
        verbose_name_plural = "Статьи КАС РФ"
        ordering = ['section_num', 'chapter_num', 'sort_number', 'full_number']

    def __str__(self):
        return f"Ст. {self.full_number} КАС РФ - {self.title[:50] if self.title else ''}"
    
    def save(self, *args, **kwargs):
        # Сортировка по числовой части номера статьи
        try:
            self.sort_number = int(self.full_number.split('.')[0]) if self.full_number else 0
        except ValueError:
            self.sort_number = 0
        super().save(*args, **kwargs)

class KASCodeArticle(models.Model):
    """Статья Кодекса административного судопроизводства РФ (КАС РФ)"""
    full_number = models.CharField(max_length=50, verbose_name="Полный номер статьи", unique=True)
    number = models.CharField(max_length=20, verbose_name="Номер статьи (базовый)")
    title = models.TextField(verbose_name="Название статьи")
    full_text = models.TextField(verbose_name="Полный текст статьи")

    # Иерархия КАС: Раздел -> Глава -> Статья
    section = models.CharField(max_length=300, blank=True, null=True, verbose_name="Раздел")
    chapter = models.CharField(max_length=300, blank=True, null=True, verbose_name="Глава")

    is_active = models.BooleanField(default=True, verbose_name="Актуально")

    # JSON поле для хранения структуры. Пример:
    # { "parts": [{"number": "1", "clauses": ["1", "2", "3"]}, {"number": "2", "clauses": ["1"]}] }
    structure = models.JSONField(default=dict, blank=True, verbose_name="Структура пунктов")

    sort_number = models.IntegerField(default=0, verbose_name="Число для сортировки")

    class Meta:
        verbose_name = "Статья КАС РФ"
        verbose_name_plural = "Статьи КАС РФ"
        ordering = ['sort_number', 'full_number']

    def __str__(self):
        return f"Ст. {self.full_number} КАС РФ - {self.title[:50]}"

    def save(self, *args, **kwargs):
        try:
            # Извлекаем число из номера статьи (например, из "1.1" -> 1)
            self.sort_number = int(self.full_number.split('.')[0]) if self.full_number else 0
        except ValueError:
            self.sort_number = 0
        super().save(*args, **kwargs)
