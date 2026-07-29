from __future__ import annotations

from typing import Any

from django.utils.deprecation import MiddlewareMixin

from common.services.audit import AuditLogService


class AuditLogMiddleware(MiddlewareMixin):
    """Middleware to record audit events for request-based activity."""

    METHOD_ACTION_MAP = {
        'GET': 'Read',
        'POST': 'Create',
        'PUT': 'Update',
        'PATCH': 'Update',
        'DELETE': 'Delete',
    }

    EXTRA_ACTIONS = {
        'approve': 'Approve',
        'export': 'Export',
        'print': 'Print',
        'assign': 'Assign',
    }

    def process_view(self, request: Any, view_func: Any, _view_args: Any, _view_kwargs: Any) -> None:
        request.audit_metadata = None

        view_class = getattr(view_func, 'view_class', None) or getattr(view_func, 'cls', None)
        if view_class is None:
            return

        audit_module = getattr(view_class, 'audit_module', None)
        audit_action = getattr(view_class, 'audit_action', None)
        audit_description = getattr(view_class, 'audit_description', None)

        if audit_module is None:
            audit_module = self._resolve_module(view_class, request)

        if audit_action is None:
            audit_action = self._resolve_action(request, view_class)

        if audit_module and audit_action:
            request.audit_metadata = {
                'module': audit_module,
                'action': audit_action,
                'description': audit_description or f'{audit_action} event for {audit_module}.',
            }

        return

    def process_response(self, request: Any, response: Any) -> Any:
        audit_metadata = getattr(request, 'audit_metadata', None)
        if audit_metadata and 200 <= response.status_code < 400:
            AuditLogService.record(
                module=audit_metadata['module'],
                action=audit_metadata['action'],
                description=audit_metadata['description'],
                user=getattr(request, 'audit_user', None),
                request=request,
            )
        return response

    def _resolve_module(self, view_class: Any, request: Any) -> str:
        """Resolve a human-friendly module name for auditing.

        Strategy (defensive, Django-5 compatible):
        - If the view class has a queryset or serializer Meta.model, use the model name.
        - If resolver_match.app_name is set, use that.
        - If the view's module path contains an "apps" segment (common project layout), return the segment after it (e.g. "apps.api.views" -> "api").
        - If the module path ends with "views" or "view", return the parent segment (e.g. "apps.api.views" -> "api", "config.views" -> "config").
        - Otherwise, return the second-to-last path segment when available, or the only segment when not.
        - Never raise IndexError; return the string "unknown" when the module cannot be determined.
        """
        # 1) Model-based resolution (preferred)
        try:
            if hasattr(view_class, 'queryset') and view_class.queryset is not None:
                model = getattr(view_class.queryset, 'model', None)
                if model is not None:
                    return model._meta.model_name

            if hasattr(view_class, 'serializer_class'):
                serializer_class = view_class.serializer_class
                model = getattr(getattr(serializer_class, 'Meta', None), 'model', None)
                if model is not None:
                    return model._meta.model_name
        except Exception:
            # Be defensive: don't allow model inspection to crash auditing
            pass

        # 2) Resolver-provided app name
        resolver_match = getattr(request, 'resolver_match', None)
        if resolver_match is not None:
            app_name = getattr(resolver_match, 'app_name', None)
            if app_name:
                return app_name

        # 3) Module path analysis
        module_path = getattr(view_class, '__module__', '') or ''
        if not module_path:
            return 'unknown'

        parts = module_path.split('.')
        # Defensive helper
        def _safe_part(index: int) -> str | None:
            return parts[index] if 0 <= index < len(parts) else None

        # If project layout uses an "apps" segment, prefer the following segment
        if 'apps' in parts:
            idx = parts.index('apps')
            candidate = _safe_part(idx + 1)
            if candidate:
                return candidate

        # If module ends with views, return its parent segment (apps.api.views -> api)
        if parts[-1] in ('views', 'view') and len(parts) >= 2:
            return parts[-2]

        # Otherwise, prefer the second-to-last segment when available
        if len(parts) >= 2:
            return parts[-2]

        # Single-segment module, return it
        if len(parts) == 1:
            return parts[0]

        return 'unknown'

    def _resolve_action(self, request: Any, view_class: Any) -> str | None:
        resolver_match = getattr(request, 'resolver_match', None)
        if resolver_match is not None:
            url_name = getattr(resolver_match, 'url_name', '') or ''
            if '-' in url_name:
                action_key = url_name.split('-')[-1]
                if action_key in self.EXTRA_ACTIONS:
                    return self.EXTRA_ACTIONS[action_key]
                if action_key in ['detail', 'list']:
                    return 'Read'

        if hasattr(view_class, 'queryset') and view_class.queryset is not None:
            return self.METHOD_ACTION_MAP.get(request.method)

        return None
