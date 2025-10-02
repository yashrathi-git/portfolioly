"""Portfolio access control dependency for FastAPI routes."""

from typing import Optional
from fastapi import Header, HTTPException, status, Request
import logging

from ..services.user_settings_service import get_user_settings_service
from ..auth.middleware import verify_firebase_token, AuthenticationError
from ..constants.chat_config import ChatConfig

logger = logging.getLogger(__name__)


class PortfolioAccessError(HTTPException):
    """Custom portfolio access error."""

    def __init__(self, detail: str, status_code: int = status.HTTP_403_FORBIDDEN):
        super().__init__(status_code=status_code, detail=detail)


async def check_portfolio_access(
    username: str,
    request: Request,
    authorization: Optional[str] = Header(None),
) -> str:
    """
    Check if the requester has access to the portfolio.

    This dependency verifies portfolio access based on the owner's settings:
    - Public portfolios: Allow all requests (authenticated or not)
    - Private portfolios: Require authentication and verify user matches owner

    Args:
        username: Portfolio username to check access for
        request: FastAPI request object (for IP tracking)
        authorization: Optional Authorization header with Bearer token

    Returns:
        str: Portfolio owner's user_id for usage tracking

    Raises:
        PortfolioAccessError: If access is denied (HTTP 403)
        HTTPException: If portfolio not found (HTTP 404)
    """
    try:
        # Get user settings service
        user_settings_service = get_user_settings_service()

        # Fetch portfolio owner's settings by username
        owner_settings = user_settings_service.get_user_settings_by_username(username)

        if not owner_settings:
            logger.warning(f"Portfolio not found for username: {username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Portfolio not found for username: {username}",
            )

        owner_user_id = owner_settings.get("user_id")

        # Get chat settings, default to public if not set
        chat_settings = owner_settings.get("chat_settings", {})
        access_mode = chat_settings.get("access_mode", ChatConfig.DEFAULT_CHAT_ACCESS)
        chat_enabled = chat_settings.get("enabled", True)

        # Check if chat is enabled
        if not chat_enabled:
            logger.info(f"Chat is disabled for portfolio: {username}")
            raise PortfolioAccessError(
                detail="Chat is not enabled for this portfolio",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # If public access, allow the request
        if access_mode == "public":
            logger.debug(f"Public access granted for portfolio: {username}")
            return owner_user_id

        # Private access - require authentication
        if not authorization or not authorization.startswith("Bearer "):
            logger.info(f"Authentication required for private portfolio: {username}")
            raise PortfolioAccessError(
                detail="This portfolio is private. Authentication required.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        # Verify the token
        try:
            user_token = await verify_firebase_token(authorization)
            authenticated_user_id = user_token.uid

            # Check if authenticated user matches portfolio owner
            if authenticated_user_id != owner_user_id:
                logger.warning(
                    f"Access denied: User {authenticated_user_id} attempted to access "
                    f"private portfolio of {owner_user_id}"
                )
                raise PortfolioAccessError(
                    detail="You do not have permission to access this portfolio",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

            logger.debug(f"Private access granted for portfolio owner: {username}")
            return owner_user_id

        except AuthenticationError as e:
            logger.warning(
                f"Authentication failed for private portfolio {username}: {e.detail}"
            )
            raise PortfolioAccessError(
                detail="Invalid authentication token",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error checking portfolio access for {username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check portfolio access",
        )
