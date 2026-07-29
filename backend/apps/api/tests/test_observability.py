from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .factories import create_user


class ObservabilityAndAdminOperationsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_startup_health_endpoint_returns_payload(self):
        response = self.client.get(reverse('api:health-startup'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['data']['status'], 'startup')
        self.assertIn('runtime', payload['data'])

    def test_admin_operations_require_staff_access(self):
        user = create_user(email='operator@example.com')
        self.client.force_authenticate(user=user)

        response = self.client.post(reverse('api:admin-cache-clear'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_operations_accept_staff_users(self):
        user = create_user(email='admin@example.com', is_staff=True, is_superuser=True)
        self.client.force_authenticate(user=user)

        response = self.client.post(reverse('api:admin-cache-clear'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertTrue(payload['data']['cleared'])

    def test_unknown_route_returns_error_id(self):
        response = self.client.get('/api/does-not-exist/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        payload = response.json()
        self.assertFalse(payload['success'])
        self.assertIn('error_id', payload)
