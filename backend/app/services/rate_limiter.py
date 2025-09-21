"""
Rate limiting service for upload onboarding flow.

This module provides sliding window rate limiting functionality with configurable
limits per user per endpoint. Supports both in-memory and Redis backends.
"""

import time
from typing import Dict, Optional, Tuple
from collections import defaultdict, deque
import asyncio
from datetime import datetime, timedelta

from ..core.upload_config import upload_config


class InMemoryRateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self):
        # Structure: {user_id: {endpoint: deque of timestamps}}
        self._requests: Dict[str, Dict[str, deque]] = defaultdict(
            lambda: defaultdict(deque)
        )
        self._lock = asyncio.Lock()

    async def check_rate_limit(
        self, user_id: str, endpoint: str, limit: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier
            limit: Maximum requests allowed in window
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_allowed, current_count, reset_time_seconds)
        """
        async with self._lock:
            current_time = time.time()
            window_start = current_time - window_seconds

            # Get request queue for this user/endpoint
            request_queue = self._requests[user_id][endpoint]

            # Remove old requests outside the window
            while request_queue and request_queue[0] < window_start:
                request_queue.popleft()

            current_count = len(request_queue)

            # Calculate reset time (when oldest request will expire)
            reset_time = int(current_time + window_seconds)
            if request_queue:
                reset_time = int(request_queue[0] + window_seconds)

            # Check if within limit
            is_allowed = current_count < limit

            return is_allowed, current_count, reset_time

    async def increment_counter(
        self, user_id: str, endpoint: str, window_seconds: int
    ) -> int:
        """
        Increment the request counter for user/endpoint.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier
            window_seconds: Time window in seconds

        Returns:
            Current request count after increment
        """
        async with self._lock:
            current_time = time.time()
            window_start = current_time - window_seconds

            # Get request queue for this user/endpoint
            request_queue = self._requests[user_id][endpoint]

            # Remove old requests outside the window
            while request_queue and request_queue[0] < window_start:
                request_queue.popleft()

            # Add current request
            request_queue.append(current_time)

            return len(request_queue)

    async def get_reset_time(
        self, user_id: str, endpoint: str, window_seconds: int
    ) -> int:
        """
        Get the reset time for the rate limit window.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier
            window_seconds: Time window in seconds

        Returns:
            Unix timestamp when rate limit resets
        """
        async with self._lock:
            current_time = time.time()
            request_queue = self._requests[user_id][endpoint]

            if not request_queue:
                return int(current_time)

            # Reset time is when the oldest request expires
            return int(request_queue[0] + window_seconds)


class RateLimiter:
    """Main rate limiter class with configurable backend."""

    def __init__(self, backend: Optional[str] = None):
        """
        Initialize rate limiter with specified backend.

        Args:
            backend: Backend type ("memory" or "redis"). Defaults to config value.
        """
        self.backend_type = backend or upload_config.RATE_LIMIT_STORAGE_BACKEND

        if self.backend_type == "memory":
            self.backend = InMemoryRateLimiter()
        elif self.backend_type == "redis":
            # Redis backend would be implemented here if needed
            raise NotImplementedError("Redis backend not implemented yet")
        else:
            raise ValueError(f"Unsupported backend: {self.backend_type}")

    async def check_rate_limit(
        self, user_id: str, endpoint: str, limit: int, window_seconds: int = 3600
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier (e.g., "pdf_upload", "github_api")
            limit: Maximum requests allowed in window
            window_seconds: Time window in seconds (default: 1 hour)

        Returns:
            Tuple of (is_allowed, current_count, reset_time_seconds)
        """
        return await self.backend.check_rate_limit(
            user_id, endpoint, limit, window_seconds
        )

    async def increment_counter(
        self, user_id: str, endpoint: str, window_seconds: int = 3600
    ) -> int:
        """
        Increment the request counter for user/endpoint.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier
            window_seconds: Time window in seconds (default: 1 hour)

        Returns:
            Current request count after increment
        """
        return await self.backend.increment_counter(user_id, endpoint, window_seconds)

    async def get_reset_time(
        self, user_id: str, endpoint: str, window_seconds: int = 3600
    ) -> int:
        """
        Get the reset time for the rate limit window.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier
            window_seconds: Time window in seconds (default: 1 hour)

        Returns:
            Unix timestamp when rate limit resets
        """
        return await self.backend.get_reset_time(user_id, endpoint, window_seconds)


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


# Rate limiting constants for different endpoints
class RateLimits:
    """Rate limiting constants for different endpoints."""

    PDF_UPLOAD_PER_HOUR = upload_config.RATE_LIMIT_PDF_UPLOADS_PER_HOUR
    GITHUB_API_PER_HOUR = upload_config.RATE_LIMIT_GITHUB_REQUESTS_PER_HOUR
    WINDOW_SECONDS = 3600  # 1 hour
