from __future__ import annotations

from typing import Any

from rest_framework.renderers import JSONRenderer


class StandardizedJSONRenderer(JSONRenderer):
    """Wrap API responses in a standardized JSON structure."""

    charset = 'utf-8'

    def render(
        self,
        data: Any,
        accepted_media_type: str | None = None,
        renderer_context: dict | None = None,
    ) -> bytes:
        renderer_context = renderer_context or {}
        response = renderer_context.get('response')

        if response is None:
            return super().render(data, accepted_media_type, renderer_context)

        if isinstance(data, dict) and 'success' in data and 'message' in data:
            return super().render(data, accepted_media_type, renderer_context)

        is_error = getattr(response, 'exception', False) or response.status_code >= 400

        if is_error:
            message = 'Request could not be processed.'
            errors = data

            if isinstance(data, dict):
                if 'detail' in data:
                    message = str(data.get('detail') or message)
                    errors = {k: v for k, v in data.items() if k != 'detail'}
                if not errors:
                    errors = {}
            elif isinstance(data, list):
                errors = {'non_field_errors': data}
            else:
                message = str(data)
                errors = {}

            payload = {
                'success': False,
                'message': message,
                'errors': errors,
            }
            return super().render(payload, accepted_media_type, renderer_context)

        payload = {
            'success': True,
            'message': '',
            'data': data if data is not None else {},
        }
        return super().render(payload, accepted_media_type, renderer_context)
