import uuid
from django.contrib.contenttypes.fields import GenericRelation
from django.conf import settings
from django.db import models
from django.utils import timezone


class Project(models.Model):
    """Represents a development/engineering project.

    Audit fields and soft-delete flags are included per enterprise standards.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='Concept')
    start_date = models.DateField(null=True, blank=True)
    planned_end_date = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)
    # Reference to ServiceType will be implemented in a later phase; keep a nullable UUID to avoid FK coupling now
    primary_service_type_id = models.UUIDField(null=True, blank=True)
    budget_total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    metadata = models.JSONField(null=True, blank=True)
    gis_locations = GenericRelation('gis.GISLocation', related_query_name='project')

    # audit & soft delete
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='projects_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='projects_updated'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = 'project'
        verbose_name_plural = 'projects'
        ordering = ['-start_date', 'name']
        indexes = [
            models.Index(fields=['status'], name='proj_status_idx'),
            models.Index(fields=['start_date'], name='proj_start_date_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"
