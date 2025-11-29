"""Waitlist signup API routes."""

from fastapi import APIRouter, Depends, HTTPException, Request
import logging

from ..dependencies.rate_limiting import limit_waitlist_requests
from ..schemas.waitlist import WaitlistSignupRequest, WaitlistSignupResponse
from ..services.waitlist_service import get_waitlist_service, WaitlistServiceError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("", response_model=WaitlistSignupResponse)
async def signup_for_waitlist(
    request_body: WaitlistSignupRequest,
    request: Request,
    _rate_limit: None = Depends(limit_waitlist_requests),
):
    """Sign up for a waitlist (e.g., resume builder feature)."""
    try:
        waitlist_service = get_waitlist_service()
        client_ip = request.client.host if request.client else None

        success, already_signed_up = waitlist_service.signup(
            email=request_body.email,
            source=request_body.source,
            ip_address=client_ip,
        )

        if already_signed_up:
            return WaitlistSignupResponse(
                success=True,
                message="You're already on the waitlist! We'll notify you when it's ready.",
                already_signed_up=True,
            )

        return WaitlistSignupResponse(
            success=True,
            message="You're on the list! We'll notify you when it's ready.",
            already_signed_up=False,
        )

    except WaitlistServiceError as e:
        logger.error(f"Waitlist service error: {e}")
        raise HTTPException(status_code=500, detail="Failed to join waitlist")
    except Exception as e:
        logger.error(f"Unexpected error in waitlist signup: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
