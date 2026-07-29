from django.contrib import admin

from .models import GISLocation


@admin.register(GISLocation)
class GISLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'geometry_type', 'srid', 'created_at', 'is_active')
    search_fields = ('name', 'description')
    list_filter = ('geometry_type', 'srid', 'is_active')
