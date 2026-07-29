# MEIMS Operations Guide

This guide provides operational procedures for running MEIMS in production.

## Service management

Use Docker Compose for service lifecycle:

```bash
cd backend
docker compose -f docker-compose.prod.yml up -d
```

To stop services:

```bash
docker compose -f docker-compose.prod.yml down
```

To update the backend image:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Health monitoring

Monitor the application using Prometheus metrics and health endpoints:

- Live health: `/api/v1/health/live/`
- Ready health: `/api/v1/health/ready/`
- Metrics: `/api/v1/metrics/`

## Logging

The application writes structured JSON logs to:

- `backend/logs/application.log`
- `backend/logs/security.log`
- `backend/logs/audit.log`
- `backend/logs/celery.log`

Ensure log rotation is configured on the host or via log collection tooling.

## Maintenance window checklist

- Verify backups are up to date.
- Confirm database and Redis health.
- Validate certificate renewal status.
- Review open alerts from Prometheus and Grafana.
