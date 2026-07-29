from django.apps import apps
from django.db import transaction
from django.shortcuts import get_object_or_404
from common.services.audit import AuditLogService

from apps.stands.models import Stand
from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    TaskHistory,
    ServiceType,
    SiteInspection,
    SiteVisit,
)


class NotificationService:
    @staticmethod
    def notify(module: str, action: str, description: str, user=None):
        AuditLogService.record(module=module, action=action, description=description, user=user)


class ServiceTypeService:
    @staticmethod
    def get(service_type_id):
        return get_object_or_404(ServiceType, pk=service_type_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = ServiceType.objects.all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        return ServiceType.objects.create(**kwargs)

    @staticmethod
    @transaction.atomic
    def update(service_type, **kwargs):
        for key, value in kwargs.items():
            setattr(service_type, key, value)
        service_type.save()
        return service_type

    @staticmethod
    @transaction.atomic
    def soft_delete(service_type, deleted_by=None):
        service_type.is_deleted = True
        service_type.is_active = False
        if deleted_by is not None:
            service_type.updated_by = deleted_by
        service_type.save()


class TaskHistoryService:
    @staticmethod
    def get(history_id):
        return get_object_or_404(TaskHistory, pk=history_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = TaskHistory.objects.select_related('task', 'changed_by', 'previous_assignee', 'new_assignee').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        return TaskHistory.objects.create(**kwargs)


class ProjectTaskService:
    @staticmethod
    def get(task_id):
        return get_object_or_404(
            ProjectTask.objects.select_related('project', 'stand', 'service_type', 'assignee', 'parent_task'),
            pk=task_id,
            is_deleted=False,
        )

    @staticmethod
    def list(active_only=True):
        qs = ProjectTask.objects.select_related('project', 'stand', 'service_type', 'assignee', 'parent_task').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        task = ProjectTask.objects.create(**kwargs)
        NotificationService.notify(
            module='project_tasks',
            action='Create',
            description=f'Project task {task.title} created.',
            user=task.created_by,
        )
        return task

    @staticmethod
    @transaction.atomic
    def update(task, expected_row_version=None, **kwargs):
        if expected_row_version is not None and task.row_version != expected_row_version:
            raise ValueError('Project task has been modified by another user.')

        changed_fields = {}
        for field in [
            'status',
            'assignee',
            'priority',
            'estimated_hours',
            'spent_hours',
            'planned_start_date',
            'planned_end_date',
            'actual_start_date',
            'actual_end_date',
        ]:
            if field in kwargs:
                new_value = kwargs[field]
                old_value = getattr(task, field)
                if old_value != new_value:
                    changed_fields[field] = (old_value, new_value)

        for key, value in kwargs.items():
            setattr(task, key, value)
        task.row_version = task.row_version + 1
        task.save()

        if changed_fields:
            TaskHistoryService.create(
                task=task,
                changed_by=task.updated_by,
                previous_status=changed_fields.get('status', (None, None))[0] or '',
                new_status=changed_fields.get('status', (None, None))[1] or '',
                previous_assignee=changed_fields.get('assignee', (None, None))[0],
                new_assignee=changed_fields.get('assignee', (None, None))[1],
                previous_priority=changed_fields.get('priority', (None, None))[0] or '',
                new_priority=changed_fields.get('priority', (None, None))[1] or '',
                previous_estimated_hours=changed_fields.get('estimated_hours', (None, None))[0],
                new_estimated_hours=changed_fields.get('estimated_hours', (None, None))[1],
                previous_spent_hours=changed_fields.get('spent_hours', (None, None))[0],
                new_spent_hours=changed_fields.get('spent_hours', (None, None))[1],
                notes='Task updated with tracked field changes.',
            )

        NotificationService.notify(
            module='project_tasks',
            action='Update',
            description=f'Project task {task.title} updated.',
            user=task.updated_by,
        )
        return task

    @staticmethod
    @transaction.atomic
    def soft_delete(task, deleted_by=None):
        task.is_deleted = True
        task.is_active = False
        if deleted_by is not None:
            task.updated_by = deleted_by
        task.save()


class EngineerTicketHistoryService:
    @staticmethod
    def get(history_id):
        return get_object_or_404(EngineerTicketHistory, pk=history_id, is_deleted=False)

    @staticmethod
    def list(active_only=True):
        qs = EngineerTicketHistory.objects.select_related('ticket', 'changed_by', 'previous_assignee', 'new_assignee').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        return EngineerTicketHistory.objects.create(**kwargs)


class EngineerTicketService:
    @staticmethod
    def get(ticket_id):
        return get_object_or_404(
            EngineerTicket.objects.select_related('project', 'stand', 'service_type', 'assignee', 'reporter'),
            pk=ticket_id,
            is_deleted=False,
        )

    @staticmethod
    def list(active_only=True):
        qs = EngineerTicket.objects.select_related('project', 'stand', 'service_type', 'assignee', 'reporter').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        ticket = EngineerTicket.objects.create(**kwargs)
        NotificationService.notify(
            module='engineer_tickets',
            action='Create',
            description=f'Engineer ticket {ticket.title} created.',
            user=ticket.reporter,
        )
        return ticket

    @staticmethod
    @transaction.atomic
    def update(ticket, **kwargs):
        changed_fields = {}
        for field in ['status', 'assignee', 'priority']:
            if field in kwargs:
                new_value = kwargs[field]
                old_value = getattr(ticket, field)
                if old_value != new_value:
                    changed_fields[field] = (old_value, new_value)

        for key, value in kwargs.items():
            setattr(ticket, key, value)
        ticket.save()

        if changed_fields:
            EngineerTicketHistoryService.create(
                ticket=ticket,
                changed_by=ticket.updated_by,
                previous_status=changed_fields.get('status', (None, None))[0] or '',
                new_status=changed_fields.get('status', (None, None))[1] or '',
                previous_assignee=changed_fields.get('assignee', (None, None))[0],
                new_assignee=changed_fields.get('assignee', (None, None))[1],
                previous_priority=changed_fields.get('priority', (None, None))[0] or '',
                new_priority=changed_fields.get('priority', (None, None))[1] or '',
                notes='Engineer ticket updated with tracked field changes.',
            )

        NotificationService.notify(
            module='engineer_tickets',
            action='Update',
            description=f'Engineer ticket {ticket.title} updated.',
            user=ticket.updated_by,
        )
        return ticket

    @staticmethod
    @transaction.atomic
    def soft_delete(ticket, deleted_by=None):
        ticket.is_deleted = True
        ticket.is_active = False
        if deleted_by is not None:
            ticket.updated_by = deleted_by
        ticket.save()


class SiteVisitService:
    @staticmethod
    def get(visit_id):
        return get_object_or_404(
            SiteVisit.objects.select_related('stand', 'engineer'),
            pk=visit_id,
            is_deleted=False,
        )

    @staticmethod
    def list(active_only=True):
        qs = SiteVisit.objects.select_related('stand', 'engineer').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        visit = SiteVisit.objects.create(**kwargs)
        NotificationService.notify(
            module='site_visits',
            action='Create',
            description=f'Site visit for {visit.stand} scheduled.',
            user=visit.created_by,
        )
        return visit

    @staticmethod
    @transaction.atomic
    def update(visit, **kwargs):
        for key, value in kwargs.items():
            setattr(visit, key, value)
        visit.save()
        NotificationService.notify(
            module='site_visits',
            action='Update',
            description=f'Site visit for {visit.stand} updated.',
            user=visit.updated_by,
        )
        return visit

    @staticmethod
    @transaction.atomic
    def soft_delete(visit, deleted_by=None):
        visit.is_deleted = True
        visit.is_active = False
        if deleted_by is not None:
            visit.updated_by = deleted_by
        visit.save()


class SiteInspectionService:
    @staticmethod
    def get(inspection_id):
        return get_object_or_404(
            SiteInspection.objects.select_related('stand', 'inspector', 'target_stage', 'follow_up_ticket'),
            pk=inspection_id,
            is_deleted=False,
        )

    @staticmethod
    def list(active_only=True):
        qs = SiteInspection.objects.select_related('stand', 'inspector', 'target_stage', 'follow_up_ticket').all()
        if active_only:
            qs = qs.filter(is_active=True, is_deleted=False)
        return qs

    @staticmethod
    @transaction.atomic
    def create(**kwargs):
        inspection = SiteInspection.objects.create(**kwargs)
        stand = inspection.stand
        inspector = inspection.inspector or inspection.created_by

        if inspection.result == SiteInspection.RESULT_FAIL:
            ticket = EngineerTicketService.create(
                project=stand.project,
                stand=stand,
                service_type=None,
                reporter=inspector,
                title=f'Inspection failed for {stand.code}',
                description=inspection.comments or 'Inspection failed and requires corrective action.',
                status=EngineerTicket.STATUS_OPEN,
                priority=EngineerTicket.PRIORITY_HIGH,
                created_by=inspector,
                updated_by=inspector,
            )
            inspection.follow_up_ticket = ticket
            inspection.save(update_fields=['follow_up_ticket'])
            stand.status = Stand.STATUS_ON_HOLD
        elif inspection.result == SiteInspection.RESULT_CONDITIONAL:
            stand.status = Stand.STATUS_ACTIVE
        elif inspection.result == SiteInspection.RESULT_PASS:
            if stand.status not in [Stand.STATUS_COMPLETED, Stand.STATUS_CANCELLED]:
                stand.status = Stand.STATUS_ACTIVE

        if inspection.target_stage and inspection.result in [SiteInspection.RESULT_PASS, SiteInspection.RESULT_CONDITIONAL]:
            from apps.stands.services import StageHistoryService

            StageHistoryService.create(
                stand=stand,
                from_stage=stand.current_stage,
                to_stage=inspection.target_stage,
                reason=f'Inspection approved stage progression: {inspection.result}',
                created_by=inspector,
                updated_by=inspector,
                changed_by=inspector,
            )

        stand.updated_by = inspector
        stand.save()

        NotificationService.notify(
            module='site_inspections',
            action='Create',
            description=f'Site inspection for {stand.code} recorded.',
            user=inspector,
        )

        return inspection

    @staticmethod
    @transaction.atomic
    def update(inspection, **kwargs):
        for key, value in kwargs.items():
            setattr(inspection, key, value)
        inspection.save()
        NotificationService.notify(
            module='site_inspections',
            action='Update',
            description=f'Site inspection for {inspection.stand.code} updated.',
            user=inspection.updated_by,
        )
        return inspection

    @staticmethod
    @transaction.atomic
    def soft_delete(inspection, deleted_by=None):
        inspection.is_deleted = True
        inspection.is_active = False
        if deleted_by is not None:
            inspection.updated_by = deleted_by
        inspection.save()
