"""Factory helpers for creating rate limiting services."""

from __future__ import annotations

import logging
from typing import Optional, TYPE_CHECKING

from ...core.rate_limit_config import rate_limit_settings
from .interface import RateLimitService
from .mock import MockRateLimitService

if TYPE_CHECKING:
    from .upstash import UpstashRateLimitService

logger = logging.getLogger(__name__)

_service_instance: Optional[RateLimitService] = None


def get_rate_limit_service() -> RateLimitService:
    """Return a singleton rate limit service instance."""
    global _service_instance

    if _service_instance is None:
        if rate_limit_settings.should_use_mock:
            _service_instance = MockRateLimitService()
        else:
            try:
                from .upstash import UpstashRateLimitService  # type: ignore
                _service_instance = UpstashRateLimitService()
            except ModuleNotFoundError as exc:
                logger.warning(
                    "Upstash rate limiter unavailable; falling back to mock implementation.",
                    exc_info=exc,
                )
                _service_instance = MockRateLimitService()

    return _service_instance


def reset_rate_limit_service() -> None:
    """Reset the singleton instance (primarily for tests)."""
    global _service_instance
    _service_instance = None

