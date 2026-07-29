from rest_framework import serializers

from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for enterprise department data."""

    class Meta:
        model = Department
        fields = (
            'id',
            'department_name',
            'department_code',
            'description',
            'head_of_department',
            'email',
            'phone',
            'office_location',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
