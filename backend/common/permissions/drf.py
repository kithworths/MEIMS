from rest_framework import permissions

from common.services.authorization import AuthorizationService


class RoleBasedPermission(permissions.BasePermission):
    """Check permission assignment dynamically for the authenticated user.

    This permission class consults the database-driven RBAC tables via
    AuthorizationService.has_permission(). Views may specify either:

    - permission_required: a string in the form 'module.action' (e.g. 'projects.Create')
    - permission_module and optional permission_action attributes

    If neither is present, the view's queryset.model._meta.model_name is used
    as the module and the HTTP method is mapped to a standard action.
    """

    permission_module = None
    permission_action = None
    permission_required = None

    action_map = {
        'GET': 'Read',
        'POST': 'Create',
        'PUT': 'Update',
        'PATCH': 'Update',
        'DELETE': 'Delete',
    }

    def get_permission_target(self, request, view):
        if getattr(view, 'permission_required', None):
            permission_required = view.permission_required
            if isinstance(permission_required, str) and '.' in permission_required:
                module, _, action = permission_required.partition('.')
                return module, action

        module = getattr(view, 'permission_module', None)
        action = getattr(view, 'permission_action', None)

        if action is None:
            action = self.action_map.get(request.method)

        if module is None and hasattr(view, 'queryset') and view.queryset is not None:
            module = view.queryset.model._meta.model_name

        return module, action

    def has_permission(self, request, view):
        # Authentication is required to evaluate RBAC permissions
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers bypass permission checks
        if getattr(request.user, 'is_superuser', False):
            return True

        module, action = self.get_permission_target(request, view)
        if not module or not action:
            return False

        # Primary DB-driven check
        if AuthorizationService.has_permission(request.user, module, action):
            return True

        # Fallback to any model-level helper if present on the User object
        has_perm = getattr(request.user, 'has_permission', None)
        if callable(has_perm):
            try:
                return bool(has_perm(module, action))
            except Exception:
                return False

        return False

    def has_object_permission(self, request, view, obj):
        # For now, object-level checks are equivalent to general permission checks.
        return self.has_permission(request, view)
