"""
Unit tests for rate limiting functionality.
"""

import pytest
import asyncio
import time
from unittest.mock import patch

from app.services.rate_limiter import RateLimiter, InMemoryRateLimiter, RateLimits


class TestInMemoryRateLimiter:
    """Test cases for InMemoryRateLimiter."""

    @pytest.fixture
    def rate_limiter(self):
        return InMemoryRateLimiter()

    @pytest.mark.asyncio
    async def test_initial_request_allowed(self, rate_limiter):
        """Test that initial request is always allowed."""
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            "user1", "test_endpoint", 5, 3600
        )

        assert is_allowed is True
        assert count == 0
        assert reset_time > time.time()

    @pytest.mark.asyncio
    async def test_increment_counter(self, rate_limiter):
        """Test that counter increments correctly."""
        # First increment
        count1 = await rate_limiter.increment_counter("user1", "test_endpoint", 3600)
        assert count1 == 1

        # Second increment
        count2 = await rate_limiter.increment_counter("user1", "test_endpoint", 3600)
        assert count2 == 2

    @pytest.mark.asyncio
    async def test_rate_limit_enforcement(self, rate_limiter):
        """Test that rate limit is enforced correctly."""
        user_id = "user1"
        endpoint = "test_endpoint"
        limit = 3
        window = 3600

        # Make requests up to the limit
        for i in range(limit):
            await rate_limiter.increment_counter(user_id, endpoint, window)

        # Check that we're at the limit
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            user_id, endpoint, limit, window
        )

        assert is_allowed is False
        assert count == limit

    @pytest.mark.asyncio
    async def test_sliding_window_cleanup(self, rate_limiter):
        """Test that old requests are cleaned up from sliding window."""
        user_id = "user1"
        endpoint = "test_endpoint"
        limit = 5
        window = 2  # 2 second window for faster testing

        # Make some requests
        await rate_limiter.increment_counter(user_id, endpoint, window)
        await rate_limiter.increment_counter(user_id, endpoint, window)

        # Check current count
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            user_id, endpoint, limit, window
        )
        assert count == 2

        # Wait for window to expire
        await asyncio.sleep(2.1)

        # Check that old requests are cleaned up
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            user_id, endpoint, limit, window
        )
        assert count == 0
        assert is_allowed is True

    @pytest.mark.asyncio
    async def test_different_users_isolated(self, rate_limiter):
        """Test that different users have isolated rate limits."""
        endpoint = "test_endpoint"
        limit = 2
        window = 3600

        # User1 makes requests up to limit
        await rate_limiter.increment_counter("user1", endpoint, window)
        await rate_limiter.increment_counter("user1", endpoint, window)

        # User1 should be at limit
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            "user1", endpoint, limit, window
        )
        assert is_allowed is False
        assert count == limit

        # User2 should still be allowed
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            "user2", endpoint, limit, window
        )
        assert is_allowed is True
        assert count == 0

    @pytest.mark.asyncio
    async def test_different_endpoints_isolated(self, rate_limiter):
        """Test that different endpoints have isolated rate limits."""
        user_id = "user1"
        limit = 2
        window = 3600

        # Make requests to endpoint1 up to limit
        await rate_limiter.increment_counter(user_id, "endpoint1", window)
        await rate_limiter.increment_counter(user_id, "endpoint1", window)

        # endpoint1 should be at limit
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            user_id, "endpoint1", limit, window
        )
        assert is_allowed is False
        assert count == limit

        # endpoint2 should still be allowed
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            user_id, "endpoint2", limit, window
        )
        assert is_allowed is True
        assert count == 0


class TestRateLimiter:
    """Test cases for main RateLimiter class."""

    def test_memory_backend_initialization(self):
        """Test that memory backend initializes correctly."""
        rate_limiter = RateLimiter(backend="memory")
        assert rate_limiter.backend_type == "memory"
        assert isinstance(rate_limiter.backend, InMemoryRateLimiter)

    def test_invalid_backend_raises_error(self):
        """Test that invalid backend raises ValueError."""
        with pytest.raises(ValueError, match="Unsupported backend"):
            RateLimiter(backend="invalid")

    def test_redis_backend_not_implemented(self):
        """Test that Redis backend raises NotImplementedError."""
        with pytest.raises(NotImplementedError, match="Redis backend not implemented"):
            RateLimiter(backend="redis")

    @pytest.mark.asyncio
    async def test_rate_limiter_delegates_to_backend(self):
        """Test that RateLimiter correctly delegates to backend."""
        rate_limiter = RateLimiter(backend="memory")

        # Test check_rate_limit delegation
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            "user1", "test", 5, 3600
        )
        assert is_allowed is True
        assert count == 0

        # Test increment_counter delegation
        count = await rate_limiter.increment_counter("user1", "test", 3600)
        assert count == 1

        # Test get_reset_time delegation
        reset_time = await rate_limiter.get_reset_time("user1", "test", 3600)
        assert reset_time > time.time()


class TestRateLimits:
    """Test cases for RateLimits constants."""

    def test_rate_limits_constants(self):
        """Test that rate limit constants are properly defined."""
        assert RateLimits.PDF_UPLOAD_PER_HOUR > 0
        assert RateLimits.GITHUB_API_PER_HOUR > 0
        assert RateLimits.WINDOW_SECONDS == 3600

    def test_rate_limits_use_config_values(self):
        """Test that rate limits use values from upload config."""
        # Test that the constants are loaded from config
        from app.core.upload_config import upload_config
        from app.services.rate_limiter import RateLimits

        assert (
            RateLimits.PDF_UPLOAD_PER_HOUR
            == upload_config.RATE_LIMIT_PDF_UPLOADS_PER_HOUR
        )
        assert (
            RateLimits.GITHUB_API_PER_HOUR
            == upload_config.RATE_LIMIT_GITHUB_REQUESTS_PER_HOUR
        )


@pytest.mark.asyncio
async def test_concurrent_rate_limiting():
    """Test rate limiting under concurrent access."""
    rate_limiter = InMemoryRateLimiter()
    user_id = "user1"
    endpoint = "test_endpoint"
    limit = 5
    window = 3600

    async def make_request():
        is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
            user_id, endpoint, limit, window
        )
        if is_allowed:
            await rate_limiter.increment_counter(user_id, endpoint, window)
        return is_allowed

    # Make concurrent requests
    tasks = [make_request() for _ in range(10)]
    results = await asyncio.gather(*tasks)

    # Only 'limit' number of requests should be allowed
    allowed_count = sum(1 for result in results if result)
    assert allowed_count == limit

    # Final check should show we're at the limit
    is_allowed, count, reset_time = await rate_limiter.check_rate_limit(
        user_id, endpoint, limit, window
    )
    assert is_allowed is False
    assert count == limit
