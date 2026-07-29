from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """Simple JSON formatter for structured logging.

    Outputs a compact JSON object per record. Keeps fields intentionally small and
    omits potentially sensitive data (no request body, no raw headers).
    """

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include correlation_id and user_id when present on the record
        if hasattr(record, "correlation_id") and record.correlation_id:
            payload["correlation_id"] = str(record.correlation_id)
        if hasattr(record, "trace_id") and record.trace_id:
            payload["trace_id"] = str(record.trace_id)
        if hasattr(record, "request_id") and record.request_id:
            payload["request_id"] = str(record.request_id)
        if hasattr(record, "span_id") and record.span_id:
            payload["span_id"] = str(record.span_id)
        if hasattr(record, "user_id") and record.user_id is not None:
            payload["user_id"] = str(record.user_id)
        if hasattr(record, "remote_ip") and record.remote_ip:
            payload["remote_ip"] = record.remote_ip
        if hasattr(record, "user_agent") and record.user_agent:
            payload["user_agent"] = record.user_agent
        if hasattr(record, "response_status") and record.response_status is not None:
            payload["response_status"] = record.response_status

        # Include module and pathname for debugging where necessary (optional)
        payload["module"] = record.module
        payload["funcName"] = record.funcName

        # If extra context provided, merge it under "context" key (must be serializable)
        extra = getattr(record, "extra", None)
        if extra and isinstance(extra, dict):
            payload["context"] = extra

        # Include exception information if present
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        # Ensure JSON is compact and safe
        return json.dumps(payload, ensure_ascii=False, default=str)
