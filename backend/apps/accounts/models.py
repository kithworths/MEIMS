import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Custom manager for the enterprise user model.

    The manager centralizes user creation and ensures that email addresses
    are normalized and validated before any user is persisted.
    """

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError(_('The email address must be set'))

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_active', True)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with staff permissions."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom enterprise user model with UUID primary key."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Primary key for the user account.'),
    )
    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text=_('A unique email address used for authentication.'),
    )
    username = models.CharField(
        _('username'),
        max_length=150,
        blank=True,
        null=True,
        help_text=_('An optional human-friendly username.'),
    )
    first_name = models.CharField(
        _('first name'),
        max_length=150,
        help_text=_('The user\'s given name.'),
    )
    last_name = models.CharField(
        _('last name'),
        max_length=150,
        help_text=_('The user\'s family name.'),
    )
    phone_number = models.CharField(
        _('phone number'),
        max_length=30,
        blank=True,
        help_text=_('A contact number for the user.'),
    )
    employee_number = models.CharField(
        _('employee number'),
        max_length=50,
        unique=True,
        help_text=_('A unique identifier assigned by the company.'),
    )
    profile_photo = models.FileField(
        _('profile photo'),
        upload_to='profiles/photos/',
        blank=True,
        null=True,
        help_text=_('Optional file upload for the user profile photo.'),
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.PROTECT,
        related_name='users',
        blank=True,
        null=True,
        help_text=_('The organizational department the user belongs to.'),
    )
    role = models.ForeignKey(
        'departments.Role',
        on_delete=models.PROTECT,
        related_name='users',
        blank=True,
        null=True,
        help_text=_('The business role assigned to the user.'),
    )
    roles = models.ManyToManyField(
        'authorization.Role',
        through='authorization.UserRole',
        related_name='users',
        blank=True,
        help_text=_('RBAC roles assigned to the user.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        db_index=True,
        help_text=_('Designates whether this user should be treated as active.'),
    )
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        db_index=True,
        help_text=_('Designates whether the user can log into the admin site.'),
    )
    date_joined = models.DateTimeField(
        _('date joined'),
        default=timezone.now,
        db_index=True,
        help_text=_('The date and time when the account was created.'),
    )

    objects = UserManager()

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'employee_number']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['email']
        indexes = [
            models.Index(fields=['is_active', 'email'], name='user_active_email_idx'),
        ]

    def clean(self):
        """Normalize the email address before saving."""
        super().clean()
        self.email = self.__class__.objects.normalize_email(self.email)

    def get_full_name(self):
        """Return the first_name plus the last_name."""
        return f'{self.first_name} {self.last_name}'.strip()

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name

    def __str__(self):
        """Return a readable representation of the user."""
        return self.email

    def get_role_names(self):
        """Return the names of all active RBAC roles assigned to this user."""
        return list(self.roles.filter(is_active=True).values_list('name', flat=True))

    def has_permission(self, module, action):
        """Return True when the user has a matching active permission via assigned roles."""
        if self.is_superuser:
            return True

        if not module or not action:
            return False

        return self.roles.filter(
            is_active=True,
            permissions__is_active=True,
            permissions__module__iexact=module,
            permissions__action__iexact=action,
        ).exists()

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Send an email to this user."""
        from django.core.mail import send_mail

        send_mail(subject, message, from_email, [self.email], **kwargs)
