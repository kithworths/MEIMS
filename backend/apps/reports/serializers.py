from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id',
            'report_name',
            'report_type',
            'params',
            'format',
            'file_url',
            'status',
            'error_message',
            'generated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'file_url', 'status', 'error_message', 'generated_by', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        if obj.file:
            return obj.file.url
        return None


class ReportCreateSerializer(serializers.Serializer):
    report_name = serializers.CharField(max_length=255)
    report_type = serializers.ChoiceField(choices=[
        ('project', 'Project'),
        ('department', 'Department'),
        ('finance', 'Finance'),
        ('task', 'Task'),
        ('gis', 'GIS'),
        ('audit', 'Audit'),
    ])
    format = serializers.ChoiceField(choices=[('csv', 'CSV'), ('xlsx', 'Excel'), ('pdf', 'PDF')], default='csv')
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    department_id = serializers.UUIDField(required=False, allow_null=True)
    extra = serializers.JSONField(required=False, allow_null=True)

    def validate(self, data):
        # basic validations
        start = data.get('start_date')
        end = data.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError('start_date must be <= end_date')
        return data