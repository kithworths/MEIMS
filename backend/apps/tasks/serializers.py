from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.projects.models import Project
from apps.stands.models import Stand, StandStage
from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    ServiceType,
    SiteInspection,
    SiteVisit,
    TaskHistory,
)
from .services import EngineerTicketService, ProjectTaskService, SiteInspectionService
from .validators import validate_service_type_code, validate_task_title, validate_ticket_title

User = get_user_model()


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = (
            'id',
            'code',
            'name',
            'description',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    code = serializers.CharField(validators=[validate_service_type_code])

    def validate(self, attrs):
        name = attrs.get('name')
        if name is not None and not name.strip():
            raise serializers.ValidationError({'name': 'Service type name is required.'})
        return attrs


class ProjectTaskSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.filter(is_deleted=False))
    stand = serializers.PrimaryKeyRelatedField(queryset=Stand.objects.filter(is_deleted=False), required=False, allow_null=True)
    parent_task = serializers.PrimaryKeyRelatedField(queryset=ProjectTask.objects.filter(is_deleted=False), required=False, allow_null=True)
    service_type = serializers.PrimaryKeyRelatedField(queryset=ServiceType.objects.filter(is_deleted=False), required=False, allow_null=True)
    assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = ProjectTask
        fields = (
            'id',
            'project',
            'stand',
            'parent_task',
            'service_type',
            'assignee',
            'title',
            'description',
            'priority',
            'status',
            'estimated_hours',
            'spent_hours',
            'planned_start_date',
            'planned_end_date',
            'actual_start_date',
            'actual_end_date',
            'row_version',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    title = serializers.CharField(validators=[validate_task_title])

    def validate(self, attrs):
        if self.instance:
            if 'row_version' not in attrs:
                raise serializers.ValidationError({'row_version': 'Row version is required for optimistic locking.'})
        estimated = attrs.get('estimated_hours')
        spent = attrs.get('spent_hours')
        if estimated is not None and estimated < 0:
            raise serializers.ValidationError({'estimated_hours': 'Estimated hours must be non-negative.'})
        if spent is not None and spent < 0:
            raise serializers.ValidationError({'spent_hours': 'Spent hours must be non-negative.'})
        return attrs

    def create(self, validated_data):
        return ProjectTaskService.create(**validated_data)

    def update(self, instance, validated_data):
        expected_version = validated_data.pop('row_version', None)
        try:
            return ProjectTaskService.update(instance, expected_row_version=expected_version, **validated_data)
        except ValueError as exc:
            raise serializers.ValidationError({'row_version': str(exc)})


class TaskHistorySerializer(serializers.ModelSerializer):
    task = serializers.PrimaryKeyRelatedField(queryset=ProjectTask.objects.filter(is_deleted=False))
    changed_by = serializers.PrimaryKeyRelatedField(read_only=True)
    previous_assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)
    new_assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = TaskHistory
        fields = (
            'id',
            'task',
            'changed_by',
            'changed_at',
            'previous_status',
            'new_status',
            'previous_assignee',
            'new_assignee',
            'previous_priority',
            'new_priority',
            'previous_estimated_hours',
            'new_estimated_hours',
            'previous_spent_hours',
            'new_spent_hours',
            'notes',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = (
            'id',
            'changed_by',
            'changed_at',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )


class EngineerTicketSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.filter(is_deleted=False))
    stand = serializers.PrimaryKeyRelatedField(queryset=Stand.objects.filter(is_deleted=False), required=False, allow_null=True)
    service_type = serializers.PrimaryKeyRelatedField(queryset=ServiceType.objects.filter(is_deleted=False), required=False, allow_null=True)
    reporter = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)
    assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = EngineerTicket
        fields = (
            'id',
            'project',
            'stand',
            'service_type',
            'reporter',
            'assignee',
            'title',
            'description',
            'priority',
            'status',
            'opened_at',
            'resolved_at',
            'closed_at',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = (
            'id',
            'opened_at',
            'resolved_at',
            'closed_at',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )

    title = serializers.CharField(validators=[validate_ticket_title])

    def create(self, validated_data):
        return EngineerTicketService.create(**validated_data)

    def update(self, instance, validated_data):
        return EngineerTicketService.update(instance, **validated_data)


class EngineerTicketHistorySerializer(serializers.ModelSerializer):
    ticket = serializers.PrimaryKeyRelatedField(queryset=EngineerTicket.objects.filter(is_deleted=False))
    changed_by = serializers.PrimaryKeyRelatedField(read_only=True)
    previous_assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)
    new_assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = EngineerTicketHistory
        fields = (
            'id',
            'ticket',
            'changed_by',
            'changed_at',
            'previous_status',
            'new_status',
            'previous_assignee',
            'new_assignee',
            'previous_priority',
            'new_priority',
            'notes',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = (
            'id',
            'changed_by',
            'changed_at',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )


class SiteVisitSerializer(serializers.ModelSerializer):
    stand = serializers.PrimaryKeyRelatedField(queryset=Stand.objects.filter(is_deleted=False))
    engineer = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = SiteVisit
        fields = (
            'id',
            'stand',
            'engineer',
            'scheduled_start',
            'scheduled_end',
            'status',
            'reminder_minutes',
            'reminder_sent',
            'notes',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')


class SiteInspectionSerializer(serializers.ModelSerializer):
    stand = serializers.PrimaryKeyRelatedField(queryset=Stand.objects.filter(is_deleted=False))
    inspector = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), required=False, allow_null=True)
    target_stage = serializers.PrimaryKeyRelatedField(queryset=StandStage.objects.filter(is_deleted=False), required=False, allow_null=True)
    follow_up_ticket = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = SiteInspection
        fields = (
            'id',
            'stand',
            'inspector',
            'inspection_date',
            'checklist',
            'result',
            'comments',
            'target_stage',
            'follow_up_ticket',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'follow_up_ticket', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def validate(self, attrs):
        if attrs.get('result') == SiteInspection.RESULT_FAIL and not attrs.get('comments'):
            raise serializers.ValidationError({'comments': 'Comments are required for failed inspections.'})
        return attrs

    def create(self, validated_data):
        return SiteInspectionService.create(**validated_data)

    def update(self, instance, validated_data):
        return SiteInspectionService.update(instance, **validated_data)
