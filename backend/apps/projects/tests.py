from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Project


User = get_user_model()


class ProjectModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='pass')

    def test_create_project(self):
        p = Project.objects.create(code='PRJ001', name='Test Project', created_by=self.user, updated_by=self.user)
        self.assertIsNotNone(p.id)
        self.assertEqual(p.code, 'PRJ001')
        self.assertEqual(p.created_by, self.user)
        self.assertFalse(p.is_deleted)
