import io
import os

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from django.contrib.contenttypes.models import ContentType
from apps.projects.models import Project
from .models import Attachment, Document, DocumentVersion, Plan, PlanVersion
from .services import AttachmentService, DocumentService, PlanService

User = get_user_model()


class DocumentsModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='doc@example.com', password='pass')
        self.project = Project.objects.create(code='PRJDOC', name='Document Project', created_by=self.user, updated_by=self.user)
        self.sample_file = SimpleUploadedFile('test.txt', b'Hello world', content_type='text/plain')

    def test_document_versioning_and_locking(self):
        document = DocumentService.create(title='Policy Document', description='A policy doc.', created_by=self.user, updated_by=self.user)
        version = DocumentService.upload_version(document, self.sample_file, metadata={'version': '1'}, version_notes='Initial version.', user=self.user)
        self.assertEqual(version.version_number, 1)
        self.assertEqual(document.current_version, version)

        document.lock(self.user)
        self.assertTrue(document.is_locked)
        self.assertEqual(document.locked_by, self.user)
        document.unlock()
        self.assertFalse(document.is_locked)

    def test_attachment_immutable_storage(self):
        document = DocumentService.create(title='Attachment Doc', description='Document with attachment', created_by=self.user, updated_by=self.user)
        attachment = AttachmentService.create(
            content_type=ContentType.objects.get_for_model(document),
            object_id=document.id,
            file=self.sample_file,
            created_by=self.user,
            updated_by=self.user,
        )
        self.assertTrue(os.path.basename(attachment.file.name).startswith('test'))
        self.assertEqual(attachment.virus_scan_status, Attachment.VIRUS_PENDING)
        with self.assertRaises(Exception):
            attachment.file = SimpleUploadedFile('other.txt', b'New', content_type='text/plain')
            attachment.save()

    def test_plan_versioning(self):
        plan = PlanService.create(code='PLAN001', name='Test Plan', project=self.project, created_by=self.user, updated_by=self.user)
        plan_version = PlanService.upload_version(plan, self.sample_file, drawing_metadata={'sheet': 'A1'}, spatial_metadata={'zone': 'local'}, version_notes='First release.', user=self.user)
        self.assertEqual(plan_version.version_number, 1)
        self.assertEqual(plan.current_version, plan_version)
