# MEIMS Business Requirements Specification (BRS)

Document purpose
-----------------
This Business Requirements Specification documents the MEIMS (Monitoring and Evaluation Information Management System) business objectives, functional and non-functional requirements, user stories, business rules, acceptance criteria, assumptions, constraints, and planned enhancements. All content is grounded in the current codebase at c:\Projects\MEIMS and the installed apps under backend/apps.

IMPORTANT: This document clearly separates IMPLEMENTED features (derived from the current implementation) from PLANNED features.

Project objectives
------------------
- Provide a secure enterprise platform to manage municipal projects, stands (parcels), planning approvals, inspections, payments, and reporting.
- Support role-based governance and auditability for municipal operations.
- Provide GIS-aware workflows for field capture and decision-making.
- Expose a versioned REST API consumed by a React + TypeScript frontend and future mobile clients.

Business goals
--------------
- Increase transparency and traceability of approvals and project milestones.
- Reduce manual paper-based processes through digitization of plans, inspections, and payments.
- Provide a consistent data model across departments (Water, Survey, Town Planning, Finance, ICT, Administration).
- Maintain auditable records to satisfy regulatory and financial auditors.

Implemented features (based on current codebase)
-------------------------------------------------
These items are confirmed by inspecting repository source files in backend/apps and backend/common.

1. Authentication foundation
   - Custom User model implemented (apps/accounts/models.py) using UUID PK, email as USERNAME_FIELD and associated profile fields.
   - JWT authentication endpoints implemented in apps/api (login, logout, refresh, profile, change-password, forgot-password, reset-password).
   - Password reset token generation and email sending utility implemented (apps/api/utils.py) and serializer/view support (apps/api/serializers.py, apps/api/views.py).

2. Role-Based Access Control (RBAC)
   - Permission, Role, RolePermission, and UserRole models implemented (apps/authorization/models.py).
   - Authorization data model supports module/action-based permissions (Create, Read, Update, Delete, Approve, Export, Print, Assign).

3. Departments and Roles
   - Department model (apps/departments/models.py) with seeded fields and a `Role` model for business roles.

4. Audit Logging
   - AuditLog model implemented (apps/audit/models.py) capturing user, module, action, description, IP, user agent, method, and timestamp.
   - Audit middleware present in `common.middleware.audit` (middleware wired in config/settings.py) to capture requests (middleware implementation inspected in backend/common/middleware/audit.py).

5. API layer
   - Versioned API routing exists at backend/apps/api and is mounted in config/urls.py under `/api/`.
   - Standardized JSON response helpers exist in `common.utils.api_response` and a custom renderer `common.renderers.StandardizedJSONRenderer` (referenced from settings).

6. Frontend scaffold
   - React + TypeScript frontend scaffold present in `frontend/` with authentication UI components and an Axios-based API client (frontend/src).

