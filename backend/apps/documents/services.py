from django.db import transaction
from django.shortcuts import get_object_or_404

from common.services.audit import AuditLogService
from .models import Attachment, Document, DocumentVersion, Plan, PlanVersion


class DocumentService:
    @staticmethod
    def get(document_id):
        return get_object_or_404(Document.objects.all(), pk=document_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = Document.objects.all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        document = Document.objects.create(**kwargs)
        AuditLogService.record(
            module='documents',
            action='Create',
            description=f'Document {document.title} created.',
            user=document.created_by,
        )
        return document

    @staticmethod
    @transaction.atomic
    def upload_version(document, file, metadata=None, version_notes='', user=None):
        version = DocumentVersion.objects.create(
            document=document,
            file=file,
            metadata=metadata or {},
            version_notes=version_notes,
            created_by=user,
            updated_by=user,
        )
        document.current_version = version
        document.save()
        AuditLogService.record(
            module='documents',
            action='Update',
            description=f'Document {document.title} version {version.version_number} uploaded.',
            user=user,
        )
        return version

    @staticmethod
    @transaction.atomic
    def lock(document, user):
        document.lock(user)
        AuditLogService.record(
            module='documents',
            action='Update',
            description=f'Document {document.title} locked by {user}.',
            user=user,
        )
        return document

    @staticmethod
    @transaction.atomic
    def unlock(document, user):
        document.unlock()
        AuditLogService.record(
            module='documents',
            action='Update',
            description=f'Document {document.title} unlocked by {user}.',
            user=user,
        )
        return document


class AttachmentService:
    @staticmethod
    def get(attachment_id):
        return get_object_or_404(Attachment.objects.all(), pk=attachment_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = Attachment.objects.all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        attachment = Attachment.objects.create(**kwargs)
        AuditLogService.record(
            module='attachments',
            action='Create',
            description=f'Attachment {attachment.file.name} created.',
            user=attachment.created_by,
        )
        return attachment


class PlanService:
    @staticmethod
    def get(plan_id):
        return get_object_or_404(Plan.objects.select_related('project', 'current_version'), pk=plan_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = Plan.objects.select_related('project', 'current_version').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        plan = Plan.objects.create(**kwargs)
        AuditLogService.record(
            module='plans',
            action='Create',
            description=f'Plan {plan.code} created.',
            user=plan.created_by,
        )
        return plan

    @staticmethod
    @transaction.atomic
    def upload_version(plan, file, drawing_metadata=None, spatial_metadata=None, version_notes='', user=None):
        version = PlanVersion.objects.create(
            plan=plan,
            file=file,
            drawing_metadata=drawing_metadata or {},
            spatial_metadata=spatial_metadata or {},
            version_notes=version_notes,
            created_by=user,
            updated_by=user,
        )
        plan.current_version = version
        plan.save()
        AuditLogService.record(
            module='plans',
            action='Update',
            description=f'Plan {plan.code} version {version.version_number} uploaded.',
            user=user,
        )
        return version
