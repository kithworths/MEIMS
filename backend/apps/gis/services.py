from django.db import transaction
from django.shortcuts import get_object_or_404

from common.services.audit import AuditLogService
from .models import GISLocation


class GISLocationService:
    @staticmethod
    def get(location_id):
        return get_object_or_404(GISLocation.objects.all(), pk=location_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = GISLocation.objects.all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        location = GISLocation.objects.create(**kwargs)
        AuditLogService.record(
            module='gis',
            action='Create',
            description=f'GIS location {location.name} created.',
            user=location.created_by,
        )
        return location

    @staticmethod
    @transaction.atomic
    def update(location, **kwargs):
        for key, value in kwargs.items():
            setattr(location, key, value)
        location.save()
        AuditLogService.record(
            module='gis',
            action='Update',
            description=f'GIS location {location.name} updated.',
            user=location.updated_by,
        )
        return location

    @staticmethod
    @transaction.atomic
    def soft_delete(location, deleted_by=None):
        location.is_deleted = True
        location.is_active = False
        if deleted_by is not None:
            location.updated_by = deleted_by
        location.save()
