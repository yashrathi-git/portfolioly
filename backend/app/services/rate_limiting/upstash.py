"""Upstash-backed rate limiting service."""

from __future__ import annotations

import asyncio
import logging
from typing import Dict, Tuple

from upstash_ratelimit import FixedWindow, Ratelimit

from ...core.rate_limit_config import RateLimitGroup, RateLimitRules
from ...core.redis import get_redis_client
from .interface import RateLimitService

logger = logging.getLogger(__name__)

SUPPORTED_GROUPS = (
    RateLimitGroup.UPLOAD,
    RateLimitGroup.GITHUB,
    RateLimitGroup.CHAT,
    RateLimitGroup.AUTH,
    RateLimitGroup.CORE,
    RateLimitGroup.PUBLIC_PORTFOLIO,
    RateLimitGroup.PUBLIC_USERNAME,
    RateLimitGroup.HEALTHCHECK,
)


class UpstashRateLimitService(RateLimitService):
    """Production rate limiter that uses Upstash's fixed-window algorithm."""

    def __init__(self) -> None:
        redis = get_redis_client()
        if redis is None:
            raise RuntimeError(
                "Upstash Redis client not configured. "
                "Ensure UPSTASH_REDIS_REST_URL and token are set."
            )

        self._limiters: Dict[str, Ratelimit] = {}

        for group in SUPPORTED_GROUPS:
            rule = RateLimitRules.get_rule(group)
            self._limiters[group] = Ratelimit(
                redis=redis,
                prefix=f"ratelimit:{group}",
                limiter=FixedWindow(
                    max_requests=rule.requests, window=rule.window_seconds
                ),
            )

    async def check(self, identifier: str, group: str) -> Tuple[bool, int, int]:
        """Check a rate limit for the given identifier and feature group."""
        limiter = self._limiters.get(group)
        if limiter is None:
            raise ValueError(f"No rate limiter configured for group: {group}")

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, limiter.limit, identifier)
            allowed = getattr(result, "allowed", True)
            rule = RateLimitRules.get_rule(group)
            limit_value = getattr(result, "limit", rule.requests)
            remaining = getattr(result, "remaining", limit_value)
            reset = getattr(result, "reset", 0)
            current_count = max(0, int(limit_value) - int(remaining))
            return bool(allowed), current_count, int(reset)
        except Exception as exc:
            logger.error(
                "Rate limit check failed for group=%s identifier=%s: %s",
                group,
                identifier,
                exc,
                exc_info=True,
            )
            # Fail-open strategy: allow the request to proceed
            return True, 0, 0
