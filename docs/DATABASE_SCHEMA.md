# MEIMS Database Schema

This document defines the planned database entities for MEIMS. Each table uses UUID primary keys for global uniqueness and future scaling.

## Users

**Purpose**
Store government staff and system users with authentication, profile, and role details.

**Fields**
- `id` (UUID, PK)
- `email` (string, unique)
- `username` (string, optional)
- `first_name` (string)
- `last_name` (string)
- `phone_number` (string)
- `employee_number` (string, unique)
- `profile_photo` (file path / URL)
- `department_id` (UUID, FK to Departments)
- `role_id` (UUID, FK to Roles)
- `is_active` (boolean)
- `is_staff` (boolean)
- `is_superuser` (boolean)
- `date_joined` (timestamp)
- `last_login` (timestamp)

**Relationships**
- Many-to-one with `Departments`
- Many-to-one with `Roles`
- Many-to-many with `Authorization.Roles` through `UserRole`

**Primary Keys**
- `id`

**Foreign Keys**
- `department_id` references `Departments(id)`
- `role_id` references `Roles(id)`

**Indexes**
- Unique index on `email`
- Unique index on `employee_number`
- Index on `department_id`
- Index on `role_id`

**Constraints**
- Non-null constraints for `email`, `first_name`, `last_name`, `employee_number`
- Unique constraint for `email` and `employee_number`
- Email normalization and canonical uniqueness enforcement

**Normalization**
- Department, role, and permission data are stored in separate tables to avoid duplication.

**Future expansion notes**
- Add federated login metadata for SSO
- Add audit settings per user
- Add user preferences and UI settings

## Departments

**Purpose**
Manage organizational departments within the municipal council.

**Fields**
- `id` (UUID, PK)
- `department_name` (string)
- `department_code` (string, unique)
- `description` (text)
- `head_of_department` (string)
- `email` (string)
- `phone` (string)
- `office_location` (string)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- One-to-many with `Users`
- One-to-many with `Projects`
- One-to-many with `Tasks`

**Primary Keys**
- `id`

**Foreign Keys**
- Not required for self-contained reference data

**Indexes**
- Unique index on `department_code`
- Index on `is_active`
- Full-text search index on `department_name`

**Constraints**
- Required `department_name` and `department_code`
- Valid email format on `email`

**Normalization**
- Department details are independent from personnel and project entities.

**Future expansion notes**
- Add department hierarchy or parent-child relationships
- Store department-level SLA and service area metadata

## Roles

**Purpose**
Define reusable business roles for RBAC and workflow assignment.

**Fields**
- `id` (UUID, PK)
- `name` (string, unique)
- `description` (text)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-many with `Permissions` through `RolePermission`
- Many-to-many with `Users` through `UserRole`

**Primary Keys**
- `id`

**Foreign Keys**
- Not directly on `Roles` table

**Indexes**
- Unique index on `name`
- Index on `is_active`

**Constraints**
- Required `name`
- Role names must be unique and immutable for workflow consistency

**Normalization**
- Roles are separate from permissions to create a flexible RBAC matrix.

**Future expansion notes**
- Add hierarchical roles or role groups
- Add role lifecycle state and deprecation timestamp

## Permissions

**Purpose**
Define actions and modules that users can perform within MEIMS.

**Fields**
- `id` (UUID, PK)
- `module` (string)
- `action` (string)
- `description` (text)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-many with `Roles` through `RolePermission`

**Primary Keys**
- `id`

**Foreign Keys**
- Not directly on `Permissions`

**Indexes**
- Composite index on `(module, action)`
- Index on `is_active`

**Constraints**
- Unique constraint on `(module, action)`
- Required `module` and `action`

**Normalization**
- Keeps permission definitions independent of business roles and assignment logic.

**Future expansion notes**
- Add permission categories and scope attributes
- Add contextual permission support for object-level rules

## RolePermission

