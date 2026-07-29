from django.contrib.auth import get_user_model
from django.db.models.signals import pre_save
from django.dispatch import receiver

from common.logging.filters import get_user_id
from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    ServiceType,
    SiteInspection,
    SiteVisit,
    TaskHistory,
)


User = get_user_model()


def _get_current_user():
    user_id = get_user_id()
    if not user_id:
        return None
    return User.objects.filter(pk=user_id).first()


@receiver(pre_save, sender=ServiceType)
def set_service_type_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=ProjectTask)
def set_project_task_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=TaskHistory)
def set_task_history_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    if instance.changed_by is None:
        instance.changed_by = user
    instance.updated_by = user


@receiver(pre_save, sender=EngineerTicket)
def set_engineer_ticket_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=EngineerTicketHistory)
def set_engineer_ticket_history_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    if instance.changed_by is None:
        instance.changed_by = user
    instance.updated_by = user


@receiver(pre_save, sender=SiteVisit)
def set_site_visit_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user


@receiver(pre_save, sender=SiteInspection)
def set_site_inspection_audit(sender, instance, **kwargs):
    user = _get_current_user()
    if instance._state.adding and not instance.created_by:
        instance.created_by = user
    instance.updated_by = user
