from __future__ import annotations

from typing import Dict, Any
from django.contrib.auth import get_user_model

from apps.departments.models import Department
from apps.authorization.models import Role, Permission, RolePermission, UserRole

User = get_user_model()


def create_user(email: str = 'test.user@example.com', password: str = 'Str0ngPass!2026', **kwargs) -> User:
    """Create a user for tests with sensible defaults."""
    defaults: Dict[str, Any] = {
        'first_name': 'Test',
        'last_name': 'User',
        'employee_number': kwargs.pop('employee_number', 'EMP-0001'),
        'is_active': True,
        'is_staff': False,
    }
    defaults.update(kwargs)
    user = User.objects.create_user(email=email, password=password, **defaults)
    return user


def create_department(name: str = 'Test Dept', code: str = 'TEST') -> Department:
    return Department.objects.create(department_name=name, department_code=code)


def create_role(name: str = 'Test Role') -> Role:
    return Role.objects.create(name=name)


def create_permission(module: str, action: str, description: str = '') -> Permission:
    perm, _ = Permission.objects.get_or_create(module=module, action=action, defaults={'description': description})
    return perm


def assign_permission_to_role(role: Role, permission: Permission) -> RolePermission:
    rp, _ = RolePermission.objects.get_or_create(role=role, permission=permission)
    return rp


def assign_role_to_user(user: User, role: Role) -> UserRole:
    ur, _ = UserRole.objects.get_or_create(user=user, role=role)
    return ur
