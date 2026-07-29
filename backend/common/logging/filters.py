from __future__ import annotations

import contextvars
import logging
from typing import Optional

# contextvars to hold request-scoped data for logging
_correlation_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("correlation_id", default=None)
_trace_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("trace_id", default=None)
_request_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
_span_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("span_id", default=None)
_user_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)
_remote_ip_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("remote_ip", default=None)
_user_agent_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_agent", default=None)
_response_status_var: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar("response_status", default=None)


def set_correlation_id(value: Optional[str]) -> None:
    _correlation_id_var.set(value)


def set_trace_id(value: Optional[str]) -> None:
    _trace_id_var.set(value)


def set_request_id(value: Optional[str]) -> None:
    _request_id_var.set(value)


def set_span_id(value: Optional[str]) -> None:
    _span_id_var.set(value)


def set_user_id(value: Optional[str]) -> None:
    _user_id_var.set(value)


def set_remote_ip(value: Optional[str]) -> None:
    _remote_ip_var.set(value)


def set_user_agent(value: Optional[str]) -> None:
    _user_agent_var.set(value)


def set_response_status(value: Optional[int]) -> None:
    _response_status_var.set(value)


def get_correlation_id() -> Optional[str]:
    return _correlation_id_var.get()


def get_trace_id() -> Optional[str]:
    return _trace_id_var.get()


def get_request_id() -> Optional[str]:
    return _request_id_var.get()


def get_span_id() -> Optional[str]:
    return _span_id_var.get()


def get_user_id() -> Optional[str]:
    return _user_id_var.get()


def get_remote_ip() -> Optional[str]:
    return _remote_ip_var.get()


def get_user_agent() -> Optional[str]:
    return _user_agent_var.get()


def get_response_status() -> Optional[int]:
    return _response_status_var.get()


class RequestContextFilter(logging.Filter):
    """Injects request-scoped context into log records when present."""

    def filter(self, record: logging.LogRecord) -> bool:  # pragma: no cover - simple shim
        correlation_id = get_correlation_id()
        trace_id = get_trace_id()
        request_id = get_request_id()
        span_id = get_span_id()
        user_id = get_user_id()
        remote_ip = get_remote_ip()
        user_agent = get_user_agent()
        response_status = get_response_status()

        setattr(record, "correlation_id", correlation_id)
        setattr(record, "trace_id", trace_id)
        setattr(record, "request_id", request_id)
        setattr(record, "span_id", span_id)
        setattr(record, "user_id", user_id)
        setattr(record, "remote_ip", remote_ip)
        setattr(record, "user_agent", user_agent)
        setattr(record, "response_status", response_status)
        return True
