"""Main API routes."""

from fastapi import APIRouter, Depends
from ..schemas.auth import UserToken
from ..dependencies.rate_limiting import (
    limit_healthcheck_requests,
    rate_limited_auth_user,
    rate_limited_core_user,
)


router = APIRouter()


@router.get("/health")
async def health_check(_rate_limit: None = Depends(limit_healthcheck_requests)):
    """Health check endpoint."""
    return {"status": "ok", "message": "Portfolioly API is running"}


@router.get("/protected")
async def protected_route(user: UserToken = Depends(rate_limited_auth_user)):
    """Protected route requiring authentication."""
    return {
        "message": "Hello from protected route!",
        "uid": user.uid,
        "email": user.email,
        "email_verified": user.email_verified,
        "claims": {"email_verified": user.email_verified, "name": user.name},
    }


@router.get("/verified-only")
async def verified_email_only(user: UserToken = Depends(rate_limited_core_user)):
    """Route requiring verified email."""
    return {
        "message": "Hello from verified email route!",
        "uid": user.uid,
        "email": user.email,
        "verified": True,
    }
