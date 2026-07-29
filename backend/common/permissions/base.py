from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BasePermission(ABC):
    """Base permission contract for MEIMS.

    This class defines the minimum interface for all permission
    implementations used by the service layer or request layer.
    """

    @abstractmethod
    def has_permission(self, user: Any, obj: Any | None = None) -> bool:
        """Return True when the user has permission to access the resource."""
        raise NotImplementedError

    def has_object_permission(self, user: Any, obj: Any) -> bool:
        """Return True when the user has permission to access a specific object."""
        return True
