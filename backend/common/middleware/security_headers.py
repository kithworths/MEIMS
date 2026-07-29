from __future__ import annotations

from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to each response for production hardening."""

    def process_response(self, request, response):
        csp_directives = [
            f"default-src {settings.CSP_DEFAULT_SRC}",
            f"script-src {settings.CSP_SCRIPT_SRC}",
            f"style-src {settings.CSP_STYLE_SRC}",
            f"img-src {settings.CSP_IMG_SRC}",
            f"connect-src {settings.CSP_CONNECT_SRC}",
        ]
        response.setdefault('Content-Security-Policy', '; '.join(csp_directives))
        response.setdefault('Permissions-Policy', getattr(settings, 'PERMISSIONS_POLICY', 'geolocation=(), microphone=(), camera=(), payment=()'))
        response.setdefault('Referrer-Policy', getattr(settings, 'SECURE_REFERRER_POLICY', 'strict-origin-when-cross-origin'))
        response.setdefault('X-Content-Type-Options', 'nosniff')
        response.setdefault('X-Frame-Options', getattr(settings, 'X_FRAME_OPTIONS', 'DENY'))
        response.setdefault('X-XSS-Protection', '1; mode=block')
        if getattr(settings, 'SECURE_HSTS_SECONDS', 0):
            response.setdefault('Strict-Transport-Security', 'max-age={}; includeSubDomains; preload'.format(getattr(settings, 'SECURE_HSTS_SECONDS', 31536000)))
        return response
