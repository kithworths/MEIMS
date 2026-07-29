from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status

from apps.audit.models import AuditLog
from .factories import create_user


class AuditAndAPIResponseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user(email='audit.user@example.com')

    def setUp(self):
        self.client = APIClient()

    def test_login_creates_audit_entry_and_response_structure(self):
        login_url = reverse('api:auth-login')
        resp = self.client.post(login_url, {'email': self.user.email, 'password': 'Str0ngPass!2026'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        self.assertIn('success', payload)
        self.assertTrue(payload['success'])
        # Check audit log
        logs = AuditLog.objects.filter(module__icontains='auth')
        self.assertTrue(logs.exists())

    def test_permission_denied_returns_standard_error_shape(self):
        # Attempt to access protected endpoint without credentials
        url = '/api/departments/'
        resp = self.client.post(url, {'department_name': 'X', 'department_code': 'X1'}, format='json')
        payload = resp.json()
        # Should be standardized error or unauthorized
        self.assertIn('success', payload)
        self.assertFalse(payload['success'])
        self.assertIn('message', payload)
        self.assertIn('errors', payload)