**Purpose**
Link roles to permissions to form the RBAC matrix.

**Fields**
- `id` (UUID, PK)
- `role_id` (UUID, FK to Roles)
- `permission_id` (UUID, FK to Permissions)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-one with `Roles`
- Many-to-one with `Permissions`

**Primary Keys**
- `id`

**Foreign Keys**
- `role_id` references `Roles(id)`
- `permission_id` references `Permissions(id)`

**Indexes**
- Composite unique index on `(role_id, permission_id)`
- Index on `is_active`

**Constraints**
- Unique mapping for each role and permission combination

**Normalization**
- Normalizes many-to-many relationships between roles and permissions.

**Future expansion notes**
- Add assignment metadata for approval workflows
- Add temporal activation windows for permissions

## UserRole

**Purpose**
Associate users with one or more RBAC roles.

**Fields**
- `id` (UUID, PK)
- `user_id` (UUID, FK to Users)
- `role_id` (UUID, FK to Roles)
- `assigned_at` (timestamp)
- `expires_at` (timestamp, optional)
- `is_active` (boolean)

**Relationships**
- Many-to-one with `Users`
- Many-to-one with `Roles`

**Primary Keys**
- `id`

**Foreign Keys**
- `user_id` references `Users(id)`
- `role_id` references `Roles(id)`

**Indexes**
- Composite unique index on `(user_id, role_id)`
- Index on `expires_at`

**Constraints**
- Prevent duplicate role assignment per user

**Normalization**
- Separates transient role assignments from user profile details.

**Future expansion notes**
- Add delegation or substitute role capabilities

## Projects

**Purpose**
Represent municipal projects managed through the platform.

