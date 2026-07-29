from __future__ import annotations

import contextvars
import hashlib
import os
import time
import uuid
from typing import Any, Optional

from common.logging.filters import (
    get_correlation_id,
    get_request_id,
    get_span_id,
    get_trace_id,
    set_correlation_id,
    set_request_id,
    set_span_id,
    set_trace_id,
)

_TRACE_ID_VAR: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar('trace_id', default=None)
_REQUEST_ID_VAR: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar('request_id', default=None)
_SPAN_ID_VAR: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar('span_id', default=None)
_ERROR_ID_VAR: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar('error_id', default=None)


def generate_trace_id() -> str:
    """Create a deterministic-looking trace identifier for request tracing."""
    return uuid.uuid4().hex


def generate_request_id() -> str:
    """Create a request identifier used across logging and response headers."""
    return uuid.uuid4().hex


def generate_span_id() -> str:
    """Create a span identifier for nested operation tracing."""
    return uuid.uuid4().hex[:16]


def generate_error_id() -> str:
    """Create a unique error identifier for centralized exception handling."""
    return uuid.uuid4().hex


def get_error_id() -> Optional[str]:
    """Return the active error identifier for the current execution context."""
    return _ERROR_ID_VAR.get()


def set_error_id(error_id: Optional[str]) -> None:
    """Store an error identifier in the current execution context."""
    _ERROR_ID_VAR.set(error_id)


def get_trace_context() -> dict[str, Optional[str]]:
    """Return the active trace context for the current request."""
    return {
        'trace_id': get_trace_id(),
        'request_id': get_request_id(),
        'span_id': get_span_id(),
        'correlation_id': get_correlation_id(),
        'error_id': get_error_id(),
    }


def set_trace_context(trace_id: Optional[str] = None, request_id: Optional[str] = None, span_id: Optional[str] = None, correlation_id: Optional[str] = None, error_id: Optional[str] = None) -> None:
    """Store trace context in the current execution context."""
    set_trace_id(trace_id)
    set_request_id(request_id)
    set_span_id(span_id)
    set_correlation_id(correlation_id)
    set_error_id(error_id)


def get_build_hash() -> str:
    """Return a deterministic build hash based on the current environment and repository state."""
    raw = os.getenv('GITHUB_SHA', 'local') + ':' + os.getenv('BUILD_NUMBER', '0')
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()[:16]


def request_timer() -> Any:
    """Simple context manager-like helper for measuring elapsed milliseconds."""
    start = time.perf_counter()

    class _Timer:
        def __enter__(self) -> '_Timer':
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            self.elapsed_ms = round((time.perf_counter() - start) * 1000, 3)

    return _Timer()
