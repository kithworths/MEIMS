from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            'id',
            'code',
            'name',
            'description',
            'status',
            'start_date',
            'planned_end_date',
            'actual_end_date',
            'primary_service_type_id',
            'budget_total',
            'currency',
            'metadata',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def validate_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Project code is required.')
        # Basic pattern enforcement: uppercase letters, digits, -, _ allowed
        import re

        if not re.match(r'^[A-Z0-9_-]+$', value):
            raise serializers.ValidationError('Project code must be uppercase letters, numbers, dash or underscore.')
        return value

    def validate(self, attrs):
        start = attrs.get('start_date') or getattr(self.instance, 'start_date', None)
        planned = attrs.get('planned_end_date') or getattr(self.instance, 'planned_end_date', None)
        if start and planned and planned < start:
            raise serializers.ValidationError({'planned_end_date': 'Planned end date must be on/after start date.'})
        return attrs
