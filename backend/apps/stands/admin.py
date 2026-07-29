from django.contrib import admin

from .models import StageHistory, Stand, StandStage, StandStageTransition


@admin.register(StandStage)
class StandStageAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'ordinal', 'is_active', 'is_deleted')
    search_fields = ('code', 'name', 'description')
    list_filter = ('is_active', 'is_deleted')
    ordering = ('ordinal', 'code')


@admin.register(Stand)
class StandAdmin(admin.ModelAdmin):
    list_display = ('project', 'code', 'name', 'stand_type', 'current_stage', 'status', 'is_active', 'is_deleted')
    search_fields = ('project__code', 'code', 'name', 'description', 'address')
    list_filter = ('status', 'stand_type', 'is_active', 'is_deleted')
    ordering = ('project', 'code')


@admin.register(StageHistory)
class StageHistoryAdmin(admin.ModelAdmin):
    list_display = ('stand', 'from_stage', 'to_stage', 'changed_by', 'changed_at', 'is_override', 'is_active', 'is_deleted')
    search_fields = ('stand__code', 'from_stage__name', 'to_stage__name', 'reason')
    list_filter = ('is_override', 'is_active', 'is_deleted')
    ordering = ('-changed_at',)


@admin.register(StandStageTransition)
class StandStageTransitionAdmin(admin.ModelAdmin):
    list_display = ('from_stage', 'to_stage', 'requires_approval', 'is_active', 'is_deleted')
    search_fields = ('from_stage__name', 'to_stage__name')
    list_filter = ('requires_approval', 'is_active', 'is_deleted')
    ordering = ('from_stage', 'to_stage')
