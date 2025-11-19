"""Abstract interface for rate limiting services."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Tuple


class RateLimitService(ABC):
    """Facade interface used by application code."""

    @abstractmethod
    async def check(self, identifier: str, group: str) -> Tuple[bool, int, int]:
        """
        Check whether the identifier is within the limit for a feature group.

        Returns:
            Tuple of (is_allowed, current_count, reset_time_unix).
        """
        raise NotImplementedError

