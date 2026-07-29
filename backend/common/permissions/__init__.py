"""Common permission abstractions for MEIMS."""

from .base import BasePermission
from .drf import RoleBasedPermission

__all__ = ["BasePermission", "RoleBasedPermission"]
