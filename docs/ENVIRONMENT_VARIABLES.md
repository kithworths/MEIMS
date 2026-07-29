# MEIMS Environment Variables

This document lists environment variables used by the MEIMS backend.

## Core variables

- `SECRET_KEY`: Django secret key used for cryptographic signing.
- `DEBUG`: Enable or disable debug mode.
- `ALLOWED_HOSTS`: Comma-separated list of allowed hostnames.
- `DJANGO_ENVIRONMENT`: Deployment environment name (development/staging/production).

## Database

- `DATABASE_URL`: Full database connection URL.
- `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`: Database connection details.
- `DATABASE_ENGINE`: Optional database engine override such as `postgres` or `postgis`.

## Redis and caching

- `REDIS_URL`: Redis connection URL for cache and Celery.
- `CACHE_TTL`: Default cache time-to-live in seconds.

## Security and cookies

- `DJANGO_SECURE_SSL_REDIRECT`: Enable HTTPS redirection.
- `DJANGO_SESSION_COOKIE_SECURE`: Secure session cookies.
- `DJANGO_CSRF_COOKIE_SECURE`: Secure CSRF cookies.
- `DJANGO_SESSION_COOKIE_HTTPONLY`: HttpOnly session cookies.
- `DJANGO_CSRF_COOKIE_HTTPONLY`: HttpOnly CSRF cookies.
- `DJANGO_SESSION_COOKIE_SAMESITE`: Session cookie SameSite policy.
- `DJANGO_CSRF_COOKIE_SAMESITE`: CSRF cookie SameSite policy.
- `DJANGO_SECURE_HSTS_SECONDS`: HSTS lifetime in seconds.
- `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS`: Enable HSTS for subdomains.
- `DJANGO_SECURE_HSTS_PRELOAD`: Enable HSTS preload.
- `DJANGO_SECURE_REFERRER_POLICY`: Referrer-Policy header.
- `DJANGO_SECURE_CONTENT_TYPE_NOSNIFF`: Enable X-Content-Type-Options header.
- `DJANGO_X_FRAME_OPTIONS`: X-Frame-Options header value.
- `DJANGO_PERMISSIONS_POLICY`: Permissions-Policy header value.
- `DJANGO_SECURE_PROXY_SSL_HEADER`: Support proxy HTTPS header.
- `DJANGO_USE_X_FORWARDED_HOST`: Support X-Forwarded-Host.
- `DJANGO_USE_X_FORWARDED_PORT`: Support X-Forwarded-Port.

## Storage backends

- `STORAGE_BACKEND`: `local`, `s3`, `aws_s3`, `spaces`, `minio`, or `azure`.
- `DEFAULT_FILE_STORAGE`: Django storage backend path.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`
- `AWS_S3_ENDPOINT_URL`, `AWS_S3_CUSTOM_DOMAIN`, `AWS_S3_SIGNATURE_VERSION`
- `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY`, `AZURE_CONTAINER`, `AZURE_SSL`

## Celery and task queue

- `CELERY_BROKER_URL`: Celery broker connection URL.
- `CELERY_RESULT_BACKEND`: Celery result backend URL.
- `CELERY_TASK_TIME_LIMIT`: Hard time limit for Celery tasks.
- `CELERY_TASK_SOFT_TIME_LIMIT`: Soft time limit for Celery tasks.
- `CELERY_WORKER_MAX_TASKS_PER_CHILD`: Maximum task count per worker child.

## Additional configuration

- `APP_VERSION`: Application version string.
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL`, `DEFAULT_FROM_EMAIL`
- `DJANGO_CORS_ALLOW_ALL_ORIGINS`, `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_CORS_ALLOW_CREDENTIALS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_REST_PAGE_SIZE`
- `DATA_UPLOAD_MAX_MEMORY_SIZE`, `FILE_UPLOAD_MAX_MEMORY_SIZE`, `DATA_UPLOAD_MAX_NUMBER_FIELDS`

## Docker and production environment

- `GUNICORN_WORKERS`: Number of Gunicorn worker processes.
- `GUNICORN_THREADS`: Number of Gunicorn threads.
- `GUNICORN_TIMEOUT`: Gunicorn worker timeout.
- `GUNICORN_KEEPALIVE`: Gunicorn keepalive timeout.
- `GUNICORN_MAX_REQUESTS`: Maximum requests per worker.
- `GUNICORN_GRACEFUL_TIMEOUT`: Graceful timeout for worker restart.
