"""
Pydantic schemas for public token authentication endpoints.
"""

from pydantic import BaseModel, Field


class EnsureUsernameRequest(BaseModel):
    """Request to get or generate a username for a user."""

    user_id: str = Field(..., min_length=1, description="Firebase user ID")


class EnsureUsernameResponse(BaseModel):
    """Response containing the username."""

    username: str = Field(..., description="Username for the user")


class EnsureTokenRequest(BaseModel):
    """Request to generate a public token for a username."""

    username: str = Field(
        ..., min_length=1, max_length=50, description="Username to generate token for"
    )


class EnsureTokenResponse(BaseModel):
    """Response containing the public token."""

    token: str = Field(..., description="Public token in format 'psk_xxx...'")
