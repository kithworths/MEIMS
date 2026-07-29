import re
from django.core.exceptions import ValidationError


def validate_stage_code(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Stand stage code is required.')
    if not re.match(r'^[A-Z0-9_-]+$', value):
        raise ValidationError('Stand stage code must be uppercase letters, numbers, dash or underscore.')


def validate_stand_code(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Stand code is required.')
    if not re.match(r'^[A-Z0-9_-]+$', value):
        raise ValidationError('Stand code must be uppercase letters, numbers, dash or underscore.')
