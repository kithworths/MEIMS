import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    """Stores audit records for user activity across the MEIMS system."""

    ACTION_CREATE = 'Create'
    ACTION_READ = 'Read'
    ACTION_UPDATE = 'Update'
    ACTION_DELETE = 'Delete'
    ACTION_APPROVE = 'Approve'
    ACTION_EXPORT = 'Export'
    ACTION_PRINT = 'Print'
    ACTION_ASSIGN = 'Assign'
    ACTION_LOGIN = 'Login'
    ACTION_LOGOUT = 'Logout'

    ACTION_CHOICES = [
        (ACTION_CREATE, ACTION_CREATE),
        (ACTION_READ, ACTION_READ),
        (ACTION_UPDATE, ACTION_UPDATE),
        (ACTION_DELETE, ACTION_DELETE),
        (ACTION_APPROVE, ACTION_APPROVE),
        (ACTION_EXPORT, ACTION_EXPORT),
        (ACTION_PRINT, ACTION_PRINT),
        (ACTION_ASSIGN, ACTION_ASSIGN),
        (ACTION_LOGIN, ACTION_LOGIN),
        (ACTION_LOGOUT, ACTION_LOGOUT),
    ]

    id = models.UUIDField(
        _('id'),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the audit record.'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
        help_text=_('The user who performed the action.'),
    )
    module = models.CharField(
        _('module'),
        max_length=128,
        help_text=_('The functional module or resource that the audit log refers to.'),
    )
    action = models.CharField(
        _('action'),
        max_length=50,
        choices=ACTION_CHOICES,
        help_text=_('The action that was performed.'),
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Detailed description of the audited event.'),
    )
    ip_address = models.CharField(
        _('IP address'),
        max_length=45,
        blank=True,
        help_text=_('The client IP address from which the event originated.'),
    )
    browser = models.TextField(
        _('browser'),
        blank=True,
        help_text=_('The user agent string from the request.'),
    )
    request_method = models.CharField(
        _('request method'),
        max_length=10,
        help_text=_('The HTTP method used for the request.'),
    )
    timestamp = models.DateTimeField(
        _('timestamp'),
        default=timezone.now,
        editable=False,
        db_index=True,
        help_text=_('The date and time when the audited event occurred.'),
    )

    class Meta:
        verbose_name = _('audit log')
        verbose_name_plural = _('audit logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['module', 'action'], name='audit_module_action_idx'),
            models.Index(fields=['user', 'timestamp'], name='audit_user_timestamp_idx'),
            models.Index(fields=['module', 'timestamp'], name='audit_module_timestamp_idx'),
        ]

    def __str__(self):
        return f'{self.timestamp.isoformat()} | {self.module} | {self.action}'
