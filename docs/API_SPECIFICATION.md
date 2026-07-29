# MEIMS API Specification

All MEIMS REST APIs are versioned under `/api/v1/`.

## API Response Contract

Success response:

```json
{
  "success": true,
  "message": "...",
  "data": { }
}
```

Validation error response:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "field": ["error message"]
  }
}
```

Server error response:

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Root and Health Endpoints

### GET /api/v1/

- Description: API metadata and entry point for version 1.
- Authentication Required: No
- Permissions Required: None

Response Body:

```json
{
  "success": true,
  "message": "MEIMS API v1",
  "data": {
    "version": "v1",
    "endpoints": {
      "health": "/api/v1/health/",
      "projects": "/api/v1/projects/",
      "stands": "/api/v1/stands/"
    }
  }
}
```

Status Codes:
- `200 OK`

### GET /api/v1/health/

- Description: Health check endpoint for service availability and connectivity.
- Authentication Required: No
- Permissions Required: None

Response Body:

```json
{
  "success": true,
  "message": "Service healthy.",
  "data": {
    "status": "ok",
    "database": "reachable",
    "version": "v1"
  }
}
```

Status Codes:
- `200 OK`

## Authentication

### POST /api/v1/auth/login/

- Description: Authenticate a user and issue JWT access and refresh tokens.
- Authentication Required: No
- Permissions Required: None

Request Body:

```json
{
  "email": "user@example.gov",
  "password": "SecretPassword123"
}
```

Response Body:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>",
    "user": {
      "id": "uuid",
      "email": "user@example.gov",
      "first_name": "Jane",
      "last_name": "Doe",
      "employee_number": "EMP-0245"
    }
  }
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`

Validation Rules:
- `email` must be a valid registered email
- `password` is required

Error Responses:
- Invalid credentials
- Missing fields

### POST /api/v1/auth/logout/

- Description: Invalidate a refresh token and log the user out.
- Authentication Required: Yes
- Permissions Required: None

Request Body:

```json
{
  "refresh": "<jwt_refresh_token>"
}
```

Response Body:

```json
{
  "success": true,
  "message": "Logout successful."
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/v1/auth/refresh/

- Description: Refresh the access token using a valid refresh token.
- Authentication Required: No
- Permissions Required: None

Request Body:

```json
{
  "refresh": "<jwt_refresh_token>"
}
```

Response Body:

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "access": "<new_jwt_access_token>"
  }
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`

### GET /api/v1/auth/profile/

- Description: Retrieve the authenticated user's profile.
- Authentication Required: Yes
- Permissions Required: None

Response Body:

```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "id": "uuid",
    "email": "user@example.gov",
    "username": "janedoe",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "+254700000000",
    "employee_number": "EMP-0245",
    "department": "Water",
    "role": "Water Engineer"
  }
}
```

Status Codes:
- `200 OK`
- `401 Unauthorized`

### POST /api/v1/auth/change-password/

- Description: Change the authenticated user's password.
- Authentication Required: Yes
- Permissions Required: None

Request Body:

```json
{
  "current_password": "OldPassword123",
  "new_password": "NewSecurePassword123",
  "confirm_password": "NewSecurePassword123"
}
```

Response Body:

```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`

Validation Rules:
- New password must match confirmation
- New password must satisfy password policy
- Current password must be correct

### POST /api/v1/auth/forgot-password/

- Description: Request a password reset email for a user account.
- Authentication Required: No
- Permissions Required: None

Request Body:

```json
{
  "email": "user@example.gov"
}
```

Response Body:

```json
{
  "success": true,
  "message": "If the email address is registered, password reset instructions have been sent."
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`

### POST /api/v1/auth/reset-password/

- Description: Reset a user's password using a secure token.
- Authentication Required: No
- Permissions Required: None

Request Body:

```json
{
  "token": "<reset_token>",
  "new_password": "NewSecurePassword123",
  "confirm_password": "NewSecurePassword123"
}
```

Response Body:

```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`

## Users

### GET /api/v1/users/

- Description: List system users.
- Authentication Required: Yes
- Permissions Required: `user.read`

Query Parameters:
- `page`
- `page_size`
- `search`
- `department`
- `role`
- `is_active`

Response Body:

```json
{
  "success": true,
  "message": "Users retrieved successfully.",
  "data": {
    "results": [
      {
        "id": "uuid",
        "email": "user@example.gov",
        "first_name": "Jane",
        "last_name": "Doe",
        "department": "Water",
        "role": "Water Engineer",
        "is_active": true
      }
    ],
    "count": 124,
    "next": "/api/v1/users/?page=2",
    "previous": null
  }
}
```

