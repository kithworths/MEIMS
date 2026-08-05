import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Report(models.Model):
    """Stores generated reports and metadata about requested report runs."""

    STATUS_PENDING = 'Pending'
    STATUS_COMPLETED = 'Completed'
    STATUS_FAILED = 'Failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    FORMAT_CSV = 'csv'
    FORMAT_XLSX = 'xlsx'
    FORMAT_PDF = 'pdf'

    FORMAT_CHOICES = [
        (FORMAT_CSV, 'CSV'),
        (FORMAT_XLSX, 'Excel'),
        (FORMAT_PDF, 'PDF'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=64, db_index=True)
    params = models.JSONField(null=True, blank=True)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default=FORMAT_CSV)
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    error_message = models.TextField(blank=True)

    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reports_generated')
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'report'
        verbose_name_plural = 'reports'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['report_type'], name='report_type_idx')]

    def __str__(self):
        return f"{self.report_name} ({self.report_type})"