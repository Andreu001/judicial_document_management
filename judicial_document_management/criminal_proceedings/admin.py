from django.contrib import admin
from .models import CriminalDecisions, CriminalAppeal
from .models import ReferringAuthority


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
