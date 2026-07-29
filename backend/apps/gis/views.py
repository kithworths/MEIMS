from rest_framework.decorators import action

from common.utils.api_response import success_response
from common.views import BaseModelViewSet

from .filters import GISLocationFilter
from .models import GISLocation
from .permissions import GISLocationPermissions
from .serializers import GISLocationSerializer


class GISLocationViewSet(BaseModelViewSet):
    queryset = GISLocation.objects.all()
    serializer_class = GISLocationSerializer
    permission_classes = [GISLocationPermissions]
    permission_module = 'gis'
    filterset_class = GISLocationFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        location = self.get_object()
        location.is_deleted = True
        location.is_active = False
        location.updated_by = request.user
        location.save()
        return success_response(message='GIS location soft-deleted.')
