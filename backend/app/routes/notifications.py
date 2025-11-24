"""
Notification signup API routes.
"""

from fastapi import APIRouter, Depends, HTTPException
import logging

from ..dependencies.rate_limiting import rate_limited_core_user
from ..schemas.auth import UserToken
from ..schemas.notification import NotificationSignupRequest
from ..services.notification_service import (
    get_notification_service,
    NotificationServiceError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def get_notification_status(
    user: UserToken = Depends(rate_limited_core_user),
):
    """Get notification signup status for all features in a single query."""
    try:
        notification_service = get_notification_service()
        status = notification_service.get_signup_status(user.uid)
        return status

    except NotificationServiceError as e:
        logger.error(f"Notification service error for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification status")
    except Exception as e:
        logger.error(f"Unexpected error getting notification status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("")
def signup_for_notification(
    request: NotificationSignupRequest,
    user: UserToken = Depends(rate_limited_core_user),
):
    """Sign up for a notification type."""
    try:
        notification_service = get_notification_service()
        notification_service.signup_for_notification(
            user.uid, request.notification_type
        )

        return {"success": True, "notification_type": request.notification_type}

    except NotificationServiceError as e:
        logger.error(f"Notification service error for user {user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to signup for notification")
    except Exception as e:
        logger.error(f"Unexpected error signing up for notification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
