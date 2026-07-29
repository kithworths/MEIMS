from __future__ import annotations

from django.conf import settings
from django.core.cache import cache
from typing import Any, Callable


def build_cache_key(*parts: Any) -> str:
    """Build a stable cache key from provided parts."""
    normalized = [str(part).strip() for part in parts if part is not None]
    return 'meims:' + ':'.join(normalized)


def get_cached_value(key: str, loader: Callable[[], Any], timeout: int | None = None) -> Any:
    """Return a cached value or compute it and store it in the cache."""
    value = cache.get(key)
    if value is not None:
        return value

    value = loader()
    cache.set(key, value, timeout=timeout or settings.CACHE_TTL)
    return value


def invalidate_cache(*keys: str) -> None:
    """Invalidate one or more cache keys."""
    for cache_key in keys:
        cache.delete(cache_key)


def clear_cache() -> None:
    """Clear the entire default cache."""
    cache.clear()
