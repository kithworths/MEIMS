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

        roles = obj.user.roles.filter(is_active=True).values_list('name', flat=True)
        return list(roles)
