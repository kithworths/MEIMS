from rest_framework import serializers

from .models import Attachment, Document, DocumentVersion, Plan, PlanVersion
from .validators import validate_document_title, validate_plan_code


class DocumentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = (
            'id',
            'document',
            'version_number',
            'file',
            'file_checksum',
            'mime_type',
            'size_bytes',
            'metadata',
            'version_notes',
            'storage_backend',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'version_number',
            'file_checksum',
            'mime_type',
            'size_bytes',
            'storage_backend',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )


class DocumentSerializer(serializers.ModelSerializer):
    current_version = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Document
        fields = (
            'id',
            'title',
            'description',
            'metadata',
            'is_locked',
            'locked_by',
            'locked_at',
            'current_version',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'locked_at',
            'current_version',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )

    title = serializers.CharField(validators=[validate_document_title])


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = (
            'id',
            'content_type',
            'object_id',
            'file',
            'description',
            'file_checksum',
            'mime_type',
            'size_bytes',
            'virus_scan_status',
            'is_immutable',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'file_checksum',
            'mime_type',
            'size_bytes',
            'virus_scan_status',
            'is_immutable',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )


class PlanVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanVersion
        fields = (
            'id',
            'plan',
            'version_number',
            'file',
            'file_checksum',
            'mime_type',
            'size_bytes',
            'drawing_metadata',
            'spatial_metadata',
            'version_notes',
            'storage_backend',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'version_number',
            'file_checksum',
            'mime_type',
            'size_bytes',
            'storage_backend',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )


class PlanSerializer(serializers.ModelSerializer):
    current_version = serializers.PrimaryKeyRelatedField(read_only=True)
    linked_documents = serializers.PrimaryKeyRelatedField(queryset=Document.objects.filter(is_deleted=False), many=True, required=False)

    class Meta:
        model = Plan
        fields = (
            'id',
            'code',
            'name',
            'description',
            'project',
            'linked_documents',
            'current_version',
            'drawing_metadata',
            'spatial_metadata',
            'status',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active',
            'is_deleted',
        )
        read_only_fields = (
            'id',
            'current_version',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )

    code = serializers.CharField(validators=[validate_plan_code])
