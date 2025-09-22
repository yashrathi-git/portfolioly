"""Authentication-related Pydantic schemas."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr


class UserToken(BaseModel):
    """Decoded Firebase token data."""

    uid: str
    email: Optional[EmailStr] = None
    email_verified: bool = False
    name: Optional[str] = None
    picture: Optional[str] = None
    firebase: Dict[str, Any] = {}

    @classmethod
    def from_firebase_token(cls, decoded_token: Dict[str, Any]) -> "UserToken":
        """Create UserToken from Firebase decoded token."""
        return cls(
            uid=decoded_token.get("uid", ""),
            email=decoded_token.get("email"),
            email_verified=decoded_token.get("email_verified", False),
            name=decoded_token.get("name"),
            picture=decoded_token.get("picture"),
            firebase=decoded_token,
        )


class AuthResponse(BaseModel):
    """Standard authentication response."""

    message: str
    user: UserToken


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    error_code: Optional[str] = None
