from django.db.models.signals import pre_save
from django.dispatch import receiver

from common.logging.filters import get_user_id
from .models import Project
from django.contrib.auth import get_user_model


User = get_user_model()


def _get_current_user_instance():
    """Return a User instance if available via contextvar user id set by middleware.

    This is a best-effort helper: if user id is present but user record not found,
    returns None.
    """
    try:
        user_id = get_user_id()
        if user_id:
            return User.objects.filter(pk=user_id).first()
    except Exception:
        return None
    return None


@receiver(pre_save, sender=Project)
def set_audit_fields(sender, instance: Project, **kwargs):
    user = _get_current_user_instance()
    if instance._state.adding:
        if not instance.created_by:
            instance.created_by = user
    # always set updated_by when saving
    instance.updated_by = user
