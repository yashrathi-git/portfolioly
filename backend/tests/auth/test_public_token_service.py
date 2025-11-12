"""Tests for public token generation and verification service."""

import pytest
from app.services.public_token_service import PublicTokenService


class TestPublicTokenService:
    """Test public token generation and verification."""

    @pytest.fixture
    def service(self):
        return PublicTokenService(
            global_secret="test-secret-key-at-least-32-characters-long"
        )

    def test_initialization_with_valid_secret(self):
        """Should initialize with valid secret."""
        service = PublicTokenService("valid-secret-key-at-least-32-chars")
        assert service is not None

    def test_initialization_with_empty_secret_raises_error(self):
        """Should raise ValueError for empty secret."""
        with pytest.raises(ValueError, match="GLOBAL_SECRET must be configured"):
            PublicTokenService("")

    def test_initialization_with_none_secret_raises_error(self):
        """Should raise ValueError for None secret."""
        with pytest.raises(ValueError, match="GLOBAL_SECRET must be configured"):
            PublicTokenService(None)

    def test_derive_token_format(self, service):
        """Generated token should have correct format."""
        token = service.derive_public_token("testuser", 1)

        assert token.startswith("psk_")
        assert len(token) == 36  # "psk_" (4) + 32 characters

    def test_derive_token_deterministic(self, service):
        """Same inputs should generate same token."""
        token1 = service.derive_public_token("testuser", 1)
        token2 = service.derive_public_token("testuser", 1)

        assert token1 == token2

    def test_derive_token_different_usernames(self, service):
        """Different usernames should generate different tokens."""
        token1 = service.derive_public_token("user1", 1)
        token2 = service.derive_public_token("user2", 1)

        assert token1 != token2

    def test_derive_token_different_versions(self, service):
        """Different versions should generate different tokens."""
        token1 = service.derive_public_token("testuser", 1)
        token2 = service.derive_public_token("testuser", 2)

        assert token1 != token2

    def test_verify_valid_token(self, service):
        """Should verify valid token."""
        token = service.derive_public_token("testuser", 1)
        is_valid = service.verify_public_token("testuser", token, 1)

        assert is_valid is True

    def test_verify_invalid_token(self, service):
        """Should reject invalid token."""
        is_valid = service.verify_public_token("testuser", "psk_invalidtoken123", 1)

        assert is_valid is False

    def test_verify_token_wrong_username(self, service):
        """Should reject token for wrong username."""
        token = service.derive_public_token("user1", 1)
        is_valid = service.verify_public_token("user2", token, 1)

        assert is_valid is False

    def test_verify_token_wrong_version(self, service):
        """Should reject token with wrong version."""
        token = service.derive_public_token("testuser", 1)
        is_valid = service.verify_public_token("testuser", token, 2)

        assert is_valid is False

    def test_verify_token_without_prefix(self, service):
        """Should reject token without psk_ prefix."""
        is_valid = service.verify_public_token("testuser", "invalidtoken", 1)

        assert is_valid is False

    def test_verify_empty_token(self, service):
        """Should reject empty token."""
        is_valid = service.verify_public_token("testuser", "", 1)

        assert is_valid is False

    def test_verify_none_token(self, service):
        """Should reject None token."""
        is_valid = service.verify_public_token("testuser", None, 1)

        assert is_valid is False

    def test_token_invalidation_by_version_increment(self, service):
        """Incrementing version should invalidate old tokens."""
        # Generate token with version 1
        old_token = service.derive_public_token("testuser", 1)

        # Verify it works with version 1
        assert service.verify_public_token("testuser", old_token, 1) is True

        # Increment version to 2
        # Old token should no longer be valid
        assert service.verify_public_token("testuser", old_token, 2) is False

        # New token with version 2 should work
        new_token = service.derive_public_token("testuser", 2)
        assert service.verify_public_token("testuser", new_token, 2) is True

    def test_different_secrets_generate_different_tokens(self):
        """Different secrets should generate different tokens."""
        service1 = PublicTokenService("secret1-at-least-32-characters-long")
        service2 = PublicTokenService("secret2-at-least-32-characters-long")

        token1 = service1.derive_public_token("testuser", 1)
        token2 = service2.derive_public_token("testuser", 1)

        assert token1 != token2

    def test_constant_time_comparison(self, service):
        """Verification should use constant-time comparison."""
        # This test verifies that the implementation uses hmac.compare_digest
        # which is resistant to timing attacks
        token = service.derive_public_token("testuser", 1)

        # Create a token that differs by one character
        invalid_token = token[:-1] + ("a" if token[-1] != "a" else "b")

        # Both should return False, but timing should be similar
        # (This is more of a documentation test - actual timing attack
        # resistance is provided by hmac.compare_digest)
        assert service.verify_public_token("testuser", token, 1) is True
        assert service.verify_public_token("testuser", invalid_token, 1) is False

    def test_special_characters_in_username(self, service):
        """Should handle usernames with allowed special characters."""
        usernames = ["user_123", "user-name", "user.name", "user123"]

        for username in usernames:
            token = service.derive_public_token(username, 1)
            assert service.verify_public_token(username, token, 1) is True

    def test_long_username(self, service):
        """Should handle long usernames."""
        long_username = "a" * 100
        token = service.derive_public_token(long_username, 1)

        assert service.verify_public_token(long_username, token, 1) is True

    def test_unicode_username(self, service):
        """Should handle unicode characters in username."""
        unicode_username = "user_测试_🚀"
        token = service.derive_public_token(unicode_username, 1)

        assert service.verify_public_token(unicode_username, token, 1) is True

    def test_high_version_numbers(self, service):
        """Should handle high version numbers."""
        token = service.derive_public_token("testuser", 999999)

        assert service.verify_public_token("testuser", token, 999999) is True

    def test_token_base64url_safe(self, service):
        """Generated tokens should be URL-safe."""
        token = service.derive_public_token("testuser", 1)

        # Remove psk_ prefix
        token_body = token[4:]

        # Should not contain characters that need URL encoding
        unsafe_chars = ["+", "/", "="]
        for char in unsafe_chars:
            assert char not in token_body, f"Token contains unsafe character: {char}"


class TestGetPublicTokenService:
    """Test the factory function for getting token service instance."""

    def test_get_service_returns_instance(self):
        """Should return PublicTokenService instance."""
        from app.services.public_token_service import get_public_token_service

        service = get_public_token_service()

        assert isinstance(service, PublicTokenService)

    def test_get_service_returns_singleton(self):
        """Should return same instance on multiple calls."""
        from app.services.public_token_service import get_public_token_service

        service1 = get_public_token_service()
        service2 = get_public_token_service()

        assert service1 is service2

    def test_service_uses_config_secret(self):
        """Should use GLOBAL_SECRET from config."""
        from app.services.public_token_service import get_public_token_service

        service = get_public_token_service()

        # Generate a token and verify it works
        token = service.derive_public_token("testuser", 1)
        assert service.verify_public_token("testuser", token, 1) is True
