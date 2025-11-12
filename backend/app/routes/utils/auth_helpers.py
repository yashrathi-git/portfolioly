"""
Authentication helper utilities for public portfolio routes.
"""

from typing import Optional, Tuple
from fastapi import HTTPException, Header
import logging

from ...core.firebase import get_firebase_auth
from ...schemas.auth import UserToken
from ...services.user_settings_service import (
    get_user_settings_service,
    UserSettingsError,
)
from ...services.public_token_service import get_public_token_service

logger = logging.getLogger(__name__)


def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    """
    Extract token from Authorization header.

    Args:
        authorization: Authorization header value

    Returns:
        Token string without "Bearer " prefix, or None if invalid format
    """
    if not authorization:
        return None

    if not authorization.startswith("Bearer "):
        return None

    return authorization[7:]  # Remove "Bearer " prefix


def verify_firebase_jwt(token: str) -> Optional[UserToken]:
    """
    Verify Firebase JWT token.

    Args:
        token: JWT token string

    Returns:
        UserToken if valid, None if invalid
    """
    try:
        firebase_auth = get_firebase_auth()
        decoded_token = firebase_auth.verify_id_token(token)
        return UserToken.from_firebase_token(decoded_token)
    except Exception as e:
        logger.debug(f"Firebase JWT verification failed: {e}")
        return None


def verify_public_token(username: str, token: str) -> bool:
    """
    Verify public portfolio token.

    Args:
        username: Portfolio username
        token: Public token to verify

    Returns:
        True if token is valid, False otherwise
    """
    try:
        user_settings_service = get_user_settings_service()
        user_settings = user_settings_service.get_user_settings_by_username(username)

        if not user_settings:
            return False

        token_version = user_settings.get("public_token_ver", 1)
        token_service = get_public_token_service()

        return token_service.verify_public_token(username, token, token_version)
    except Exception as e:
        logger.error(f"Error verifying public token for {username}: {e}")
        return False


def get_user_settings_by_username(username: str):
    """
    Get user settings by username with error handling.

    Args:
        username: Portfolio username

    Returns:
        User settings dict or None

    Raises:
        HTTPException: On service errors
    """
    try:
        user_settings_service = get_user_settings_service()
        return user_settings_service.get_user_settings_by_username(username)
    except UserSettingsError as e:
        logger.error(f"User settings error for username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user settings")


def validate_portfolio_access(
    username: str, authorization: Optional[str] = None, require_public: bool = True
) -> Tuple[dict, Optional[UserToken]]:
    """
    Validate access to a portfolio with flexible authentication.

    This function handles both Firebase JWT and public token authentication.
    Authentication is ALWAYS required - anonymous access is not permitted.

    Args:
        username: Portfolio username
        authorization: Optional Authorization header
        require_public: If True, portfolio must be public when using public token

    Returns:
        Tuple of (user_settings, firebase_user)
        - user_settings: User settings dict
        - firebase_user: UserToken if Firebase JWT was valid and user is owner, None otherwise

    Raises:
        HTTPException: 401 for missing/invalid tokens, 404 for missing/private portfolios
    """
    # Get user settings
    user_settings = get_user_settings_by_username(username)

    if not user_settings:
        logger.info(f"Username '{username}' not found")
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Extract token from authorization header
    token = extract_bearer_token(authorization)

    # SECURITY: Always require authentication
    if not token:
        logger.warning(f"No authentication token provided for username '{username}'")
        raise HTTPException(status_code=401, detail="Authentication required")

    firebase_user = None

    # Try Firebase JWT first
    firebase_user = verify_firebase_jwt(token)

    if firebase_user:
        # SECURITY: Verify ownership - user must own this username
        portfolio_owner_id = user_settings.get("user_id")

        if portfolio_owner_id == firebase_user.uid:
            # Owner access - always allowed regardless of public/private status
            logger.info(
                f"Firebase JWT verified for username '{username}' (owner access)"
            )
            return user_settings, firebase_user
        else:
            # Valid JWT but not the owner - treat as unauthenticated
            logger.debug(
                f"Firebase JWT valid but user {firebase_user.uid} doesn't own username '{username}' (owner: {portfolio_owner_id})"
            )
            firebase_user = None

    # Not owner with Firebase JWT, try public token
    is_valid_public_token = verify_public_token(username, token)

    if not is_valid_public_token:
        logger.warning(f"Invalid token provided for username '{username}'")
        raise HTTPException(status_code=401, detail="Invalid token")

    logger.info(f"Public token verified for username '{username}'")

    # Valid public token - check if portfolio is public (if required)
    if require_public:
        chat_settings = user_settings.get("chat_settings") or {}
        access_mode = chat_settings.get("access_mode", "private")

        if access_mode != "public":
            logger.info(
                "Portfolio for username '%s' is private (access_mode=%s)",
                username,
                access_mode,
            )
            raise HTTPException(status_code=404, detail="Portfolio not found")

    return user_settings, firebase_user
