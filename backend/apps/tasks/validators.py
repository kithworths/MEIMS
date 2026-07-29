import re
from django.core.exceptions import ValidationError


def validate_service_type_code(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Service type code is required.')
    if not re.match(r'^[A-Z0-9_-]+$', value):
        raise ValidationError('Service type code must be uppercase letters, numbers, dash or underscore.')


def validate_task_title(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Task title is required.')
    if len(value.strip()) > 255:
        raise ValidationError('Task title must be 255 characters or fewer.')


def validate_ticket_title(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Ticket title is required.')
    if len(value.strip()) > 255:
        raise ValidationError('Ticket title must be 255 characters or fewer.')
