import logging
import platform
import shutil
import time

from common.utils.api_response import error_response, success_response

from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.cache import cache, caches
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connections
from django.db.migrations.executor import MigrationExecutor
from django.db.utils import OperationalError
from django.utils import timezone
from django_redis import get_redis_connection
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse

try:
    import psutil
except ImportError:  # pragma: no cover
    psutil = None

from common.metrics import (
    CACHE_HEALTH,
    CELERY_HEALTH,
    DATABASE_HEALTH,
    MIGRATIONS_STATUS,
    REDIS_HEALTH,
    STORAGE_HEALTH,
    render_metrics,
)
from common.observability import get_build_hash
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config import celery_app
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    ApiRootSerializer,
    AuthTokenObtainPairSerializer,
    ChangePasswordSerializer,
    HealthSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileSerializer,
)
from .utils import (
    generate_password_reset_token,
    send_password_reset_email,
)


class JSONResponseMixin:
    """Mixin to standardize JSON response structure across auth APIs."""

    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK):
        return success_response(data=data, message=message or '', status_code=status_code)

    def error_response(self, errors, message=None, status_code=status.HTTP_400_BAD_REQUEST):
        return error_response(errors=errors, message=message or 'Request could not be processed.', status_code=status_code)


@extend_schema(
    summary='API root',
    description='Return MEIMS API root metadata and available API namespaces.',
    tags=['API'],
    responses={200: ApiRootSerializer},
)
class ApiRootView(JSONResponseMixin, GenericAPIView):
    serializer_class = ApiRootSerializer

    def get(self, request, *args, **kwargs):
        return self.success_response(
            data={
                'service': 'MEIMS',
                'status': 'ok',
            },
            message='Welcome to the MEIMS API.',
        )


def get_uptime_seconds():
    return round(timezone.now().timestamp() - settings.APP_START_TIME, 2)


def get_memory_usage():
    if psutil is None:
        return 'unavailable'

    try:
        process = psutil.Process()
        rss_bytes = process.memory_info().rss
        return f'{rss_bytes:,} bytes'
    except Exception:
        return 'unavailable'


def get_disk_usage():
    try:
        usage = shutil.disk_usage(settings.BASE_DIR)
        return {
            'total_bytes': usage.total,
            'used_bytes': usage.used,
            'free_bytes': usage.free,
        }
    except Exception:
        return {}


def get_migration_status():
    try:
        executor = MigrationExecutor(connections['default'])
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        return len(plan)
    except Exception:
        return -1


def get_environment_metadata():
    return {
        'environment': getattr(settings, 'ENVIRONMENT', 'unknown'),
        'platform': platform.platform(),
    }


def get_cpu_usage():
    if psutil is None:
        return 'unavailable'

    try:
        return f'{psutil.Process().cpu_percent():.2f}%'
    except Exception:
        return 'unavailable'


def get_response_time_ms(request) -> float:
    started_at = getattr(request, '_perf_start_time', None)
    if started_at is None:
        return 0.0
    return round((time.perf_counter() - started_at) * 1000, 3)


def get_postgis_status():
    if not getattr(settings, 'GIS_ENABLED', False):
        return 'disabled'
    try:
        with connections['default'].cursor() as cursor:
            cursor.execute('SELECT PostGIS_version()')
            cursor.fetchone()
        return 'available'
    except Exception:
        return 'unavailable'


def get_health_payload(request=None, *, status_value='ok', include_runtime=True):
    database_status = check_database_connection()
    cache_status = check_cache_backend()
    redis_status = check_redis_backend()
    storage_status = check_storage_backend()
    celery_status = check_celery_backend()
    migrations_pending = get_migration_status()

    payload = {
        'status': status_value,
        'timestamp': timezone.now().isoformat(),
        'version': settings.APP_VERSION,
        'uptime': get_uptime_seconds(),
        'database': 'configured',
        'cache': 'configured',
        'storage': 'configured',
        'redis': redis_status,
        'celery': celery_status,
        'migrations': 'pending' if migrations_pending > 0 else 'up_to_date',
        'environment': get_environment_metadata(),
        'build_hash': get_build_hash(),
        'memory': get_memory_usage(),
        'cpu': get_cpu_usage(),
        'disk_usage': get_disk_usage(),
        'postgresql': database_status,
        'postgis': get_postgis_status(),
        'response_time_ms': get_response_time_ms(request) if request is not None else 0.0,
    }
    if include_runtime:
        payload['runtime'] = {
            'database': database_status,
            'cache': cache_status,
            'storage': storage_status,
            'redis': redis_status,
            'celery': celery_status,
        }
    return payload


def check_database_connection():
    db_conn = connections['default']
    try:
        db_conn.ensure_connection()
        with db_conn.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        DATABASE_HEALTH.set(1)
        return 'available'
    except OperationalError:
        DATABASE_HEALTH.set(0)
        return 'unreachable'


