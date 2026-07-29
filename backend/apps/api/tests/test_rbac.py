from __future__ import annotations

from django.test import TestCase
from django.contrib.auth import get_user_model

from .factories import create_user, create_role, create_permission, assign_permission_to_role, assign_role_to_user
from common.services.authorization import AuthorizationService

User = get_user_model()


class RBACTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = create_user(email='rbac.user@example.com')
        cls.role = create_role(name='Engineer')
        cls.permission = create_permission(module='projects', action='Create')
        assign_permission_to_role(cls.role, cls.permission)
        assign_role_to_user(cls.user, cls.role)

    def test_user_has_permission_via_role(self):
        has = AuthorizationService.has_permission(self.user, 'projects', 'Create')
        self.assertTrue(has)

    def test_user_lacks_unassigned_permission(self):
        self.assertFalse(AuthorizationService.has_permission(self.user, 'payments', 'Delete'))
