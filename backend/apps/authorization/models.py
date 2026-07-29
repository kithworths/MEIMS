import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Permission(models.Model):
    """A permission associates a module with an allowed action."""

    ACTION_CREATE = 'Create'
    ACTION_READ = 'Read'
    ACTION_UPDATE = 'Update'
    ACTION_DELETE = 'Delete'
    ACTION_APPROVE = 'Approve'
    ACTION_EXPORT = 'Export'
    ACTION_PRINT = 'Print'
    ACTION_ASSIGN = 'Assign'

    ACTION_CHOICES = [
        (ACTION_CREATE, ACTION_CREATE),
        (ACTION_READ, ACTION_READ),
        (ACTION_UPDATE, ACTION_UPDATE),
        (ACTION_DELETE, ACTION_DELETE),
        (ACTION_APPROVE, ACTION_APPROVE),
        (ACTION_EXPORT, ACTION_EXPORT),
        (ACTION_PRINT, ACTION_PRINT),
        (ACTION_ASSIGN, ACTION_ASSIGN),
    ]

    id = models.UUIDField(
        _('id'),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the permission record.'),
    )
    module = models.CharField(
        _('module'),
        max_length=128,
        help_text=_('The application module or resource that this permission governs.'),
    )
    action = models.CharField(
        _('action'),
        max_length=50,
        choices=ACTION_CHOICES,
        help_text=_('The action allowed on the module.'),
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('A human readable description of the permission.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        db_index=True,
        help_text=_('Designates whether this permission is currently active.'),
    )
    created_at = models.DateTimeField(
        _('created at'),
        default=timezone.now,
        editable=False,
        db_index=True,
        help_text=_('The date and time when this permission was created.'),
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
        help_text=_('The date and time when this permission was last updated.'),
    )

    class Meta:
        verbose_name = _('permission')
        verbose_name_plural = _('permissions')
        unique_together = ('module', 'action')
        ordering = ['module', 'action']
        indexes = [
            models.Index(fields=['is_active', 'module'], name='perm_active_module_idx'),
        ]

    def __str__(self):
        return f'{self.module}:{self.action}'


class Role(models.Model):
    """A named collection of permissions assigned to users."""

    id = models.UUIDField(
        _('id'),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the role record.'),
    )
    name = models.CharField(
        _('name'),
        max_length=255,
        unique=True,
        help_text=_('A unique name for the RBAC role.'),
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Optional description of the role and its responsibilities.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        db_index=True,
        help_text=_('Designates whether this role is currently active.'),
    )
    permissions = models.ManyToManyField(
        Permission,
        through='RolePermission',
        related_name='roles',
        blank=True,
        help_text=_('Permissions granted to this role.'),
    )
    created_at = models.DateTimeField(
        _('created at'),
        default=timezone.now,
        editable=False,
        db_index=True,
        help_text=_('The date and time when this role was created.'),
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
        help_text=_('The date and time when this role was last updated.'),
    )

    class Meta:
        verbose_name = _('role')
        verbose_name_plural = _('roles')
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name'], name='auth_role_active_name_idx'),
        ]

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Explicit association between a role and a permission."""

    id = models.UUIDField(
        _('id'),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the role-permission association.'),
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        help_text=_('The role that receives the permission.'),
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        help_text=_('The permission granted to the role.'),
    )
    created_at = models.DateTimeField(
        _('created at'),
        default=timezone.now,
        editable=False,
        db_index=True,
        help_text=_('The date and time when this association was created.'),
    )

    class Meta:
        verbose_name = _('role permission')
        verbose_name_plural = _('role permissions')
        unique_together = ('role', 'permission')
        ordering = ['role__name', 'permission__module', 'permission__action']
        indexes = []

    def __str__(self):
        return f'{self.role.name} -> {self.permission}'


class UserRole(models.Model):
    """Explicit association between a user and a role."""

    id = models.UUIDField(
        _('id'),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the user-role association.'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_roles',
        help_text=_('The user assigned to the role.'),
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles',
        help_text=_('The role assigned to the user.'),
    )
    created_at = models.DateTimeField(
        _('created at'),
        default=timezone.now,
        editable=False,
        db_index=True,
        help_text=_('The date and time when this association was created.'),
    )

    class Meta:
        verbose_name = _('user role')
        verbose_name_plural = _('user roles')
        unique_together = ('user', 'role')
        ordering = ['role__name', 'user__email']
        indexes = []

    def __str__(self):
        return f'{self.user.email} -> {self.role.name}'
