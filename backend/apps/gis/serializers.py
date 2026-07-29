from rest_framework import serializers

from .models import GISLocation


class GISLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GISLocation
        fields = (
            'id',
            'name',
            'description',
            'content_type',
            'object_id',
            'geometry_type',
            'srid',
            'geometry',
            'centroid',
            'bounding_box',
            'metadata',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'centroid',
            'bounding_box',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
