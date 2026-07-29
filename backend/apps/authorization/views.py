from rest_framework import permissions

from common.views import BaseModelViewSet
from .models import Permission, Role
from .serializers import PermissionSerializer, RoleSerializer


class PermissionViewSet(BaseModelViewSet):
    """REST API for managing RBAC permissions.

    Access to this endpoint is controlled via RBAC permissions stored in the database.
    Use the Permission model with module='authorization' and appropriate actions to grant access.
    """

    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_module = 'authorization'
    ordering_fields = ['module', 'action', 'created_at']
    ordering = ['module', 'action']
    filterset_fields = ['is_active']
    search_fields = ['module', 'action', 'description']


class RoleViewSet(BaseModelViewSet):
    """REST API for managing RBAC roles.

    Access to this endpoint is controlled via RBAC permissions stored in the database.
    Use the Permission model with module='authorization' and appropriate actions to grant access.
    """

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_module = 'authorization'
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
