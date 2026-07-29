from __future__ import annotations

import logging
import os
import time
from typing import Any

try:
    import psutil
except ImportError:  # pragma: no cover
    psutil = None

from django.conf import settings
from django.db import connections
from django.utils.deprecation import MiddlewareMixin

from common.metrics import SLOW_REQUESTS, record_db_metrics, record_request_timing_metrics

logger = logging.getLogger('meims.performance')


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Measure request performance, database time, and resource usage per request."""

    def process_request(self, request):
        request._perf_start_time = time.perf_counter()
        request._perf_db_time_ms = 0.0
        request._perf_serialization_time_ms = 0.0
        request._perf_auth_time_ms = 0.0
        request._perf_memory_start = self._get_memory_usage_mb()
        request._perf_cpu_start = self._get_cpu_percent()

    def process_view(self, request, view_func, view_args, view_kwargs):
        if hasattr(request, '_perf_start_time'):
            request._perf_auth_time_ms = round((time.perf_counter() - request._perf_start_time) * 1000, 3)
        return None

    def process_response(self, request, response):
        total_ms = 0.0
        if hasattr(request, '_perf_start_time'):
            total_ms = round((time.perf_counter() - request._perf_start_time) * 1000, 3)

        db_time_ms = self._get_db_time_ms()
        request._perf_db_time_ms = db_time_ms

        memory_mb = self._get_memory_usage_mb()
        cpu_percent = self._get_cpu_percent()
        response_size = len(response.content or b'') if hasattr(response, 'content') else 0

        if getattr(response, 'streaming', False):
            response_size = 0

        record_request_timing_metrics(
            endpoint=request.path,
            total_ms=total_ms,
            db_ms=request._perf_db_time_ms,
            auth_ms=request._perf_auth_time_ms,
            memory_mb=memory_mb,
            cpu_percent=cpu_percent,
            response_size=response_size,
        )
        record_db_metrics(db_count=self._get_query_count(), db_time_ms=request._perf_db_time_ms)

        logger.info(
            'request_performance',
            extra={
                'extra': {
                    'path': request.path,
                    'method': request.method,
                    'total_ms': total_ms,
                    'db_ms': request._perf_db_time_ms,
                    'auth_ms': request._perf_auth_time_ms,
                    'memory_mb': memory_mb,
                    'cpu_percent': cpu_percent,
                    'response_size': response_size,
                    'status_code': getattr(response, 'status_code', None),
                    'user_id': getattr(getattr(request, 'user', None), 'id', None),
                }
            },
        )

        threshold_ms = getattr(settings, 'PERFORMANCE_SLOW_REQUEST_THRESHOLD_MS', 1000)
        if total_ms >= threshold_ms:
            SLOW_REQUESTS.labels(endpoint=request.path).inc()
            logger.warning(
                'slow_request_detected',
                extra={
                    'extra': {
                        'path': request.path,
                        'method': request.method,
                        'total_ms': total_ms,
                        'threshold_ms': threshold_ms,
                    }
                },
            )
        return response

    def _get_memory_usage_mb(self) -> float:
        try:
            if psutil is None:
                return 0.0
            return round(psutil.Process().memory_info().rss / (1024 * 1024), 2)
        except Exception:
            return 0.0

    def _get_cpu_percent(self) -> float:
        try:
            if psutil is None:
                return 0.0
            return round(psutil.Process().cpu_percent() or 0.0, 2)
        except Exception:
            return 0.0

    def _get_db_time_ms(self) -> float:
        """Get total database query time in milliseconds across all database connections.
        
        Safely iterates through all configured database connections and aggregates
        query execution times. Returns 0.0 if an error occurs to prevent middleware crashes.
        
        Works with SQLite, PostgreSQL, PostGIS, and multiple databases.
        """
        try:
            total = 0.0
            # Django 5.x: use connections as an iterable (alias iterator)
            # This works across Django versions and supports multiple databases
            for alias in connections:
                try:
                    connection = connections[alias]
                    # Try 'queries' first (standard), then 'queries_log' for compatibility
                    queries = getattr(connection, 'queries', None)
                    if queries is None:
                        queries = getattr(connection, 'queries_log', [])
                    
                    for query in queries or []:
                        time_value = query.get('time') if isinstance(query, dict) else None
                        if isinstance(time_value, (int, float)):
                            total += float(time_value) * 1000
                except Exception:
                    # Don't fail if a single connection has issues
                    continue
            return round(total, 3)
        except Exception as exc:
            # Log the exception but don't let monitoring crash the request
            logger.exception('Failed to collect database query time metrics')
            return 0.0

    def _get_query_count(self) -> int:
        """Get total database query count across all database connections.
        
        Safely counts queries executed against each configured database.
        Returns 0 if an error occurs to prevent middleware crashes.
        
        Works with SQLite, PostgreSQL, PostGIS, and multiple databases.
        """
        try:
            total = 0
            # Django 5.x: use connections as an iterable (alias iterator)
            for alias in connections:
                try:
                    connection = connections[alias]
                    # Try 'queries' first (standard), then 'queries_log' for compatibility
                    queries = getattr(connection, 'queries', None)
                    if queries is None:
                        queries = getattr(connection, 'queries_log', [])
                    
                    total += len(queries or [])
                except Exception:
                    # Don't fail if a single connection has issues
                    continue
            return total
        except Exception as exc:
            # Log the exception but don't let monitoring crash the request
            logger.exception('Failed to collect database query count metrics')
            return 0
