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
from apps.notifications.models import Notification


class NotificationAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user_email = 'alice@example.com'
        cls.user_password = 'Str0ngPass!2026'
        cls.user = create_user(email=cls.user_email, password=cls.user_password, employee_number='EMP-0001')

        read_permission = create_permission('notifications', 'Read', 'Allows viewing notifications')
        create_permission_obj = create_permission('notifications', 'Create', 'Allows modifying notification status')
        role = create_role('Notification Reader')
        assign_permission_to_role(role, read_permission)
        assign_permission_to_role(role, create_permission_obj)
        assign_role_to_user(cls.user, role)

        cls.other_user = create_user(email='bob@example.com', password='Str0ngPass!2026', employee_number='EMP-0002')

        Notification.objects.create(
            user=cls.user,
            title='Task assigned',
            message='A new task has been assigned to you.',
            category=Notification.CATEGORY_TASK,
            priority=Notification.PRIORITY_HIGH,
        )
        Notification.objects.create(
            user=cls.user,
            title='Invoice review needed',
            message='A finance notification requires attention.',
            category=Notification.CATEGORY_FINANCE,
            priority=Notification.PRIORITY_MEDIUM,
            is_read=True,
        )
        Notification.objects.create(
            user=cls.other_user,
            title='Other user alert',
            message='This notification belongs to another user.',
            category=Notification.CATEGORY_SYSTEM,
            priority=Notification.PRIORITY_LOW,
        )

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

    def test_list_notifications_returns_current_user_notifications(self):
        resp = self.client.get(reverse('notification-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['data']['count'], 2)
        titles = {item['title'] for item in payload['data']['results']}
        self.assertSetEqual(titles, {'Task assigned', 'Invoice review needed'})

    def test_mark_read_updates_notification(self):
        notification = Notification.objects.filter(user=self.user, is_read=False).first()
        self.assertIsNotNone(notification)
        resp = self.client.post(reverse('notification-mark-read', args=[notification.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()['data']
        self.assertTrue(data['is_read'])
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_archive_notification_updates_notification(self):
        notification = Notification.objects.filter(user=self.user, is_archived=False).first()
        self.assertIsNotNone(notification)
        resp = self.client.post(reverse('notification-archive', args=[notification.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_archived)

    def test_mark_all_read_applies_to_user_notifications(self):
        Notification.objects.filter(user=self.user).update(is_read=False)
        resp = self.client.post(reverse('notification-mark-all-read'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        self.assertEqual(payload['data']['updated'], Notification.objects.filter(user=self.user, is_read=True).count())
        self.assertEqual(Notification.objects.filter(user=self.user, is_read=False).count(), 0)

    def test_archive_all_applies_to_user_notifications(self):
        Notification.objects.filter(user=self.user).update(is_archived=False)
        resp = self.client.post(reverse('notification-archive-all'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        self.assertEqual(payload['data']['updated'], Notification.objects.filter(user=self.user, is_archived=True).count())
        self.assertEqual(Notification.objects.filter(user=self.user, is_archived=False).count(), 0)
