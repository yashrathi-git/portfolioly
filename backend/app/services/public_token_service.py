"""Service for generating and verifying deterministic public tokens."""

import hmac
import hashlib
import base64
from typing import Optional


class PublicTokenService:
    """Service for generating and verifying deterministic public tokens.

    Tokens are generated using HMAC-SHA256 with a global secret and are
    deterministic based on username and token version. This allows for
    immediate token invalidation by incrementing the version number.
    """

    def __init__(self, global_secret: str):
        """Initialize the token service with a global secret.

        Args:
            global_secret: The global secret key for token generation.
                          Must be at least 32 characters long.

        Raises:
            ValueError: If global_secret is empty or None.
        """
        if not global_secret:
            raise ValueError("GLOBAL_SECRET must be configured")
        self.global_secret = global_secret.encode("utf-8")

    def derive_public_token(self, username: str, token_version: int) -> str:
        """Generate a deterministic token for a username and version.

        The token is generated using HMAC-SHA256 with the message format:
        "{username}|v{token_version}". The result is base64url encoded,
        truncated to 32 characters, and prefixed with "psk_".

        Args:
            username: The username to generate a token for.
            token_version: The version number for the token.

        Returns:
            A token string in the format "psk_<32-char-base64url-string>".

        Example:
            >>> service = PublicTokenService("my-secret-key-at-least-32-chars")
            >>> token = service.derive_public_token("john_doe", 1)
            >>> token.startswith("psk_")
            True
            >>> len(token)
            36  # "psk_" (4) + 32 characters
        """
        # Create message in format: "username|vN"
        message = f"{username}|v{token_version}".encode("utf-8")

        # Generate HMAC-SHA256 hash
        hmac_hash = hmac.new(self.global_secret, message, hashlib.sha256).digest()

        # Base64url encode and truncate to 32 characters
        token_bytes = base64.urlsafe_b64encode(hmac_hash)[:32]
        token_str = token_bytes.decode("utf-8")

        # Prefix with "psk_" (public secret key)
        return f"psk_{token_str}"

    def verify_public_token(
        self, username: str, token: str, token_version: int
    ) -> bool:
        """Verify that a token is valid for a username and version.

        Uses constant-time comparison to prevent timing attacks.

        Args:
            username: The username to verify the token against.
            token: The token to verify (should start with "psk_").
            token_version: The expected token version.

        Returns:
            True if the token is valid, False otherwise.

        Example:
            >>> service = PublicTokenService("my-secret-key-at-least-32-chars")
            >>> token = service.derive_public_token("john_doe", 1)
            >>> service.verify_public_token("john_doe", token, 1)
            True
            >>> service.verify_public_token("john_doe", token, 2)
            False
            >>> service.verify_public_token("jane_doe", token, 1)
            False
        """
        # Validate token format
        if not token or not token.startswith("psk_"):
            return False

        # Generate expected token
        expected_token = self.derive_public_token(username, token_version)

        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(token, expected_token)


# Cached service instance
_token_service_instance: Optional[PublicTokenService] = None


def get_public_token_service() -> PublicTokenService:
    """Get or create the global PublicTokenService instance.

    This factory function creates a singleton instance of the token service
    initialized with the GLOBAL_SECRET from the application configuration.
    The instance is cached for reuse across requests.

    Returns:
        The global PublicTokenService instance.

    Example:
        >>> service = get_public_token_service()
        >>> token = service.derive_public_token("username", 1)
    """
    global _token_service_instance

    if _token_service_instance is None:
        from app.core.config import settings

        _token_service_instance = PublicTokenService(settings.global_secret)

    return _token_service_instance
