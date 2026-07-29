import django_filters
from django_filters.rest_framework import FilterSet

from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    ServiceType,
    SiteInspection,
    SiteVisit,
    TaskHistory,
)


class ServiceTypeFilter(FilterSet):
    code = django_filters.CharFilter(field_name='code', lookup_expr='iexact')
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = ServiceType
        fields = ['code', 'name', 'is_active']


class ProjectTaskFilter(FilterSet):
    project = django_filters.UUIDFilter(field_name='project__id')
    stand = django_filters.UUIDFilter(field_name='stand__id')
    service_type = django_filters.UUIDFilter(field_name='service_type__id')
    assignee = django_filters.UUIDFilter(field_name='assignee__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    priority = django_filters.CharFilter(field_name='priority', lookup_expr='iexact')
    planned_start_after = django_filters.DateFilter(field_name='planned_start_date', lookup_expr='gte')
    planned_end_before = django_filters.DateFilter(field_name='planned_end_date', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = ProjectTask
        fields = [
            'project',
            'stand',
            'service_type',
            'assignee',
            'status',
            'priority',
            'planned_start_after',
            'planned_end_before',
            'is_active',
        ]


class TaskHistoryFilter(FilterSet):
    task = django_filters.UUIDFilter(field_name='task__id')
    changed_by = django_filters.UUIDFilter(field_name='changed_by__id')
    changed_at_after = django_filters.DateTimeFilter(field_name='changed_at', lookup_expr='gte')
    changed_at_before = django_filters.DateTimeFilter(field_name='changed_at', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = TaskHistory
        fields = ['task', 'changed_by', 'changed_at_after', 'changed_at_before', 'is_active']


class EngineerTicketFilter(FilterSet):
    project = django_filters.UUIDFilter(field_name='project__id')
    stand = django_filters.UUIDFilter(field_name='stand__id')
    service_type = django_filters.UUIDFilter(field_name='service_type__id')
    assignee = django_filters.UUIDFilter(field_name='assignee__id')
    reporter = django_filters.UUIDFilter(field_name='reporter__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    priority = django_filters.CharFilter(field_name='priority', lookup_expr='iexact')
    opened_after = django_filters.DateTimeFilter(field_name='opened_at', lookup_expr='gte')
    opened_before = django_filters.DateTimeFilter(field_name='opened_at', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = EngineerTicket
        fields = [
            'project',
            'stand',
            'service_type',
            'assignee',
            'reporter',
            'status',
            'priority',
            'opened_after',
            'opened_before',
            'is_active',
        ]


class EngineerTicketHistoryFilter(FilterSet):
    ticket = django_filters.UUIDFilter(field_name='ticket__id')
    changed_by = django_filters.UUIDFilter(field_name='changed_by__id')
    changed_at_after = django_filters.DateTimeFilter(field_name='changed_at', lookup_expr='gte')
    changed_at_before = django_filters.DateTimeFilter(field_name='changed_at', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = EngineerTicketHistory
        fields = ['ticket', 'changed_by', 'changed_at_after', 'changed_at_before', 'is_active']


class SiteVisitFilter(FilterSet):
    stand = django_filters.UUIDFilter(field_name='stand__id')
    engineer = django_filters.UUIDFilter(field_name='engineer__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    scheduled_start_after = django_filters.DateTimeFilter(field_name='scheduled_start', lookup_expr='gte')
    scheduled_end_before = django_filters.DateTimeFilter(field_name='scheduled_end', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = SiteVisit
        fields = ['stand', 'engineer', 'status', 'scheduled_start_after', 'scheduled_end_before', 'is_active']


class SiteInspectionFilter(FilterSet):
    stand = django_filters.UUIDFilter(field_name='stand__id')
    inspector = django_filters.UUIDFilter(field_name='inspector__id')
    result = django_filters.CharFilter(field_name='result', lookup_expr='iexact')
    inspection_date_after = django_filters.DateTimeFilter(field_name='inspection_date', lookup_expr='gte')
    inspection_date_before = django_filters.DateTimeFilter(field_name='inspection_date', lookup_expr='lte')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = SiteInspection
        fields = ['stand', 'inspector', 'result', 'inspection_date_after', 'inspection_date_before', 'is_active']
