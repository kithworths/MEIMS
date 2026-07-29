from __future__ import annotations

import logging
from typing import Optional
from django.utils.deprecation import MiddlewareMixin

from common.logging.filters import set_user_id

logger = logging.getLogger("meims.request")


class UserContextMiddleware(MiddlewareMixin):
    """Middleware that updates the logging context with authenticated user id.

    This must run after Django's AuthenticationMiddleware so request.user is available.
    """

    def process_request(self, request):
        user = getattr(request, "user", None)
        user_id: Optional[str] = None
        try:
            if user and getattr(user, "is_authenticated", False):
                user_id = getattr(user, "id", None)
        except Exception:
            user_id = None
        set_user_id(user_id)

    def process_response(self, request, response):
        # clear per-request user id
        set_user_id(None)
        return response
