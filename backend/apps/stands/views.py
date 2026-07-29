from rest_framework.decorators import action

from common.views import BaseModelViewSet
from common.utils.api_response import error_response, success_response
from .permissions import (
    StandPermissions,
    StandStagePermissions,
    StandStageTransitionPermissions,
    StageHistoryPermissions,
)

from .models import StageHistory, Stand, StandStage, StandStageTransition
from .serializers import (
    StandSerializer,
    StandStageSerializer,
    StandStageTransitionSerializer,
    StageHistorySerializer,
)
from .filters import (
    StandFilter,
    StandStageFilter,
    StandStageTransitionFilter,
    StageHistoryFilter,
)
from .services import (
    StandService,
    StandStageService,
    StandStageTransitionService,
    StageHistoryService,
)


class StandStageViewSet(BaseModelViewSet):
    queryset = StandStage.objects.all()
    serializer_class = StandStageSerializer
    permission_classes = [StandStagePermissions]
    permission_module = 'standstages'
    filterset_class = StandStageFilter
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['ordinal', 'name', 'code']
    ordering = ['ordinal', 'name']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        stage = self.get_object()
        StandStageService.soft_delete(stage, deleted_by=request.user)
        return success_response(message='Stand stage soft-deleted.')


class StandStageTransitionViewSet(BaseModelViewSet):
    queryset = StandStageTransition.objects.select_related('from_stage', 'to_stage').all()
    serializer_class = StandStageTransitionSerializer
    permission_classes = [StandStageTransitionPermissions]
    permission_module = 'standstage_transitions'
    filterset_class = StandStageTransitionFilter
    search_fields = ['from_stage__name', 'to_stage__name']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        transition = self.get_object()
        StandStageTransitionService.soft_delete(transition, deleted_by=request.user)
        return success_response(message='Stand stage transition soft-deleted.')


class StandViewSet(BaseModelViewSet):
    queryset = Stand.objects.select_related('project', 'current_stage').all()
    serializer_class = StandSerializer
    permission_classes = [StandPermissions]
    permission_module = 'stands'
    filterset_class = StandFilter
    search_fields = ['name', 'code', 'description', 'address', 'stand_type']
    ordering_fields = ['created_at', 'updated_at', 'name', 'area_sq_m']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        stand = self.get_object()
        try:
            StandService.soft_delete(stand, deleted_by=request.user)
        except ValueError as error:
            return error_response(errors={'detail': str(error)}, message=str(error), status_code=400)
        return success_response(message='Stand soft-deleted.')


class StageHistoryViewSet(BaseModelViewSet):
    queryset = StageHistory.objects.select_related('stand', 'from_stage', 'to_stage', 'changed_by').all()
    serializer_class = StageHistorySerializer
    permission_classes = [StageHistoryPermissions]
    permission_module = 'stagehistories'
    filterset_class = StageHistoryFilter
    search_fields = ['stand__code', 'from_stage__name', 'to_stage__name', 'reason']
    ordering_fields = ['changed_at', 'created_at', 'updated_at']
    ordering = ['-changed_at']
    http_method_names = ['get', 'post', 'head', 'options']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(
            created_by=user,
            updated_by=user,
            changed_by=user,
        )

    def update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Stage history records are immutable.'}, message='Updates are not allowed.', status_code=405)

    def partial_update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Stage history records are immutable.'}, message='Updates are not allowed.', status_code=405)

    def destroy(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Stage history records are immutable.'}, message='Deletes are not allowed.', status_code=405)
