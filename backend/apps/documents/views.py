from rest_framework.decorators import action

from common.utils.api_response import error_response, success_response
from common.views import BaseModelViewSet

from .filters import AttachmentFilter, DocumentFilter, PlanFilter
from .models import Attachment, Document, DocumentVersion, Plan, PlanVersion
from .permissions import AttachmentPermissions, DocumentPermissions, PlanPermissions
from .serializers import (
    AttachmentSerializer,
    DocumentSerializer,
    DocumentVersionSerializer,
    PlanSerializer,
    PlanVersionSerializer,
)
from .services import AttachmentService, DocumentService, PlanService


class DocumentViewSet(BaseModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [DocumentPermissions]
    permission_module = 'documents'
    filterset_class = DocumentFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        document = self.get_object()
        DocumentService.lock(document, request.user)
        return success_response(message='Document locked.')

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        document = self.get_object()
        DocumentService.unlock(document, request.user)
        return success_response(message='Document unlocked.')


class DocumentVersionViewSet(BaseModelViewSet):
    queryset = DocumentVersion.objects.select_related('document').all()
    serializer_class = DocumentVersionSerializer
    permission_classes = [DocumentPermissions]
    permission_module = 'documents'
    search_fields = ['document__title', 'version_notes']
    ordering_fields = ['version_number', 'created_at']
    ordering = ['-version_number']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Document versions are immutable.'}, message='Update not allowed.', status_code=405)

    def partial_update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Document versions are immutable.'}, message='Partial update not allowed.', status_code=405)

    def destroy(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Document versions are immutable.'}, message='Delete not allowed.', status_code=405)


class AttachmentViewSet(BaseModelViewSet):
    queryset = Attachment.objects.select_related('content_type').all()
    serializer_class = AttachmentSerializer
    permission_classes = [AttachmentPermissions]
    permission_module = 'attachments'
    filterset_class = AttachmentFilter
    search_fields = ['description', 'file']
    ordering_fields = ['created_at', 'size_bytes']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Attachments are immutable once stored.'}, message='Update not allowed.', status_code=405)

    def partial_update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Attachments are immutable once stored.'}, message='Partial update not allowed.', status_code=405)

    def destroy(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Attachments are immutable once stored.'}, message='Delete not allowed.', status_code=405)


class PlanViewSet(BaseModelViewSet):
    queryset = Plan.objects.prefetch_related('linked_documents').all()
    serializer_class = PlanSerializer
    permission_classes = [PlanPermissions]
    permission_module = 'plans'
    filterset_class = PlanFilter
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(updated_by=user)


class PlanVersionViewSet(BaseModelViewSet):
    queryset = PlanVersion.objects.select_related('plan').all()
    serializer_class = PlanVersionSerializer
    permission_classes = [PlanPermissions]
    permission_module = 'plans'
    search_fields = ['plan__code', 'version_notes']
    ordering_fields = ['version_number', 'created_at']
    ordering = ['-version_number']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        serializer.save(created_by=user, updated_by=user)

    def update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Plan versions are immutable.'}, message='Update not allowed.', status_code=405)

    def partial_update(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Plan versions are immutable.'}, message='Partial update not allowed.', status_code=405)

    def destroy(self, request, *args, **kwargs):
        return error_response(errors={'detail': 'Plan versions are immutable.'}, message='Delete not allowed.', status_code=405)
