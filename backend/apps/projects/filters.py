import django_filters
from django_filters.rest_framework import FilterSet

from .models import Project


class ProjectFilter(FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    code = django_filters.CharFilter(field_name='code', lookup_expr='iexact')
    start_date_after = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_before = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')

    class Meta:
        model = Project
        fields = ['status', 'code', 'start_date_after', 'start_date_before']