def check_cache_backend():
    try:
        cache = caches['default']
        cache.set('meims_health_check', 'ok', timeout=5)
        if cache.get('meims_health_check') != 'ok':
            CACHE_HEALTH.set(0)
            return 'unavailable'
        cache.delete('meims_health_check')
        CACHE_HEALTH.set(1)
        return 'available'
    except Exception:
        CACHE_HEALTH.set(0)
        return 'unavailable'


def check_redis_backend():
    if not getattr(settings, 'REDIS_URL', ''):
        REDIS_HEALTH.set(0)
        return 'unconfigured'

    try:
        redis_conn = get_redis_connection('default')
        if redis_conn.ping():
            REDIS_HEALTH.set(1)
            return 'available'
        REDIS_HEALTH.set(0)
        return 'unavailable'
    except Exception:
        REDIS_HEALTH.set(0)
        return 'unavailable'


def check_storage_backend():
    try:
        if getattr(default_storage, 'location', None):
            STORAGE_HEALTH.set(1)
            return 'available'
        health_path = '.meims_health_check'
        content = ContentFile(b'meims-health-check')
        try:
            default_storage.save(health_path, content)
        finally:
            if default_storage.exists(health_path):
                default_storage.delete(health_path)
        STORAGE_HEALTH.set(1)
        return 'available'
    except Exception:
        STORAGE_HEALTH.set(0)
        return 'unavailable'


def check_celery_backend():
    if celery_app is None:
       return 'unconfigured'

    try:
       health = celery_app.control.ping(timeout=2)
       return 'available' if health else 'unavailable'
    except Exception:
       return 'unavailable'


@extend_schema(
    summary='Health check',
    description='Return the overall health status of the application, including database, cache, storage, Redis, and Celery.',
    tags=['Health'],
    responses={200: HealthSerializer},
)
class HealthCheckAPIView(JSONResponseMixin, GenericAPIView):
    serializer_class = HealthSerializer

    def get(self, request, *args, **kwargs):
       payload = get_health_payload(request=request, status_value='ok', include_runtime=True)
       serializer = self.get_serializer(payload)
       return self.success_response(
           data=serializer.data,
           message='Health check successful.',
       )


@extend_schema(
    summary='Liveness probe',
    description='Return a simple liveness response to indicate the service is running.',
    tags=['Health'],
    responses={200: HealthSerializer},
)
class HealthLiveAPIView(JSONResponseMixin, GenericAPIView):
    serializer_class = HealthSerializer

    def get(self, request, *args, **kwargs):
        payload = get_health_payload(request=request, status_value='alive', include_runtime=True)
        serializer = self.get_serializer(payload)
        return self.success_response(data=serializer.data, message='Live health check successful.')


