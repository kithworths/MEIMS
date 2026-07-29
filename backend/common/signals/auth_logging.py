from __future__ import annotations

import logging
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.utils.timezone import now

logger = logging.getLogger("meims.security")


@receiver(user_logged_in)
def handle_user_logged_in(sender, request, user, **kwargs):
    logger.info(
        "user_logged_in",
        extra={
            "extra": {
                "user_id": str(getattr(user, "id", None)),
                "username": getattr(user, "email", None) or getattr(user, "username", None),
                "ip": request.META.get("REMOTE_ADDR"),
                "timestamp": now().isoformat(),
            }
        },
    )


@receiver(user_login_failed)
def handle_user_login_failed(sender, credentials, request, **kwargs):
    # credentials may contain username/email - do not log passwords
    username = None
    if isinstance(credentials, dict):
        username = credentials.get("username") or credentials.get("email")
    logger.warning(
        "user_login_failed",
        extra={
            "extra": {
                "username": username,
                "ip": request.META.get("REMOTE_ADDR") if request else None,
                "timestamp": now().isoformat(),
            }
        },
    )


@receiver(user_logged_out)
def handle_user_logged_out(sender, request, user, **kwargs):
    logger.info(
        "user_logged_out",
        extra={
            "extra": {
                "user_id": str(getattr(user, "id", None)),
                "ip": request.META.get("REMOTE_ADDR") if request else None,
                "timestamp": now().isoformat(),
            }
        },
    )
