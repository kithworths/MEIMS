# MEIMS User Roles

This document describes the responsibilities, permissions, workflows, and restrictions for each user role in MEIMS.

## Administrator

**Responsibilities**
- Manage system users and departments.
- Configure roles, permissions, and access levels.
- Oversee system settings and audit logs.
- Support other departments with access and configuration.

**Permissions**
- `user.*`
- `department.*`
- `authorization.*`
- `audit.read`
- `report.read`

**Accessible Modules**
- Users
- Departments
- Roles and Permissions
- Audit Logs
- Notifications
- Reports
- System Configuration

**Workflow**
- Create and manage user accounts.
- Assign departmental and RBAC roles.
- Review audit logs for compliance.
- Approve administrative requests.

**Approval Rights**
- Authorize user role changes.
- Approve system configuration updates.

**Restrictions**
- Administrative actions are logged for audit.
- May not override operational approvals in domain-specific workflows without proper governance.

## Director

**Responsibilities**
- Provide strategic oversight of departmental operations.
- Review and approve high-value projects and budgets.
- Monitor performance across municipal programs.

**Permissions**
- `project.read`
- `project.approve`
- `report.read`
- `department.read`
- `notification.read`

**Accessible Modules**
- Projects
- Reports
- Notifications
- Departments
- Audit summaries

**Workflow**
- Review project proposals and status dashboards.
- Approve or reject significant project milestones.
- Receive executive notifications.

**Approval Rights**
- Approve projects and funding requests.
- Authorize major status changes.

**Restrictions**
- May not manage low-level user accounts unless also assigned administrator privileges.

## Water Engineer

**Responsibilities**
- Manage water infrastructure projects and inspections.
- Review water-related plans and stand applications.
- Coordinate with field staff and contractors.

**Permissions**
- `project.read`
- `task.create`
- `task.update`
- `stand.read`
- `standstage.update`
- `gis.read`

**Accessible Modules**
- Projects
- Tasks
- Stand Management
- GIS
- Notifications

**Workflow**
- Assign tasks to technical staff.
- Review stand stage updates for water projects.
- Track GIS locations for water assets.

**Approval Rights**
- Approve technical stage transitions for water projects.
- Sign off water-specific task completions.

**Restrictions**
- Limited access to financial approvals unless appropriate role is assigned.

## Surveyor

**Responsibilities**
- Conduct land surveys and stand verification.
- Capture GIS coordinates and site metadata.
- Validate plans against survey requirements.

**Permissions**
- `gis.create`
- `gis.read`
- `stand.read`
- `standstage.create`
- `task.read`

**Accessible Modules**
- GIS
- Stand Management
- Tasks
- Reports

**Workflow**
- Record survey location data.
- Update stand stages with survey findings.
- Provide survey input into planning approvals.

**Approval Rights**
- Verify stand location and survey status.

**Restrictions**
- Cannot approve financial or executive-level project decisions.

## Town Planner

**Responsibilities**
- Review development applications and town planning submissions.
- Ensure compliance with zoning and land use policies.
- Coordinate across departments for planning approvals.

**Permissions**
- `plan.read`
- `task.create`
- `stand.read`
- `report.read`
- `notification.read`

**Accessible Modules**
- Plans
- Stand Management
- Tasks
- Reports
- Notifications

**Workflow**
- Evaluate plan submissions.
- Assign planning tasks and review statuses.
- Report on planning compliance.

**Approval Rights**
- Approve town planning stage completions.
- Authorize planning recommendations.

**Restrictions**
- May not change RBAC assignments or administrative settings.

## Civil Engineer

**Responsibilities**
- Manage civil engineering projects and technical reviews.
- Review infrastructure drawings and compliance documentation.
- Coordinate construction staging and inspections.

**Permissions**
- `project.read`
- `task.update`
- `standstage.update`
- `report.read`
- `gis.read`

**Accessible Modules**
- Projects
- Tasks
- Stand Management
- GIS
- Reports

**Workflow**
- Monitor engineering tasks and project milestones.
- Approve civil stage changes.
- Validate site inspections.

**Approval Rights**
- Approve engineering stage transitions.

**Restrictions**
- Limited financial and administrative authority without additional roles.

## Finance Officer

**Responsibilities**
- Manage project budgets, payments, and financial records.
- Review fee assessments and payment reconciliations.
- Generate finance and audit reports.

**Permissions**
- `payment.read`
- `payment.create`
- `payment.update`
- `report.read`
- `notification.read`

**Accessible Modules**
- Payments
- Reports
- Projects
- Notifications

**Workflow**
- Post payment receipts and reconcile transactions.
- Generate financial reports for auditing.
- Respond to payment exceptions.

**Approval Rights**
- Authorize payments and fee adjustments.

**Restrictions**
- Does not have broad project approval authority outside finance scope.

## Inspector

**Responsibilities**
- Conduct field inspections and compliance checks.
- Record inspection findings and update task status.
- Validate completion of safety and quality requirements.

**Permissions**
- `task.read`
- `task.update`
- `standstage.create`
- `gis.read`
- `notification.read`

**Accessible Modules**
- Tasks
- Stand Management
- GIS
- Notifications

**Workflow**
- Execute inspection tasks.
- Update stand stage progress with inspection results.
- Communicate issues and compliance gaps.

**Approval Rights**
- Approve inspection-based stage transitions.

**Restrictions**
- Cannot modify roles or department data.

## System Auditor

**Responsibilities**
- Review audit logs and security events.
- Validate compliance with procedural controls.
- Investigate suspicious actions and access patterns.

**Permissions**
- `audit.read`
- `report.read`
- `user.read`
- `department.read`

**Accessible Modules**
- Audit Logs
- Reports
- Users
- Departments

**Workflow**
- Review audit trail entries.
- Generate compliance reports.
- Escalate security incidents.

**Approval Rights**
- May not approve operational workflows but can request corrective action.

**Restrictions**
- Read-only access to most transactional workflows.
- Cannot modify user roles or business data unless explicitly granted.
