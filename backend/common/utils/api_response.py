from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.response import Response

from common.observability import get_trace_context


def success_response(
    data: Any | None = None,
    message: str = '',
    status_code: int = status.HTTP_200_OK,
) -> Response:
    """Return a standardized success response for API endpoints."""
    context = get_trace_context()
    return Response(
        {
            'success': True,
            'message': message,
            'data': data if data is not None else {},
            'request_id': context.get('request_id'),
        },
        status=status_code,
    )


def error_response(
    errors: Any | None = None,
    message: str = 'Request could not be processed.',
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    """Return a standardized error response for API endpoints."""
    context = get_trace_context()
    return Response(
        {
            'success': False,
            'message': message,
            'errors': errors if errors is not None else {},
            'error_id': context.get('error_id'),
            'request_id': context.get('request_id'),
        },
        status=status_code,
    )


def internal_server_error(message: str = 'Internal Server Error') -> Response:
    """Return a standardized internal server error response."""
    return error_response(errors={}, message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
