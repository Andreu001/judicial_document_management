from django.contrib import admin
from .models import CriminalSidesCase, CriminalDecisions, CriminalAppeal
from .models import ReferringAuthority


@admin.register(CriminalSidesCase)
class CriminalSidesCaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code',)  # Поля в списке записей
    list_display_links = ('name',)  # Поля-ссылки на редактирование
    search_fields = ('name', 'code',)  # Поиск по этим полям
    list_per_page = 20  # Количество записей на странице
    ordering = ('name',)  # Сортировка по умолчанию


@admin.register(CriminalDecisions)
class CriminalDecisionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code',)
    list_display_links = ('name',)
    search_fields = ('name', 'code',)
    list_per_page = 20
    ordering = ('name',)


@admin.register(CriminalAppeal)
class CriminalAppealAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code',)
    list_display_links = ('name',)
    search_fields = ('name', 'code',)
    list_per_page = 20
    ordering = ('name',)


@admin.register(ReferringAuthority)
class ReferringAuthorityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code',)
    list_display_links = ('name',)
    search_fields = ('name', 'code',)
    list_per_page = 20
    ordering = ('name',)