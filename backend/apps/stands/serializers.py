from rest_framework import serializers

from apps.projects.models import Project
from .models import Stand, StandStage, StandStageTransition, StageHistory
from .services import StageHistoryService
from .validators import validate_stage_code, validate_stand_code


class StandStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandStage
        fields = (
            'id',
            'code',
            'name',
            'description',
            'ordinal',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    code = serializers.CharField(validators=[validate_stage_code])

    def validate(self, attrs):
        if 'name' in attrs and not attrs['name'].strip():
            raise serializers.ValidationError({'name': 'Stand stage name is required.'})
        return attrs


class StandSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.filter(is_deleted=False)
    )
    current_stage = serializers.PrimaryKeyRelatedField(
        queryset=StandStage.objects.filter(is_deleted=False),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Stand
        fields = (
            'id',
            'project',
            'code',
            'name',
            'description',
            'stand_type',
            'current_stage',
            'gis_location_id',
            'address',
            'area_sq_m',
            'status',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    code = serializers.CharField(validators=[validate_stand_code])

    def validate(self, attrs):
        area = attrs.get('area_sq_m')
        if area is not None and area <= 0:
            raise serializers.ValidationError({'area_sq_m': 'Area must be a positive number.'})
        return attrs


class StageHistorySerializer(serializers.ModelSerializer):
        stand = serializers.PrimaryKeyRelatedField(
            queryset=Stand.objects.filter(is_deleted=False)
        )
        from_stage = serializers.PrimaryKeyRelatedField(
            queryset=StandStage.objects.filter(is_deleted=False)
        )
        to_stage = serializers.PrimaryKeyRelatedField(
            queryset=StandStage.objects.filter(is_deleted=False)
        )
        is_override = serializers.BooleanField(default=False)

        class Meta:
            model = StageHistory
            fields = (
                'id',
                'stand',
                'from_stage',
                'to_stage',
                'changed_by',
                'changed_at',
                'reason',
                'is_override',
                'is_active',
                'is_deleted',
                'created_at',
                'updated_at',
                'created_by',
                'updated_by',
            )
            read_only_fields = (
                'id',
                'changed_by',
                'changed_at',
                'created_at',
                'updated_at',
                'created_by',
                'updated_by',
            )

        def validate(self, attrs):
            stand = attrs.get('stand') or getattr(self.instance, 'stand', None)
            from_stage = attrs.get('from_stage') or getattr(self.instance, 'from_stage', None)
            to_stage = attrs.get('to_stage') or getattr(self.instance, 'to_stage', None)
            is_override = attrs.get('is_override', False) or getattr(self.instance, 'is_override', False)
            reason = attrs.get('reason') or getattr(self.instance, 'reason', '')

            if from_stage and to_stage and from_stage == to_stage:
                raise serializers.ValidationError({'to_stage': 'Stage history transition must move to a different stage.'})

            if is_override and not reason:
                raise serializers.ValidationError({'reason': 'Reason is required for override stage history entries.'})

            if stand and from_stage and to_stage and not is_override:
                if stand.current_stage and stand.current_stage != from_stage:
                    raise serializers.ValidationError({'from_stage': 'Stand current stage must match from_stage unless override is used.'})

                if not StandStageTransition.objects.filter(
                    from_stage=from_stage,
                    to_stage=to_stage,
                    is_active=True,
                    is_deleted=False,
                ).exists():
                    raise serializers.ValidationError({'non_field_errors': 'This transition is not allowed by the configured workflow.'})

            return attrs

        def create(self, validated_data):
            return StageHistoryService.create(**validated_data)


class StandStageTransitionSerializer(serializers.ModelSerializer):
    from_stage = serializers.PrimaryKeyRelatedField(
        queryset=StandStage.objects.filter(is_deleted=False)
    )
    to_stage = serializers.PrimaryKeyRelatedField(
        queryset=StandStage.objects.filter(is_deleted=False)
    )

    class Meta:
        model = StandStageTransition
        fields = (
            'id',
            'from_stage',
            'to_stage',
            'requires_approval',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def validate(self, attrs):
        from_stage = attrs.get('from_stage') or getattr(self.instance, 'from_stage', None)
        to_stage = attrs.get('to_stage') or getattr(self.instance, 'to_stage', None)

        if from_stage and to_stage and from_stage == to_stage:
            raise serializers.ValidationError({'to_stage': 'Transition must move to a different stage.'})

        if not self.instance and from_stage and to_stage:
            if StandStageTransition.objects.filter(
                from_stage=from_stage,
                to_stage=to_stage,
                is_deleted=False,
            ).exists():
                raise serializers.ValidationError(
                    'A transition already exists for the selected stages.'
                )

        return attrs
