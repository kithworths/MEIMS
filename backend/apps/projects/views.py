from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from common.views import BaseModelViewSet
from common.utils.api_response import success_response, error_response
from common.permissions.drf import RoleBasedPermission

from .models import Project
from .serializers import ProjectSerializer
from .filters import ProjectFilter
from .services import ProjectService


class ProjectViewSet(BaseModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [RoleBasedPermission]
    permission_module = 'projects'
    filterset_class = ProjectFilter
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['start_date', 'planned_end_date', 'name']
    ordering = ['-start_date']

    def perform_create(self, serializer):
        # Set created_by/updated_by from context if provided (signals also handle this)
        request = self.request
        user = getattr(request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        request = self.request
        user = getattr(request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        project = self.get_object()
        ProjectService.soft_delete(project, deleted_by=request.user)
        return success_response(message='Project soft-deleted.')
