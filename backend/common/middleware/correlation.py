from __future__ import annotations

import logging
import uuid
from typing import Callable

from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

from common.logging.filters import set_correlation_id, set_user_id
from common.observability import generate_error_id, generate_request_id, generate_span_id, generate_trace_id, set_error_id, set_request_id, set_span_id, set_trace_id

logger = logging.getLogger("meims.request")


class CorrelationIdMiddleware(MiddlewareMixin):
    """Middleware that assigns a correlation id to each request and stores it in a
    contextvar so log records can include it.

    Adds X-Correlation-ID header to responses. If an incoming header X-Correlation-ID
    exists (from upstream load balancer), it is respected.
    """

    header = getattr(settings, "CORRELATION_ID_HEADER", "X-Correlation-ID")

    def process_request(self, request):
        # Respect incoming correlation id when present, otherwise generate one
        correlation_id = request.META.get(f"HTTP_{self.header.upper().replace('-', '_')}")
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
        trace_id = request.META.get('HTTP_X_TRACE_ID') or generate_trace_id()
        request_id = request.META.get('HTTP_X_REQUEST_ID') or generate_request_id()
        span_id = generate_span_id()
        error_id = generate_error_id()

        # set contextvars used by logging filter
        set_correlation_id(correlation_id)
        set_trace_id(trace_id)
        set_request_id(request_id)
        set_span_id(span_id)
        set_error_id(error_id)

        # Attach to request for access in views, audit logs, and response headers
        request.correlation_id = correlation_id
        request.trace_id = trace_id
        request.request_id = request_id
        request.span_id = span_id
        request.error_id = error_id

        # Also attach user_id when user is already authenticated
        user = getattr(request, "user", None)
        user_id = None
        try:
            if user and user.is_authenticated:
                user_id = getattr(user, "id", None)
        except Exception:
            user_id = None
        set_user_id(user_id)

        # Log a debug-level access line for traceability (no sensitive data)
        logger.debug("request_started", extra={"extra": {"path": request.path, "method": request.method, "request_id": request_id, "trace_id": trace_id}})

    def process_response(self, request, response):
        # Ensure header is present on all responses
        try:
            correlation_id = getattr(request, "correlation_id", None)
            if correlation_id:
                response[self.header] = correlation_id
            if getattr(request, "request_id", None):
                response['X-Request-ID'] = request.request_id
            if getattr(request, "trace_id", None):
                response['X-Trace-ID'] = request.trace_id
        except Exception:
            pass
        # Clear contextvars for safety (optional in framework contextvars)
        set_correlation_id(None)
        set_trace_id(None)
        set_request_id(None)
        set_span_id(None)
        set_error_id(None)
        set_user_id(None)
        return response
