from .base import *

DEBUG = False
ENVIRONMENT = config('DJANGO_ENVIRONMENT', default='production')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv())

SECURE_SSL_REDIRECT = config('DJANGO_SECURE_SSL_REDIRECT', default=True, cast=bool) and not TESTING
SESSION_COOKIE_SECURE = config('DJANGO_SESSION_COOKIE_SECURE', default=True, cast=bool)
CSRF_COOKIE_SECURE = config('DJANGO_CSRF_COOKIE_SECURE', default=True, cast=bool)
SESSION_COOKIE_SAMESITE = config('DJANGO_SESSION_COOKIE_SAMESITE', default='Lax')
CSRF_COOKIE_SAMESITE = config('DJANGO_CSRF_COOKIE_SAMESITE', default='Lax')
USE_X_FORWARDED_HOST = config('DJANGO_USE_X_FORWARDED_HOST', default=True, cast=bool)
USE_X_FORWARDED_PORT = config('DJANGO_USE_X_FORWARDED_PORT', default=True, cast=bool)
SECURE_HSTS_SECONDS = config('DJANGO_SECURE_HSTS_SECONDS', default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True, cast=bool)
SECURE_HSTS_PRELOAD = config('DJANGO_SECURE_HSTS_PRELOAD', default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') if config('DJANGO_SECURE_PROXY_SSL_HEADER', default=True, cast=bool) else None
