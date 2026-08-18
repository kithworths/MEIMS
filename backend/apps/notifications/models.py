import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    PRIORITY_LOW = 'Low'
    PRIORITY_MEDIUM = 'Medium'
    PRIORITY_HIGH = 'High'
    PRIORITY_CRITICAL = 'Critical'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, _('Low')),
        (PRIORITY_MEDIUM, _('Medium')),
        (PRIORITY_HIGH, _('High')),
        (PRIORITY_CRITICAL, _('Critical')),
    ]

    CATEGORY_TASK = 'Task'
    CATEGORY_FINANCE = 'Finance'
    CATEGORY_APPROVAL = 'Approval'
    CATEGORY_SYSTEM = 'System'

    CATEGORY_CHOICES = [
        (CATEGORY_TASK, _('Task')),
        (CATEGORY_FINANCE, _('Finance')),
        (CATEGORY_APPROVAL, _('Approval')),
        (CATEGORY_SYSTEM, _('System')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default=CATEGORY_SYSTEM)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    source_module = models.CharField(max_length=128, blank=True)
    source_action = models.CharField(max_length=50, blank=True)
    source_url = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read'], name='notification_user_read_idx'),
            models.Index(fields=['user', 'is_archived'], name='notification_user_archived_idx'),
            models.Index(fields=['user', 'is_archived', 'created_at'], name='notif_archived_created_idx'),
        ]

    def __str__(self) -> str:
        return f'{self.title} ({self.category})'
