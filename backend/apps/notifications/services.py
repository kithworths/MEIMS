from common.services.base import BaseService

from .models import Notification


class NotificationService(BaseService):
    @staticmethod
    def create_notification(user, title, message, category='System', priority='Medium', source_module='', source_action='', source_url='', metadata=None):
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            category=category,
            priority=priority,
            source_module=source_module,
            source_action=source_action,
            source_url=source_url,
            metadata=metadata or {},
        )
