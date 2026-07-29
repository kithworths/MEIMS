from django.contrib import admin

from .models import (
    EngineerTicket,
    EngineerTicketHistory,
    ProjectTask,
    ServiceType,
    SiteInspection,
    SiteVisit,
    TaskHistory,
)


@admin.register(ServiceType)
class ServiceTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'is_deleted')
    search_fields = ('code', 'name', 'description')
    list_filter = ('is_active', 'is_deleted')
    ordering = ('code',)


@admin.register(ProjectTask)
class ProjectTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'stand', 'assignee', 'status', 'priority', 'is_active', 'is_deleted')
    search_fields = ('title', 'description', 'project__code', 'stand__code')
    list_filter = ('status', 'priority', 'is_active', 'is_deleted')
    ordering = ('-planned_start_date', 'title')


@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ('task', 'changed_by', 'changed_at', 'new_status', 'new_priority', 'is_active', 'is_deleted')
    search_fields = ('task__title', 'notes')
    list_filter = ('is_active', 'is_deleted')
    ordering = ('-changed_at',)


@admin.register(EngineerTicket)
class EngineerTicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'stand', 'assignee', 'status', 'priority', 'is_active', 'is_deleted')
    search_fields = ('title', 'description', 'project__code', 'stand__code')
    list_filter = ('status', 'priority', 'is_active', 'is_deleted')
    ordering = ('-opened_at',)


@admin.register(EngineerTicketHistory)
class EngineerTicketHistoryAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'changed_by', 'changed_at', 'new_status', 'new_priority', 'is_active', 'is_deleted')
    search_fields = ('ticket__title', 'notes')
    list_filter = ('is_active', 'is_deleted')
    ordering = ('-changed_at',)


@admin.register(SiteVisit)
class SiteVisitAdmin(admin.ModelAdmin):
    list_display = ('stand', 'engineer', 'scheduled_start', 'scheduled_end', 'status', 'is_active', 'is_deleted')
    search_fields = ('stand__code', 'engineer__email', 'notes')
    list_filter = ('status', 'is_active', 'is_deleted')
    ordering = ('scheduled_start',)


@admin.register(SiteInspection)
class SiteInspectionAdmin(admin.ModelAdmin):
    list_display = ('stand', 'inspector', 'inspection_date', 'result', 'target_stage', 'is_active', 'is_deleted')
    search_fields = ('stand__code', 'inspector__email', 'comments')
    list_filter = ('result', 'is_active', 'is_deleted')
    ordering = ('-inspection_date',)
