# MEIMS Security Guidelines

These guidelines establish the security requirements and best practices for MEIMS as a government-grade information management system.

## Authentication

- Use secure passwords with Django's built-in password validators.
- Enforce email-based login with the custom user model.
- Use JWT access tokens with short lifetimes and refresh tokens for session continuity.
- Protect all sensitive endpoints with authentication guards.
- Use HTTPS in all environments, especially production.

## Authorization

- Enforce authorization at the API layer using RBAC permission classes.
- Do not rely on UI controls for protection; backend must verify permissions.
- Keep permission rules centralized and easy to audit.

## RBAC

- Define permissions using `module` and `action` metadata.
- Assign roles via `RolePermission` and `UserRole` entities.
- Support role additions without code changes by using database-driven mappings.
- Audit role and permission changes.

## Password Policies

- Require passwords to be strong, non-common, and of minimum length.
- Prevent reuse of old passwords when possible.
- Use secure hash algorithms and let Django manage password hashing.
- Do not store plain text passwords in logs or persistent storage.

## JWT Security

- Store access tokens in memory or secure client storage; store refresh tokens securely.
- Use `Bearer` headers for token authentication.
- Rotate refresh tokens and blacklist invalidated tokens.
- Expire access tokens promptly and require refresh for long-lived sessions.
- Validate token signature and claims on every request.

## Session Management

- Use server-side session invalidation where applicable.
- Invalidate sessions upon logout and password changes.
- Avoid persistent authentication cookies unless necessary and secure them with `HttpOnly` and `Secure` flags.

## Input Validation

- Validate all API input using serializers and dedicated validators.
- Enforce strict field validation for required data.
- Normalize user input such as email addresses.
- Reject malformed or unexpected payloads.

## SQL Injection Prevention

- Use Django ORM exclusively for database access.
- Avoid raw SQL unless absolutely necessary.
- When raw SQL is required, use parameter substitution and never string interpolation.

## XSS Prevention

- Sanitize user-generated content before rendering in HTML contexts.
- Use React's default escaping for UI rendering.
- Avoid `dangerouslySetInnerHTML` unless content is sanitized and trusted.

## CSRF

- Use CSRF protection for session-authenticated endpoints.
- Protect the frontend and API from cross-site request forgery.
- For JWT authentication, ensure the application follows same-site and CORS policies.

## File Upload Security

- Validate file type and size for all uploads.
- Store uploads outside the web root or behind controlled media serving.
- Scan uploaded files for malware if required by policy.
- Enforce file naming conventions and avoid user-controlled paths.

## API Security

- Use versioned API paths under `/api/v1/`.
- Use rate limiting on authentication and sensitive routes when possible.
- Use standardized error messages that do not expose implementation details.
- Enforce HTTPS and secure headers via proxy or application configuration.

## Logging

- Log authentication attempts, authorization failures, and system errors.
- Keep logs separate for application, security, and audit events.
- Retain logs long enough for forensic review and compliance.

## Audit Trails

- Record security and business-critical actions in `AuditLog`.
- Capture user, module, action, description, IP address, browser, request method, and timestamp.
- Ensure audit entries are immutable and tamper-resistant.
- Include login, logout, create, update, delete, approve, export, and other high-risk actions.

## Secrets Management

- Store secrets in environment variables or a secrets manager.
- Do not check secrets, keys, or credentials into source control.
- Use `python-decouple` or similar libraries to read environment configuration.
- Rotate secrets regularly and monitor for unauthorized access.

## Production Security Checklist

- Enable HTTPS and TLS for all public-facing services.
- Harden servers with least privilege and up-to-date patches.
- Configure strict CORS and CSRF policies.
- Protect admin interfaces with IP restrictions and strong credentials.
- Use database encryption at rest and secure backups.
- Conduct security reviews and penetration tests before deployment.
- Monitor logs and alerts for suspicious activity.
