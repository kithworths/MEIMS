# MEIMS Coding Standards

This document describes the coding standards for the MEIMS project and provides guidance for backend, frontend, and maintenance workflows.

## Python Style Guide

- Follow PEP 8 for formatting, naming, and layout.
- Use `black` formatting rules for consistent code style.
- Use `flake8` or similar linting tools for static code quality checks.
- Prefer explicit imports and avoid wildcard imports.
- Keep functions short and single-purpose.
- Use type hints for public APIs and complex functions.
- Document modules, classes, and methods with clear docstrings.
- Place constants in uppercase with descriptive names.
- Use `django.utils.translation.gettext_lazy` for user-facing text.
- Use `timezone.now()` for datetime values in Django models.

## Django Standards

- Keep apps focused around a single domain or business capability.
- Use a custom user model from project inception.
- Use `UUIDField` for primary keys in business-critical tables.
- Keep `models.py` simple and move service logic to dedicated modules.
- Use model manager methods for reusable query logic.
- Protect foreign keys with `on_delete=models.PROTECT` for critical reference data.
- Keep serializers lean and use validators for input rules.
- Use viewsets and routers for resource-centric endpoints.
- Apply permission classes at the view level and avoid hardcoding permission checks.
- Use Django admin customizations for government user management.
- Implement global exception handling and standardized response format.

## React Standards

- Use modern React with function components and hooks.
- Use React Router v7 for routing and navigation.
- Write reusable presentational components for forms and buttons.
- Keep UI state localized to the component unless shared state is needed.
- Use custom hooks for authentication and API integration.
- Avoid inline styles; prefer CSS modules, utility classes, or component styles.
- Keep components under `src/components/` and pages under `src/pages/`.
- Use accessibility best practices for forms, labels, keyboard navigation, and color contrast.

## TypeScript Standards

- Use strict type checking where possible.
- Define interfaces for request and response payloads.
- Avoid `any` except for safe migration or third-party integration.
- Keep types in dedicated files or alongside related code.
- Use discriminated unions for state machines and variant props.
- Prefer `readonly` and immutable data patterns for props and state.
- Use explicit return types for exported functions.

## Folder Structure

Recommended folder structure:

```
backend/
  apps/
    accounts/
    api/
    authorization/
    audit/
    departments/
    ...
  common/
  config/
  manage.py

frontend/
  public/
  src/
    api/
    auth/
    components/
    pages/
    routes/
    assets/
```

- Keep top-level app modules grouped by domain.
- Keep shared utilities under `common/` in the backend.
- Keep frontend assets and reusable UI components separate from pages.

## Naming Conventions

- Use `snake_case` for Python functions, variables, and filenames.
- Use `PascalCase` for Django model, serializer, and view class names.
- Use `camelCase` for JavaScript/TypeScript variables, functions, and hooks.
- Use `PascalCase` for React component and hook names.
- Name boolean fields with `is_` or `has_` prefixes.
- Use descriptive names for primary keys, e.g. `id`, `created_at`, `updated_at`.

## Database Naming

- Use singular entity names for table descriptions in documentation.
- Use lowercase snake_case for column names.
- Use UUID primary keys for all core entities.
- Use `created_at` and `updated_at` timestamps consistently.
- Use explicit foreign key names such as `department_id`.
- Preserve referential integrity with foreign keys and database constraints.

## Git Commit Standards

- Use clear, imperative commit messages.
- Follow the format: `type(scope): summary`
- Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`.
- Example: `feat(auth): add password reset endpoint`.
- Include a body for complex changes, explaining the why and what.
- Reference ticket IDs or issue numbers when available.
- Keep commits small and atomic.

## Documentation Standards

- Write documentation in Markdown with clear headings.
- Use tables for structured comparisons.
- Keep documentation up to date with architecture and requirements.
- Document assumptions, dependencies, and security controls.
- Include diagrams for workflows and system relationships.
- Use enterprise tone appropriate for a government organization.

## Security Standards

- Store secrets in environment variables, not code.
- Use HTTPS for all public endpoints.
- Enforce input validation and output escaping.
- Use Django security middleware and CORS restrictions.
- Use JWT with rotation and blacklist support.
- Store password hashes using Django defaults and strong validators.

## Performance Standards

- Use pagination for list endpoints.
- Avoid N+1 queries with `select_related` and `prefetch_related`.
- Use caching for expensive, frequently accessed responses.
- Optimize database indexes on search and filter fields.
- Use efficient serializers with explicit fields.
- Keep API responses compact and consistent.

## Logging Standards

- Log security events and errors with structured messages.
- Use separate logs for application, errors, and security events.
- Do not log sensitive data such as passwords or tokens.
- Include request IDs or trace identifiers when available.
- Log audit events to the audit trail service and database.

## Testing Standards

- Write unit tests for models, serializers, and views.
- Write integration tests for API workflows.
- Run `python manage.py test` for backend test validation.
- Use frontend test tooling for component and route validation when available.
- Validate new features with regression tests before deployment.

## Dependency Management

- Manage backend dependencies in `requirements.txt`.
- Manage frontend dependencies in `package.json`.
- Use fixed version ranges for production dependencies where appropriate.
- Review third-party packages for security and maintenance.
- Update dependencies regularly and validate changes.

## Code Review Checklist

- Does the code follow project naming conventions?
- Are APIs documented and versioned correctly?
- Are permissions and access controls enforced?
- Is input validated and sanitized?
- Are new models and fields covered with tests?
- Is error handling consistent with the standard response format?
- Are any secrets or credentials accidentally included?
- Is the change backward compatible with existing functionality?
- Is the code modular and easy to maintain?
