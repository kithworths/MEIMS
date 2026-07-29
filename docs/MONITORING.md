# MEIMS Monitoring Guide

This guide describes monitoring for MEIMS production deployments.

## Metrics endpoints

The backend exposes monitoring data via Prometheus:

- `/api/v1/metrics/`
- `/api/v1/health/live/`
- `/api/v1/health/ready/`

## Recommended dashboards

- Request throughput and latency
- Error rate trends
- Database connection and query performance
- Redis cache hit/miss ratios
- Celery worker task success and latency
- System CPU, memory, disk, and network usage

## Prometheus integration

Scrape the metrics endpoint from your monitoring stack and use Grafana for visualization.

## Alerting recommendations

- Alert on service unavailability and failed health checks.
- Alert on high error rates and slow response times.
- Alert on database and Redis connectivity issues.
