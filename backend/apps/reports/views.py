import io
import csv
import uuid
from datetime import datetime

from django.core.files.base import ContentFile
from django.db.models import Count
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.response import Response

from common.views import BaseModelViewSet
from common.utils.api_response import success_response, error_response
from .models import Report
from .serializers import ReportSerializer, ReportCreateSerializer


class ReportViewSet(BaseModelViewSet):
    queryset = Report.objects.all().select_related('generated_by')
    serializer_class = ReportSerializer
    permission_module = 'reports'
    search_fields = ['report_name', 'report_type']
    ordering_fields = ['created_at', 'report_type']
    ordering = ['-created_at']

    def get_permissions(self):
        # Defer to BaseModelViewSet which resolves permission classes by permission_module
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Create report record in pending state
        report = Report.objects.create(
            report_name=data['report_name'],
            report_type=data['report_type'],
            params={
                'start_date': str(data.get('start_date')) if data.get('start_date') else None,
                'end_date': str(data.get('end_date')) if data.get('end_date') else None,
                'department_id': str(data.get('department_id')) if data.get('department_id') else None,
                'extra': data.get('extra'),
            },
            format=data['format'],
            generated_by=request.user,
            status=Report.STATUS_PENDING,
        )

        try:
            if data['format'] != Report.FORMAT_CSV:
                # For now only CSV generation is implemented
                raise NotImplementedError('Only CSV export is currently supported by the reporting engine.')

            csv_content = self._generate_csv(data['report_type'], data)
            filename = f"report_{data['report_type']}_{uuid.uuid4().hex[:8]}.csv"
            report.file.save(filename, ContentFile(csv_content.getvalue().encode('utf-8')))
            report.status = Report.STATUS_COMPLETED
            report.save(update_fields=['file', 'status', 'updated_at'])
            serializer_out = ReportSerializer(report, context={'request': request})
            return success_response(data=serializer_out.data, message='Report generated successfully.')

        except NotImplementedError as e:
            report.status = Report.STATUS_FAILED
            report.error_message = str(e)
            report.save(update_fields=['status', 'error_message', 'updated_at'])
            return error_response(message=str(e), code=status.HTTP_501_NOT_IMPLEMENTED)

        except Exception as e:  # pragma: no cover - unexpected errors
            report.status = Report.STATUS_FAILED
            report.error_message = str(e)
            report.save(update_fields=['status', 'error_message', 'updated_at'])
            return error_response(message='Report generation failed: ' + str(e), code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _generate_csv(self, report_type: str, params) -> io.StringIO:
        """Generate a CSV in-memory for the given report type."""
        output = io.StringIO()
        writer = csv.writer(output)

        start_date = params.get('start_date')
        end_date = params.get('end_date')
        department_id = params.get('department_id')

        if report_type == 'project':
            from apps.projects.models import Project

            qs = Project.objects.filter(is_deleted=False, is_active=True)
            if start_date:
                qs = qs.filter(start_date__gte=start_date)
            if end_date:
                qs = qs.filter(start_date__lte=end_date)
            if department_id:
                # Projects may reference department in metadata; attempt simple filter if possible
                qs = qs.filter(metadata__department_id=department_id)

            writer.writerow(['project_id', 'code', 'name', 'status', 'start_date', 'planned_end_date', 'actual_end_date', 'budget_total', 'currency'])
            for p in qs:
                writer.writerow([
                    str(p.id),
                    p.code,
                    p.name,
                    p.status,
                    p.start_date.isoformat() if p.start_date else '',
                    p.planned_end_date.isoformat() if p.planned_end_date else '',
                    p.actual_end_date.isoformat() if p.actual_end_date else '',
                    f"{p.budget_total:.2f}" if p.budget_total is not None else '',
                    p.currency,
                ])
            return output

        if report_type == 'department':
            from apps.departments.models import Department
            from apps.projects.models import Project

            qs = Department.objects.filter()
            if department_id:
                qs = qs.filter(id=department_id)

            writer.writerow(['department_id', 'department_code', 'department_name', 'project_count'])
            for d in qs:
                project_count = Project.objects.filter(is_deleted=False, is_active=True, metadata__department_id=str(d.id)).count()
                writer.writerow([str(d.id), d.department_code, d.department_name, project_count])
            return output

        if report_type == 'finance':
            from apps.finance.models import Payment

            qs = Payment.objects.filter(is_deleted=False, is_active=True)
            if start_date:
                qs = qs.filter(payment_date__date__gte=start_date)
            if end_date:
                qs = qs.filter(payment_date__date__lte=end_date)
            if department_id:
                # try filter by project->metadata->department_id or payment notes
                qs = qs.filter(project__metadata__department_id=department_id)

            writer.writerow(['payment_id', 'reference', 'payment_type', 'amount', 'currency', 'status', 'payment_date', 'project_id', 'stand_id'])
            for pay in qs.select_related('project', 'stand'):
                writer.writerow([
                    str(pay.id),
                    pay.reference,
                    pay.payment_type,
                    f"{pay.amount:.2f}",
                    pay.currency,
                    pay.status,
                    pay.payment_date.isoformat() if pay.payment_date else '',
                    str(pay.project.id) if pay.project else '',
                    str(pay.stand.id) if pay.stand else '',
                ])
            return output

        if report_type == 'task':
            from apps.tasks.models import EngineerTicket

            qs = EngineerTicket.objects.all()
            if start_date:
                qs = qs.filter(created_at__date__gte=start_date)
            if end_date:
                qs = qs.filter(created_at__date__lte=end_date)

            writer.writerow(['id', 'title', 'project_id', 'stand_id', 'status', 'created_at', 'assignee_id', 'reporter_id'])
            for t in qs.select_related('project', 'stand', 'assignee', 'reporter'):
                writer.writerow([
                    str(t.id),
                    t.title,
                    str(t.project.id) if t.project else '',
                    str(t.stand.id) if t.stand else '',
                    t.status,
                    t.created_at.isoformat() if t.created_at else '',
                    str(t.assignee.id) if t.assignee else '',
                    str(t.reporter.id) if t.reporter else '',
                ])
            return output

        if report_type == 'gis':
            from apps.gis.models import GISLocation

            qs = GISLocation.objects.all()
            writer.writerow(['id', 'name', 'feature_type', 'wkt', 'related_project_id'])
            for loc in qs:
                writer.writerow([
                    str(loc.id),
                    loc.name,
                    loc.feature_type,
                    loc.geometry.wkt if loc.geometry else '',
                    str(getattr(loc, 'project_id', '')),
                ])
            return output

        if report_type == 'audit':
            from apps.audit.models import AuditLog

            qs = AuditLog.objects.all()
            if start_date:
                qs = qs.filter(created_at__date__gte=start_date)
            if end_date:
                qs = qs.filter(created_at__date__lte=end_date)

            writer.writerow(['id', 'actor_id', 'action', 'object_type', 'object_id', 'timestamp', 'data'])
            for a in qs:
                writer.writerow([
                    str(a.id),
                    str(a.actor_id) if a.actor_id else '',
                    a.action,
                    a.object_type,
                    str(a.object_id) if a.object_id else '',
                    a.created_at.isoformat() if a.created_at else '',
                    a.data if a.data else '',
                ])
            return output

        # Unknown report
        raise ValueError('Unknown report type: ' + report_type)