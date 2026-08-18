import uuid

from django.apps import apps
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.projects.models import Project


class StandBaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_updated',
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True


class StandStage(StandBaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    ordinal = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = 'stand stage'
        verbose_name_plural = 'stand stages'
        ordering = ['ordinal', 'name']
        indexes = [
            models.Index(fields=['code'], name='standstage_code_idx'),
            models.Index(fields=['ordinal'], name='standstage_ordinal_idx'),
        ]

    def __str__(self):
        return f'{self.code} - {self.name}'


class Stand(StandBaseModel):
    STATUS_PLANNED = 'Planned'
    STATUS_ACTIVE = 'Active'
    STATUS_COMPLETED = 'Completed'
    STATUS_ON_HOLD = 'On Hold'
    STATUS_CANCELLED = 'Cancelled'

    STATUS_CHOICES = [
        (STATUS_PLANNED, 'Planned'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_ON_HOLD, 'On Hold'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name='stands',
    )
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    stand_type = models.CharField(max_length=64, blank=True)
    current_stage = models.ForeignKey(
        StandStage,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='stands',
    )
    gis_location_id = models.UUIDField(null=True, blank=True)
    address = models.TextField(blank=True)
    area_sq_m = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_PLANNED)
    gis_locations = GenericRelation('gis.GISLocation', related_query_name='stand')

    class Meta:
        verbose_name = 'stand'
        verbose_name_plural = 'stands'
        ordering = ['project', 'code']
        constraints = [
            models.UniqueConstraint(fields=['project', 'code'], name='unique_project_stand_code'),
            models.CheckConstraint(check=Q(area_sq_m__gt=0) | Q(area_sq_m__isnull=True), name='stand_area_positive_chk'),
        ]
        indexes = [
            models.Index(fields=['project'], name='stand_project_idx'),
            models.Index(fields=['code'], name='stand_code_idx'),
            models.Index(fields=['current_stage'], name='stand_current_stage_idx'),
            models.Index(fields=['status'], name='stand_status_idx'),
        ]

    def clean(self):
        if self.area_sq_m is not None and self.area_sq_m <= 0:
            raise ValidationError('Stand area must be a positive number.')

    def __str__(self):
        return f'{self.project.code}-{self.code} - {self.name}'


class StageHistory(StandBaseModel):
    stand = models.ForeignKey(
        Stand,
        on_delete=models.PROTECT,
        related_name='stage_histories',
    )
    from_stage = models.ForeignKey(
        StandStage,
        on_delete=models.PROTECT,
        related_name='history_from',
    )
    to_stage = models.ForeignKey(
        StandStage,
        on_delete=models.PROTECT,
        related_name='history_to',
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='stage_histories_changed',
    )
    changed_at = models.DateTimeField(default=timezone.now)
    reason = models.TextField(blank=True)
    is_override = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'stage history'
        verbose_name_plural = 'stage histories'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['stand'], name='stagehistory_stand_idx'),
            models.Index(fields=['changed_at'], name='stagehistory_changed_at_idx'),
        ]

    def clean(self):
        if self.from_stage == self.to_stage:
            raise ValidationError('Stage history transition must move to a different stage.')

        if not self.is_override:
            if self.stand.current_stage and self.stand.current_stage != self.from_stage:
                raise ValidationError('Stand current stage must match from_stage unless override is used.')

            if not StandStageTransition.objects.filter(
                from_stage=self.from_stage,
                to_stage=self.to_stage,
                is_active=True,
                is_deleted=False,
            ).exists():
                raise ValidationError('This transition is not allowed by the configured workflow.')

        if self.is_override and not self.reason:
            raise ValidationError('A reason is required for override stage history entries.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.stand} {self.from_stage} -> {self.to_stage} at {self.changed_at}'


class StandStageTransition(StandBaseModel):
    from_stage = models.ForeignKey(
        StandStage,
        on_delete=models.PROTECT,
        related_name='transitions_from',
    )
    to_stage = models.ForeignKey(
        StandStage,
        on_delete=models.PROTECT,
        related_name='transitions_to',
    )
    requires_approval = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'stand stage transition'
        verbose_name_plural = 'stand stage transitions'
        ordering = ['from_stage__ordinal', 'to_stage__ordinal']
        constraints = [
            models.UniqueConstraint(
                fields=['from_stage', 'to_stage'],
                name='unique_standstage_transition',
            ),
            models.CheckConstraint(check=Q(from_stage__isnull=False) & Q(to_stage__isnull=False), name='standstage_transition_not_null_chk'),
        ]
        indexes = [
            models.Index(fields=['from_stage'], name='standstagetransition_from_idx'),
            models.Index(fields=['to_stage'], name='standstagetransition_to_idx'),
        ]

    def clean(self):
        if self.from_stage == self.to_stage:
            raise ValidationError('Transition from_stage and to_stage must be different.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.from_stage} -> {self.to_stage}'
