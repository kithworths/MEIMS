from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.api.tests.factories import (
    assign_permission_to_role,
    assign_role_to_user,
    create_permission,
    create_role,
    create_user,
)
from .models import AuditLog


class AuditAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user_email = 'auditor@example.com'
        cls.user_password = 'Str0ngPass!2026'
        cls.user = create_user(email=cls.user_email, password=cls.user_password, employee_number='EMP-1001')

        read_perm = create_permission('audit', 'Read', 'Allows viewing audit logs')
        export_perm = create_permission('audit', 'Export', 'Allows exporting audit logs')
        role = create_role('Auditor')
        assign_permission_to_role(role, read_perm)
        assign_permission_to_role(role, export_perm)
        assign_role_to_user(cls.user, role)

        cls.other_user = create_user(email='finance@example.com', password='Str0ngPass!2026', employee_number='EMP-1002')
        other_role = create_role('Finance')
        assign_role_to_user(cls.other_user, other_role)

        AuditLog.objects.create(
            user=cls.user,
            module='authentication',
            action=AuditLog.ACTION_LOGIN,
            description='User logged in',
            object_type='User',
            object_id=str(cls.user.id),
            ip_address='127.0.0.1',
            browser='TestAgent/1.0',
            request_method='POST',
        )
        AuditLog.objects.create(
            user=cls.user,
            module='reports',
            action=AuditLog.ACTION_EXPORT,
            description='Exported quarterly report',
            object_type='Report',
            object_id='Q1',
            ip_address='127.0.0.1',
            browser='TestAgent/1.0',
            request_method='GET',
        )
        AuditLog.objects.create(
            user=cls.other_user,
            module='finance',
            action=AuditLog.ACTION_READ,
            description='Viewed payment record',
            object_type='Payment',
            object_id='PAY-001',
            ip_address='10.0.0.1',
            browser='TestAgent/1.0',
            request_method='GET',
        )

    def setUp(self):
        self.client = APIClient()
        login_url = reverse('api:auth-login')
        response = self.client.post(
            login_url,
            {'email': self.user_email, 'password': self.user_password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_list_audit_records(self):
        response = self.client.get(reverse('audit-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()['data']
        self.assertIn('results', payload)
        self.assertEqual(len(payload['results']), 4)

    def test_filter_audit_by_role(self):
        response = self.client.get(reverse('audit-list'), {'role': 'Auditor'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()['data']
        self.assertEqual(len(payload['results']), 2)
        self.assertTrue(all(record['user_email'] == self.user_email for record in payload['results']))

    def test_search_audit_records(self):
        response = self.client.get(reverse('audit-list'), {'search': 'payment'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()['data']
        self.assertEqual(len(payload['results']), 1)
        self.assertEqual(payload['results'][0]['object_type'], 'Payment')

    def test_export_audit_csv(self):
        export_path = reverse('audit-export')
        response = self.client.get(export_path)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('timestamp,user_email', response.content.decode())

    def test_audit_summary(self):
        response = self.client.get(reverse('audit-summary'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()['data']
        self.assertIn('actions', payload)
        self.assertIn('daily_trend', payload)
        self.assertIn('roles', payload)
        action_names = {item['action'] for item in payload['actions']}
        self.assertIn(AuditLog.ACTION_EXPORT, action_names)
        self.assertIn(AuditLog.ACTION_LOGIN, action_names)
