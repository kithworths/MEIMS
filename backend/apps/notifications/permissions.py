from common.permissions.drf import RoleBasedPermission


class NotificationPermissions(RoleBasedPermission):
    permission_module = 'notifications'
