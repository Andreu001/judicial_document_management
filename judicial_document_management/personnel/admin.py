from django.contrib import admin
from .models import AbsenceType, AbsenceRecord

@admin.register(AbsenceType)
class AbsenceTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'color', 'block_before_days', 'block_after_days', 'is_active')
    list_editable = ('is_active',)

@admin.register(AbsenceRecord)
class AbsenceRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'absence_type', 'block_start_date', 'block_end_date')
    list_filter = ('absence_type', 'user__last_name')
    search_fields = ('user__last_name', 'user__first_name')
    date_hierarchy = 'block_start_date'