Status Codes:
- `200 OK`
- `401 Unauthorized`
- `403 Forbidden`

### GET /api/v1/users/{id}/

- Description: Retrieve a single user profile.
- Authentication Required: Yes
- Permissions Required: `user.read`

Response Body:

```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "id": "uuid",
    "email": "user@example.gov",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "+254700000000",
    "employee_number": "EMP-0245",
    "department": "Water",
    "role": "Water Engineer",
    "is_active": true
  }
}
```

Status Codes:
- `200 OK`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### POST /api/v1/users/

- Description: Create a new user account.
- Authentication Required: Yes
- Permissions Required: `user.create`

Request Body:

```json
{
  "email": "new.user@example.gov",
  "first_name": "New",
  "last_name": "User",
  "employee_number": "EMP-0350",
  "department": "Water",
  "role": "Water Engineer",
  "password": "SecurePassword123"
}
```

Response Body:

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "uuid"
  }
}
```

Status Codes:
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`

Validation Rules:
- Required fields: `email`, `first_name`, `last_name`, `employee_number`, `password`
- Email must be unique
- Password must satisfy policy

### PUT /api/v1/users/{id}/

- Description: Update existing user details.
- Authentication Required: Yes
- Permissions Required: `user.update`

Request Body:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "phone_number": "+254700000000",
  "department": "Survey",
  "role": "Surveyor",
  "is_active": true
}
```

Response Body:

```json
{
  "success": true,
  "message": "User updated successfully.",
  "data": {
    "id": "uuid"
  }
}
```

Status Codes:
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`

### DELETE /api/v1/users/{id}/

- Description: Deactivate or remove a user account.
- Authentication Required: Yes
- Permissions Required: `user.delete`

Response Body:

```json
{
  "success": true,
  "message": "User deactivated successfully."
}
```

Status Codes:
- `200 OK`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

## Departments

### GET /api/v1/departments/

- Description: List departments.
- Authentication Required: Yes
- Permissions Required: `department.read`

Response Body:

```json
{
  "success": true,
  "message": "Departments retrieved successfully.",
  "data": {
    "results": [
      {
        "id": "uuid",
        "department_name": "Water",
        "department_code": "WTR",
        "description": "Water services and infrastructure.",
        "head_of_department": "Eng. Alice Mwangi",
        "email": "water@municipality.gov",
        "phone": "+254711000111",
        "office_location": "Civic Centre, Block A",
        "is_active": true
      }
    ]
  }
}
```

Status Codes:
- `200 OK`
- `401 Unauthorized`
- `403 Forbidden`

### GET /api/v1/departments/{id}/

- Description: Retrieve detailed department information.
- Authentication Required: Yes
- Permissions Required: `department.read`

### POST /api/v1/departments/

- Description: Create a new department.
- Authentication Required: Yes
- Permissions Required: `department.create`

### PUT /api/v1/departments/{id}/

- Description: Update department properties.
- Authentication Required: Yes
- Permissions Required: `department.update`

### DELETE /api/v1/departments/{id}/

- Description: Deactivate a department.
- Authentication Required: Yes
- Permissions Required: `department.delete`

## Projects

### GET /api/v1/projects/

- Description: List projects.
- Authentication Required: Yes
- Permissions Required: `project.read`

### GET /api/v1/projects/{id}/

- Description: Retrieve a project record.
- Authentication Required: Yes
- Permissions Required: `project.read`

### POST /api/v1/projects/

- Description: Create a new project entry.
- Authentication Required: Yes
- Permissions Required: `project.create`

### PUT /api/v1/projects/{id}/

- Description: Update a project.
- Authentication Required: Yes
- Permissions Required: `project.update`

### DELETE /api/v1/projects/{id}/

- Description: Deactivate or archive a project.
- Authentication Required: Yes
- Permissions Required: `project.delete`

## Stand Management

### GET /api/v1/stands/

- Description: List stands and parcels.
- Authentication Required: Yes
- Permissions Required: `stand.read`

### GET /api/v1/stands/{id}/

- Description: Retrieve stand details.
- Authentication Required: Yes
- Permissions Required: `stand.read`

### POST /api/v1/stands/

- Description: Create a stand record.
- Authentication Required: Yes
- Permissions Required: `stand.create`

### PUT /api/v1/stands/{id}/

- Description: Update stand data.
- Authentication Required: Yes
- Permissions Required: `stand.update`

### DELETE /api/v1/stands/{id}/

- Description: Deactivate stand data.
- Authentication Required: Yes
- Permissions Required: `stand.delete`

