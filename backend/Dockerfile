# Multi-stage production build for the MEIMS Django backend
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /install
COPY requirements.txt ./
RUN python -m pip install --upgrade pip \
    && pip install --prefix=/install -r requirements.txt

FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

COPY --from=builder /install /usr/local
COPY . /app

RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup appuser \
    && mkdir -p /app/staticfiles /app/media /app/logs \
    && chown -R appuser:appgroup /app/staticfiles /app/media /app/logs \
    && chmod +x /app/docker-entrypoint.sh

USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request, sys; response = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/ready/', timeout=10); sys.exit(0 if response.getcode() == 200 else 1)"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
