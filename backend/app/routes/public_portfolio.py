"""
Public portfolio API routes for accessing published portfolios.
"""

from fastapi import APIRouter, HTTPException, Path, Header, Request
from typing import Optional
import logging

from ..schemas.portfolio import PortfolioData
from ..schemas.public_token import (
    EnsureUsernameRequest,
    EnsureUsernameResponse,
    EnsureTokenRequest,
    EnsureTokenResponse,
)
from ..services.portfolio_service import get_portfolio_service, FirebaseError
from ..services.user_settings_service import (
    get_user_settings_service,
    UserSettingsError,
)
from ..services.public_token_service import get_public_token_service
from ..core.firebase import get_firebase_auth
from .utils.auth_helpers import (
    extract_bearer_token,
    verify_firebase_jwt,
    get_user_settings_by_username,
    validate_portfolio_access,
)
from ..routes.public_portfolio_chat import handle_chat_request


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/public", tags=["public-portfolio"])


@router.get("/portfolio/{username}", response_model=Optional[PortfolioData])
def get_public_portfolio(
    username: str = Path(..., description="Username of the portfolio to retrieve"),
    authorization: Optional[str] = Header(
        None, description="Public token for authentication"
    ),
):
    """
    Get a public portfolio by username.

    Authentication: Public token only (psk_xxx...)
    - Requires valid public token in Authorization header
    - Token must match the username

    Returns 401 if token is missing or invalid.
    Returns 404 if portfolio doesn't exist.
    """
    try:
        # Require token - no public requirement check
        user_settings, _ = validate_portfolio_access(
            username=username, authorization=authorization, require_public=False
        )

        # Get the user ID from settings
        user_id = user_settings.get("user_id")
        if not user_id:
            logger.error(f"No user_id found for username '{username}'")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Fetch the portfolio data
        portfolio_service = get_portfolio_service()
        portfolio_data = portfolio_service.get_portfolio_data(user_id)

        if not portfolio_data:
            logger.info(
                f"No portfolio data found for user_id '{user_id}' (username: '{username}')"
            )
            raise HTTPException(status_code=404, detail="Portfolio not found")

        logger.info(
            f"Successfully retrieved public portfolio for username '{username}'"
        )
        return portfolio_data

    except HTTPException:
        raise
    except FirebaseError as e:
        logger.error(
            f"Firebase error retrieving portfolio for username '{username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")
    except Exception as e:
        logger.error(
            f"Unexpected error retrieving portfolio for username '{username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ensure-username", response_model=EnsureUsernameResponse)
def ensure_username(
    request: EnsureUsernameRequest,
    authorization: str = Header(..., description="Firebase JWT token required"),
):
    """
    Get or generate a username for a user.

    Authentication: Firebase JWT only (required)

    Flow:
    1. Verify Firebase JWT token
    2. Check if user already has a username
    3. If not, generate one from their email
    4. Store and return the username
    """
    try:
        # Verify Firebase JWT
        token = extract_bearer_token(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Missing authentication token")

        firebase_user = verify_firebase_jwt(token)
        if not firebase_user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        # Verify the token user_id matches the request user_id
        if firebase_user.uid != request.user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        user_settings_service = get_user_settings_service()

        # Check if user already has a username
        existing_settings = user_settings_service.get_user_settings(request.user_id)

        if existing_settings and existing_settings.get("username"):
            username = existing_settings.get("username")
            logger.info(f"User {request.user_id} already has username: {username}")
            return EnsureUsernameResponse(username=username)

        # Generate username from email
        auth = get_firebase_auth()
        user_record = auth.get_user(request.user_id)

        if not user_record.email:
            logger.error(f"User {request.user_id} has no email address")
            raise HTTPException(status_code=400, detail="User has no email address")

        username = user_settings_service.generate_username_from_email(user_record.email)
        user_settings_service.set_username(request.user_id, username)

        logger.info(
            f"Generated and stored username '{username}' for user {request.user_id}"
        )
        return EnsureUsernameResponse(username=username)

    except HTTPException:
        raise
    except UserSettingsError as e:
        logger.error(f"User settings error for user {request.user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to ensure username")
    except Exception as e:
        logger.error(
            f"Unexpected error ensuring username for user {request.user_id}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ensure-token", response_model=EnsureTokenResponse)
def ensure_token(
    request: EnsureTokenRequest,
    authorization: Optional[str] = Header(
        None, description="Optional Firebase JWT token"
    ),
):
    """
    Generate a public token for a username.

    Authentication rules:
    - With valid Firebase JWT: Always returns token (regardless of portfolio visibility)
    - Without Firebase JWT: Returns token only if portfolio is public

    Returns 404 if:
    - Username doesn't exist
    - Token generation disabled (public_token_enabled == false)
    - Portfolio is private AND no valid Firebase JWT provided

    Returns:
        EnsureTokenResponse with the generated token in format "psk_xxx..."
    """
    try:
        # Get user settings
        user_settings = get_user_settings_by_username(request.username)

        if not user_settings:
            logger.info(f"Username '{request.username}' not found for token generation")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Check if token generation is disabled
        if not user_settings.get("public_token_enabled", True):
            logger.info(f"Token generation disabled for username '{request.username}'")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Check authentication
        token = extract_bearer_token(authorization)
        has_firebase_auth = False

        if token:
            firebase_user = verify_firebase_jwt(token)
            if firebase_user:
                has_firebase_auth = True
                logger.info(
                    f"Firebase JWT verified for token generation: {request.username}"
                )

        # If no Firebase auth, require portfolio to be public
        if not has_firebase_auth and not user_settings.get("is_public", False):
            logger.info(
                f"Portfolio for username '{request.username}' is private and no Firebase auth provided"
            )
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Generate the token
        token_version = user_settings.get("public_token_ver", 1)
        token_service = get_public_token_service()
        token = token_service.derive_public_token(request.username, token_version)

        logger.info(
            f"Generated token for username '{request.username}' with version {token_version}"
        )
        return EnsureTokenResponse(token=token)

    except HTTPException:
        raise
    except UserSettingsError as e:
        logger.error(
            f"User settings error generating token for username '{request.username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to generate token")
    except Exception as e:
        logger.error(
            f"Unexpected error generating token for username '{request.username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/username/{username}/available", response_model=dict)
def check_username_availability(
    username: str = Path(..., description="Username to check availability for"),
    authorization: str = Header(..., description="Firebase JWT token required"),
):
    """
    Check if a username is available for registration.

    Authentication: Firebase JWT only (required)

    Returns:
        {"available": true/false, "reason": "..."}
    """
    try:
        # Verify Firebase JWT
        token = extract_bearer_token(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Missing authentication token")

        firebase_user = verify_firebase_jwt(token)
        if not firebase_user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        user_settings_service = get_user_settings_service()

        # Validate username format
        validation_result = user_settings_service.validate_username(username)
        if not validation_result["valid"]:
            return {
                "available": False,
                "reason": validation_result.get("error", "Invalid username format"),
            }

        # Check if username is already taken
        existing_settings = get_user_settings_by_username(username)
        is_available = existing_settings is None

        logger.info(f"Username '{username}' availability check: {is_available}")

        result = {"available": is_available}
        if not is_available:
            result["reason"] = "Username is already taken"

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error checking username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat/{username}")
async def chat_with_public_portfolio(
    username: str,
    request: Request,
    authorization: str = Header(..., description="Bearer token for authentication"),
):
    """Chat with an AI assistant about a public portfolio using token authentication."""

    return await handle_chat_request(username, request, authorization)
