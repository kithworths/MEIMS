from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model
from .factories import create_user

User = get_user_model()


class AuthenticationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user_email = 'alice@example.com'
        cls.user_password = 'Str0ngPass!2026'
        cls.user = create_user(email=cls.user_email, password=cls.user_password)

    def setUp(self):
        self.client = APIClient()

    def test_user_creation_and_password_check(self):
        u = User.objects.get(email=self.user_email)
        self.assertTrue(u.check_password(self.user_password))
        self.assertEqual(str(u), self.user_email)

    def test_jwt_login_returns_tokens_and_profile(self):
        url = reverse('api:auth-login')
        resp = self.client.post(url, {'email': self.user_email, 'password': self.user_password}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        payload = resp.json()
        # Standardized response
        self.assertIn('success', payload)
        self.assertTrue(payload['success'])
        self.assertIn('data', payload)
        data = payload['data']
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], self.user_email)

    def test_profile_requires_authentication(self):
        url = reverse('api:auth-profile')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate and try again
        login_url = reverse('api:auth-login')
        login = self.client.post(login_url, {'email': self.user_email, 'password': self.user_password}, format='json')
        token = login.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp2 = self.client.get(url)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        payload = resp2.json()
        self.assertTrue(payload['success'])
        self.assertIn('data', payload)
        self.assertEqual(payload['data']['email'], self.user_email)

    def test_refresh_rejects_invalid_token(self):
        url = reverse('api:auth-refresh')
        resp = self.client.post(url, {'refresh': 'invalid'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        payload = resp.json()
        self.assertFalse(payload.get('success', True))
        self.assertIn('errors', payload)
        self.assertIn('refresh', payload['errors'])
        self.assertIn('Invalid refresh token', payload['message'])

    def test_change_password(self):
        # Login
        login_url = reverse('api:auth-login')
        login = self.client.post(login_url, {'email': self.user_email, 'password': self.user_password}, format='json')
        token = login.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        url = reverse('api:auth-change-password')
        resp = self.client.post(
            url,
            {
                'current_password': self.user_password,
                'new_password': 'NewStrongPass!2026',
                'confirm_password': 'NewStrongPass!2026',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Reload user from db
        user = User.objects.get(email=self.user_email)
        self.assertTrue(user.check_password('NewStrongPass!2026'))
