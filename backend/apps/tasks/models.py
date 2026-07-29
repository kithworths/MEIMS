import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.projects.models import Project
from apps.stands.models import Stand, StandStage


class TaskBaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
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


class ServiceType(TaskBaseModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = 'service type'
        verbose_name_plural = 'service types'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code'], name='servicetype_code_idx'),
        ]

    def __str__(self):
        return f'{self.code} - {self.name}'


class ProjectTask(TaskBaseModel):
    PRIORITY_LOW = 'Low'
    PRIORITY_MEDIUM = 'Medium'
    PRIORITY_HIGH = 'High'
    PRIORITY_CRITICAL = 'Critical'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_CRITICAL, 'Critical'),
    ]

    STATUS_OPEN = 'Open'
    STATUS_IN_PROGRESS = 'In Progress'
    STATUS_BLOCKED = 'Blocked'
    STATUS_COMPLETED = 'Completed'
    STATUS_CANCELLED = 'Cancelled'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_BLOCKED, 'Blocked'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name='tasks',
    )
    stand = models.ForeignKey(
        Stand,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='tasks',
    )
    parent_task = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='subtasks',
    )
    service_type = models.ForeignKey(
        ServiceType,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='tasks',
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_tasks',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN, db_index=True)
    estimated_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    spent_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    planned_start_date = models.DateField(null=True, blank=True, db_index=True)
    planned_end_date = models.DateField(null=True, blank=True, db_index=True)
    actual_start_date = models.DateField(null=True, blank=True, db_index=True)
    actual_end_date = models.DateField(null=True, blank=True, db_index=True)
    row_version = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'project task'
        verbose_name_plural = 'project tasks'
        ordering = ['-planned_start_date', 'title']
        indexes = [
            models.Index(fields=['project'], name='projecttask_project_idx'),
            models.Index(fields=['stand'], name='projecttask_stand_idx'),
            models.Index(fields=['assignee'], name='projecttask_assignee_idx'),
            models.Index(fields=['status'], name='projecttask_status_idx'),
            models.Index(fields=['priority'], name='projecttask_priority_idx'),
        ]

    def clean(self):
        if self.parent_task:
            if self.parent_task == self:
                raise ValidationError('A task cannot be its own parent.')

            if self.parent_task.project != self.project:
                raise ValidationError('Parent task must belong to the same project.')

            if self.parent_task.stand and self.stand and self.parent_task.stand != self.stand:
                raise ValidationError('Parent task and child task must belong to the same stand when both are present.')

            ancestor = self.parent_task
            while ancestor is not None:
                if ancestor == self:
                    raise ValidationError('Task hierarchy cannot contain cycles.')
                ancestor = ancestor.parent_task

        if self.estimated_hours is not None and self.estimated_hours < 0:
            raise ValidationError({'estimated_hours': 'Estimated hours must be non-negative.'})

        if self.spent_hours is not None and self.spent_hours < 0:
            raise ValidationError({'spent_hours': 'Spent hours must be non-negative.'})

        if self.planned_start_date and self.planned_end_date and self.planned_end_date < self.planned_start_date:
            raise ValidationError({'planned_end_date': 'Planned end date must be on or after planned start date.'})

        if self.actual_start_date and self.actual_end_date and self.actual_end_date < self.actual_start_date:
            raise ValidationError({'actual_end_date': 'Actual end date must be on or after actual start date.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.project.code} - {self.title}'


class TaskHistory(TaskBaseModel):
    task = models.ForeignKey(
        ProjectTask,
        on_delete=models.PROTECT,
        related_name='history',
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='task_histories_changed',
    )
    changed_at = models.DateTimeField(default=timezone.now)
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)
    previous_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='task_histories_previous_assignee',
    )
    new_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='task_histories_new_assignee',
    )
    previous_priority = models.CharField(max_length=20, blank=True)
    new_priority = models.CharField(max_length=20, blank=True)
    previous_estimated_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_estimated_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    previous_spent_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_spent_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'task history'
        verbose_name_plural = 'task histories'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['task'], name='taskhistory_task_idx'),
            models.Index(fields=['changed_at'], name='taskhistory_changed_at_idx'),
        ]

    def __str__(self):
        return f'TaskHistory for {self.task} at {self.changed_at}'


