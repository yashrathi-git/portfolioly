"""Mock rate limiter used for development environments."""

from __future__ import annotations

import logging
from typing import Tuple

from .interface import RateLimitService

logger = logging.getLogger(__name__)


class MockRateLimitService(RateLimitService):
    """Development-only rate limiter that always allows requests."""

    def __init__(self) -> None:
        logger.info("Using MockRateLimitService (development fail-open bypass)")

    async def check(self, identifier: str, group: str) -> Tuple[bool, int, int]:
        return True, 0, 0

