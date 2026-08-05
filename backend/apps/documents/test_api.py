import io

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from django.contrib.contenttypes.models import ContentType
from apps.projects.models import Project
from .models import Document, DocumentVersion, Attachment

User = get_user_model()


class DocumentsApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='api_doc@example.com', password='pass')
        # make superuser to bypass RBAC for tests
        self.user.is_superuser = True
        self.user.is_staff = True
        self.user.save()

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.project = Project.objects.create(code='PRJAPI', name='API Docs Project')
        self.sample_file = SimpleUploadedFile('upload.txt', b'API file contents', content_type='text/plain')

    def test_create_document_and_upload_version(self):
        # Create document
        payload = {'title': 'API Document', 'description': 'Created via API'}
        response = self.client.post('/api/v1/documents/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        doc_id = response.data['id']

        # Upload a version via document-versions endpoint
        with SimpleUploadedFile('v1.txt', b'Version one', content_type='text/plain') as f:
            data = {'document': doc_id, 'file': f, 'version_notes': 'Initial via API'}
            upload_resp = self.client.post('/api/v1/document-versions/', data, format='multipart')
        self.assertEqual(upload_resp.status_code, 201)
        version_id = upload_resp.data['id']

        # Verify version is linked to document
        doc_resp = self.client.get(f'/api/v1/documents/{doc_id}/')
        self.assertEqual(doc_resp.status_code, 200)
        # Serializer may return UUID objects; compare string forms to be robust
        self.assertEqual(str(doc_resp.data['current_version']), str(version_id))

        # Fetch versions list
        list_resp = self.client.get(f'/api/v1/document-versions/?document={doc_id}')
        self.assertEqual(list_resp.status_code, 200)
        self.assertTrue(list_resp.data.get('count', 0) >= 1)

    def test_lock_and_unlock_document(self):
        doc = Document.objects.create(title='Lockable', description='To be locked', created_by=self.user)
        resp_lock = self.client.post(f'/api/v1/documents/{doc.id}/lock/')
        self.assertEqual(resp_lock.status_code, 200)
        doc.refresh_from_db()
        self.assertTrue(doc.is_locked)

        resp_unlock = self.client.post(f'/api/v1/documents/{doc.id}/unlock/')
        self.assertEqual(resp_unlock.status_code, 200)
        doc.refresh_from_db()
        self.assertFalse(doc.is_locked)

    def test_upload_attachment_for_document(self):
        doc = Document.objects.create(title='AttachDoc', description='Has attachment', created_by=self.user)
        content_type = ContentType.objects.get_for_model(doc)

        with SimpleUploadedFile('attach.txt', b'Attachment data', content_type='text/plain') as f:
            payload = {'content_type': content_type.id, 'object_id': str(doc.id), 'file': f, 'description': 'API attach'}
            resp = self.client.post('/api/v1/attachments/', payload, format='multipart')

        self.assertEqual(resp.status_code, 201)
        attach_id = resp.data['id']
        attachment = Attachment.objects.get(pk=attach_id)
        self.assertEqual(attachment.content_type, content_type)
        self.assertEqual(attachment.object_id, doc.id)
