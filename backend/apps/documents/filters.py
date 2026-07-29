import django_filters

from .models import Attachment, Document, Plan


class DocumentFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    is_locked = django_filters.BooleanFilter(field_name='is_locked')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Document
        fields = ['title', 'is_locked']


class AttachmentFilter(django_filters.FilterSet):
    content_type = django_filters.CharFilter(field_name='content_type__model', lookup_expr='iexact')
    object_id = django_filters.UUIDFilter(field_name='object_id')
    virus_scan_status = django_filters.CharFilter(field_name='virus_scan_status', lookup_expr='iexact')

    class Meta:
        model = Attachment
        fields = ['content_type', 'object_id', 'virus_scan_status']


class PlanFilter(django_filters.FilterSet):
    code = django_filters.CharFilter(field_name='code', lookup_expr='icontains')
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')

    class Meta:
        model = Plan
        fields = ['code', 'name', 'status']