class EngineerTicket(TaskBaseModel):
    PRIORITY_LOW = 'Low'
    PRIORITY_MEDIUM = 'Medium'
    PRIORITY_HIGH = 'High'
    PRIORITY_CRITICAL = 'Critical'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_CRITICAL, 'Critical'),
    ]

    STATUS_OPEN = 'Open'
    STATUS_ASSIGNED = 'Assigned'
    STATUS_IN_PROGRESS = 'In Progress'
    STATUS_RESOLVED = 'Resolved'
    STATUS_CLOSED = 'Closed'
    STATUS_REJECTED = 'Rejected'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_ASSIGNED, 'Assigned'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_RESOLVED, 'Resolved'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name='engineer_tickets',
    )
    stand = models.ForeignKey(
        Stand,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='engineer_tickets',
    )
    service_type = models.ForeignKey(
        ServiceType,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='engineer_tickets',
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reported_engineer_tickets',
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_engineer_tickets',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN, db_index=True)
    opened_at = models.DateTimeField(default=timezone.now, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True, db_index=True)
    closed_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        verbose_name = 'engineer ticket'
        verbose_name_plural = 'engineer tickets'
        ordering = ['-opened_at', 'priority']
        indexes = [
            models.Index(fields=['project'], name='engineerticket_project_idx'),
            models.Index(fields=['stand'], name='engineerticket_stand_idx'),
            models.Index(fields=['assignee'], name='engineerticket_assignee_idx'),
            models.Index(fields=['status'], name='engineerticket_status_idx'),
            models.Index(fields=['priority'], name='engineerticket_priority_idx'),
        ]

    def clean(self):
        if self.status == self.STATUS_RESOLVED and self.resolved_at is None:
            self.resolved_at = timezone.now()

        if self.status == self.STATUS_CLOSED and self.closed_at is None:
            self.closed_at = timezone.now()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'[{self.status}] {self.title}'


class EngineerTicketHistory(TaskBaseModel):
    ticket = models.ForeignKey(
        EngineerTicket,
        on_delete=models.PROTECT,
        related_name='history',
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='engineer_ticket_histories_changed',
    )
    changed_at = models.DateTimeField(default=timezone.now)
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)
    previous_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='engineer_ticket_histories_previous_assignee',
    )
    new_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='engineer_ticket_histories_new_assignee',
    )
    previous_priority = models.CharField(max_length=20, blank=True)
    new_priority = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'engineer ticket history'
        verbose_name_plural = 'engineer ticket histories'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['ticket'], name='engtickhist_ticket_idx'),
            models.Index(fields=['changed_at'], name='engtickhist_changed_at_idx'),
        ]

    def __str__(self):
        return f'EngineerTicketHistory for {self.ticket} at {self.changed_at}'


class SiteVisit(TaskBaseModel):
    STATUS_SCHEDULED = 'Scheduled'
    STATUS_COMPLETED = 'Completed'
    STATUS_CANCELLED = 'Cancelled'
    STATUS_NO_SHOW = 'No Show'

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_NO_SHOW, 'No Show'),
    ]

    stand = models.ForeignKey(
        Stand,
        on_delete=models.PROTECT,
        related_name='site_visits',
    )
    engineer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='site_visits',
    )
    scheduled_start = models.DateTimeField(db_index=True)
    scheduled_end = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED, db_index=True)
    reminder_minutes = models.PositiveIntegerField(default=60)
    reminder_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'site visit'
        verbose_name_plural = 'site visits'
        ordering = ['scheduled_start']
        indexes = [
            models.Index(fields=['engineer'], name='sitevisit_engineer_idx'),
            models.Index(fields=['scheduled_start'], name='sitevisit_start_idx'),
            models.Index(fields=['status'], name='sitevisit_status_idx'),
        ]

    def clean(self):
        if self.scheduled_end <= self.scheduled_start:
            raise ValidationError('Site visit end must be after the start.')

        if self.engineer:
            overlapping = SiteVisit.objects.filter(
                engineer=self.engineer,
                is_deleted=False,
                status__in=[self.STATUS_SCHEDULED, self.STATUS_COMPLETED, self.STATUS_NO_SHOW],
            ).exclude(pk=self.pk)
            overlapping = overlapping.filter(
                scheduled_start__lt=self.scheduled_end,
                scheduled_end__gt=self.scheduled_start,
            )
            if overlapping.exists():
                raise ValidationError('The engineer has an overlapping site visit booking.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'SiteVisit for {self.stand} at {self.scheduled_start}'


class SiteInspection(TaskBaseModel):
    RESULT_PASS = 'Pass'
    RESULT_FAIL = 'Fail'
    RESULT_CONDITIONAL = 'Conditional Pass'

    RESULT_CHOICES = [
        (RESULT_PASS, 'Pass'),
        (RESULT_FAIL, 'Fail'),
        (RESULT_CONDITIONAL, 'Conditional Pass'),
    ]

    stand = models.ForeignKey(
        Stand,
        on_delete=models.PROTECT,
        related_name='inspections',
    )
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='site_inspections',
    )
    inspection_date = models.DateTimeField(default=timezone.now, db_index=True)
    checklist = models.JSONField(null=True, blank=True)
    result = models.CharField(max_length=32, choices=RESULT_CHOICES, db_index=True)
    comments = models.TextField(blank=True)
    target_stage = models.ForeignKey(
        StandStage,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='inspection_targets',
    )
    follow_up_ticket = models.ForeignKey(
        'EngineerTicket',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='generated_inspections',
    )
    gis_locations = GenericRelation('gis.GISLocation', related_query_name='siteinspection')

    class Meta:
        verbose_name = 'site inspection'
        verbose_name_plural = 'site inspections'
        ordering = ['-inspection_date']
        indexes = [
            models.Index(fields=['stand'], name='siteinspection_stand_idx'),
            models.Index(fields=['inspector'], name='siteinspection_inspector_idx'),
            models.Index(fields=['result'], name='siteinspection_result_idx'),
        ]

    def clean(self):
        if self.result == self.RESULT_FAIL and not self.comments:
            raise ValidationError({'comments': 'Comments are required for failed inspections.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Inspection for {self.stand} on {self.inspection_date}'
