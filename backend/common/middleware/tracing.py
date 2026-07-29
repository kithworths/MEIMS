from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin

from common.observability import generate_request_id, generate_span_id, generate_trace_id, set_trace_context


class TracingMiddleware(MiddlewareMixin):
    """Populate a lightweight tracing context for logs and responses."""

    def process_request(self, request):
        trace_id = request.META.get('HTTP_X_TRACE_ID') or request.META.get('HTTP_TRACEPARENT') or generate_trace_id()
        request_id = request.META.get('HTTP_X_REQUEST_ID') or generate_request_id()
        span_id = request.META.get('HTTP_X_SPAN_ID') or generate_span_id()
        correlation_id = request.META.get('HTTP_X_CORRELATION_ID') or request_id
        set_trace_context(trace_id=trace_id, request_id=request_id, span_id=span_id, correlation_id=correlation_id)
        request.trace_id = trace_id
        request.request_id = request_id
        request.span_id = span_id
        request.correlation_id = correlation_id

    def process_response(self, request, response):
        response['X-Trace-ID'] = getattr(request, 'trace_id', 'unknown')
        response['X-Request-ID'] = getattr(request, 'request_id', 'unknown')
        response['X-Span-ID'] = getattr(request, 'span_id', 'unknown')
        response['X-Correlation-ID'] = getattr(request, 'correlation_id', 'unknown')
        set_trace_context(trace_id=None, request_id=None, span_id=None, correlation_id=None)
        return response
