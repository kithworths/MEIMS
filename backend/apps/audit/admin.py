from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin registration for audit logs."""

    list_display = ('timestamp', 'user', 'module', 'action', 'ip_address', 'request_method')
    search_fields = ('user__email', 'module', 'action', 'description', 'ip_address', 'browser')
    list_filter = ('action', 'module', 'request_method')
    readonly_fields = (
        'id',
        'user',
        'module',
        'action',
        'description',
        'ip_address',
        'browser',
        'request_method',
        'timestamp',
    )
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'
    list_per_page = 50
    list_select_related = ('user',)
    raw_id_fields = ('user',)
