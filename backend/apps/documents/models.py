import hashlib
import mimetypes
import os
import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

MAX_UPLOAD_SIZE_BYTES = getattr(settings, 'MAX_UPLOAD_SIZE_BYTES', 50 * 1024 * 1024)

UPLOAD_STATUS_PENDING = 'Pending'
UPLOAD_STATUS_SCANNING = 'Scanning'
UPLOAD_STATUS_CLEAN = 'Clean'
UPLOAD_STATUS_INFECTED = 'Infected'
UPLOAD_STATUS_REJECTED = 'Rejected'

UPLOAD_STATUS_CHOICES = [
    (UPLOAD_STATUS_PENDING, 'Pending'),
    (UPLOAD_STATUS_SCANNING, 'Scanning'),
    (UPLOAD_STATUS_CLEAN, 'Clean'),
    (UPLOAD_STATUS_INFECTED, 'Infected'),
    (UPLOAD_STATUS_REJECTED, 'Rejected'),
]


class DocumentBaseModel(models.Model):
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
        indexes = [
            models.Index(fields=['is_active', 'is_deleted', 'created_at'], name='%(app_label)s_%(class)s_active_deleted_created_idx'),
        ]


class Document(DocumentBaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='documents_locked',
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    current_version = models.ForeignKey(
        'DocumentVersion',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
    )
    attachments = GenericRelation('documents.Attachment', related_query_name='document')

    class Meta:
        verbose_name = 'document'
        verbose_name_plural = 'documents'
        ordering = ['-created_at', 'title']
        indexes = [
            models.Index(fields=['is_locked'], name='document_locked_idx'),
        ]

    def clean(self):
        if self.is_locked and not self.locked_by:
            raise ValidationError({'locked_by': 'Locked documents must have an owner.'})

    def lock(self, user):
        self.is_locked = True
        self.locked_by = user
        self.locked_at = timezone.now()
        self.save()

    def unlock(self):
        self.is_locked = False
        self.locked_by = None
        self.locked_at = None
        self.save()

    def __str__(self):
        return self.title


class DocumentVersion(DocumentBaseModel):
    document = models.ForeignKey(Document, on_delete=models.PROTECT, related_name='versions')
    version_number = models.PositiveIntegerField(default=1, db_index=True)
    file = models.FileField(upload_to='documents/versions/%Y/%m/%d/')
    file_checksum = models.CharField(max_length=64, blank=True, editable=False)
    mime_type = models.CharField(max_length=128, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    metadata = models.JSONField(null=True, blank=True)
    version_notes = models.TextField(blank=True)
    storage_backend = models.CharField(max_length=128, blank=True)
    scan_status = models.CharField(max_length=20, choices=UPLOAD_STATUS_CHOICES, default=UPLOAD_STATUS_PENDING)

    class Meta:
        verbose_name = 'document version'
        verbose_name_plural = 'document versions'
        unique_together = ('document', 'version_number')
        ordering = ['-version_number']
        indexes = [
            models.Index(fields=['document', 'version_number'], name='documentversion_idx'),
        ]

    def clean(self):
        if self.document.is_locked:
            raise ValidationError('Document is locked and cannot accept new versions.')

        if self.file:
            self.file.seek(0)
            checksum = hashlib.sha256()
            for chunk in self.file.chunks():
                checksum.update(chunk)
            self.file_checksum = checksum.hexdigest()
            self.size_bytes = self.file.size
            if self.size_bytes == 0:
                raise ValidationError({'file': 'Document version file cannot be empty.'})
            if self.size_bytes > MAX_UPLOAD_SIZE_BYTES:
                raise ValidationError({'file': f'Document version file exceeds the {MAX_UPLOAD_SIZE_BYTES} byte limit.'})
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
            self.storage_backend = getattr(self.file.storage, 'location', '') or self.file.storage.__class__.__name__

            duplicate = DocumentVersion.objects.filter(document=self.document, file_checksum=self.file_checksum)
            if self.pk:
                duplicate = duplicate.exclude(pk=self.pk)
            if duplicate.exists():
                raise ValidationError({'file': 'A duplicate document version already exists for this document.'})

        if self.pk is None and self.version_number == 1:
            last_version = DocumentVersion.objects.filter(document=self.document).order_by('-version_number').first()
            self.version_number = last_version.version_number + 1 if last_version else 1

    def save(self, *args, **kwargs):
        if self.file and not self.file_checksum:
            self.file.seek(0)
            checksum = hashlib.sha256()
            for chunk in self.file.chunks():
                checksum.update(chunk)
            self.file_checksum = checksum.hexdigest()
            self.size_bytes = self.file.size
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
            self.storage_backend = getattr(self.file.storage, 'location', '') or self.file.storage.__class__.__name__

        if self.pk is None and self.version_number == 1:
            last_version = DocumentVersion.objects.filter(document=self.document).order_by('-version_number').first()
            self.version_number = last_version.version_number + 1 if last_version else 1

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.document.title} v{self.version_number}'


class Attachment(DocumentBaseModel):
    VIRUS_PENDING = 'Pending'
    VIRUS_CLEAN = 'Clean'
    VIRUS_INFECTED = 'Infected'

    VIRUS_STATUS_CHOICES = [
        (VIRUS_PENDING, 'Pending'),
        (VIRUS_CLEAN, 'Clean'),
        (VIRUS_INFECTED, 'Infected'),
    ]

    content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    description = models.TextField(blank=True)
    file_checksum = models.CharField(max_length=64, blank=True, editable=False)
    mime_type = models.CharField(max_length=128, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    virus_scan_status = models.CharField(max_length=20, choices=VIRUS_STATUS_CHOICES, default=VIRUS_PENDING)
    is_immutable = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'attachment'
        verbose_name_plural = 'attachments'
        indexes = [
            models.Index(fields=['content_type', 'object_id'], name='attachment_content_idx'),
        ]

    def clean(self):
        if self.file:
            if self.file.size == 0:
                raise ValidationError({'file': 'Attachment file cannot be empty.'})
            if self.file.size > 50 * 1024 * 1024:
                raise ValidationError({'file': 'Attachment file exceeds the 50MB limit.'})
            self.file.seek(0)
            checksum = hashlib.sha256()
            for chunk in self.file.chunks():
                checksum.update(chunk)
            self.file_checksum = checksum.hexdigest()
            self.size_bytes = self.file.size
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'

        if self.pk and self.is_immutable:
            original = Attachment.objects.filter(pk=self.pk).first()
            if original and (original.file.name != self.file.name or original.file_checksum != self.file_checksum):
                raise ValidationError('Attachments are immutable once stored.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Attachment {os.path.basename(self.file.name)}'


class Plan(DocumentBaseModel):
    STATUS_DRAFT = 'Draft'
    STATUS_ACTIVE = 'Active'
    STATUS_SUPERSEDED = 'Superseded'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_SUPERSEDED, 'Superseded'),
    ]

    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(
        'projects.Project',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='plans',
    )
    linked_documents = models.ManyToManyField(Document, blank=True, related_name='linked_plans')
    current_version = models.ForeignKey(
        'PlanVersion',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
    )
    drawing_metadata = models.JSONField(null=True, blank=True)
    spatial_metadata = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    attachments = GenericRelation('documents.Attachment', related_query_name='plan')
    gis_locations = GenericRelation('gis.GISLocation', related_query_name='plan')

    class Meta:
        verbose_name = 'plan'
        verbose_name_plural = 'plans'
        ordering = ['code']
        indexes = [
            models.Index(fields=['code'], name='plan_code_idx'),
            models.Index(fields=['status'], name='plan_status_idx'),
        ]

    def __str__(self):
        return f'{self.code} - {self.name}'


class PlanVersion(DocumentBaseModel):
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='versions')
    version_number = models.PositiveIntegerField(default=1, db_index=True)
    file = models.FileField(upload_to='plans/versions/%Y/%m/%d/')
    file_checksum = models.CharField(max_length=64, blank=True, editable=False)
    mime_type = models.CharField(max_length=128, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    drawing_metadata = models.JSONField(null=True, blank=True)
    spatial_metadata = models.JSONField(null=True, blank=True)
    version_notes = models.TextField(blank=True)
    storage_backend = models.CharField(max_length=128, blank=True)
    scan_status = models.CharField(max_length=20, choices=UPLOAD_STATUS_CHOICES, default=UPLOAD_STATUS_PENDING)

    class Meta:
        verbose_name = 'plan version'
        verbose_name_plural = 'plan versions'
        unique_together = ('plan', 'version_number')
        ordering = ['-version_number']
        indexes = [
            models.Index(fields=['plan', 'version_number'], name='planversion_idx'),
        ]

    def clean(self):
        if self.file:
            self.file.seek(0)
            checksum = hashlib.sha256()
            for chunk in self.file.chunks():
                checksum.update(chunk)
            self.file_checksum = checksum.hexdigest()
            self.size_bytes = self.file.size
            if self.size_bytes == 0:
                raise ValidationError({'file': 'Plan version file cannot be empty.'})
            if self.size_bytes > MAX_UPLOAD_SIZE_BYTES:
                raise ValidationError({'file': f'Plan version file exceeds the {MAX_UPLOAD_SIZE_BYTES} byte limit.'})
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
            self.storage_backend = getattr(self.file.storage, 'location', '') or self.file.storage.__class__.__name__

            duplicate = PlanVersion.objects.filter(plan=self.plan, file_checksum=self.file_checksum)
            if self.pk:
                duplicate = duplicate.exclude(pk=self.pk)
            if duplicate.exists():
                raise ValidationError({'file': 'A duplicate plan version already exists for this plan.'})

    def save(self, *args, **kwargs):
        if self.file and not self.file_checksum:
            self.file.seek(0)
            checksum = hashlib.sha256()
            for chunk in self.file.chunks():
                checksum.update(chunk)
            self.file_checksum = checksum.hexdigest()
            self.size_bytes = self.file.size
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
            self.storage_backend = getattr(self.file.storage, 'location', '') or self.file.storage.__class__.__name__

        if self.pk is None and self.version_number == 1:
            last_version = PlanVersion.objects.filter(plan=self.plan).order_by('-version_number').first()
            self.version_number = last_version.version_number + 1 if last_version else 1

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.plan.code} v{self.version_number}'
