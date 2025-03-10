from django.contrib import admin

from .models import (SidesCase, BusinessMovement, Decisions,
                     Petitions, BusinessCard, Category)


@admin.register(BusinessMovement)
class ReceivedCaseAdmin(admin.ModelAdmin):
    '''Поступившее дело'''
    list_display = ('pk',
                    'date_meeting',
                    'meeting_time',
                    )
    search_fields = ('date_meeting',)
    empty_value_display = '-пусто-'


@admin.register(SidesCase)
class SidesCaseAdmin(admin.ModelAdmin):
    '''Стороны по делу'''
    list_display = (
        'sides_case',
    )
    search_fields = ('text',)
    empty_value_display = '-пусто-'


@admin.register(Petitions)
class PetitionsAdmin(admin.ModelAdmin):
    '''Модель заявленных ходатайств по делу'''
    list_display = (
        'petitions',
    )
    search_fields = ('petitions',)
    empty_value_display = '-пусто-'


@admin.register(Decisions)
class DecisionsAdmin(admin.ModelAdmin):
    '''Стороны по делу'''
    list_display = (
        'name_case',
    )
    search_fields = ('text',)
    empty_value_display = '-пусто-'


@admin.register(BusinessCard)
class BusinessCardAdmin(admin.ModelAdmin):
    list_display = (
        'original_name',
        'author',
        'case_category',
        'pub_date',
        'preliminary_hearing',
    )
    search_fields = ('original_name',)
    list_editable = ('case_category',)
    empty_value_display = '-пусто-'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    '''Модель категории дела'''
    list_display = (
        'title_category',
        'description',
    )
    search_fields = ('title',)
    empty_value_display = '-пусто-'
