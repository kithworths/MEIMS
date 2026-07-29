# MEIMS Deployment Guide

This guide describes production deployment of the MEIMS Django backend using Docker and Nginx on Ubuntu Server.

## Production stack

- Django backend served by Gunicorn
- Nginx reverse proxy with HTTPS termination
- PostgreSQL database
- Redis cache and Celery broker
- Celery worker and Celery beat for background tasks
- Persistent volumes for database, media, and static files

## Deployment workflow

1. Prepare host server and install Docker Engine and Docker Compose.
2. Copy `backend/.env.example` to `backend/.env` and set production values.
3. Ensure `DJANGO_SETTINGS_MODULE=config.settings.production` is set in the production environment.
4. Build the backend image:
   ```bash
   cd backend
   docker build -t meims-backend:latest .
   ```
5. Start the production stack:
   ```bash
   docker compose -f backend/docker-compose.prod.yml up -d
   ```
6. Verify health endpoints:
   - `https://<your-domain>/api/v1/health/ready/`
   - `https://<your-domain>/api/v1/health/live/`

## Automatic static and migration handling

The production container runs `manage.py migrate --noinput` and `manage.py collectstatic --noinput` during startup. Ensure database and storage backends are reachable before the service starts.

## Nginx configuration

The production Nginx configuration is available at `backend/nginx/nginx.conf`. It is configured for HTTPS, HTTP/2, gzip, proxy buffering, static files, media files, health checks, and security headers.

## Rollback

To rollback to a known good version:

1. Stop the services:
   ```bash
   docker compose -f backend/docker-compose.prod.yml down
   ```
2. Redeploy a stable image tag:
   ```bash
   docker compose -f backend/docker-compose.prod.yml up -d --build
   ```
3. Verify health and application functionality.
