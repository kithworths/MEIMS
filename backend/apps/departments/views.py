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
