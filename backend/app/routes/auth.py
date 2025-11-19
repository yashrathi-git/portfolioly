"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas.auth import UserToken, AuthResponse
from ..dependencies.rate_limiting import (
    rate_limited_auth_user,
    rate_limited_core_user,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=AuthResponse)
async def get_current_user(user: UserToken = Depends(rate_limited_auth_user)):
    """Get current authenticated user information."""
    return AuthResponse(message="User authenticated successfully", user=user)


@router.get("/me/verified", response_model=AuthResponse)
async def get_verified_user(user: UserToken = Depends(rate_limited_core_user)):
    """Get current authenticated user with verified email."""
    return AuthResponse(message="User authenticated with verified email", user=user)


@router.post("/verify-email-status")
async def check_email_verification(
    user: UserToken = Depends(rate_limited_auth_user),
):
    """Check if user's email is verified."""
    return {
        "uid": user.uid,
        "email": user.email,
        "email_verified": user.email_verified,
        "verification_required": not user.email_verified,
    }
