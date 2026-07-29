from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import DocumentVersion, PlanVersion


@receiver(post_save, sender=DocumentVersion)
def update_document_current_version(sender, instance, created, **kwargs):
    if created:
        document = instance.document
        if document.current_version_id != instance.id:
            document.current_version = instance
            document.save(update_fields=['current_version'])


@receiver(post_save, sender=PlanVersion)
def update_plan_current_version(sender, instance, created, **kwargs):
    if created:
        plan = instance.plan
        if plan.current_version_id != instance.id:
            plan.current_version = instance
            plan.save(update_fields=['current_version'])
