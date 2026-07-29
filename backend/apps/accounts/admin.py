from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User

admin.site.site_header = 'MEIMS Administration'
admin.site.site_title = 'MEIMS Admin Portal'
admin.site.index_title = 'MEIMS Management'


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Configure the admin interface for the custom user model."""

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal information'), {
            'fields': (
                'first_name',
                'last_name',
                'username',
                'phone_number',
                'employee_number',
                'profile_photo',
                'department',
                'role',
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'first_name',
                    'last_name',
                    'employee_number',
                    'password1',
                    'password2',
                ),
            },
        ),
    )
    list_display = (
        'email',
        'first_name',
        'last_name',
        'employee_number',
        'department',
        'role',
        'is_staff',
        'is_active',
        'last_login',
    )
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'department', 'role')
    search_fields = ('email', 'first_name', 'last_name', 'employee_number', 'username')
    ordering = ('email',)
    list_select_related = ('department', 'role')
    raw_id_fields = ('department', 'role')
    readonly_fields = ('last_login', 'date_joined')
    filter_horizontal = ('groups', 'user_permissions')
    list_per_page = 50
