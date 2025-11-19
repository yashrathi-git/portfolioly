"""Dedicated configuration for rate limiting."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, field_validator
from pydantic_settings import BaseSettings


class RateLimitGroup:
    """Feature group identifiers for rate limiting."""

    UPLOAD: str = "upload"
    CHAT: str = "chat"
    GITHUB: str = "github"
    AUTH: str = "auth"
    CORE: str = "core"
    PUBLIC_PORTFOLIO: str = "public_portfolio"
    PUBLIC_USERNAME: str = "public_username"
    HEALTHCHECK: str = "healthcheck"


class RateLimitRule(BaseModel):
    """Represents a single rate limit rule."""

    requests: int
    window_seconds: int


class RateLimitRules:
    """Centralized rate limit rules."""

    UPLOAD: RateLimitRule = RateLimitRule(requests=20, window_seconds=3600)
    GITHUB: RateLimitRule = RateLimitRule(requests=20, window_seconds=3600)
    CHAT: RateLimitRule = RateLimitRule(requests=2, window_seconds=60)
    AUTH: RateLimitRule = RateLimitRule(requests=10, window_seconds=60)
    CORE: RateLimitRule = RateLimitRule(requests=20, window_seconds=60)
    PUBLIC_PORTFOLIO: RateLimitRule = RateLimitRule(requests=10, window_seconds=60)
    PUBLIC_USERNAME: RateLimitRule = RateLimitRule(requests=10, window_seconds=60)
    HEALTHCHECK: RateLimitRule = RateLimitRule(requests=100, window_seconds=60)

    @classmethod
    def get_rule(cls, group: str) -> RateLimitRule:
        """Return the rule associated with a feature group."""
        key = group.upper()
        try:
            return getattr(cls, key)
        except AttributeError as exc:
            raise ValueError(f"Unknown rate limit group: {group}") from exc


class RateLimitSettings(BaseSettings):
    """Infrastructure configuration for rate limiting."""

    environment: str = "development"
    upstash_redis_rest_url: Optional[str] = None
    upstash_redis_rest_token: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",
    }

    @field_validator("upstash_redis_rest_url")
    @classmethod
    def validate_production_redis(cls, value: Optional[str], info):
        """Ensure Redis is configured when running in production."""
        environment = info.data.get("environment", "development")
        if environment == "production" and not value:
            raise ValueError(
                "UPSTASH_REDIS_REST_URL is required when ENVIRONMENT=production."
            )
        return value

    @property
    def should_use_mock(self) -> bool:
        """Return True when the mock limiter should be used."""
        return self.environment == "development" and not self.upstash_redis_rest_url

    @property
    def redis_configured(self) -> bool:
        """Return True if Upstash Redis credentials are available."""
        return bool(self.upstash_redis_rest_url and self.upstash_redis_rest_token)


rate_limit_settings = RateLimitSettings()
