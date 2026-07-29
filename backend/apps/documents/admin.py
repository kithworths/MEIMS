from django.contrib import admin

from .models import Attachment, Document, DocumentVersion, Plan, PlanVersion


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_locked', 'created_at', 'is_active')
    search_fields = ('title', 'description')
    list_filter = ('is_locked', 'is_active')


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ('document', 'version_number', 'file_checksum', 'mime_type', 'size_bytes')
    search_fields = ('document__title',)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('content_type', 'object_id', 'file_checksum', 'mime_type', 'virus_scan_status')
    search_fields = ('file', 'description')
    list_filter = ('virus_scan_status',)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'status', 'created_at', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('status',)


@admin.register(PlanVersion)
class PlanVersionAdmin(admin.ModelAdmin):
    list_display = ('plan', 'version_number', 'file_checksum', 'size_bytes')
    search_fields = ('plan__code',)
