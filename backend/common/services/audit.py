from __future__ import annotations

from typing import Any

from common.services.base import BaseService


class AuditLogService(BaseService):
    """Reusable audit logging service for MEIMS."""

    @classmethod
    def record(
        cls,
        module: str,
        action: str,
        description: str | None = None,
        user: Any = None,
        request: Any = None,
        ip_address: str | None = None,
        browser: str | None = None,
        request_method: str | None = None,
    ):
        from apps.audit.models import AuditLog

        if request is not None:
            request_method = request_method or request.method
            ip_address = ip_address or cls._get_client_ip(request)
            browser = browser or request.META.get('HTTP_USER_AGENT', '')
            if user is None and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user

        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            module=module,
            action=action,
            description=description or f'{action} event for module {module}.',
            ip_address=ip_address or '',
            browser=browser or '',
            request_method=request_method or '',
        )

    @staticmethod
    def _get_client_ip(request: Any) -> str:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')
