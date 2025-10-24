"""
User settings API routes for managing usernames and portfolio visibility.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from ..auth.middleware import require_verified_email
from ..schemas.auth import UserToken
from ..schemas.user_settings import AccessModeUpdateRequest
from ..services.user_settings_service import (
    get_user_settings_service,
    UserSettingsError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["user-settings"])


class UsernameRequest(BaseModel):
    username: str


class VisibilityRequest(BaseModel):
    is_public: bool


class UserSettingsResponse(BaseModel):
    username: Optional[str] = None
    is_public: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("/profile", response_model=UserSettingsResponse)
def get_user_settings(
    user: UserToken = Depends(require_verified_email),
):
    """
    Get the current user's settings (username, visibility, etc.).
    """
    try:
        user_settings_service = get_user_settings_service()
        settings = user_settings_service.get_user_settings(user.uid)

        if not settings:
            # Return default settings if none exist
            return UserSettingsResponse()

        return UserSettingsResponse(
            username=settings.get("username"),
            is_public=settings.get("is_public", False),
            created_at=settings.get("created_at"),
            updated_at=settings.get("updated_at"),
        )

    except UserSettingsError as e:
        logger.error(f"User settings error for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user settings")
    except Exception as e:
        logger.error(f"Unexpected error retrieving settings for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/username", response_model=dict)
def set_username(
    request: UsernameRequest,
    user: UserToken = Depends(require_verified_email),
):
    """
    Set or update the user's public username.
    """
    try:
        user_settings_service = get_user_settings_service()

        # Validate username format
        validation_result = user_settings_service.validate_username(request.username)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=400,
                detail=validation_result.get("error", "Invalid username format"),
            )

        # Check if username is available (excluding current user)
        existing_settings = user_settings_service.get_user_settings_by_username(
            request.username
        )
        if existing_settings and existing_settings.get("user_id") != user.uid:
            raise HTTPException(status_code=409, detail="Username is already taken")

        # Set the username
        user_settings_service.set_username(user.uid, request.username)

        logger.info(
            f"Username set successfully for user {user.uid}: {request.username}"
        )
        return {"message": "Username set successfully", "username": request.username}

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except UserSettingsError as e:
        logger.error(f"User settings error setting username for user {user.uid}: {e}")
        if "already taken" in str(e).lower():
            raise HTTPException(status_code=409, detail="Username is already taken")
        raise HTTPException(status_code=500, detail="Failed to set username")
    except Exception as e:
        logger.error(f"Unexpected error setting username for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/visibility", response_model=dict)
def set_portfolio_visibility(
    request: VisibilityRequest,
    user: UserToken = Depends(require_verified_email),
):
    """
    Set the portfolio's public/private visibility.
    """
    try:
        user_settings_service = get_user_settings_service()

        # If making portfolio public, ensure user has a username
        if request.is_public:
            settings = user_settings_service.get_user_settings(user.uid)
            if not settings or not settings.get("username"):
                raise HTTPException(
                    status_code=400,
                    detail="A username is required before making portfolio public",
                )

        # Set the visibility
        user_settings_service.set_portfolio_visibility(user.uid, request.is_public)

        visibility_text = "public" if request.is_public else "private"
        logger.info(
            f"Portfolio visibility set to {visibility_text} for user {user.uid}"
        )

        return {
            "message": f"Portfolio visibility set to {visibility_text}",
            "is_public": request.is_public,
        }

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except UserSettingsError as e:
        logger.error(f"User settings error setting visibility for user {user.uid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to set portfolio visibility"
        )
    except Exception as e:
        logger.error(f"Unexpected error setting visibility for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/username", response_model=dict)
def remove_username(
    user: UserToken = Depends(require_verified_email),
):
    """
    Remove the user's public username and make portfolio private.
    """
    try:
        user_settings_service = get_user_settings_service()

        # Remove username and set portfolio to private
        user_settings_service.remove_username(user.uid)

        logger.info(f"Username removed for user {user.uid}")
        return {"message": "Username removed and portfolio set to private"}

    except UserSettingsError as e:
        logger.error(f"User settings error removing username for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove username")
    except Exception as e:
        logger.error(f"Unexpected error removing username for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/access-mode", response_model=dict)
def update_access_mode(
    request: AccessModeUpdateRequest,
    user: UserToken = Depends(require_verified_email),
):
    """
    Update the portfolio access mode (public/private).
    """
    try:
        user_settings_service = get_user_settings_service()

        # Update chat_settings.access_mode
        user_settings_service.update_access_mode(user.uid, request.access_mode)

        logger.info(f"Access mode updated to {request.access_mode} for user {user.uid}")

        return {"success": True, "access_mode": request.access_mode}

    except UserSettingsError as e:
        logger.error(
            f"User settings error updating access mode for user {user.uid}: {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to update access mode")
    except Exception as e:
        logger.error(f"Unexpected error updating access mode for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
