"""Shared Redis connection helpers for infrastructure concerns."""

from __future__ import annotations

from typing import Optional

from upstash_redis import Redis

from .rate_limit_config import rate_limit_settings

_redis_client: Optional[Redis] = None


def get_redis_client() -> Optional[Redis]:
    """Return a singleton Redis client if credentials are configured."""
    global _redis_client

    if not rate_limit_settings.redis_configured:
        return None

    if _redis_client is None:
        _redis_client = Redis(
            url=rate_limit_settings.upstash_redis_rest_url,
            token=rate_limit_settings.upstash_redis_rest_token,
        )

    return _redis_client

