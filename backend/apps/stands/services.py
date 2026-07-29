from django.apps import apps
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import StageHistory, Stand, StandStage, StandStageTransition


class StandStageService:
    @staticmethod
    def get(stage_id):
        return get_object_or_404(StandStage, pk=stage_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = StandStage.objects.all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        return StandStage.objects.create(**kwargs)

    @staticmethod
    @transaction.atomic
    def update(stage, **kwargs):
        for key, value in kwargs.items():
            setattr(stage, key, value)
        stage.save()
        return stage

    @staticmethod
    @transaction.atomic
    def soft_delete(stage, deleted_by=None):
        stage.is_deleted = True
        stage.is_active = False
        if deleted_by is not None:
            stage.updated_by = deleted_by
        stage.save()


class StandStageTransitionService:
    @staticmethod
    def get(transition_id):
        return get_object_or_404(StandStageTransition, pk=transition_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = StandStageTransition.objects.select_related('from_stage', 'to_stage').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        return StandStageTransition.objects.create(**kwargs)

    @staticmethod
    @transaction.atomic
    def update(transition, **kwargs):
        for key, value in kwargs.items():
            setattr(transition, key, value)
        transition.save()
        return transition

    @staticmethod
    @transaction.atomic
    def soft_delete(transition, deleted_by=None):
        transition.is_deleted = True
        transition.is_active = False
        if deleted_by is not None:
            transition.updated_by = deleted_by
        transition.save()


class StandService:
    @staticmethod
    def get(stand_id):
        return get_object_or_404(Stand.objects.select_related('project', 'current_stage'), pk=stand_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = Stand.objects.select_related('project', 'current_stage').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    def has_dependent_records(stand):
        try:
            StageHistory = apps.get_model('stands', 'StageHistory')
            return StageHistory.objects.filter(stand=stand, is_deleted=False).exists()
        except LookupError:
            return False

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        return Stand.objects.create(**kwargs)

    @staticmethod
    @transaction.atomic
    def update(stand, **kwargs):
        for key, value in kwargs.items():
            setattr(stand, key, value)
        stand.save()
        return stand

    @staticmethod
    @transaction.atomic
    def soft_delete(stand, deleted_by=None):
        if StandService.has_dependent_records(stand):
            raise ValueError('Cannot delete stand with dependent records.')
        stand.is_deleted = True
        stand.is_active = False
        if deleted_by is not None:
            stand.updated_by = deleted_by
        stand.save()


class StageHistoryService:
    @staticmethod
    def get(history_id):
        return get_object_or_404(StageHistory, pk=history_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = StageHistory.objects.select_related('stand', 'from_stage', 'to_stage', 'changed_by').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        history = StageHistory.objects.create(**kwargs)
        stand = history.stand
        if stand.current_stage != history.to_stage:
            stand.current_stage = history.to_stage
            stand.updated_by = history.changed_by or history.created_by
            stand.save()
        return history

    @staticmethod
    @transaction.atomic
    def soft_delete(history, deleted_by=None):
        history.is_deleted = True
        history.is_active = False
        if deleted_by is not None:
            history.updated_by = deleted_by
        history.save()
