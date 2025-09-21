"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.middleware import require_authenticated_user, require_verified_email
from ..auth.models import UserToken, AuthResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=AuthResponse)
async def get_current_user(user: UserToken = Depends(require_authenticated_user)):
    """Get current authenticated user information."""
    return AuthResponse(message="User authenticated successfully", user=user)


@router.get("/me/verified", response_model=AuthResponse)
async def get_verified_user(user: UserToken = Depends(require_verified_email)):
    """Get current authenticated user with verified email."""
    return AuthResponse(message="User authenticated with verified email", user=user)


@router.post("/verify-email-status")
async def check_email_verification(
    user: UserToken = Depends(require_authenticated_user),
):
    """Check if user's email is verified."""
    return {
        "uid": user.uid,
        "email": user.email,
        "email_verified": user.email_verified,
        "verification_required": not user.email_verified,
    }
