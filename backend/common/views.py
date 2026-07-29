from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from common.permissions.drf import RoleBasedPermission


class BaseModelViewSet(viewsets.ModelViewSet):
    """Base ModelViewSet that centralizes common DRF configuration used across the project.

    - Enforces authenticated access by default and RBAC checks via RoleBasedPermission.
    - Provides sensible filter/search/ordering backends so all inheritors support those features.
    - Child viewsets may override attributes like permission_module, filter_backends, search_fields, etc.
    """

    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Leave pagination to DRF settings.DEFAULT_PAGINATION_CLASS; override in child if needed
    # ordering_fields, filterset_fields, and search_fields are to be provided by children when relevant
