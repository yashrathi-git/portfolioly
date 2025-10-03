"""
FastAPI dependencies for chat rate limiting.

This module provides rate limiting functionality specific to the chat endpoint,
including IP-based rate limiting and portfolio owner usage tracking.
"""

from fastapi import HTTPException, Request
from typing import Tuple
import time

from ..services.rate_limiter import get_rate_limiter, RateLimiter
from ..constants.chat_config import ChatConfig


async def check_chat_ip_rate_limit(
    request: Request,
    username: str,
    token: str,
) -> str:
    """
    FastAPI dependency to check IP-based rate limit for chat requests.

    This enforces a per-IP rate limit keyed by (IP, username, token) to prevent abuse
    from unauthenticated users. Different tokens get separate rate limit buckets.

    Args:
        request: FastAPI request object
        username: Portfolio username being accessed
        token: Public token being used for authentication

    Returns:
        IP address of the requester

    Raises:
        HTTPException with 429 status if rate limit exceeded
    """
    rate_limiter = get_rate_limiter()

    # Get IP address from request
    ip_address = request.client.host if request.client else "unknown"

    # Use first 8 characters of token for rate limit key
    token_hash = token[:8] if len(token) >= 8 else token

    # Create composite key: IP + username + token_hash
    # This ensures different tokens get separate rate limit buckets
    composite_key = f"{ip_address}_{username}_{token_hash}"
    endpoint = "chat_ip"

    is_allowed, current_count, reset_time = await rate_limiter.check_rate_limit(
        user_id=composite_key,
        endpoint=endpoint,
        limit=ChatConfig.IP_REQUESTS_PER_HOUR,
        window_seconds=ChatConfig.RATE_LIMIT_WINDOW_SECONDS,
    )

    if not is_allowed:
        retry_after = reset_time - int(time.time())
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Rate limit exceeded. Maximum {ChatConfig.IP_REQUESTS_PER_HOUR} chat requests per hour from your IP address.",
                "error_code": "CHAT_IP_RATE_LIMIT_EXCEEDED",
                "retry_after": retry_after,
                "current_count": current_count,
                "limit": ChatConfig.IP_REQUESTS_PER_HOUR,
            },
            headers={"Retry-After": str(retry_after)},
        )

    # Increment counter after successful check
    await rate_limiter.increment_counter(
        user_id=composite_key,
        endpoint=endpoint,
        window_seconds=ChatConfig.RATE_LIMIT_WINDOW_SECONDS,
    )

    return ip_address


async def check_portfolio_owner_usage_limit(
    portfolio_owner_user_id: str,
) -> None:
    """
    Check if portfolio owner has exceeded their monthly message limit.

    This function checks the portfolio owner's monthly message count against
    their configured limit. It automatically resets the counter if we're in
    a new month.

    Args:
        portfolio_owner_user_id: Firebase user ID of the portfolio owner

    Raises:
        HTTPException with 429 status if monthly limit exceeded
    """
    from firebase_admin import firestore
    from datetime import datetime

    db = firestore.client()
    settings_ref = db.collection("user_settings").document(portfolio_owner_user_id)
    settings_doc = settings_ref.get()

    if not settings_doc.exists:
        # No settings yet, create default chat settings
        return

    settings_data = settings_doc.to_dict()
    chat_settings = settings_data.get("chat_settings", {})

    # Get current values
    monthly_count = chat_settings.get("monthly_message_count", 0)
    monthly_limit = chat_settings.get(
        "monthly_message_limit", ChatConfig.PORTFOLIO_MESSAGES_PER_MONTH
    )
    month_reset_date = chat_settings.get("month_reset_date")

    # Check if we need to reset the counter (new month)
    current_date = datetime.utcnow()
    should_reset = False

    if month_reset_date:
        # Parse the reset date
        if isinstance(month_reset_date, str):
            # Parse ISO format datetime string
            try:
                reset_date = datetime.fromisoformat(
                    month_reset_date.replace("Z", "+00:00")
                )
            except (ValueError, AttributeError):
                # If parsing fails, reset the counter
                should_reset = True
                reset_date = current_date
        else:
            reset_date = month_reset_date

        # Check if we're in a new month
        if not should_reset and (
            current_date.year > reset_date.year
            or (
                current_date.year == reset_date.year
                and current_date.month > reset_date.month
            )
        ):
            should_reset = True
    else:
        # No reset date set, initialize it
        should_reset = True

    if should_reset:
        # Reset counter for new month
        monthly_count = 0
        month_reset_date = current_date

        # Update in Firebase
        settings_ref.update(
            {
                "chat_settings.monthly_message_count": 0,
                "chat_settings.month_reset_date": month_reset_date,
            }
        )

    # Check if limit exceeded
    if monthly_count >= monthly_limit:
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Portfolio owner has reached their monthly message limit of {monthly_limit} messages.",
                "error_code": "PORTFOLIO_OWNER_LIMIT_EXCEEDED",
                "current_count": monthly_count,
                "limit": monthly_limit,
            },
        )