7. Admin configuration
   - Admin registrations and customizations exist for accounts, departments, authorization, and audit (backend/apps/*/admin.py files present).

Planned or partially implemented features (NOT fully present in codebase)
-------------------------------------------------------------------------
The repository contains app directories for key domain areas; many models and endpoints are scaffolded or planned but not yet implemented in models or views.

1. Projects, Stands, Tasks, Payments, Plans, Reports, Documents, GIS
   - Corresponding app directories exist (apps/projects, apps/tasks, apps/finance, apps/documents, apps/gis, apps/reports) but model files for these domain entities are not present (no `models.py` in those apps was detected during analysis), indicating these domain models and APIs are planned but not implemented.

2. Notifications
   - The `apps/notifications` directory exists but there is no evidence of a fully implemented notification model or service in the current codebase.

3. Full RBAC enforcement in APIs
   - Core RBAC models are implemented, but detailed permission checks applied across all resource endpoints are not present for the planned modules (e.g., projects, stands, payments).

4. GIS spatial types and mapping services
   - GIS app is present as a placeholder; spatial models and integrations (PostGIS, geometry types, mapping provider integration) are planned, not present.

5. Payment gateway integration
   - Payment model and gateway connectors are not implemented.

6. Reporting engine
   - Reports app exists but report generation, scheduling, and export features are not yet present.

Functional requirements
-----------------------
The following functional requirements describe expected application behaviour based on implemented features and planned scope.

1. Authentication and Account Management (IMPLEMENTED)
   - Users must authenticate using email and password.
   - Issuance of JWT access and refresh tokens for API access.
   - Refresh token rotation and blacklisting support when configured.
   - Password reset via signed token (email delivery implemented but requires configuration of PASSWORD_RESET_URL and email backend).

2. Roles and Permissions (IMPLEMENTED)
   - Define Permissions as (module, action) pairs.
   - Create Roles and map Role -> Permissions.
   - Assign Roles to Users (UserRole). Permissions must be evaluable at runtime.

3. Audit Logging (IMPLEMENTED)
   - Log security-sensitive events: login, logout, create, update, delete, approve, export.
   - Include request metadata (IP, user agent, request method).

4. Department Management (IMPLEMENTED)
   - CRUD operations for departments through admin and planned API endpoints.

5. Project & Stand Management (PLANNED)
   - Ability to create and manage Projects and Stands, track their lifecycle, and link to GIS locations and plans.

6. Tasks and Workflows (PLANNED)
   - Create tasks, assign users, track status and priorities, and connect tasks to projects/stands.

7. Payments and Finance (PLANNED)
   - Record payments, integrate with external payment gateways, track invoices and reconciliations.

8. GIS and Mobile Field Capture (PLANNED)
   - Capture coordinates, survey data, and allow mobile offline sync for field officers.

9. Reporting & Notifications (PLANNED)
   - Generate scheduled and ad-hoc reports, export to common formats, and deliver notifications via in-app and external channels.

Non-functional requirements
---------------------------
- Security: System must comply with enterprise security best practices, including TLS, JWT protection, RBAC, and auditability.
- Scalability: Support thousands of users and large datasets via PostgreSQL and caching (Redis recommended).
- Availability: Design for high-availability deployment in production with monitoring and backup strategies.
- Maintainability: Code must follow established coding standards; documentation must be kept current.
- Performance: API endpoints should be paginated and optimized to avoid N+1 queries.
- Compliance: Maintain immutable audit logs for regulatory compliance.

User stories
------------
(Representative examples based on current and planned scope.)

- As a Water Engineer, I want to view and update water project stand stages so I can track construction progress.
- As a Finance Officer, I want to record and reconcile payments associated with permits so the council can maintain financial records.
- As an Auditor, I want to query audit logs for specific actions and date ranges so I can verify compliance.
- As a Surveyor, I want to capture GPS coordinates for stands from my mobile device so that the GIS reflects accurate locations.

Business rules
--------------
- Users must have a valid, unique email; email is used for authentication.
- Only users with assigned roles that include the appropriate permission (module, action) may perform that action.
- Audit logs are immutable and should not be deletable by normal users.
- Department reference data is protected — deleting a department must be restricted and guarded by governance.

Acceptance criteria
-------------------
- Core authentication endpoints must successfully issue and refresh JWT tokens (verified by integration tests).
- Password reset tokens must be valid for the configured token lifetime and allow password change when presented.
- RBAC models and assignments must be editable via admin and enforceable by permission checks at API layer for implemented resources.

Assumptions
-----------
- The team will provide email delivery credentials and a PASSWORD_RESET_URL environment variable for production-ready password resets.
- PostgreSQL and Redis are available in production for persistence and caching.
- Admin users will seed initial roles and permissions or a management UI will be provided early in Phase 2.

Constraints
-----------
- Current implementation shows many domain apps exist but lack domain models — project timeline must allocate model and endpoint implementation for each domain app.
- Frontend assumes JWT-based authentication and requires backend endpoints for all planned modules before full UI completion.

Future enhancements
-------------------
- Add PostGIS support and spatial indices for GIS features.
- Implement payment gateway integration (MPesa, PayPal, Stripe, or local payment providers) with reconciliation.
- Implement document management with virus scanning and versioning.
- Field-mobile application with offline-first sync and push notifications.
- Role hierarchy and temporary delegation features for complex workflows.

Appendix: Codebase mapping (key files inspected)
-----------------------------------------------
- `backend/apps/accounts/models.py` — Custom User model (email-based auth) [IMPLEMENTED]
- `backend/apps/departments/models.py` — Department and Role (department-scoped role) [IMPLEMENTED]
- `backend/apps/authorization/models.py` — Permission, Role, RolePermission, UserRole [IMPLEMENTED]
- `backend/apps/audit/models.py` — AuditLog [IMPLEMENTED]
- `backend/apps/api/serializers.py` — Auth and password serializers [IMPLEMENTED]
- `backend/apps/api/views.py` — Auth views (login, refresh, logout, profile, change-password, forgot/reset) [IMPLEMENTED]
- `backend/apps/api/utils.py` — Password reset token utilities and email sending helper [IMPLEMENTED]
- `backend/config/settings.py` — Security, JWT, and installed apps configuration [IMPLEMENTED]
- `frontend/` — React + TypeScript frontend with authentication components (scaffold present) [PARTIALLY IMPLEMENTED]

Status summary
--------------
- Implemented: authentication, RBAC data model, departments, audit logging, API response framework, frontend auth scaffolding.
- Planned (not yet implemented): projects, stands, tasks, payments, reports, documents, GIS spatial models, notifications (full implementation), payment gateway.

End of BRS.