**Fields**
- `id` (UUID, PK)
- `project_name` (string)
- `project_code` (string, unique)
- `description` (text)
- `department_id` (UUID, FK to Departments)
- `stand_id` (UUID, FK to Stands, optional)
- `status` (string)
- `start_date` (date)
- `end_date` (date)
- `budget` (decimal)
- `created_by` (UUID, FK to Users)
- `approved_by` (UUID, FK to Users, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-one with `Departments`
- Many-to-one with `Users` for created and approved metadata
- One-to-many with `Tasks`
- One-to-many with `Reports`

**Primary Keys**
- `id`

**Foreign Keys**
- `department_id` references `Departments(id)`
- `stand_id` references `Stands(id)`
- `created_by` references `Users(id)`
- `approved_by` references `Users(id)`

**Indexes**
- Unique index on `project_code`
- Index on `department_id`
- Index on `status`

**Constraints**
- Required `project_name`, `project_code`, `department_id`
- Budget must be positive

**Normalization**
- Projects are normalized from tasks, reports, and financial transactions.

**Future expansion notes**
- Add multi-department collaboration and funding sources
- Add project lifecycle and risk ratings

## Stands

**Purpose**
Capture parcel or stand-level data for land and infrastructure management.

**Fields**
- `id` (UUID, PK)
- `stand_reference` (string, unique)
- `location_name` (string)
- `description` (text)
- `site_area` (decimal)
- `phase` (string)
- `status` (string)
- `project_id` (UUID, FK to Projects)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-one with `Projects`
- One-to-many with `StandStages`
- One-to-one or one-to-many with `GISLocations`

**Primary Keys**
- `id`

**Foreign Keys**
- `project_id` references `Projects(id)`

**Indexes**
- Unique index on `stand_reference`
- Index on `status`

**Constraints**
- Required `stand_reference`
- Valid numeric values for `site_area`

**Normalization**
- Stand data is separate from project metadata and location geometry.

**Future expansion notes**
- Add land ownership and zoning classification
- Add external title register references

## Stand Stages

**Purpose**
Track the lifecycle stages of a stand or property for approvals and inspections.

**Fields**
- `id` (UUID, PK)
- `stand_id` (UUID, FK to Stands)
- `stage_name` (string)
- `status` (string)
- `started_at` (timestamp)
- `completed_at` (timestamp, optional)
- `assigned_to` (UUID, FK to Users, optional)
- `notes` (text)

**Relationships**
- Many-to-one with `Stands`
- Optional many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `stand_id` references `Stands(id)`
- `assigned_to` references `Users(id)`

**Indexes**
- Index on `stand_id`
- Index on `stage_name`

**Constraints**
- Required `stage_name`
- `completed_at` must be after `started_at`

**Normalization**
- Stage tracking is separated from stand metadata for flexible workflows.

**Future expansion notes**
- Add stage templates and approval history

## Plans

**Purpose**
Store plan documents, drawings, and application packages for review.

**Fields**
- `id` (UUID, PK)
- `plan_name` (string)
- `plan_code` (string)
- `description` (text)
- `project_id` (UUID, FK to Projects)
- `stand_id` (UUID, FK to Stands, optional)
- `document_url` (string)
- `uploaded_by` (UUID, FK to Users)
- `uploaded_at` (timestamp)
- `status` (string)

**Relationships**
- Many-to-one with `Projects`
- Optional many-to-one with `Stands`
- Many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `project_id` references `Projects(id)`
- `stand_id` references `Stands(id)`
- `uploaded_by` references `Users(id)`

**Indexes**
- Index on `project_id`
- Index on `status`

**Constraints**
- Required `plan_name`, `project_id`, `document_url`

**Normalization**
- Document storage separated from project and task workflows.

**Future expansion notes**
- Support versioned plan uploads and approval artifacts

## Payments

**Purpose**
Record payment transactions and fees associated with permits, projects, and services.

**Fields**
- `id` (UUID, PK)
- `payment_reference` (string, unique)
- `project_id` (UUID, FK to Projects)
- `user_id` (UUID, FK to Users)
- `amount` (decimal)
- `currency` (string)
- `payment_method` (string)
- `status` (string)
- `paid_at` (timestamp, optional)
- `created_at` (timestamp)

**Relationships**
- Many-to-one with `Projects`
- Many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `project_id` references `Projects(id)`
- `user_id` references `Users(id)`

**Indexes**
- Unique index on `payment_reference`
- Index on `status`

**Constraints**
- Required `payment_reference`, `amount`, `currency`
- `amount` must be positive

**Normalization**
- Separates payment records from billing and reporting summaries.

**Future expansion notes**
- Add invoice tracking and payment reconciliation
- Add integration with external payment gateways

## Tickets

**Purpose**
Track issue tickets, customer service requests, and regulatory inquiries.

**Fields**
- `id` (UUID, PK)
- `ticket_number` (string, unique)
- `subject` (string)
- `description` (text)
- `project_id` (UUID, FK to Projects, optional)
- `created_by` (UUID, FK to Users)
- `assigned_to` (UUID, FK to Users, optional)
- `priority` (string)
- `status` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-one with `Users`
- Optional many-to-one with `Projects`

**Primary Keys**
- `id`

**Foreign Keys**
- `project_id` references `Projects(id)`
- `created_by` references `Users(id)`
- `assigned_to` references `Users(id)`

**Indexes**
- Unique index on `ticket_number`
- Index on `status`
- Index on `priority`

**Constraints**
- Required `ticket_number`, `subject`, `description`

**Normalization**
- Tickets are independent from project planning data to support service workflows.

**Future expansion notes**
- Add ticket categories and SLA metrics

## Tasks

**Purpose**
Manage work items for projects, inspections, approvals, and operational execution.

**Fields**
- `id` (UUID, PK)
- `task_title` (string)
- `description` (text)
- `project_id` (UUID, FK to Projects)
- `assigned_to` (UUID, FK to Users)
- `created_by` (UUID, FK to Users)
- `status` (string)
- `priority` (string)
- `due_date` (date)
- `completed_at` (timestamp, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**
- Many-to-one with `Projects`
- Many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `project_id` references `Projects(id)`
- `assigned_to` references `Users(id)`
- `created_by` references `Users(id)`

**Indexes**
- Index on `status`
- Index on `assigned_to`
- Index on `due_date`

**Constraints**
- Required `task_title`, `project_id`, `assigned_to`

**Normalization**
- Task details are kept separate from project and stand metadata.

**Future expansion notes**
- Add recurring tasks, checklists, and dependencies

## Reports

**Purpose**
Store structured report definitions and generated report metadata.

**Fields**
- `id` (UUID, PK)
- `report_name` (string)
- `report_type` (string)
- `project_id` (UUID, FK to Projects, optional)
- `generated_by` (UUID, FK to Users)
- `generated_at` (timestamp)
- `status` (string)
- `parameters` (JSON)
- `file_url` (string, optional)

**Relationships**
- Optional many-to-one with `Projects`
- Many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `project_id` references `Projects(id)`
- `generated_by` references `Users(id)`

**Indexes**
- Index on `report_type`
- Index on `generated_at`

**Constraints**
- Required `report_name`, `generated_by`

**Normalization**
- Report metadata is separated from report content storage.

**Future expansion notes**
- Add report scheduling and export destinations

## Notifications

**Purpose**
Capture system notifications and alerts delivered to users.

**Fields**
- `id` (UUID, PK)
- `user_id` (UUID, FK to Users)
- `module` (string)
- `action` (string)
- `message` (text)
- `link` (string, optional)
- `is_read` (boolean)
- `created_at` (timestamp)

**Relationships**
- Many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `user_id` references `Users(id)`

**Indexes**
- Index on `user_id`
- Index on `is_read`

**Constraints**
- Required `user_id`, `module`, `action`, `message`

**Normalization**
- Notifications are independent of the triggering entity to support future channel distribution.

**Future expansion notes**
- Add notification category, delivery channel, and retry status

## Audit Logs

**Purpose**
Track security-relevant actions for compliance, investigations, and change history.

**Fields**
- `id` (UUID, PK)
- `user_id` (UUID, FK to Users, optional)
- `module` (string)
- `action` (string)
- `description` (text)
- `ip_address` (string)
- `browser` (string)
- `request_method` (string)
- `request_path` (string)
- `status_code` (integer)
- `created_at` (timestamp)

**Relationships**
- Optional many-to-one with `Users`

**Primary Keys**
- `id`

**Foreign Keys**
- `user_id` references `Users(id)`

**Indexes**
- Index on `user_id`
- Index on `module`
- Index on `action`
- Index on `created_at`

**Constraints**
- Required `module`, `action`, `description`, `request_method`

**Normalization**
- Audit entries are isolated from business entities to preserve an immutable event history.

**Future expansion notes**
- Add event categories and severity labels
- Add retention policies and archival support

## GIS Locations

**Purpose**
Store geographic location records for stands, projects, inspections, and planning.

**Fields**
- `id` (UUID, PK)
- `stand_id` (UUID, FK to Stands, optional)
- `project_id` (UUID, FK to Projects, optional)
- `latitude` (decimal)
- `longitude` (decimal)
- `location_type` (string)
- `address` (string)
- `zone` (string)
- `status` (string)
- `created_at` (timestamp)

**Relationships**
- Optional many-to-one with `Stands`
- Optional many-to-one with `Projects`

**Primary Keys**
- `id`

**Foreign Keys**
- `stand_id` references `Stands(id)`
- `project_id` references `Projects(id)`

**Indexes**
- Spatial index on `(latitude, longitude)`
- Index on `location_type`

**Constraints**
- required coordinate pair for geospatial entries

**Normalization**
- GIS data is separated from core business tables to support mapping and analysis.

**Future expansion notes**
- Add geometry type support for polygons and lines
- Add integration with national cadastral systems
