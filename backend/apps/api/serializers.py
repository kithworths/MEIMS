from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .utils import validate_password_reset_token


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()
    timestamp = serializers.DateTimeField()
    version = serializers.CharField()
    uptime = serializers.FloatField()
    database = serializers.CharField()
    cache = serializers.CharField()
    storage = serializers.CharField()
    redis = serializers.CharField()
    celery = serializers.CharField()
    migrations = serializers.CharField(required=False)
    environment = serializers.JSONField(required=False)
    memory = serializers.CharField(required=False)
    cpu = serializers.CharField(required=False)
    disk_usage = serializers.JSONField(required=False)
    build_hash = serializers.CharField(required=False)
    postgresql = serializers.CharField(required=False)
    postgis = serializers.CharField(required=False)
    response_time_ms = serializers.FloatField(required=False)
    runtime = serializers.JSONField(required=False)


class ApiRootSerializer(serializers.Serializer):
    service = serializers.CharField()
    status = serializers.CharField()
    message = serializers.CharField()


class AuthTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for obtaining JWT tokens with user profile data."""

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'employee_number': user.employee_number,
        }
        return data


class LogoutSerializer(serializers.Serializer):
    """Serializer for logging out a user by invalidating refresh tokens."""

    refresh = serializers.CharField()

    def validate(self, attrs):
        token = attrs['refresh']
        try:
            self.token = self.token_class(token)
        except TokenError as exc:
            raise InvalidToken(_('Invalid refresh token.')) from exc
        return attrs

    @property
    def token_class(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        return RefreshToken


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for returning authenticated user profile information."""

    class Meta:
        model = get_user_model()
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'phone_number',
            'employee_number',
            'department',
            'role',
        )
        read_only_fields = fields


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing an authenticated user's password."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(_('Current password is incorrect.'))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': _('Password confirmation does not match.')})

        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset token via email."""

    email = serializers.EmailField()

    def validate_email(self, value):
        self.user = get_user_model().objects.filter(email__iexact=value).first()
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a password reset and updating the user password."""

    token = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': _('Password confirmation does not match.')})

        try:
            user = validate_password_reset_token(attrs['token'])
        except ValueError as exc:
            raise serializers.ValidationError({'token': str(exc)}) from exc

        validate_password(attrs['new_password'], user)
        attrs['user'] = user
        return attrs
