from django.contrib import admin

from .models import Permission, Role, RolePermission, UserRole


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Admin registration for RBAC permissions."""

    list_display = ('module', 'action', 'description', 'is_active', 'created_at', 'updated_at')
    search_fields = ('module', 'action', 'description')
    list_filter = ('module', 'action', 'is_active')
    ordering = ('module', 'action')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Admin registration for RBAC roles."""

    list_display = ('name', 'description', 'is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    """Admin registration for role-to-permission associations."""

    list_display = ('role', 'permission', 'created_at')
    search_fields = ('role__name', 'permission__module', 'permission__action')
    list_filter = ('role', 'permission__module', 'permission__action')
    list_select_related = ('role', 'permission')
    readonly_fields = ('created_at',)
    raw_id_fields = ('role', 'permission')
    date_hierarchy = 'created_at'
    list_per_page = 50


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """Admin registration for user-to-role assignments."""

    list_display = ('user', 'role', 'created_at')
    search_fields = ('user__email', 'role__name')
    list_filter = ('role',)
    list_select_related = ('user', 'role')
    readonly_fields = ('created_at',)
    raw_id_fields = ('user', 'role')
    date_hierarchy = 'created_at'
    list_per_page = 50
