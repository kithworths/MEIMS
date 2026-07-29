from __future__ import annotations

from functools import wraps
from typing import Callable


def permission_required(permission: str) -> Callable:
    """Decorator to attach a permission_required string to view functions or classes.

    Usage:
        @permission_required('projects.Create')
        class ProjectCreateView(APIView):
            ...

    The decorator sets the `permission_required` attribute which is consumed by
    common.permissions.drf.RoleBasedPermission.
    """

    def decorator(obj):
        if isinstance(obj, type):
            # class-based view
            setattr(obj, 'permission_required', permission)
            return obj

        # function-based view
        @wraps(obj)
        def wrapper(*args, **kwargs):
            return obj(*args, **kwargs)

        setattr(wrapper, 'permission_required', permission)
        return wrapper

    return decorator
