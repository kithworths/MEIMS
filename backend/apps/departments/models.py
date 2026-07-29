import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Department(models.Model):
    """Represents an organizational department within the enterprise."""

    id = models.UUIDField(
        _('id'),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the department record.'),
    )
    department_name = models.CharField(
        _('department name'),
        max_length=255,
        unique=True,
        help_text=_('The official department name.'),
    )
    department_code = models.CharField(
        _('department code'),
        max_length=50,
        unique=True,
        help_text=_('A short unique code identifying the department.'),
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Optional department description.'),
    )
    head_of_department = models.CharField(
        _('head of department'),
        max_length=255,
        blank=True,
        help_text=_('The name of the department head.'),
    )
    email = models.EmailField(
        _('department email'),
        blank=True,
        help_text=_('Contact email address for the department.'),
    )
    phone = models.CharField(
        _('phone'),
        max_length=30,
        blank=True,
        help_text=_('Contact phone number for the department.'),
    )
    office_location = models.CharField(
        _('office location'),
        max_length=255,
        blank=True,
        help_text=_('Physical office location, if available.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        db_index=True,
        help_text=_('Designates whether this department is currently active.'),
    )
    created_at = models.DateTimeField(
        _('created at'),
        default=timezone.now,
        editable=False,
        db_index=True,
        help_text=_('Timestamp when this department was created.'),
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
        help_text=_('Timestamp when this department was last updated.'),
    )

    class Meta:
        verbose_name = _('department')
        verbose_name_plural = _('departments')
        ordering = ['department_name']
        indexes = [
            models.Index(fields=['is_active', 'department_name'], name='dept_active_name_idx'),
        ]

    def __str__(self):
        return self.department_name


class Role(models.Model):
    """Represents a business role that can be assigned to a user."""

    name = models.CharField(
        _('name'),
        max_length=255,
        unique=True,
        help_text=_('A unique role name used for business assignments.'),
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Optional description of the role or responsibility.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        db_index=True,
        help_text=_('Designates whether this role is active.'),
    )
    created_at = models.DateTimeField(
        _('created at'),
        default=timezone.now,
        editable=False,
        db_index=True,
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
    )

    class Meta:
        verbose_name = _('role')
        verbose_name_plural = _('roles')
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name'], name='role_active_name_idx'),
        ]

    def __str__(self):
        return self.name
