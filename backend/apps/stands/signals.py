from django.db.models.signals import pre_save
from django.dispatch import receiver

from common.logging.filters import get_user_id
from django.contrib.auth import get_user_model

from .models import StageHistory, Stand, StandStage, StandStageTransition


User = get_user_model()


def _get_current_user():
    user_id = get_user_id()
    if not user_id:
        return None
    return User.objects.filter(pk=user_id).first()


@receiver(pre_save, sender=StandStage)
def set_standstage_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=StandStageTransition)
def set_standstagetransition_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=Stand)
def set_stand_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=StageHistory)
def set_stagehistory_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    if instance.changed_by is None:
        instance.changed_by = user
    instance.updated_by = user
