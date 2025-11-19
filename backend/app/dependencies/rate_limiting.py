"""FastAPI dependencies for enforcing rate limits."""

from __future__ import annotations

import time
from typing import Callable

from fastapi import Depends, HTTPException, Request

from ..auth.middleware import require_authenticated_user, require_verified_email
from ..core.rate_limit_config import RateLimitGroup, RateLimitRule, RateLimitRules
from ..schemas.auth import UserToken
from ..services.rate_limiting import RateLimitService, get_rate_limit_service


def _current_retry_after(reset_time: int) -> int:
    return max(reset_time - int(time.time()), 0)


async def _enforce_rate_limit(
    *,
    identifier: str,
    group: str,
    rule: RateLimitRule,
    rate_limit_service: RateLimitService,
    error_code: str,
    message: str,
) -> None:
    is_allowed, current_count, reset_time = await rate_limit_service.check(
        identifier=identifier,
        group=group,
    )

    if not is_allowed:
        retry_after = _current_retry_after(reset_time)
        raise HTTPException(
            status_code=429,
            detail={
                "message": message,
                "error_code": error_code,
                "retry_after": retry_after,
                "current_count": current_count,
                "limit": rule.requests,
            },
            headers={"Retry-After": str(retry_after)},
        )


def _build_user_rate_limit_dependency(
    *,
    group: str,
    rule: RateLimitRule,
    require_verified: bool,
    error_code: str,
    message: str,
) -> Callable[..., UserToken]:
    dependency_provider = (
        require_verified_email if require_verified else require_authenticated_user
    )

    async def dependency(
        user: UserToken = Depends(dependency_provider),
        rate_limit_service: RateLimitService = Depends(get_rate_limit_service),
    ) -> UserToken:
        await _enforce_rate_limit(
            identifier=user.uid,
            group=group,
            rule=rule,
            rate_limit_service=rate_limit_service,
            error_code=error_code,
            message=message,
        )
        return user

    return dependency


def _build_ip_rate_limit_dependency(
    *,
    group: str,
    rule: RateLimitRule,
    error_code: str,
    message: str,
    key_suffix: str,
) -> Callable[..., None]:
    async def dependency(
        request: Request,
        rate_limit_service: RateLimitService = Depends(get_rate_limit_service),
    ) -> None:
        client_host = request.client.host if request.client else "unknown"
        identifier = f"{client_host}:{key_suffix}"
        await _enforce_rate_limit(
            identifier=identifier,
            group=group,
            rule=rule,
            rate_limit_service=rate_limit_service,
            error_code=error_code,
            message=message,
        )

    return dependency


# Shared dependencies for routes -------------------------------------------

rate_limited_auth_user = _build_user_rate_limit_dependency(
    group=RateLimitGroup.AUTH,
    rule=RateLimitRules.AUTH,
    require_verified=False,
    error_code="AUTH_RATE_LIMIT_EXCEEDED",
    message="Too many authentication checks. Please try again soon.",
)

rate_limited_core_user = _build_user_rate_limit_dependency(
    group=RateLimitGroup.CORE,
    rule=RateLimitRules.CORE,
    require_verified=True,
    error_code="CORE_RATE_LIMIT_EXCEEDED",
    message="Too many API requests. Please slow down.",
)

limit_public_portfolio_requests = _build_ip_rate_limit_dependency(
    group=RateLimitGroup.PUBLIC_PORTFOLIO,
    rule=RateLimitRules.PUBLIC_PORTFOLIO,
    error_code="PUBLIC_PORTFOLIO_RATE_LIMIT",
    message="Too many requests from this IP. Please wait before accessing more portfolios.",
    key_suffix="public_portfolio",
)

limit_public_username_requests = _build_ip_rate_limit_dependency(
    group=RateLimitGroup.PUBLIC_USERNAME,
    rule=RateLimitRules.PUBLIC_USERNAME,
    error_code="PUBLIC_USERNAME_RATE_LIMIT",
    message="Too many username requests from this IP. Please try again later.",
    key_suffix="public_username",
)

limit_healthcheck_requests = _build_ip_rate_limit_dependency(
    group=RateLimitGroup.HEALTHCHECK,
    rule=RateLimitRules.HEALTHCHECK,
    error_code="HEALTHCHECK_RATE_LIMIT",
    message="Health check rate limit exceeded from this IP.",
    key_suffix="health",
)


# Endpoint-specific dependencies -------------------------------------------


async def check_pdf_upload_rate_limit(
    user: UserToken = Depends(require_authenticated_user),
    rate_limit_service: RateLimitService = Depends(get_rate_limit_service),
) -> None:
    """Enforce PDF upload limits per verified user."""
    rule = RateLimitRules.UPLOAD
    await _enforce_rate_limit(
        identifier=user.uid,
        group=RateLimitGroup.UPLOAD,
        rule=rule,
        rate_limit_service=rate_limit_service,
        error_code="RATE_LIMIT_EXCEEDED",
        message=f"Rate limit exceeded. Maximum {rule.requests} PDF uploads per hour.",
    )


async def check_github_api_rate_limit(
    user: UserToken = Depends(require_authenticated_user),
    rate_limit_service: RateLimitService = Depends(get_rate_limit_service),
) -> None:
    """Enforce GitHub sync limits per user."""
    rule = RateLimitRules.GITHUB
    await _enforce_rate_limit(
        identifier=user.uid,
        group=RateLimitGroup.GITHUB,
        rule=rule,
        rate_limit_service=rate_limit_service,
        error_code="GITHUB_RATE_LIMIT",
        message=f"Rate limit exceeded. Maximum {rule.requests} GitHub sync requests per hour.",
    )
