from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from common.views import BaseModelViewSet
from common.utils.api_response import success_response
from .models import Notification
from .permissions import NotificationPermissions
from .serializers import NotificationSerializer


class NotificationViewSet(BaseModelViewSet):
    queryset = Notification.objects.select_related('user').all()
    serializer_class = NotificationSerializer
    permission_classes = [NotificationPermissions]
    permission_module = 'notifications'
    search_fields = ['title', 'message', 'category', 'priority', 'source_module', 'source_action']
    ordering_fields = ['created_at', 'priority', 'category']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset().filter(user=user)
        if self.request.query_params.get('archived') is not None:
            archived = self.request.query_params.get('archived').lower() in ['1', 'true', 'yes']
            qs = qs.filter(is_archived=archived)
        else:
            qs = qs.filter(is_archived=False)

        if self.request.query_params.get('unread') is not None:
            unread = self.request.query_params.get('unread').lower() in ['1', 'true', 'yes']
            qs = qs.filter(is_read=not unread)

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        updated_count = notifications.update(is_read=True)
        return success_response(data={'updated': updated_count}, message='All notifications marked as read.')

    @action(detail=False, methods=['post'])
    def archive_all(self, request):
        notifications = self.get_queryset().filter(is_archived=False)
        updated_count = notifications.update(is_archived=True)
        return success_response(data={'updated': updated_count}, message='All notifications archived.')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read', 'updated_at'])
        serializer = self.get_serializer(notification)
        return success_response(data=serializer.data, message='Notification marked as read.')

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        notification = self.get_object()
        notification.is_archived = True
        notification.save(update_fields=['is_archived', 'updated_at'])
        serializer = self.get_serializer(notification)
        return success_response(data=serializer.data, message='Notification archived.')
