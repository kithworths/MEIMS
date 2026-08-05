from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.api.tests.factories import (
    create_user,
    create_permission,
    create_role,
    assign_permission_to_role,
    assign_role_to_user,
)
from apps.projects.models import Project
from apps.departments.models import Department
from .models import Report


class ReportAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user_email = 'reporter@example.com'
        cls.user_password = 'Str0ngPass!2026'
        cls.user = create_user(email=cls.user_email, password=cls.user_password)

        read_perm = create_permission('reports', 'Read', 'Allows viewing reports')
        create_perm = create_permission('reports', 'Create', 'Allows creating reports')
        role = create_role('Report Creator')
        assign_permission_to_role(role, read_perm)
        assign_permission_to_role(role, create_perm)
        assign_role_to_user(cls.user, role)

        # create a department and project to ensure report has data
        cls.dept = Department.objects.create(department_name='Infra', department_code='INFRA')
        Project.objects.create(code='P-001', name='Bridge Works', status='Active', start_date=None, planned_end_date=None, actual_end_date=None, budget_total=None, currency='USD', metadata={'department_id': str(cls.dept.id)})

    def setUp(self):
        self.client = APIClient()
        login_url = reverse('api:auth-login')
        login_resp = self.client.post(
            login_url,
            {'email': self.user_email, 'password': self.user_password},
            format='json',
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        token = login_resp.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_generate_project_report_csv(self):
        resp = self.client.post(reverse('report-list'), data={
            'report_name': 'Project Portfolio',
            'report_type': 'project',
            'format': 'csv',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        self.assertTrue(payload['success'])
        data = payload['data']
        self.assertEqual(data['report_type'], 'project')
        self.assertEqual(data['format'], 'csv')
        self.assertEqual(data['status'], Report.STATUS_COMPLETED)
        self.assertIsNotNone(data['file_url'])

    def test_generate_department_report_csv_with_date_filters(self):
        resp = self.client.post(reverse('report-list'), data={
            'report_name': 'Department Summary',
            'report_type': 'department',
            'format': 'csv',
            'start_date': None,
            'end_date': None,
            'department_id': str(self.dept.id),
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        data = payload['data']
        self.assertEqual(data['report_type'], 'department')
        self.assertEqual(data['status'], Report.STATUS_COMPLETED)
        self.assertIsNotNone(data['file_url'])
