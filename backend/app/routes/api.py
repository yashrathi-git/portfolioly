"""Main API routes."""

from fastapi import APIRouter, Depends
from ..auth.middleware import require_authenticated_user, require_verified_email
from ..schemas.auth import UserToken


router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Portfolioly API is running"}


@router.get("/protected")
async def protected_route(user: UserToken = Depends(require_authenticated_user)):
    """Protected route requiring authentication."""
    return {
        "message": "Hello from protected route!",
        "uid": user.uid,
        "email": user.email,
        "email_verified": user.email_verified,
        "claims": {"email_verified": user.email_verified, "name": user.name},
    }


@router.get("/verified-only")
async def verified_email_only(user: UserToken = Depends(require_verified_email)):
    """Route requiring verified email."""
    return {
        "message": "Hello from verified email route!",
        "uid": user.uid,
        "email": user.email,
        "verified": True,
    }
