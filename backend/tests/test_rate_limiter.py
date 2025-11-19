"""Unit tests for the rate limiting facade."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core.rate_limit_config import (
    RateLimitGroup,
    RateLimitRules,
    rate_limit_settings,
)
from app.services.rate_limiting import (
    RateLimitService,
    get_rate_limit_service,
    reset_rate_limit_service,
)
from app.services.rate_limiting.mock import MockRateLimitService
from app.services.rate_limiting.upstash import UpstashRateLimitService


@pytest.fixture(autouse=True)
def reset_rate_limit_settings():
    """Ensure settings and singletons reset between tests."""
    original_env = rate_limit_settings.environment
    original_url = rate_limit_settings.upstash_redis_rest_url
    original_token = rate_limit_settings.upstash_redis_rest_token
    yield
    rate_limit_settings.environment = original_env
    rate_limit_settings.upstash_redis_rest_url = original_url
    rate_limit_settings.upstash_redis_rest_token = original_token
    reset_rate_limit_service()


@pytest.mark.asyncio
async def test_mock_rate_limit_service_allows_requests():
    service = MockRateLimitService()
    allowed, count, reset = await service.check("user", RateLimitGroup.UPLOAD)
    assert allowed is True
    assert count == 0
    assert reset == 0


def test_rate_limit_rules_unknown_group():
    with pytest.raises(ValueError):
        RateLimitRules.get_rule("unknown")


def test_factory_returns_mock_when_should_use_mock():
    rate_limit_settings.environment = "development"
    rate_limit_settings.upstash_redis_rest_url = None
    reset_rate_limit_service()

    service = get_rate_limit_service()
    assert isinstance(service, MockRateLimitService)


def _configure_upstash_env():
    rate_limit_settings.environment = "production"
    rate_limit_settings.upstash_redis_rest_url = "https://example.upstash.io"
    rate_limit_settings.upstash_redis_rest_token = "token"


@pytest.mark.asyncio
async def test_upstash_service_returns_current_count(monkeypatch):
    _configure_upstash_env()

    class FakeLimiter:
        def __init__(self, *, prefix, **kwargs):
            self.prefix = prefix

        def limit(self, identifier: str):
            return SimpleNamespace(allowed=False, remaining=0, limit=10, reset=999)

    monkeypatch.setattr(
        "app.services.rate_limiting.upstash.get_redis_client", lambda: object()
    )
    monkeypatch.setattr(
        "app.services.rate_limiting.upstash.Ratelimit",
        lambda **kwargs: FakeLimiter(**kwargs),
    )

    service = UpstashRateLimitService()
    allowed, count, reset = await service.check("user", RateLimitGroup.UPLOAD)

    assert allowed is False
    assert count == RateLimitRules.UPLOAD.requests
    assert reset == 999


@pytest.mark.asyncio
async def test_upstash_service_fail_open(monkeypatch):
    _configure_upstash_env()

    class ExplodingLimiter:
        def __init__(self, **kwargs):
            pass

        def limit(self, identifier: str):
            raise RuntimeError("boom")

    monkeypatch.setattr(
        "app.services.rate_limiting.upstash.get_redis_client", lambda: object()
    )
    monkeypatch.setattr(
        "app.services.rate_limiting.upstash.Ratelimit",
        lambda **kwargs: ExplodingLimiter(**kwargs),
    )

    service = UpstashRateLimitService()
    allowed, count, reset = await service.check("user", RateLimitGroup.UPLOAD)
    assert allowed is True
    assert count == 0
    assert reset == 0


def test_factory_returns_upstash_when_configured(monkeypatch):
    _configure_upstash_env()

    class FakeLimiter:
        def __init__(self, **kwargs):
            pass

        def limit(self, identifier: str):
            return SimpleNamespace(allowed=True, remaining=5, limit=10, reset=123)

    monkeypatch.setattr(
        "app.services.rate_limiting.upstash.get_redis_client", lambda: object()
    )
    monkeypatch.setattr(
        "app.services.rate_limiting.upstash.Ratelimit",
        lambda **kwargs: FakeLimiter(**kwargs),
    )

    reset_rate_limit_service()
    service = get_rate_limit_service()
    assert isinstance(service, UpstashRateLimitService)
