from common.permissions.drf import RoleBasedPermission


class ProjectPermissions(RoleBasedPermission):
    """RBAC wrapper for project endpoints.

    Views may set permission_module = 'projects' to allow RoleBasedPermission to evaluate.
    """

    # Leave behavior to RoleBasedPermission; this subclass exists for explicit import and future extension.
    pass