async def increment_portfolio_owner_usage(
    portfolio_owner_user_id: str,
) -> int:
    """
    Increment the portfolio owner's monthly message counter.

    This function increments the counter and updates the last_message_at timestamp.
    It should be called after a successful chat message is processed.

    Args:
        portfolio_owner_user_id: Firebase user ID of the portfolio owner

    Returns:
        Updated message count
    """
    from firebase_admin import firestore
    from datetime import datetime
    from google.cloud.firestore_v1 import Increment

    db = firestore.client()
    settings_ref = db.collection("user_settings").document(portfolio_owner_user_id)

    # Use Firestore's atomic increment
    current_time = datetime.utcnow()
    settings_ref.update(
        {
            "chat_settings.monthly_message_count": Increment(1),
            "chat_settings.last_message_at": current_time,
        }
    )

    # Get updated count
    settings_doc = settings_ref.get()
    if settings_doc.exists:
        settings_data = settings_doc.to_dict()
        chat_settings = settings_data.get("chat_settings", {})
        return chat_settings.get("monthly_message_count", 1)

    return 1


def validate_chat_input_tokens(message: str) -> None:
    """
    Validate that user input doesn't exceed token limit.

    Uses tiktoken to count tokens in the user's message and ensures it's
    within the configured limit.

    Args:
        message: User's chat message

    Raises:
        HTTPException with 400 status if token limit exceeded
    """
    import tiktoken

    try:
        # Use cl100k_base encoding (used by GPT-4 and similar models)
        encoding = tiktoken.get_encoding("cl100k_base")
        token_count = len(encoding.encode(message))

        if token_count > ChatConfig.MAX_USER_INPUT_TOKENS:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Message too long. Maximum {ChatConfig.MAX_USER_INPUT_TOKENS} tokens allowed.",
                    "error_code": "INPUT_TOKEN_LIMIT_EXCEEDED",
                    "token_count": token_count,
                    "limit": ChatConfig.MAX_USER_INPUT_TOKENS,
                },
            )
    except Exception as e:
        # If tiktoken fails, fall back to character-based estimation
        # Rough estimate: 1 token ≈ 4 characters
        estimated_tokens = len(message) // 4
        if estimated_tokens > ChatConfig.MAX_USER_INPUT_TOKENS:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Message too long. Please keep it under {ChatConfig.MAX_USER_INPUT_TOKENS * 4} characters.",
                    "error_code": "INPUT_LENGTH_EXCEEDED",
                },
            )


def validate_system_prompt_tokens(prompt: str) -> None:
    """
    Validate that system prompt doesn't exceed token limit.

    Uses tiktoken to count tokens in the system prompt and ensures it's
    within the configured limit.

    Args:
        prompt: System prompt text

    Raises:
        ValueError if token limit exceeded
    """
    import tiktoken

    try:
        # Use cl100k_base encoding (used by GPT-4 and similar models)
        encoding = tiktoken.get_encoding("cl100k_base")
        token_count = len(encoding.encode(prompt))

        if token_count > ChatConfig.MAX_SYSTEM_PROMPT_TOKENS:
            raise ValueError(
                f"System prompt exceeds token limit. "
                f"Current: {token_count}, Limit: {ChatConfig.MAX_SYSTEM_PROMPT_TOKENS}"
            )
    except Exception as e:
        # If tiktoken fails, log warning but don't block
        import logging

        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to validate system prompt tokens: {e}")


def count_tokens(text: str) -> int:
    """
    Count the number of tokens in a text string.

    Args:
        text: Text to count tokens for

    Returns:
        Number of tokens
    """
    import tiktoken

    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        # Fall back to character-based estimation
        return len(text) // 4
