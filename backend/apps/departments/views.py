from csv import DictWriter
from io import StringIO

from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from common.views import BaseModelViewSet

from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(BaseModelViewSet):
    """REST API for managing departments."""

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_module = 'departments'
    filterset_fields = ['is_active']
    search_fields = [
        'department_name',
        'department_code',
        'head_of_department',
        'email',
        'office_location',
    ]
    ordering_fields = ['department_name', 'department_code', 'created_at']
    ordering = ['department_name']

    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(60 * 5))
    def export(self, request):
        """Export departments as CSV. Supports query filters and ordering."""
        export_format = request.query_params.get('export_format', 'csv').lower()

        if export_format != 'csv':
            return Response({'detail': f'{export_format.upper()} export is not supported.'}, status=status.HTTP_501_NOT_IMPLEMENTED)

        queryset = self.filter_queryset(self.get_queryset())
        rows = queryset.order_by(*self.ordering)[:5000]

        fieldnames = [
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
        ]

        csv_file = StringIO()
        writer = DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for dept in rows:
            writer.writerow(
                {
                    'id': str(dept.id),
                    'department_name': dept.department_name,
                    'department_code': dept.department_code,
                    'description': dept.description or '',
                    'head_of_department': dept.head_of_department or '',
                    'email': dept.email or '',
                    'phone': dept.phone or '',
                    'office_location': dept.office_location or '',
                    'is_active': str(dept.is_active),
                    'created_at': dept.created_at.isoformat() if dept.created_at else '',
                    'updated_at': dept.updated_at.isoformat() if dept.updated_at else '',
                }
            )

        response = HttpResponse(csv_file.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="departments_export.csv"'
        return response
