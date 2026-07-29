from __future__ import annotations

import time

from django.utils.deprecation import MiddlewareMixin

from common.metrics import REQUEST_COUNT, REQUEST_EXCEPTIONS, REQUEST_LATENCY, REQUEST_SIZE_BYTES, RESPONSE_SIZE_BYTES


class PrometheusMiddleware(MiddlewareMixin):
    """Middleware that exposes request metrics for Prometheus monitoring."""

    def process_request(self, request):
        request._prometheus_start_time = time.monotonic()
        request._prometheus_request_size = int(request.META.get('CONTENT_LENGTH', 0) or 0)

    def process_response(self, request, response):
        start_time = getattr(request, '_prometheus_start_time', None)
        endpoint = request.path
        method = request.method
        status = str(getattr(response, 'status_code', 500))
        request_size = int(getattr(request, '_prometheus_request_size', 0) or 0)
        response_size = self._get_response_size(response)

        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
        if start_time is not None:
            elapsed = time.monotonic() - start_time
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(elapsed)
        REQUEST_SIZE_BYTES.labels(method=method, endpoint=endpoint).observe(request_size)
        RESPONSE_SIZE_BYTES.labels(method=method, endpoint=endpoint).observe(response_size)

        return response

    def process_exception(self, request, exception):
        endpoint = request.path
        REQUEST_EXCEPTIONS.labels(endpoint=endpoint, exception_type=type(exception).__name__).inc()

    def _get_response_size(self, response) -> int:
        try:
            if hasattr(response, 'content') and response.content is not None:
                return len(response.content)
        except Exception:
            pass
        try:
            return int(response.get('Content-Length', 0) or 0)
        except Exception:
            return 0
