from csv import DictWriter
from io import StringIO

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.timezone import make_aware
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from common.views import BaseModelViewSet

from .models import AuditLog
from .permissions import AuditPermissions
from .serializers import AuditLogSerializer


class AuditLogViewSet(BaseModelViewSet):
    queryset = AuditLog.objects.select_related('user').prefetch_related('user__roles').all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, AuditPermissions]
    permission_module = 'audit'
    filterset_fields = ['module', 'action', 'request_method', 'object_type', 'object_id', 'ip_address']
    search_fields = [
        'module',
        'action',
        'description',
        'object_type',
        'object_id',
        'ip_address',
        'browser',
        'user__email',
    ]
    ordering_fields = ['timestamp', 'module', 'action', 'user__email', 'object_type']
    ordering = ['-timestamp']

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        start_date = params.get('start_date')
        end_date = params.get('end_date')
        role_name = params.get('role')

        if start_date:
            parsed = parse_datetime(start_date) or parse_date(start_date)
            if parsed:
                if hasattr(parsed, 'date') and not hasattr(parsed, 'hour'):
                    queryset = queryset.filter(timestamp__date=parsed)
                else:
                    queryset = queryset.filter(timestamp__gte=make_aware(parsed) if parsed.tzinfo is None else parsed)

        if end_date:
            parsed = parse_datetime(end_date) or parse_date(end_date)
            if parsed:
                if hasattr(parsed, 'date') and not hasattr(parsed, 'hour'):
                    queryset = queryset.filter(timestamp__date=parsed)
                else:
                    queryset = queryset.filter(timestamp__lte=make_aware(parsed) if parsed.tzinfo is None else parsed)

        if role_name:
            queryset = queryset.filter(user__roles__name__iexact=role_name)

        return queryset.distinct()

    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(60 * 5))
    def export(self, request):
        export_format = request.query_params.get('export_format', 'csv').lower()

        if export_format != 'csv':
            return Response({'detail': f'{export_format.upper()} export is not supported.'}, status=status.HTTP_501_NOT_IMPLEMENTED)

        queryset = self.filter_queryset(self.get_queryset())
        rows = queryset.order_by('-timestamp')[:1000]
        fieldnames = [
            'timestamp',
            'user_email',
            'user_name',
            'user_roles',
            'module',
            'action',
            'object_type',
            'object_id',
            'ip_address',
            'request_method',
            'description',
            'old_value',
            'new_value',
        ]

        csv_file = StringIO()
        writer = DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for audit in rows:
            writer.writerow(
                {
                    'timestamp': audit.timestamp.isoformat(),
                    'user_email': audit.user.email if audit.user else '',
                    'user_name': audit.user.get_full_name() if audit.user else '',
                    'user_roles': ','.join(audit.user.roles.filter(is_active=True).values_list('name', flat=True)) if audit.user else '',
                    'module': audit.module,
                    'action': audit.action,
                    'object_type': audit.object_type,
                    'object_id': audit.object_id,
                    'ip_address': audit.ip_address,
                    'request_method': audit.request_method,
                    'description': audit.description,
                    'old_value': audit.old_value if audit.old_value is not None else '',
                    'new_value': audit.new_value if audit.new_value is not None else '',
                }
            )

        response = HttpResponse(csv_file.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_export.csv"'
        return response

    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(60 * 5))
    def summary(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        action_counts = (
            queryset.values('action')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        daily_trend = (
            queryset.annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        role_counts = (
            queryset.values('user__roles__name')
            .annotate(count=Count('id'))
            .filter(user__roles__name__isnull=False)
            .order_by('-count')
        )

        return Response(
            {
                'actions': [
                    {'action': row['action'], 'count': row['count']} for row in action_counts
                ],
                'daily_trend': [
                    {'date': row['date'], 'count': row['count']} for row in daily_trend
                ],
                'roles': [
                    {'role': row['user__roles__name'], 'count': row['count']} for row in role_counts
                ],
            }
        )
