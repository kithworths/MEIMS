import re
from django.core.exceptions import ValidationError


def validate_document_title(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Document title is required.')
    if len(value.strip()) > 255:
        raise ValidationError('Document title must be 255 characters or fewer.')


def validate_plan_code(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Plan code is required.')
    if not re.match(r'^[A-Z0-9_-]+$', value):
        raise ValidationError('Plan code must be uppercase letters, numbers, dash or underscore.')
