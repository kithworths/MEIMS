from common.permissions.drf import RoleBasedPermission


class AuditPermissions(RoleBasedPermission):
    def get_permission_target(self, request, view):
        if getattr(view, 'action', None) == 'export':
            return getattr(view, 'permission_module', None), 'Export'
        return super().get_permission_target(request, view)
