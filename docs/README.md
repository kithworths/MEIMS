# MEIMS Documentation

This documentation repository supports the Monitoring and Evaluation Information Management System (MEIMS) project. It is intended for project stakeholders, system architects, developers, and operations teams.

## Project Overview

MEIMS is an enterprise information management system developed for municipal councils and government organizations. It provides secure management of projects, planning workflows, geographic data, financial transactions, and audit trails.

## Features

- Custom enterprise authentication with JWT
- Role-based access control (RBAC)
- Department and user management
- Audit logging and compliance trails
- Project, stand, and task management
- GIS location tracking and mapping metadata
- Payments and finance workflow support
- Notification and reporting frameworks
- Documentation for deployment, security, and standards

## Technology Stack

- Backend: Django, Django REST Framework
- Authentication: djangorestframework-simplejwt
- Frontend: React, TypeScript, Vite
- Database: PostgreSQL (recommended), SQLite for development
- Caching: Redis (recommended for production)
- Containerization: Docker (recommended)

## Installation

1. Clone the repository.
2. Install backend dependencies with `pip install -r backend/requirements.txt`.
3. Install frontend dependencies with `npm install` in the `frontend/` directory.
4. Configure environment variables in `backend/.env`.

## Development Setup

### Backend

- Navigate to `backend/`
- Activate a Python virtual environment
- Install dependencies
- Run migrations
- Start the backend development server with `python manage.py runserver`

### Frontend

- Navigate to `frontend/`
- Install dependencies
- Start the frontend development server with `npm run dev`

## Folder Structure

```
backend/
  apps/
  common/
  config/
  manage.py
frontend/
  public/
  src/
  package.json
docs/
  SYSTEM_ARCHITECTURE.md
  DATABASE_SCHEMA.md
  API_SPECIFICATION.md
  CODING_STANDARDS.md
  CHANGELOG.md
  SECURITY_GUIDELINES.md
  DEPLOYMENT_GUIDE.md
  USER_ROLES.md
  PROJECT_ROADMAP.md
  README.md
```

## Environment Variables

The backend uses environment variables for configuration. Key variables include:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`
- `JWT_REFRESH_TOKEN_LIFETIME_DAYS`
- `PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS`
- `PASSWORD_RESET_URL`
- `DEFAULT_FROM_EMAIL`
- `DJANGO_CORS_ALLOWED_ORIGINS`

## Running Backend

From the `backend/` directory:

```bash
python manage.py migrate
python manage.py runserver
```

## Running Frontend

From the `frontend/` directory:

```bash
npm run dev
```

## Testing

### Backend

```bash
cd backend
python manage.py test
```

### Frontend

```bash
cd frontend
npm run build
npm run lint
```

## Deployment

For production deployment, use Docker or Ubuntu server with Nginx, Gunicorn, PostgreSQL, and Redis. Follow the detailed instructions in `docs/DEPLOYMENT_GUIDE.md`.

## Contributing

- Follow the coding standards in `docs/CODING_STANDARDS.md`
- Use feature branches and clear commit messages
- Review code for security, correctness, and maintainability
- Keep documentation current with changes

## License

MEIMS is developed under the enterprise software guidelines agreed with the municipal council. License terms are defined by the project governance and may require review before distribution.
