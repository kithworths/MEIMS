from __future__ import annotations

from typing import Dict, List

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.authorization.models import Permission, Role, RolePermission
from apps.departments.models import Department


class Command(BaseCommand):
    help = 'Seed initial Departments, Roles, Permissions and RolePermission associations (idempotent).'

    # Modules to create permissions for
    MODULES: List[str] = [
        'users',
        'departments',
        'authorization',
        'projects',
        'stands',
        'tasks',
        'payments',
        'paymentreceipts',
        'reports',
        'documents',
        'attachments',
        'plans',
        'gis',
        'notifications',
    ]

    ACTIONS: List[str] = [
        'Create',
        'Read',
        'Update',
        'Delete',
        'Approve',
        'Export',
        'Print',
        'Assign',
    ]

    DEPARTMENTS = [
        ('Administration', 'ADMIN'),
        ('Water', 'WATER'),
        ('Survey', 'SURVEY'),
        ('Town Planning', 'TOWN_PLANNING'),
        ('Civil Engineering', 'CIVIL_ENGINEERING'),
        ('Finance', 'FINANCE'),
        ('ICT', 'ICT'),
    ]

    ROLES: List[str] = [
        'System Administrator',
        'Director',
        'Water Engineer',
        'Surveyor',
        'Town Planner',
        'Civil Engineer',
        'Finance Officer',
        'Inspector',
        'Auditor',
    ]

    # Role -> allowed actions per module (defaults filled in run)
    ROLE_PERMISSIONS: Dict[str, Dict[str, List[str]]] = {}

    def _build_default_role_permissions(self):
        # Full access for sysadmin
        self.ROLE_PERMISSIONS['System Administrator'] = {
            module: self.ACTIONS[:] for module in self.MODULES
        }

        # Director: read/approve/export/print across modules
        director_actions = ['Read', 'Approve', 'Export', 'Print']
        self.ROLE_PERMISSIONS['Director'] = {module: director_actions[:] for module in self.MODULES}

        # Water Engineer: full on water-relevant modules, common on others
        self.ROLE_PERMISSIONS['Water Engineer'] = {
            **{m: ['Create', 'Read', 'Update', 'Approve', 'Export'] for m in ['projects', 'stands', 'gis']},
            **{m: ['Read', 'Export'] for m in self.MODULES if m not in ['projects', 'stands', 'gis']},
        }

        # Surveyor: create/read/update on survey-related modules
        self.ROLE_PERMISSIONS['Surveyor'] = {
            **{m: ['Create', 'Read', 'Update', 'Export'] for m in ['projects', 'stands', 'gis']},
            **{m: ['Read'] for m in self.MODULES if m not in ['projects', 'stands', 'gis']},
        }

        # Town Planner
        self.ROLE_PERMISSIONS['Town Planner'] = {
            **{m: ['Create', 'Read', 'Update', 'Approve', 'Export'] for m in ['projects', 'plans'] if m in self.MODULES},
            **{m: ['Read', 'Export'] for m in self.MODULES if m not in ['projects', 'plans']},
        }

        # Civil Engineer
        self.ROLE_PERMISSIONS['Civil Engineer'] = {
            **{m: ['Create', 'Read', 'Update', 'Export'] for m in ['projects', 'stands']},
            **{m: ['Read'] for m in self.MODULES if m not in ['projects', 'stands']},
        }

        # Finance Officer
        self.ROLE_PERMISSIONS['Finance Officer'] = {
            **{m: ['Create', 'Read', 'Update', 'Delete', 'Export'] for m in ['payments'] if m in self.MODULES},
            **{m: ['Read', 'Export'] for m in self.MODULES if m not in ['payments']},
        }

        # Inspector
        self.ROLE_PERMISSIONS['Inspector'] = {m: ['Read', 'Update', 'Approve'] for m in self.MODULES}

        # Auditor
        self.ROLE_PERMISSIONS['Auditor'] = {m: ['Read', 'Export'] for m in self.MODULES}

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Seeding initial data for MEIMS (departments, roles, permissions)...')

        self._build_default_role_permissions()

        # Seed Departments
        self.stdout.write('Seeding departments...')
        for dept_name, dept_code in self.DEPARTMENTS:
            dept, created = Department.objects.get_or_create(
                department_name=dept_name,
                defaults={
                    'department_code': dept_code,
                    'description': f'{dept_name} department',
                    'head_of_department': '',
                    'email': '',
                    'phone': '',
                    'office_location': '',
                    'is_active': True,
                },
            )
            if created:
                self.stdout.write(f'  Created department: {dept_name}')
            else:
                self.stdout.write(f'  Department exists: {dept_name}')

        # Seed Roles
        self.stdout.write('Seeding roles...')
        role_objs = {}
        for role_name in self.ROLES:
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'Default role: {role_name}', 'is_active': True},
            )
            role_objs[role_name] = role
            if created:
                self.stdout.write(f'  Created role: {role_name}')
            else:
                self.stdout.write(f'  Role exists: {role_name}')

        # Seed Permissions
        self.stdout.write('Seeding permissions...')
        perm_objs = {}
        for module in self.MODULES:
            for action in self.ACTIONS:
                perm, created = Permission.objects.get_or_create(
                    module=module,
                    action=action,
                    defaults={'description': f'{action} permission on {module}', 'is_active': True},
                )
                perm_objs[(module, action)] = perm
                if created:
                    self.stdout.write(f'  Created permission: {module}:{action}')

        # Assign RolePermissions
        self.stdout.write('Assigning permissions to roles...')
        assigned = 0
        for role_name, mapping in self.ROLE_PERMISSIONS.items():
            role = role_objs.get(role_name)
            if not role:
                self.stderr.write(f'Role not found (skipping): {role_name}')
                continue

            for module, actions in mapping.items():
                # If module not in perm_objs (e.g., 'plans' placeholder), skip
                for action in actions:
                    perm = perm_objs.get((module, action))
                    if not perm:
                        # Skip silently if permission not created for this module/action
                        continue
                    rp, created = RolePermission.objects.get_or_create(role=role, permission=perm)
                    if created:
                        assigned += 1
                        self.stdout.write(f'  Assigned {perm} to role {role.name}')

        self.stdout.write(self.style.SUCCESS(f'Seeding complete. Permissions assigned: {assigned}'))
