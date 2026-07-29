from __future__ import annotations

import logging
import time
from typing import Optional
from django.utils.deprecation import MiddlewareMixin

from common.logging.filters import set_response_status
from common.logging.filters import set_remote_ip, set_user_agent

logger = logging.getLogger('meims.request')


class RequestResponseLoggingMiddleware(MiddlewareMixin):
    """Middleware that logs request lifecycle details and response metadata."""

    def process_request(self, request):
        request._start_time = time.monotonic()
        remote_ip = request.META.get('HTTP_X_FORWARDED_FOR')
        if remote_ip:
            remote_ip = remote_ip.split(',')[0].strip()
        else:
            remote_ip = request.META.get('REMOTE_ADDR')
        set_remote_ip(remote_ip)
        set_user_agent(request.META.get('HTTP_USER_AGENT', ''))

    def process_response(self, request, response):
        duration = None
        if hasattr(request, '_start_time'):
            duration = round((time.monotonic() - request._start_time) * 1000, 2)

        response_status = getattr(response, 'status_code', None)
        set_response_status(response_status)

        logger.info(
            'request_completed',
            extra={
                'extra': {
                    'method': request.method,
                    'path': request.path,
                    'status': response_status,
                    'duration_ms': duration,
                    'remote_ip': getattr(request, 'META', {}).get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                }
            },
        )

        set_response_status(None)
        set_remote_ip(None)
        set_user_agent(None)
        return response

    def process_exception(self, request, exception):
        set_remote_ip(None)
        set_user_agent(None)
        set_response_status(None)
        return None