### GET /api/v1/stand-stages/

- Description: List stand stage progress.
- Authentication Required: Yes
- Permissions Required: `standstage.read`

### POST /api/v1/stand-stages/

- Description: Record a new stage update.
- Authentication Required: Yes
- Permissions Required: `standstage.create`

## Tasks

### GET /api/v1/tasks/

- Description: List tasks.
- Authentication Required: Yes
- Permissions Required: `task.read`

### GET /api/v1/tasks/{id}/

- Description: Retrieve a task.
- Authentication Required: Yes
- Permissions Required: `task.read`

### POST /api/v1/tasks/

- Description: Create a task.
- Authentication Required: Yes
- Permissions Required: `task.create`

### PUT /api/v1/tasks/{id}/

- Description: Update a task.
- Authentication Required: Yes
- Permissions Required: `task.update`

### DELETE /api/v1/tasks/{id}/

- Description: Delete or deactivate a task.
- Authentication Required: Yes
- Permissions Required: `task.delete`

## Payments

### GET /api/v1/payments/

- Description: List payment records.
- Authentication Required: Yes
- Permissions Required: `payment.read`

### GET /api/v1/payments/{id}/

- Description: Retrieve a payment.
- Authentication Required: Yes
- Permissions Required: `payment.read`

### POST /api/v1/payments/

- Description: Record a new payment.
- Authentication Required: Yes
- Permissions Required: `payment.create`

### PUT /api/v1/payments/{id}/

- Description: Update a payment entry.
- Authentication Required: Yes
- Permissions Required: `payment.update`

### DELETE /api/v1/payments/{id}/

- Description: Cancel or deactivate a payment.
- Authentication Required: Yes
- Permissions Required: `payment.delete`

## Reports

### GET /api/v1/reports/

- Description: List generated and scheduled reports.
- Authentication Required: Yes
- Permissions Required: `report.read`

### GET /api/v1/reports/{id}/

- Description: Retrieve report metadata.
- Authentication Required: Yes
- Permissions Required: `report.read`

### POST /api/v1/reports/

- Description: Generate a new report.
- Authentication Required: Yes
- Permissions Required: `report.create`

## Documents

### GET /api/v1/documents/

- Description: List documents and plan records.
- Authentication Required: Yes
- Permissions Required: `document.read`

### GET /api/v1/documents/{id}/

- Description: Retrieve document metadata.
- Authentication Required: Yes
- Permissions Required: `document.read`

### POST /api/v1/documents/

- Description: Upload or register a document.
- Authentication Required: Yes
- Permissions Required: `document.create`

### PUT /api/v1/documents/{id}/

- Description: Update document metadata.
- Authentication Required: Yes
- Permissions Required: `document.update`

### DELETE /api/v1/documents/{id}/

- Description: Deactivate document records.
- Authentication Required: Yes
- Permissions Required: `document.delete`

## GIS

### GET /api/v1/gis/locations/

- Description: List GIS locations and mapping entities.
- Authentication Required: Yes
- Permissions Required: `gis.read`

### GET /api/v1/gis/locations/{id}/

- Description: Retrieve a single GIS location.
- Authentication Required: Yes
- Permissions Required: `gis.read`

### POST /api/v1/gis/locations/

- Description: Create a GIS location or coordinate record.
- Authentication Required: Yes
- Permissions Required: `gis.create`

### PUT /api/v1/gis/locations/{id}/

- Description: Update GIS location metadata.
- Authentication Required: Yes
- Permissions Required: `gis.update`

### DELETE /api/v1/gis/locations/{id}/

- Description: Deactivate GIS location records.
- Authentication Required: Yes
- Permissions Required: `gis.delete`

## Notifications

### GET /api/v1/notifications/

- Description: List notifications for the authenticated user.
- Authentication Required: Yes
- Permissions Required: `notification.read`

### GET /api/v1/notifications/{id}/

- Description: Retrieve a notification.
- Authentication Required: Yes
- Permissions Required: `notification.read`

### POST /api/v1/notifications/

- Description: Create a notification for a user or role.
- Authentication Required: Yes
- Permissions Required: `notification.create`

### PUT /api/v1/notifications/{id}/

- Description: Update notification delivery status.
- Authentication Required: Yes
- Permissions Required: `notification.update`

### DELETE /api/v1/notifications/{id}/

- Description: Remove or archive a notification.
- Authentication Required: Yes
- Permissions Required: `notification.delete`

## Standard Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "field": ["This field is required."]
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication credentials were not provided."
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You do not have permission to perform this action."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "The requested resource was not found."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```
