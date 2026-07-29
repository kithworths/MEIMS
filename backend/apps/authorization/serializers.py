from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Permission, Role


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for RBAC permission objects."""

    class Meta:
        model = Permission
        fields = (
            'id',
            'module',
            'action',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for RBAC roles with permission and user assignments."""

    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        required=False,
    )
    users = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=get_user_model().objects.all(),
        required=False,
    )

    class Meta:
        model = Role
        fields = (
            'id',
            'name',
            'description',
            'is_active',
            'permissions',
            'users',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
