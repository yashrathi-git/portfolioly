"""
FastAPI dependencies for rate limiting.

This module provides FastAPI dependency functions for enforcing rate limits
on different endpoints in the upload onboarding flow.
"""

from fastapi import HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import time

from ..services.rate_limiter import get_rate_limiter, RateLimits, RateLimiter
from ..auth.middleware import require_authenticated_user


async def check_pdf_upload_rate_limit(
    request: Request,
    user=Depends(require_authenticated_user),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
):
    """
    FastAPI dependency to check PDF upload rate limit.

    Raises HTTPException with 429 status if rate limit exceeded.
    """
    user_id = user.uid
    endpoint = "pdf_upload"

    is_allowed, current_count, reset_time = await rate_limiter.check_rate_limit(
        user_id=user_id,
        endpoint=endpoint,
        limit=RateLimits.PDF_UPLOAD_PER_HOUR,
        window_seconds=RateLimits.WINDOW_SECONDS,
    )

    if not is_allowed:
        retry_after = reset_time - int(time.time())
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Rate limit exceeded. Maximum {RateLimits.PDF_UPLOAD_PER_HOUR} PDF uploads per hour.",
                "error_code": "RATE_LIMIT_EXCEEDED",
                "retry_after": retry_after,
                "current_count": current_count,
                "limit": RateLimits.PDF_UPLOAD_PER_HOUR,
            },
            headers={"Retry-After": str(retry_after)},
        )

    # Increment counter after successful check
    await rate_limiter.increment_counter(
        user_id=user_id, endpoint=endpoint, window_seconds=RateLimits.WINDOW_SECONDS
    )


async def check_github_api_rate_limit(
    request: Request,
    user=Depends(require_authenticated_user),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
):
    """
    FastAPI dependency to check GitHub API rate limit.

    Raises HTTPException with 429 status if rate limit exceeded.
    """
    user_id = user.uid
    endpoint = "github_api"

    is_allowed, current_count, reset_time = await rate_limiter.check_rate_limit(
        user_id=user_id,
        endpoint=endpoint,
        limit=RateLimits.GITHUB_API_PER_HOUR,
        window_seconds=RateLimits.WINDOW_SECONDS,
    )

    if not is_allowed:
        retry_after = reset_time - int(time.time())
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Rate limit exceeded. Maximum {RateLimits.GITHUB_API_PER_HOUR} GitHub API requests per hour.",
                "error_code": "RATE_LIMIT_EXCEEDED",
                "retry_after": retry_after,
                "current_count": current_count,
                "limit": RateLimits.GITHUB_API_PER_HOUR,
            },
            headers={"Retry-After": str(retry_after)},
        )

    # Increment counter after successful check
    await rate_limiter.increment_counter(
        user_id=user_id, endpoint=endpoint, window_seconds=RateLimits.WINDOW_SECONDS
    )
