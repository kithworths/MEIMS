import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
os.environ.setdefault('DJANGO_TESTING', '1')
os.environ.setdefault('PYTEST_CURRENT_TEST', '1')

import django

django.setup()
