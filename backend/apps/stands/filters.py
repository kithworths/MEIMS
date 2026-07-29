import django_filters
from django_filters.rest_framework import FilterSet

from .models import Stand, StandStage, StandStageTransition, StageHistory


class StandStageFilter(FilterSet):
    code = django_filters.CharFilter(field_name='code', lookup_expr='iexact')
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    ordinal = django_filters.NumberFilter(field_name='ordinal')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = StandStage
        fields = ['code', 'name', 'ordinal', 'is_active']


class StandStageTransitionFilter(FilterSet):
    from_stage = django_filters.UUIDFilter(field_name='from_stage__id')
    to_stage = django_filters.UUIDFilter(field_name='to_stage__id')
    requires_approval = django_filters.BooleanFilter(field_name='requires_approval')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = StandStageTransition
        fields = ['from_stage', 'to_stage', 'requires_approval', 'is_active']


class StandFilter(FilterSet):
    project = django_filters.UUIDFilter(field_name='project__id')
    code = django_filters.CharFilter(field_name='code', lookup_expr='iexact')
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    stand_type = django_filters.CharFilter(field_name='stand_type', lookup_expr='icontains')
    current_stage = django_filters.UUIDFilter(field_name='current_stage__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    is_active = django_filters.BooleanFilter(field_name='is_active')
    area_min = django_filters.NumberFilter(field_name='area_sq_m', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area_sq_m', lookup_expr='lte')

    class Meta:
        model = Stand
        fields = ['project', 'code', 'name', 'stand_type', 'current_stage', 'status', 'is_active', 'area_min', 'area_max']


class StageHistoryFilter(FilterSet):
    stand = django_filters.UUIDFilter(field_name='stand__id')
    from_stage = django_filters.UUIDFilter(field_name='from_stage__id')
    to_stage = django_filters.UUIDFilter(field_name='to_stage__id')
    changed_by = django_filters.UUIDFilter(field_name='changed_by__id')
    changed_at_after = django_filters.DateTimeFilter(field_name='changed_at', lookup_expr='gte')
    changed_at_before = django_filters.DateTimeFilter(field_name='changed_at', lookup_expr='lte')
    is_override = django_filters.BooleanFilter(field_name='is_override')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = StageHistory
        fields = ['stand', 'from_stage', 'to_stage', 'changed_by', 'changed_at_after', 'changed_at_before', 'is_override', 'is_active']
