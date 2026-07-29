import django_filters

from .models import GISLocation


class GISLocationFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    geometry_type = django_filters.CharFilter(field_name='geometry_type', lookup_expr='iexact')
    srid = django_filters.NumberFilter(field_name='srid')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = GISLocation
        fields = ['name', 'geometry_type', 'srid']
