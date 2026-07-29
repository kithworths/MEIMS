import re
from django.core.exceptions import ValidationError


def validate_project_code(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Project code is required.')
    if not re.match(r'^[A-Z0-9_-]+$', value):
        raise ValidationError('Project code must be uppercase letters, numbers, dash or underscore.')
