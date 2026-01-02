from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'middle_name', 'role', 'subject_level', 'is_staff', 'is_active')
    list_filter = ('role', 'subject_level', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'middle_name', 'email')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        ('Дополнительная информация', {'fields': ('role', 'phone', 'court', 'bar_association', 'subject_level')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2',
                       'first_name', 'last_name', 'middle_name', 'role', 'phone', 'subject_level'),
        }),
    )
    readonly_fields = ('last_login', 'date_joined')
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)
