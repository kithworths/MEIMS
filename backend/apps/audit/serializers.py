from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', default='', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_roles = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'user_roles',
            'module',
            'action',
            'description',
            'object_type',
            'object_id',
            'old_value',
            'new_value',
            'ip_address',
            'browser',
            'request_method',
            'timestamp',
        ]

    def get_user_name(self, obj: AuditLog) -> str:
        return obj.user.get_full_name() if obj.user else ''

    def get_user_roles(self, obj: AuditLog) -> list[str]:
        if not obj.user:
            return []

        prefetched = getattr(obj.user, '_prefetched_objects_cache', {})
        roles = prefetched.get('roles')
        if roles is not None:
            return [role.name for role in roles if role.is_active]

        return list(obj.user.roles.filter(is_active=True).values_list('name', flat=True))
