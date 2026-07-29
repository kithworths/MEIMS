from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'status', 'start_date', 'planned_end_date', 'is_active')
    search_fields = ('code', 'name', 'description')
    list_filter = ('status', 'is_active')
    ordering = ('-start_date', 'code')
