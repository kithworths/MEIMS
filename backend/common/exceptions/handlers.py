from __future__ import annotations

import logging
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from django.http import JsonResponse

from common.observability import generate_error_id, set_error_id, get_trace_context
from common.utils.api_response import error_response, internal_server_error

logger = logging.getLogger("meims.request")
security_logger = logging.getLogger("meims.security")


def custom_exception_handler(exc, context):
    """Standardize exception responses for the API and log security/exception events.

    Logs permission denials (403) to the security logger and unexpected errors (5xx)
    to the request logger with traceback information. Sensitive request data is not
    logged.
    """
    request = context.get("request")
    error_id = getattr(request, "error_id", None) or generate_error_id()
    set_error_id(error_id)
    if request is not None:
        request.error_id = error_id

    response = exception_handler(exc, context)

    # Map Django validation errors to DRF validation responses before falling back to server errors
    if response is None and isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            response = Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
        else:
            response = Response({'non_field_errors': exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    # If DRF could not handle the exception, treat as internal server error
    if response is None:
        logger.exception("unhandled_exception", exc_info=exc)
        return internal_server_error()

    # Prepare the standardized payload
    errors = response.data
    message = None

    if isinstance(errors, dict):
        message = errors.get("detail")
        if "detail" in errors:
            errors = {key: value for key, value in errors.items() if key != "detail"}

    if isinstance(errors, list):
        if len(errors) == 1 and isinstance(errors[0], dict) and "detail" in errors[0]:
            message = str(errors[0]["detail"])
            errors = {}
        else:
            errors = {"non_field_errors": errors}

    # Default messages by status code
    if message is None:
        if response.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
            message = "Internal Server Error"
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            message = "Not found."
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            message = "Authentication credentials were not provided or are invalid."
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            message = "You do not have permission to perform this action."
        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            message = "Validation error."
        else:
            message = "Request could not be processed."

    # Log security-related events (permission denials)
    if response.status_code == status.HTTP_403_FORBIDDEN:
        # Log to security logger with path and user context, avoid sensitive payloads
        security_logger.warning(
            "permission_denied",
            extra={
                "extra": {
                    "path": getattr(request, "path", None),
                    "method": getattr(request, "method", None),
                    "user_id": getattr(getattr(request, "user", None), "id", None),
                    "error_id": error_id,
                }
            },
        )

    # Log server errors with exception trace
    if response.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        logger.error(
            "server_error",
            exc_info=exc,
            extra={
                "extra": {
                    "path": getattr(request, "path", None),
                    "method": getattr(request, "method", None),
                    "error_id": error_id,
                    # Do NOT log request body or headers
                }
            },
        )

    if not errors:
        errors = {}

    return error_response(errors=errors, message=message, status_code=response.status_code)


def handle_404(request, exception=None):
    """Django handler404 to return JSON error payload for missing routes.

    This ensures API clients receive standardized JSON error responses
    (including an error_id) instead of Django's default HTML 404 page.
    """
    error_id = getattr(request, "error_id", None) or generate_error_id()
    set_error_id(error_id)
    if request is not None:
        request.error_id = error_id
    context = get_trace_context()
    payload = {
        'success': False,
        'message': 'Not found.',
        'errors': {},
        'error_id': error_id,
        'request_id': context.get('request_id'),
    }
    return JsonResponse(payload, status=status.HTTP_404_NOT_FOUND)


def handle_500(request):
    """Django handler500 to return standardized JSON error payload for server errors."""
    error_id = getattr(request, "error_id", None) or generate_error_id()
    set_error_id(error_id)
    if request is not None:
        request.error_id = error_id
    logger.exception("handler500_internal_error")
    context = get_trace_context()
    payload = {
        'success': False,
        'message': 'Internal Server Error',
        'errors': {},
        'error_id': error_id,
        'request_id': context.get('request_id'),
    }
    return JsonResponse(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
