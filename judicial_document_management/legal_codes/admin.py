from django.contrib import admin
from .models import (CriminalCodeArticle, CivilCodeArticle,
    AdministrativeCodeArticle, KASCodeArticle
)

@admin.register(CriminalCodeArticle)
class CriminalCodeArticleAdmin(admin.ModelAdmin):
    list_display = ['full_number', 'title_short', 'chapter', 'parts_info', 'clauses_info']
    list_filter = ['chapter', 'is_active']
    search_fields = ['full_number', 'number', 'title', 'full_text']
    list_display_links = ['full_number', 'title_short']
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'
    
    def parts_info(self, obj):
        """Отображает только номера частей статьи (без списка пунктов)"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_numbers = [f"ч.{part.get('number', '?')}" for part in parts]
        return ', '.join(parts_numbers)
    parts_info.short_description = 'Части'
    
    def clauses_info(self, obj):
        """Отображает информацию о пунктах для каждой части"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_text = []
        for part in parts:
            part_num = part.get('number', '?')
            clauses = part.get('clauses', [])
            if clauses:
                clauses_text = ', '.join(clauses[:5])
                if len(clauses) > 5:
                    clauses_text += f'... (+{len(clauses)-5})'
                parts_text.append(f'ч.{part_num}: [{clauses_text}]')
            else:
                parts_text.append(f'ч.{part_num}: нет пунктов')
        return '; '.join(parts_text)
    clauses_info.short_description = 'Пункты по частям'
    
    def get_ordering(self, request):
        return ['sort_number']


@admin.register(CivilCodeArticle)
class CivilCodeArticleAdmin(admin.ModelAdmin):
    list_display = ['full_number', 'title_short', 'part', 'section', 'chapter', 'parts_info', 'clauses_info']
    list_filter = ['part', 'chapter', 'is_active']
    search_fields = ['full_number', 'number', 'title', 'full_text']
    list_display_links = ['full_number', 'title_short']
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'
    
    def parts_info(self, obj):
        """Отображает только номера частей статьи (без списка пунктов)"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_numbers = [f"ч.{part.get('number', '?')}" for part in parts]
        return ', '.join(parts_numbers)
    parts_info.short_description = 'Части'
    
    def clauses_info(self, obj):
        """Отображает информацию о пунктах для каждой части"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_text = []
        for part in parts:
            part_num = part.get('number', '?')
            clauses = part.get('clauses', [])
            if clauses:
                clauses_text = ', '.join(clauses[:5])
                if len(clauses) > 5:
                    clauses_text += f'... (+{len(clauses)-5})'
                parts_text.append(f'ч.{part_num}: [{clauses_text}]')
            else:
                parts_text.append(f'ч.{part_num}: нет пунктов')
        return '; '.join(parts_text)
    clauses_info.short_description = 'Пункты по частям'
    
    def get_ordering(self, request):
        return ['sort_number', 'full_number']


@admin.register(AdministrativeCodeArticle)
class AdministrativeCodeArticleAdmin(admin.ModelAdmin):
    list_display = ['full_number', 'title_short', 'section', 'chapter', 'parts_info', 'clauses_info']
    list_filter = ['section', 'chapter', 'is_active']
    search_fields = ['full_number', 'number', 'title', 'full_text']
    list_display_links = ['full_number', 'title_short']
    
    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'
    
    def parts_info(self, obj):
        """Отображает только номера частей статьи"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_numbers = [f"ч.{part.get('number', '?')}" for part in parts]
        return ', '.join(parts_numbers)
    parts_info.short_description = 'Части'
    
    def clauses_info(self, obj):
        """Отображает информацию о пунктах для каждой части"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_text = []
        for part in parts:
            part_num = part.get('number', '?')
            clauses = part.get('clauses', [])
            if clauses:
                clauses_text = ', '.join(clauses[:5])
                if len(clauses) > 5:
                    clauses_text += f'... (+{len(clauses)-5})'
                parts_text.append(f'ч.{part_num}: [{clauses_text}]')
            else:
                parts_text.append(f'ч.{part_num}: нет пунктов')
        return '; '.join(parts_text)
    clauses_info.short_description = 'Пункты по частям'
    
    def get_ordering(self, request):
        return ['sort_number', 'full_number']


@admin.register(KASCodeArticle)
class KASCodeArticleAdmin(admin.ModelAdmin):
    list_display = ['full_number', 'title_short', 'section', 'chapter', 'parts_info', 'clauses_info']
    list_filter = ['section', 'chapter', 'is_active']
    search_fields = ['full_number', 'number', 'title', 'full_text']
    list_display_links = ['full_number', 'title_short']

    def title_short(self, obj):
        return obj.title[:80] + '...' if len(obj.title) > 80 else obj.title
    title_short.short_description = 'Название'

    def parts_info(self, obj):
        """Отображает номера частей статьи"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_numbers = [f"ч.{part.get('number', '?')}" for part in parts]
        return ', '.join(parts_numbers)
    parts_info.short_description = 'Части'

    def clauses_info(self, obj):
        """Отображает пункты для каждой части"""
        parts = obj.structure.get('parts', [])
        if not parts:
            return '-'
        parts_text = []
        for part in parts:
            part_num = part.get('number', '?')
            clauses = part.get('clauses', [])
            if clauses:
                clauses_text = ', '.join(clauses[:5])
                if len(clauses) > 5:
                    clauses_text += f'... (+{len(clauses)-5})'
                parts_text.append(f'ч.{part_num}: [{clauses_text}]')
            else:
                parts_text.append(f'ч.{part_num}: нет пунктов')
        return '; '.join(parts_text)
    clauses_info.short_description = 'Пункты по частям'

    def get_ordering(self, request):
        return ['sort_number', 'full_number']
