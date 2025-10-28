"""
User settings API routes for managing usernames and portfolio visibility.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
import logging

from ..auth.middleware import require_verified_email
from ..schemas.auth import UserToken
from ..schemas.user_settings import AccessModeUpdateRequest
from ..services.user_settings_service import (
    get_user_settings_service,
    UserSettingsError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["user-settings"])


class UsernameRequest(BaseModel):
    username: str


class UserSettingsResponse(BaseModel):
    username: Optional[str] = None
    access_mode: Literal["public", "private"] = "private"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    chat_settings: Optional[Dict[str, Any]] = None
    public_token_enabled: Optional[bool] = None
    public_token_ver: Optional[int] = None

    @classmethod
    def from_document(cls, settings: Dict[str, Any]) -> "UserSettingsResponse":
        created_at = settings.get("created_at")
        updated_at = settings.get("updated_at")

        if created_at is not None:
            try:
                created_at = created_at.isoformat()
            except AttributeError:
                created_at = str(created_at)

        if updated_at is not None:
            try:
                updated_at = updated_at.isoformat()
            except AttributeError:
                updated_at = str(updated_at)

        chat_settings = settings.get("chat_settings") or {}
        access_mode = chat_settings.get("access_mode", "private")
        if not chat_settings:
            chat_settings = {"access_mode": access_mode}

        return cls(
            username=settings.get("username"),
            access_mode=access_mode,
            created_at=created_at,
            updated_at=updated_at,
            chat_settings=chat_settings,
            public_token_enabled=settings.get("public_token_enabled"),
            public_token_ver=settings.get("public_token_ver"),
        )


class SettingsUpdateRequest(BaseModel):
    username: Optional[str] = None
    access_mode: Optional[Literal["public", "private"]] = None


@router.get("", response_model=UserSettingsResponse)
def get_user_settings(
    user: UserToken = Depends(require_verified_email),
):
    """
    Get the current user's settings (username, visibility, etc.).
    """
    try:
        user_settings_service = get_user_settings_service()
        settings = user_settings_service.get_user_settings(user.uid)

        # If we don't have settings yet, return defaults
        if not settings:
            return UserSettingsResponse(
                username=None,
                access_mode="private",
                created_at=None,
                updated_at=None,
                chat_settings={"access_mode": "private"},
                public_token_enabled=True,
                public_token_ver=1,
            )

        return UserSettingsResponse.from_document(settings)

    except UserSettingsError as e:
        logger.error(f"User settings error for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user settings")
    except Exception as e:
        logger.error(f"Unexpected error retrieving settings for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("", response_model=UserSettingsResponse)
def update_settings(
    request: SettingsUpdateRequest,
    user: UserToken = Depends(require_verified_email),
):
    """
    Update username or visibility settings in a single call.
    """
    try:
        user_settings_service = get_user_settings_service()

        updates = {}

        if request.username is not None:
            validation_result = user_settings_service.validate_username(
                request.username
            )
            if not validation_result["valid"]:
                raise HTTPException(
                    status_code=400,
                    detail=validation_result.get("error", "Invalid username format"),
                )

            existing_settings = user_settings_service.get_user_settings_by_username(
                request.username
            )
            if existing_settings and existing_settings.get("user_id") != user.uid:
                raise HTTPException(status_code=409, detail="Username is already taken")

            user_settings_service.set_username(user.uid, request.username)
            updates["username"] = request.username

        if request.access_mode is not None:
            if request.access_mode == "public":
                current_settings = user_settings_service.get_user_settings(user.uid)
                if not current_settings or not current_settings.get("username"):
                    raise HTTPException(
                        status_code=400,
                        detail="A username is required before making portfolio public",
                    )

            user_settings_service.update_access_mode(user.uid, request.access_mode)
            updates["access_mode"] = request.access_mode

        if not updates:
            logger.info("No updates provided for user settings request")
        else:
            logger.info(f"Updated user settings for user {user.uid}: {updates.keys()}")

        settings = user_settings_service.get_user_settings(user.uid) or {}
        return UserSettingsResponse.from_document(settings)

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
def set_portfolio_access_mode(
    request: AccessModeUpdateRequest,
    user: UserToken = Depends(require_verified_email),
):
    """
    Set the portfolio's public/private visibility.
    """
    try:
        user_settings_service = get_user_settings_service()

        # If making portfolio public, ensure user has a username
        if request.access_mode == "public":
            settings = user_settings_service.get_user_settings(user.uid)
            if not settings or not settings.get("username"):
                raise HTTPException(
                    status_code=400,
                    detail="A username is required before making portfolio public",
                )

        # Set the access mode
        user_settings_service.update_access_mode(user.uid, request.access_mode)

        visibility_text = request.access_mode
        logger.info(
            f"Portfolio visibility set to {visibility_text} for user {user.uid}"
        )

        return {
            "message": f"Portfolio visibility set to {visibility_text}",
            "access_mode": request.access_mode,
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

        # If switching to public ensure username exists
        if request.access_mode == "public":
            settings = user_settings_service.get_user_settings(user.uid)
            if not settings or not settings.get("username"):
                raise HTTPException(
                    status_code=400,
                    detail="A username is required before making portfolio public",
                )

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
