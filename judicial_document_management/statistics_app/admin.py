from django.contrib import admin
from statistics_app.models import SavedQueryView, Dashboard, DashboardWidget

@admin.register(SavedQueryView)
class SavedQueryViewAdmin(admin.ModelAdmin):
    list_display = ('name', 'target_content_type', 'created_by', 'created_at', 'is_public', 'last_run')
    list_filter = ('is_public', 'target_content_type')
    search_fields = ('name', 'created_by__username')
    raw_id_fields = ('created_by',)
    readonly_fields = ('created_at', 'last_run')


class DashboardWidgetInline(admin.TabularInline):
    model = DashboardWidget
    extra = 1
    raw_id_fields = ('saved_query',)


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at', 'is_public')
    list_filter = ('is_public',)
    search_fields = ('name', 'created_by__username')
    inlines = [DashboardWidgetInline]
    readonly_fields = ('created_at',)