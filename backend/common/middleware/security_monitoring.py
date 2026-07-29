from __future__ import annotations

import logging
from typing import Optional

from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin

from common.metrics import AUTH_FAILURES, PERMISSION_DENIALS

logger = logging.getLogger('meims.security')


class SecurityMonitoringMiddleware(MiddlewareMixin):
    """Detect suspicious security patterns and log them for operations review."""

    def process_response(self, request, response):
        if response.status_code in (401, 403, 429):
            self._record_security_event(request, response)
        return response

    def _record_security_event(self, request, response) -> None:
        client_ip = self._get_client_ip(request)
        user_id = getattr(getattr(request, 'user', None), 'id', None)
        event_type = self._event_type(request, response)

        if event_type == 'authentication_failure':
            AUTH_FAILURES.labels(endpoint=request.path).inc()
        elif event_type == 'permission_denial':
            PERMISSION_DENIALS.labels(endpoint=request.path).inc()

        if event_type in ('authentication_failure', 'permission_denial', 'token_abuse', 'rate_limit_violation'):
            window_key = f'security:{event_type}:{client_ip}:{user_id or "anonymous"}'
            count = int(cache.get(window_key, 0)) + 1
            cache.set(window_key, count, 60 * 15)
            if count >= 5:
                logger.warning(
                    'security_pattern_detected',
                    extra={
                        'extra': {
                            'event_type': event_type,
                            'client_ip': client_ip,
                            'user_id': user_id,
                            'count': count,
                            'path': request.path,
                        }
                    },
                )

    def _event_type(self, request, response) -> str:
        path = request.path.lower()
        if response.status_code == 429:
            return 'rate_limit_violation'
        if response.status_code == 401 and 'refresh' in path:
            return 'token_abuse'
        if response.status_code == 401:
            return 'authentication_failure'
        if response.status_code == 403:
            return 'permission_denial'
        return 'unknown'

    def _get_client_ip(self, request) -> Optional[str]:
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
