from rest_framework.decorators import action

from common.views import BaseModelViewSet
from common.utils.api_response import error_response, success_response
from .filters import (
    EngineerTicketFilter,
    EngineerTicketHistoryFilter,
    ProjectTaskFilter,
    ServiceTypeFilter,
    SiteInspectionFilter,
    SiteVisitFilter,
    TaskHistoryFilter,
)
from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    ServiceType,
    SiteInspection,
    SiteVisit,
    TaskHistory,
)
from .permissions import (
    EngineerTicketHistoryPermissions,
    EngineerTicketPermissions,
    ProjectTaskPermissions,
    ServiceTypePermissions,
    SiteInspectionPermissions,
    SiteVisitPermissions,
    TaskHistoryPermissions,
)
from .serializers import (
    EngineerTicketHistorySerializer,
    EngineerTicketSerializer,
    ProjectTaskSerializer,
    ServiceTypeSerializer,
    SiteInspectionSerializer,
    SiteVisitSerializer,
    TaskHistorySerializer,
)
from .services import EngineerTicketService, ProjectTaskService, ServiceTypeService, SiteInspectionService, SiteVisitService


class ServiceTypeViewSet(BaseModelViewSet):
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [ServiceTypePermissions]
    permission_module = 'service_types'
    filterset_class = ServiceTypeFilter
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        service_type = self.get_object()
        ServiceTypeService.soft_delete(service_type, deleted_by=request.user)
        return success_response(message='Service type soft-deleted.')


class ProjectTaskViewSet(BaseModelViewSet):
    queryset = ProjectTask.objects.select_related('project', 'stand', 'service_type', 'assignee', 'parent_task').all()
    serializer_class = ProjectTaskSerializer
    permission_classes = [ProjectTaskPermissions]
    permission_module = 'project_tasks'
    filterset_class = ProjectTaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['planned_start_date', 'planned_end_date', 'priority', 'status']
    ordering = ['-planned_start_date']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        task = self.get_object()
        from .services import ProjectTaskService

        ProjectTaskService.soft_delete(task, deleted_by=request.user)
        return success_response(message='Project task soft-deleted.')


class TaskHistoryViewSet(BaseModelViewSet):
    queryset = TaskHistory.objects.select_related('task', 'changed_by', 'previous_assignee', 'new_assignee').all()
    serializer_class = TaskHistorySerializer
    permission_classes = [TaskHistoryPermissions]
    permission_module = 'task_histories'
    filterset_class = TaskHistoryFilter
    search_fields = ['task__title', 'notes']
    ordering_fields = ['changed_at', 'created_at']
    ordering = ['-changed_at']
    http_method_names = ['get', 'post', 'head', 'options']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user, changed_by=user)

    def update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Task history records are immutable.'}, message='Updates are not allowed.', status_code=405)

    def partial_update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Task history records are immutable.'}, message='Updates are not allowed.', status_code=405)

    def destroy(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Task history records are immutable.'}, message='Deletes are not allowed.', status_code=405)


class EngineerTicketViewSet(BaseModelViewSet):
    queryset = EngineerTicket.objects.select_related('project', 'stand', 'service_type', 'reporter', 'assignee').all()
    serializer_class = EngineerTicketSerializer
    permission_classes = [EngineerTicketPermissions]
    permission_module = 'engineer_tickets'
    filterset_class = EngineerTicketFilter
    search_fields = ['title', 'description']
    ordering_fields = ['opened_at', 'status', 'priority']
    ordering = ['-opened_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        ticket = self.get_object()
        from .services import EngineerTicketService

        EngineerTicketService.soft_delete(ticket, deleted_by=request.user)
        return success_response(message='Engineer ticket soft-deleted.')


class EngineerTicketHistoryViewSet(BaseModelViewSet):
    queryset = EngineerTicketHistory.objects.select_related('ticket', 'changed_by', 'previous_assignee', 'new_assignee').all()
    serializer_class = EngineerTicketHistorySerializer
    permission_classes = [EngineerTicketHistoryPermissions]
    permission_module = 'engineer_ticket_histories'
    filterset_class = EngineerTicketHistoryFilter
    search_fields = ['ticket__title', 'notes']
    ordering_fields = ['changed_at', 'created_at']
    ordering = ['-changed_at']
    http_method_names = ['get', 'post', 'head', 'options']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user, changed_by=user)

    def update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Engineer ticket history records are immutable.'}, message='Updates are not allowed.', status_code=405)

    def partial_update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Engineer ticket history records are immutable.'}, message='Updates are not allowed.', status_code=405)

    def destroy(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Engineer ticket history records are immutable.'}, message='Deletes are not allowed.', status_code=405)


class SiteVisitViewSet(BaseModelViewSet):
    queryset = SiteVisit.objects.select_related('stand', 'engineer').all()
    serializer_class = SiteVisitSerializer
    permission_classes = [SiteVisitPermissions]
    permission_module = 'site_visits'
    filterset_class = SiteVisitFilter
    search_fields = ['stand__code', 'notes']
    ordering_fields = ['scheduled_start', 'scheduled_end', 'status']
    ordering = ['scheduled_start']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        visit = self.get_object()
        from .services import SiteVisitService

        SiteVisitService.soft_delete(visit, deleted_by=request.user)
        return success_response(message='Site visit soft-deleted.')


class SiteInspectionViewSet(BaseModelViewSet):
    queryset = SiteInspection.objects.select_related('stand', 'inspector', 'target_stage', 'follow_up_ticket').all()
    serializer_class = SiteInspectionSerializer
    permission_classes = [SiteInspectionPermissions]
    permission_module = 'site_inspections'
    filterset_class = SiteInspectionFilter
    search_fields = ['stand__code', 'comments']
    ordering_fields = ['inspection_date', 'result']
    ordering = ['-inspection_date']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        inspection = self.get_object()
        from .services import SiteInspectionService

        SiteInspectionService.soft_delete(inspection, deleted_by=request.user)
        return success_response(message='Site inspection soft-deleted.')
