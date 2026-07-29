import re
from django.core.exceptions import ValidationError


def validate_currency_code(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Currency code is required.')
    if not re.match(r'^[A-Z]{3}$', value):
        raise ValidationError('Currency code must be three uppercase letters.')


def validate_payment_reference(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError('Payment reference is required.')
    if len(value.strip()) > 128:
        raise ValidationError('Payment reference must be 128 characters or fewer.')
