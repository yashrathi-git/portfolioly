"""Integration tests for authentication security fixes."""

import pytest
from unittest.mock import patch, Mock
from fastapi import HTTPException

from app.routes.utils.auth_helpers import validate_portfolio_access
from app.schemas.auth import UserToken


class TestAuthenticationSecurityFixes:
    """Test that authentication security vulnerabilities are fixed."""

    @pytest.fixture
    def sample_user_settings(self):
        return {
            "user_id": "owner_user_123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
            "public_token_enabled": True,
            "public_token_ver": 1,
        }

    @pytest.fixture
    def private_user_settings(self):
        return {
            "user_id": "owner_user_456",
            "username": "janedoe",
            "chat_settings": {"access_mode": "private"},
            "public_token_enabled": True,
            "public_token_ver": 1,
        }

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    def test_no_token_returns_401(
        self, mock_extract_token, mock_get_settings, sample_user_settings
    ):
        """SECURITY FIX: No token should return 401, not allow access."""
        mock_get_settings.return_value = sample_user_settings
        mock_extract_token.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access("johndoe", authorization=None)

        assert exc_info.value.status_code == 401
        assert "Authentication required" in exc_info.value.detail

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    def test_firebase_jwt_non_owner_denied(
        self,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        sample_user_settings,
    ):
        """SECURITY FIX: Firebase JWT from non-owner should not grant access."""
        mock_get_settings.return_value = sample_user_settings
        mock_extract_token.return_value = "valid_jwt_token"

        # Mock Firebase JWT for a DIFFERENT user (not the owner)
        different_user = UserToken(
            uid="different_user_789",  # Not owner_user_123
            email="different@example.com",
            email_verified=True,
        )
        mock_verify_jwt.return_value = different_user

        # Should raise 401 because JWT user doesn't own the username
        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access("johndoe", authorization="Bearer jwt_token")

        assert exc_info.value.status_code == 401
        assert "Invalid token" in exc_info.value.detail

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    def test_firebase_jwt_owner_granted_access(
        self,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        private_user_settings,
    ):
        """Owner with Firebase JWT should access their own portfolio (even if private)."""
        mock_get_settings.return_value = private_user_settings
        mock_extract_token.return_value = "valid_jwt_token"

        # Mock Firebase JWT for the OWNER
        owner_user = UserToken(
            uid="owner_user_456",  # Matches private_user_settings.user_id
            email="janedoe@example.com",
            email_verified=True,
        )
        mock_verify_jwt.return_value = owner_user

        # Should succeed - owner can access their own private portfolio
        user_settings, firebase_user = validate_portfolio_access(
            "janedoe", authorization="Bearer jwt_token", require_public=True
        )

        assert user_settings == private_user_settings
        assert firebase_user == owner_user

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_public_token_private_portfolio_allowed(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        private_user_settings,
    ):
        """Valid public token grants access even to private portfolios (token is the authorization)."""
        mock_get_settings.return_value = private_user_settings
        mock_extract_token.return_value = "psk_validtoken"
        mock_verify_jwt.return_value = None  # Not a Firebase JWT
        mock_verify_public_token.return_value = True  # Valid public token

        # Should succeed - valid PSK token is sufficient authorization
        user_settings, firebase_user = validate_portfolio_access(
            "janedoe", authorization="Bearer psk_validtoken", require_public=False
        )

        assert user_settings == private_user_settings
        assert firebase_user is None

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_public_token_public_portfolio_granted(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        sample_user_settings,
    ):
        """Public token should access public portfolios."""
        mock_get_settings.return_value = sample_user_settings
        mock_extract_token.return_value = "psk_validtoken"
        mock_verify_jwt.return_value = None  # Not a Firebase JWT
        mock_verify_public_token.return_value = True  # Valid public token

        # Should succeed - public token can access public portfolio
        user_settings, firebase_user = validate_portfolio_access(
            "johndoe", authorization="Bearer psk_validtoken", require_public=True
        )

        assert user_settings == sample_user_settings
        assert firebase_user is None

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_invalid_token_denied(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        sample_user_settings,
    ):
        """Invalid token should return 401."""
        mock_get_settings.return_value = sample_user_settings
        mock_extract_token.return_value = "invalid_token"
        mock_verify_jwt.return_value = None  # Not a valid Firebase JWT
        mock_verify_public_token.return_value = False  # Invalid public token

        # Should raise 401
        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access("johndoe", authorization="Bearer invalid_token")

        assert exc_info.value.status_code == 401
        assert "Invalid token" in exc_info.value.detail
