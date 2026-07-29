import base64

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils.encoding import force_bytes, force_str

def _get_signer():
    """Return a TimestampSigner using the configured PASSWORD_RESET_SALT.

    The salt MUST be provided via Django settings in production. Using a default
    value is allowed for local development but is not recommended.
    """
    salt = getattr(settings, 'PASSWORD_RESET_SALT', None)
    if not salt:
        # Use a non-secret default in development; warn in logs if needed.
        salt = 'DEFAULT_PASSWORD_RESET_SALT'
    return TimestampSigner(salt=salt)


def generate_password_reset_token(user):
    """Generate a signed token for password reset URLs."""
    signer = _get_signer()
    signed_value = signer.sign(str(user.pk))
    return base64.urlsafe_b64encode(force_bytes(signed_value)).decode('utf-8')


def validate_password_reset_token(token):
    """Validate the signed password reset token and return the associated user."""
    try:
        signed_value = force_str(base64.urlsafe_b64decode(token))
        signer = _get_signer()
        user_id = signer.unsign(signed_value, max_age=settings.PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS)
        return get_user_model().objects.get(pk=user_id)
    except (BadSignature, SignatureExpired, ValueError, TypeError, get_user_model().DoesNotExist) as exc:
        raise ValueError('Invalid or expired password reset token.') from exc


def build_password_reset_url(token):
    """Build a user-facing password reset URL for the frontend application."""
    base_url = getattr(settings, 'PASSWORD_RESET_URL', '').rstrip('/')
    if not base_url:
        raise ValueError('PASSWORD_RESET_URL must be configured to build password reset links.')
    return f'{base_url}?token={token}'


def send_password_reset_email(user, token):
    """Send a password reset email to the configured user address."""
    reset_url = build_password_reset_url(token)
    subject = 'MEIMS Password Reset Request'
    message = (
        f'Hello {user.get_full_name() or user.email},\n\n'
        'We received a request to reset your password for your MEIMS account.\n\n'
        f'Use the following link to choose a new password:\n\n{reset_url}\n\n'
        'If you did not request this change, you can ignore this email.\n\n'
        'This link will expire after the configured password reset window.\n'
    )
    send_mail(
        subject,
        message,
        getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@meims.local'),
        [user.email],
        fail_silently=True,
    )
