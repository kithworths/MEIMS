from typing import Optional
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Project


class ProjectService:
    """Service layer for Project business operations.

    Keep business logic here. Methods return model instances or raise exceptions.
    Use transactions for multi-step operations.
    """

    @staticmethod
    def get(project_id: str) -> Project:
        return get_object_or_404(Project, pk=project_id, is_deleted=False)

    @staticmethod
    def list(active_only: bool = True):
        qs = Project.objects.all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs) -> Project:
        project = Project.objects.create(**kwargs)
        return project

    @staticmethod
    @transaction.atomic
    def update(project: Project, **kwargs) -> Project:
        for k, v in kwargs.items():
            setattr(project, k, v)
        project.save()
        return project

    @staticmethod
    @transaction.atomic
    def soft_delete(project: Project, deleted_by=None) -> None:
        project.is_deleted = True
        project.is_active = False
        if deleted_by is not None:
            project.updated_by = deleted_by
        project.save()
