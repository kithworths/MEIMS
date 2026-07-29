from __future__ import annotations

from apps.authorization.models import Permission


class AuthorizationService:
    """Service encapsulating runtime checks for RBAC permissions.

    Use this service to determine whether a given user has a permission
    represented by (module, action). The service consults the database-driven
    Permission -> RolePermission -> UserRole relationships.
    """

    @staticmethod
    def has_permission(user, module: str, action: str) -> bool:
        """Return True when the user has the named permission.

        Superusers bypass the permission checks.
        Module matching is case-insensitive for convenience.
        """
        if user is None:
            return False

        # Superusers are allowed everything
        if getattr(user, 'is_superuser', False):
            return True

        if not module or not action:
            return False

        # Query for an active Permission with the given module/action that is
        # related to at least one active Role held by the user.
        try:
            return Permission.objects.filter(
                module__iexact=module,
                action=action,
                is_active=True,
                roles__is_active=True,
                roles__user_roles__user=user,
            ).exists()
        except Exception:
            # On unexpected errors (missing tables during migrations), deny access.
            return False
