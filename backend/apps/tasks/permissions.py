from common.permissions.drf import RoleBasedPermission


class ServiceTypePermissions(RoleBasedPermission):
    pass


class ProjectTaskPermissions(RoleBasedPermission):
    pass


class TaskHistoryPermissions(RoleBasedPermission):
    pass


class EngineerTicketPermissions(RoleBasedPermission):
    pass


class EngineerTicketHistoryPermissions(RoleBasedPermission):
    pass


class SiteVisitPermissions(RoleBasedPermission):
    pass


class SiteInspectionPermissions(RoleBasedPermission):
    pass
