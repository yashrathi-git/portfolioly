"""Authentication middleware and dependencies."""

from typing import Optional
from fastapi import Header, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..core.firebase import get_firebase_auth
from ..core.config import settings
from ..schemas.auth import UserToken


# Security scheme for Swagger documentation
security = HTTPBearer()


class AuthenticationError(HTTPException):
    """Custom authentication error."""

    def __init__(self, detail: str, error_code: str = "AUTH_ERROR"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
        self.error_code = error_code


class EmailVerificationError(HTTPException):
    """Email verification required error."""

    def __init__(self, detail: str = "Email verification required"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


async def verify_firebase_token(
    authorization: Optional[str] = Header(None),
) -> UserToken:
    """
    Verify Firebase ID token from Authorization header.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        UserToken: Decoded token data

    Raises:
        AuthenticationError: If token is invalid or missing
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError(
            "Missing or invalid Authorization header", "MISSING_TOKEN"
        )

    token = authorization.split(" ", 1)[1]

    try:
        firebase_auth = get_firebase_auth()
        decoded_token = firebase_auth.verify_id_token(token)
        return UserToken.from_firebase_token(decoded_token)
    except Exception as e:
        raise AuthenticationError(f"Invalid token: {str(e)}", "INVALID_TOKEN")


async def verify_firebase_token_with_credentials(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserToken:
    """
    Alternative token verification using HTTPBearer security scheme.
    Useful for Swagger documentation.
    """
    try:
        firebase_auth = get_firebase_auth()
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        return UserToken.from_firebase_token(decoded_token)
    except Exception as e:
        raise AuthenticationError(f"Invalid token: {str(e)}", "INVALID_TOKEN")


async def require_authenticated_user(
    user: UserToken = Depends(verify_firebase_token),
) -> UserToken:
    """
    Require authenticated user (any valid token).

    Args:
        user: User from token verification

    Returns:
        UserToken: Authenticated user data
    """
    return user


async def require_verified_email(
    user: UserToken = Depends(verify_firebase_token),
) -> UserToken:
    """
    Require authenticated user with verified email.

    Args:
        user: User from token verification

    Returns:
        UserToken: Authenticated user with verified email

    Raises:
        EmailVerificationError: If email is not verified
    """
    if settings.require_email_verification and not user.email_verified:
        raise EmailVerificationError(
            "Email verification required to access this resource"
        )

    return user


# Convenience aliases for different authentication levels
OptionalAuth = Depends(verify_firebase_token)
RequireAuth = Depends(require_authenticated_user)
RequireVerifiedEmail = Depends(require_verified_email)
