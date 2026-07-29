import os

DJANGO_ENV = os.environ.get('DJANGO_ENV', '').lower()
DJANGO_SETTINGS_MODULE = os.environ.get('DJANGO_SETTINGS_MODULE', '').lower()

if 'production' in DJANGO_ENV or 'production' in DJANGO_SETTINGS_MODULE:
    from .production import *  # noqa: F401,F403
elif 'staging' in DJANGO_ENV or 'staging' in DJANGO_SETTINGS_MODULE:
    from .staging import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403
