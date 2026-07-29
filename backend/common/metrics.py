from __future__ import annotations

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

REQUEST_COUNT = Counter(
    'meims_http_requests_total',
    'Total HTTP requests processed by the backend.',
    ['method', 'endpoint', 'status'],
)
REQUEST_LATENCY = Histogram(
    'meims_http_request_latency_seconds',
    'HTTP request latency in seconds.',
    ['method', 'endpoint'],
)
REQUEST_SIZE_BYTES = Histogram(
    'meims_http_request_size_bytes',
    'Incoming request body sizes in bytes.',
    ['method', 'endpoint'],
)
RESPONSE_SIZE_BYTES = Histogram(
    'meims_http_response_size_bytes',
    'Outgoing response sizes in bytes.',
    ['method', 'endpoint'],
)
REQUEST_EXCEPTIONS = Counter(
    'meims_http_exceptions_total',
    'Total HTTP exceptions encountered during request processing.',
    ['endpoint', 'exception_type'],
)
DATABASE_HEALTH = Gauge(
    'meims_database_up',
    'Database availability metric: 1 = available, 0 = unavailable.',
)
CACHE_HEALTH = Gauge(
    'meims_cache_up',
    'Cache availability metric: 1 = available, 0 = unavailable.',
)
REDIS_HEALTH = Gauge(
    'meims_redis_up',
    'Redis availability metric: 1 = available, 0 = unavailable.',
)
CELERY_HEALTH = Gauge(
    'meims_celery_up',
    'Celery backend availability metric: 1 = available, 0 = unavailable.',
)
STORAGE_HEALTH = Gauge(
    'meims_storage_up',
    'Storage backend availability metric: 1 = available, 0 = unavailable.',
)
MIGRATIONS_STATUS = Gauge(
    'meims_migrations_pending',
    'Number of pending database migrations.',
)
DATABASE_QUERY_COUNT = Counter(
    'meims_database_queries_total',
    'Total database queries executed.',
    ['engine'],
)
DATABASE_QUERY_DURATION_SECONDS = Histogram(
    'meims_database_query_duration_seconds',
    'Database query duration in seconds.',
    ['engine'],
)
CACHE_HITS = Counter('meims_cache_hits_total', 'Total cache hits.', ['cache'])
CACHE_MISSES = Counter('meims_cache_misses_total', 'Total cache misses.', ['cache'])
REDIS_OPERATIONS = Counter('meims_redis_operations_total', 'Redis operations performed.', ['operation'])
CELERY_WORKERS = Gauge('meims_celery_workers', 'Number of active Celery workers.', ['state'])
CELERY_QUEUE_DEPTH = Gauge('meims_celery_queue_depth', 'Current Celery queue depth.', ['queue'])
AUTH_FAILURES = Counter('meims_auth_failures_total', 'Authentication failure attempts.', ['endpoint'])
PERMISSION_DENIALS = Counter('meims_permission_denials_total', 'Permission denials observed by the backend.', ['endpoint'])
GIS_OPERATIONS = Counter('meims_gis_operations_total', 'GIS operations processed.', ['operation'])
DOCUMENT_UPLOADS = Counter('meims_document_uploads_total', 'Number of document uploads.', ['backend'])
DOCUMENT_DOWNLOADS = Counter('meims_document_downloads_total', 'Number of document downloads.', ['backend'])
STORAGE_USAGE_BYTES = Gauge('meims_storage_usage_bytes', 'Total bytes used by the configured storage backend.')
BACKGROUND_JOBS = Gauge('meims_background_jobs', 'Background jobs observed by the system.', ['state'])
SLOW_REQUESTS = Counter('meims_slow_requests_total', 'Slow requests detected by the performance middleware.', ['endpoint'])


def render_metrics() -> tuple[bytes, str]:
    """Render Prometheus metrics for exposure to a metrics endpoint."""
    return generate_latest(), CONTENT_TYPE_LATEST


def record_db_metrics(db_count: int, db_time_ms: float, engine: str = 'default') -> None:
    """Record database query metrics for monitoring."""
    DATABASE_QUERY_COUNT.labels(engine=engine).inc(db_count)
    DATABASE_QUERY_DURATION_SECONDS.labels(engine=engine).observe(db_time_ms / 1000.0)


def record_request_timing_metrics(endpoint: str, total_ms: float, db_ms: float, auth_ms: float, memory_mb: float, cpu_percent: float, response_size: int, method: str = 'GET') -> None:
    """Record detailed request timing and resource metrics."""
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(total_ms / 1000.0)
    REQUEST_SIZE_BYTES.labels(method=method, endpoint=endpoint).observe(response_size)
    RESPONSE_SIZE_BYTES.labels(method=method, endpoint=endpoint).observe(response_size)
