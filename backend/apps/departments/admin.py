from django.contrib import admin

from .models import Department, Role


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin configuration for company departments."""

    list_display = (
        'department_name',
        'department_code',
        'head_of_department',
        'email',
        'phone',
        'office_location',
        'is_active',
        'created_at',
        'updated_at',
    )
    search_fields = (
        'department_name',
        'department_code',
        'head_of_department',
        'email',
        'office_location',
    )
    list_filter = ('is_active', 'office_location')
    ordering = ('department_name',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    list_per_page = 50


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Admin configuration for business roles."""

    list_display = ('name', 'description', 'is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50