@extend_schema(
    summary='Readiness probe',
    description='Verify that the application is ready to receive traffic by checking database, cache, storage, Redis, and Celery.',
    tags=['Health'],
    responses={200: HealthSerializer, 503: HealthSerializer},
)
class HealthReadyAPIView(JSONResponseMixin, GenericAPIView):
    serializer_class = HealthSerializer

    def get(self, request, *args, **kwargs):
        database_status = check_database_connection()
        cache_status = check_cache_backend()
        redis_status = check_redis_backend()
        storage_status = check_storage_backend()
        celery_status = check_celery_backend()
        overall = 'healthy' if all(
            status == 'available' for status in [database_status, cache_status, redis_status, storage_status, celery_status]
        ) else 'degraded'

        payload = get_health_payload(request=request, status_value=overall, include_runtime=True)
        payload['database'] = database_status
        payload['cache'] = cache_status
        payload['storage'] = storage_status
        payload['redis'] = redis_status
        payload['celery'] = celery_status
        serializer = self.get_serializer(payload)
        return self.success_response(
            data=serializer.data,
            message='Readiness check completed.',
            status_code=status.HTTP_200_OK if overall == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
@extend_schema(
    summary='Database health probe',
    description='Check the database connection status for the application.',
    tags=['Health'],
    responses={200: HealthSerializer},
)
class HealthDatabaseAPIView(JSONResponseMixin, GenericAPIView):
    serializer_class = HealthSerializer

    def get(self, request, *args, **kwargs):
        database_status = check_database_connection()
        redis_status = check_redis_backend()
        celery_status = check_celery_backend()
        migrations_pending = get_migration_status()

        payload = {
            'status': database_status,
            'timestamp': timezone.now().isoformat(),
            'version': settings.APP_VERSION,
            'uptime': get_uptime_seconds(),
            'database': database_status,
            'cache': 'configured',
            'storage': 'configured',
            'redis': redis_status,
            'celery': celery_status,
            'migrations': 'pending' if migrations_pending > 0 else 'up_to_date',
            'environment': get_environment_metadata(),
            'memory': get_memory_usage(),
            'disk_usage': get_disk_usage(),
        }
        serializer = self.get_serializer(payload)
        return self.success_response(data=serializer.data, message='Database health check completed.')


@extend_schema(
    summary='Cache health probe',
    description='Check the configured cache backend for operational readiness.',
    tags=['Health'],
    responses={200: HealthSerializer},
)
class HealthCacheAPIView(JSONResponseMixin, GenericAPIView):
    serializer_class = HealthSerializer

    def get(self, request, *args, **kwargs):
        cache_status = check_cache_backend()
        storage_status = check_storage_backend()
        redis_status = check_redis_backend()
        celery_status = check_celery_backend()
        migrations_pending = get_migration_status()

        payload = {
            'status': cache_status,
            'timestamp': timezone.now().isoformat(),
            'version': settings.APP_VERSION,
            'uptime': get_uptime_seconds(),
            'database': 'configured',
            'cache': cache_status,
            'storage': storage_status,
            'redis': redis_status,
            'celery': celery_status,
            'migrations': 'pending' if migrations_pending > 0 else 'up_to_date',
            'environment': get_environment_metadata(),
            'memory': get_memory_usage(),
            'disk_usage': get_disk_usage(),
        }
        serializer = self.get_serializer(payload)
        return self.success_response(data=serializer.data, message='Cache health check completed.')


@extend_schema(
    summary='Startup probe',
    description='Verify that the application can serve traffic and has completed startup checks.',
    tags=['Health'],
    responses={200: HealthSerializer, 503: HealthSerializer},
)
class HealthStartupAPIView(JSONResponseMixin, GenericAPIView):
    serializer_class = HealthSerializer

    def get(self, request, *args, **kwargs):
        payload = get_health_payload(request=request, status_value='startup', include_runtime=True)
        serializer = self.get_serializer(payload)
        return self.success_response(
            data=serializer.data,
            message='Startup check completed.',
            status_code=status.HTTP_200_OK,
        )


class AdminCacheClearView(JSONResponseMixin, GenericAPIView):
    """Clear the configured Django cache backend."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        cache.clear()
        return self.success_response(message='Cache cleared successfully.', data={'cleared': True})


class AdminCacheWarmView(JSONResponseMixin, GenericAPIView):
    """Warm a small set of cache entries for operational readiness."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        cache.set('admin:ops:cache-warmup', 'ok', timeout=60)
        cache.set('admin:ops:health', 'ok', timeout=60)
        return self.success_response(message='Cache warmed successfully.', data={'warmed': True})


class AdminFlushSessionsView(JSONResponseMixin, GenericAPIView):
    """Remove expired sessions to reduce storage usage."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        deleted_count, _ = Session.objects.filter(expire_date__lt=timezone.now()).delete()
        return self.success_response(message='Expired sessions flushed.', data={'deleted_sessions': deleted_count})


class AdminQueueStatusView(JSONResponseMixin, GenericAPIView):
    """Return a summary of Celery queue health when available."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        try:
            inspect = celery_app.control.inspect(timeout=2)
            payload = {
                'stats': inspect.stats() or {},
                'active': inspect.active() or {},
                'scheduled': inspect.scheduled() or {},
                'reserved': inspect.reserved() or {},
            }
        except Exception as exc:
            payload = {'error': str(exc)}
        return self.success_response(message='Queue status retrieved.', data=payload)


class AdminHealthTriggerView(JSONResponseMixin, GenericAPIView):
    """Trigger a consolidated operational health check."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        payload = get_health_payload(request=request, status_value='operational', include_runtime=True)
        return self.success_response(message='Operational health check triggered.', data=payload)


class AdminRotateLogsView(JSONResponseMixin, GenericAPIView):
    """Rotate configured file handlers for the active loggers."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        rotated = 0
        for logger_name in ('meims.request', 'meims.security', 'meims.audit', 'meims.performance', 'celery', 'django.db.backends'):
            logger_instance = logging.getLogger(logger_name)
            for handler in getattr(logger_instance, 'handlers', []):
                if hasattr(handler, 'doRollover'):
                    handler.doRollover()
                    rotated += 1
        return self.success_response(message='Log rotation requested.', data={'handlers_rotated': rotated})


class AdminMetricsCollectView(JSONResponseMixin, GenericAPIView):
    """Collect and return the current Prometheus metrics payload."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        content, content_type = render_metrics()
        return self.success_response(message='Metrics collected.', data={'content_type': content_type, 'bytes': len(content)})


class AdminStorageVerifyView(JSONResponseMixin, GenericAPIView):
    """Verify the configured storage backend."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        return self.success_response(message='Storage backend verified.', data={'status': check_storage_backend()})


class AdminDatabaseVerifyView(JSONResponseMixin, GenericAPIView):
    """Verify database connectivity."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        return self.success_response(message='Database connectivity verified.', data={'status': check_database_connection()})


class AdminRedisVerifyView(JSONResponseMixin, GenericAPIView):
    """Verify Redis connectivity."""

    serializer_class = HealthSerializer
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        return self.success_response(message='Redis connectivity verified.', data={'status': check_redis_backend()})


@extend_schema(
    summary='Prometheus metrics',
    description='Expose Prometheus metrics for monitoring systems.',
    tags=['Monitoring'],
    responses={200: OpenApiResponse(description='Prometheus metrics in plaintext')},
)
class MetricsView(APIView):
    """Expose Prometheus metrics for service monitoring."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        content, content_type = render_metrics()
        return Response(content, content_type=content_type)


@extend_schema(
    summary='User login',
    description='Authenticate a user using email and password and return JWT access and refresh tokens.',
    tags=['Authentication'],
    responses={200: OpenApiResponse(description='JWT access and refresh tokens including user profile data.')},
)
class AuthLoginView(JSONResponseMixin, TokenObtainPairView):
    """Authenticate a user and return JWT access and refresh tokens."""

    serializer_class = AuthTokenObtainPairSerializer
    audit_module = 'authentication'
    audit_action = 'Login'
    audit_description = 'User logged in successfully.'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.audit_user = serializer.user
        return self.success_response(
            data=serializer.validated_data,
            message='Login successful.',
            status_code=status.HTTP_200_OK,
        )


@extend_schema(
    summary='Refresh token',
    description='Refresh a JWT access token using a valid refresh token.',
    tags=['Authentication'],
    responses={200: OpenApiResponse(description='New JWT access token.')},
)
class AuthRefreshView(JSONResponseMixin, TokenRefreshView):
    """Refresh an access token using a valid refresh token."""

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            return self.error_response(
                errors={'refresh': [str(exc)]},
                message='Invalid refresh token.',
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        return self.success_response(
            data=serializer.validated_data,
            message='Token refreshed successfully.',
            status_code=status.HTTP_200_OK,
        )


@extend_schema(
    summary='User logout',
    description='Invalidate the current refresh token and log the authenticated user out.',
    tags=['Authentication'],
    responses={200: OpenApiResponse(description='Logout successful.')},
)
class AuthLogoutView(JSONResponseMixin, GenericAPIView):
    """Blacklist a refresh token to log a user out securely."""

    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]
    audit_module = 'authentication'
    audit_action = 'Logout'
    audit_description = 'User logged out successfully.'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.audit_user = request.user

        try:
            serializer.token.blacklist()
        except AttributeError:
            return self.error_response(
                {'refresh': ['Token blacklisting is not configured.']},
                message='Logout cannot be completed.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except TokenError as exc:
            raise InvalidToken(exc.args[0])

        return self.success_response(message='Logout successful.')


@extend_schema(
    summary='User profile',
    description='Return the currently authenticated user profile information.',
    tags=['Authentication'],
    responses={200: ProfileSerializer},
)
class AuthProfileView(JSONResponseMixin, GenericAPIView):
    """Return the current authenticated user profile."""

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return self.success_response(
            data=serializer.data,
            message='Profile retrieved successfully.',
        )


@extend_schema(
    summary='Change password',
    description='Allow an authenticated user to change their account password.',
    tags=['Authentication'],
    request=ChangePasswordSerializer,
    responses={200: OpenApiResponse(description='Password changed successfully.')},
)
class ChangePasswordView(JSONResponseMixin, GenericAPIView):
    """Allow an authenticated user to update their password."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return self.success_response(message='Password changed successfully.')


@extend_schema(
    summary='Request password reset',
    description='Request a password reset link to be sent to the registered email address.',
    tags=['Authentication'],
    request=PasswordResetRequestSerializer,
    responses={200: OpenApiResponse(description='Password reset instructions have been sent if the email exists.')},
)
class ForgotPasswordView(JSONResponseMixin, GenericAPIView):
    """Request a password reset link for a user account."""

    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = getattr(serializer, 'user', None)
        if user is not None:
            token = generate_password_reset_token(user)
            send_password_reset_email(user, token)

        return self.success_response(
            message='If the email address is registered, password reset instructions have been sent.',
        )


@extend_schema(
    summary='Reset password',
    description='Reset a user password using a secure password reset token.',
    tags=['Authentication'],
    request=PasswordResetConfirmSerializer,
    responses={200: OpenApiResponse(description='Password has been reset successfully.')},
)
class ResetPasswordView(JSONResponseMixin, GenericAPIView):
    """Reset a user password using a secure reset token."""

    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return self.success_response(message='Password has been reset successfully.')
