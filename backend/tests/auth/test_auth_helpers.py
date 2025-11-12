"""Comprehensive tests for authentication helper functions."""

import pytest
from unittest.mock import patch, Mock
from fastapi import HTTPException

from app.routes.utils.auth_helpers import (
    extract_bearer_token,
    verify_firebase_jwt,
    verify_public_token,
    validate_portfolio_access,
    get_user_settings_by_username,
)
from app.schemas.auth import UserToken


class TestExtractBearerToken:
    """Test token extraction from Authorization header."""

    def test_extract_valid_bearer_token(self):
        """Should extract token from valid Bearer format."""
        auth_header = "Bearer abc123xyz"
        result = extract_bearer_token(auth_header)
        assert result == "abc123xyz"

    def test_extract_token_with_spaces(self):
        """Should handle tokens with various formats."""
        auth_header = "Bearer   token_with_spaces  "
        result = extract_bearer_token(auth_header)
        assert result == "  token_with_spaces  "

    def test_extract_psk_token(self):
        """Should extract PSK tokens."""
        auth_header = "Bearer psk_abcdefghijklmnopqrstuvwxyz123456"
        result = extract_bearer_token(auth_header)
        assert result == "psk_abcdefghijklmnopqrstuvwxyz123456"

    def test_none_authorization(self):
        """Should return None for None input."""
        result = extract_bearer_token(None)
        assert result is None

    def test_empty_string(self):
        """Should return None for empty string."""
        result = extract_bearer_token("")
        assert result is None

    def test_invalid_format_no_bearer(self):
        """Should return None if 'Bearer ' prefix is missing."""
        result = extract_bearer_token("Token abc123")
        assert result is None

    def test_invalid_format_lowercase(self):
        """Should return None for lowercase 'bearer'."""
        result = extract_bearer_token("bearer abc123")
        assert result is None

    def test_bearer_only(self):
        """Should handle 'Bearer ' with no token."""
        result = extract_bearer_token("Bearer ")
        assert result == ""


class TestVerifyFirebaseJWT:
    """Test Firebase JWT verification."""

    @patch("app.routes.utils.auth_helpers.get_firebase_auth")
    def test_verify_valid_jwt(self, mock_get_auth):
        """Should return UserToken for valid JWT."""
        mock_auth = Mock()
        mock_auth.verify_id_token.return_value = {
            "uid": "user123",
            "email": "test@example.com",
            "email_verified": True,
        }
        mock_get_auth.return_value = mock_auth

        result = verify_firebase_jwt("valid_jwt_token")

        assert result is not None
        assert isinstance(result, UserToken)
        assert result.uid == "user123"
        assert result.email == "test@example.com"
        assert result.email_verified is True

    @patch("app.routes.utils.auth_helpers.get_firebase_auth")
    def test_verify_invalid_jwt(self, mock_get_auth):
        """Should return None for invalid JWT."""
        mock_auth = Mock()
        mock_auth.verify_id_token.side_effect = Exception("Invalid token")
        mock_get_auth.return_value = mock_auth

        result = verify_firebase_jwt("invalid_token")

        assert result is None

    @patch("app.routes.utils.auth_helpers.get_firebase_auth")
    def test_verify_expired_jwt(self, mock_get_auth):
        """Should return None for expired JWT."""
        mock_auth = Mock()
        mock_auth.verify_id_token.side_effect = Exception("Token expired")
        mock_get_auth.return_value = mock_auth

        result = verify_firebase_jwt("expired_token")

        assert result is None


class TestVerifyPublicToken:
    """Test public token verification."""

    @patch("app.routes.utils.auth_helpers.get_user_settings_service")
    @patch("app.routes.utils.auth_helpers.get_public_token_service")
    def test_verify_valid_public_token(
        self, mock_get_token_service, mock_get_settings_service
    ):
        """Should return True for valid public token."""
        mock_settings_service = Mock()
        mock_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "user123",
            "username": "johndoe",
            "public_token_ver": 1,
        }
        mock_get_settings_service.return_value = mock_settings_service

        mock_token_service = Mock()
        mock_token_service.verify_public_token.return_value = True
        mock_get_token_service.return_value = mock_token_service

        result = verify_public_token("johndoe", "psk_validtoken")

        assert result is True
        mock_token_service.verify_public_token.assert_called_once_with(
            "johndoe", "psk_validtoken", 1
        )

    @patch("app.routes.utils.auth_helpers.get_user_settings_service")
    def test_verify_token_username_not_found(self, mock_get_settings_service):
        """Should return False if username doesn't exist."""
        mock_settings_service = Mock()
        mock_settings_service.get_user_settings_by_username.return_value = None
        mock_get_settings_service.return_value = mock_settings_service

        result = verify_public_token("nonexistent", "psk_token")

        assert result is False

    @patch("app.routes.utils.auth_helpers.get_user_settings_service")
    @patch("app.routes.utils.auth_helpers.get_public_token_service")
    def test_verify_invalid_public_token(
        self, mock_get_token_service, mock_get_settings_service
    ):
        """Should return False for invalid token."""
        mock_settings_service = Mock()
        mock_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "user123",
            "username": "johndoe",
            "public_token_ver": 1,
        }
        mock_get_settings_service.return_value = mock_settings_service

        mock_token_service = Mock()
        mock_token_service.verify_public_token.return_value = False
        mock_get_token_service.return_value = mock_token_service

        result = verify_public_token("johndoe", "psk_invalidtoken")

        assert result is False

    @patch("app.routes.utils.auth_helpers.get_user_settings_service")
    @patch("app.routes.utils.auth_helpers.get_public_token_service")
    def test_verify_token_version_mismatch(
        self, mock_get_token_service, mock_get_settings_service
    ):
        """Should return False when token version doesn't match."""
        mock_settings_service = Mock()
        mock_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "user123",
            "username": "johndoe",
            "public_token_ver": 2,  # Version incremented
        }
        mock_get_settings_service.return_value = mock_settings_service

        mock_token_service = Mock()
        mock_token_service.verify_public_token.return_value = False
        mock_get_token_service.return_value = mock_token_service

        result = verify_public_token("johndoe", "psk_oldtoken")

        assert result is False


class TestValidatePortfolioAccess:
    """Test comprehensive portfolio access validation."""

    @pytest.fixture
    def public_user_settings(self):
        return {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
            "public_token_ver": 1,
        }

    @pytest.fixture
    def private_user_settings(self):
        return {
            "user_id": "owner456",
            "username": "janedoe",
            "chat_settings": {"access_mode": "private"},
            "public_token_ver": 1,
        }

    # No Authentication Tests
    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    def test_no_token_returns_401(
        self, mock_extract_token, mock_get_settings, public_user_settings
    ):
        """SECURITY: No token should always return 401."""
        mock_get_settings.return_value = public_user_settings
        mock_extract_token.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access("johndoe", authorization=None)

        assert exc_info.value.status_code == 401
        assert "Authentication required" in exc_info.value.detail

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    def test_username_not_found(self, mock_get_settings):
        """Should return 404 if username doesn't exist."""
        mock_get_settings.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access("nonexistent", authorization="Bearer token")

        assert exc_info.value.status_code == 404
        assert "Portfolio not found" in exc_info.value.detail

    # Firebase JWT Owner Access Tests
    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    def test_owner_firebase_jwt_grants_access(
        self,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        private_user_settings,
    ):
        """Owner with Firebase JWT should access their own portfolio (even if private)."""
        mock_get_settings.return_value = private_user_settings
        mock_extract_token.return_value = "firebase_jwt"

        owner_token = UserToken(
            uid="owner456",  # Matches private_user_settings.user_id
            email="janedoe@example.com",
            email_verified=True,
        )
        mock_verify_jwt.return_value = owner_token

        user_settings, firebase_user = validate_portfolio_access(
            "janedoe", authorization="Bearer firebase_jwt"
        )

        assert user_settings == private_user_settings
        assert firebase_user == owner_token

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_non_owner_firebase_jwt_denied(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        public_user_settings,
    ):
        """SECURITY: Non-owner with Firebase JWT should not access other portfolios."""
        mock_get_settings.return_value = public_user_settings
        mock_extract_token.return_value = "firebase_jwt"

        different_user = UserToken(
            uid="different_user_789",  # NOT owner123
            email="different@example.com",
            email_verified=True,
        )
        mock_verify_jwt.return_value = different_user
        mock_verify_public_token.return_value = False  # Not a valid public token

        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access("johndoe", authorization="Bearer firebase_jwt")

        assert exc_info.value.status_code == 401
        assert "Invalid token" in exc_info.value.detail

    # Public Token Access Tests
    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_valid_psk_token_grants_access(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        public_user_settings,
    ):
        """Valid PSK token should grant access regardless of access_mode."""
        mock_get_settings.return_value = public_user_settings
        mock_extract_token.return_value = "psk_validtoken"
        mock_verify_jwt.return_value = None  # Not a Firebase JWT
        mock_verify_public_token.return_value = True

        user_settings, firebase_user = validate_portfolio_access(
            "johndoe", authorization="Bearer psk_validtoken", require_public=False
        )

        assert user_settings == public_user_settings
        assert firebase_user is None

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_valid_psk_token_private_portfolio(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        private_user_settings,
    ):
        """Valid PSK token grants access even to private portfolios."""
        mock_get_settings.return_value = private_user_settings
        mock_extract_token.return_value = "psk_validtoken"
        mock_verify_jwt.return_value = None
        mock_verify_public_token.return_value = True

        user_settings, firebase_user = validate_portfolio_access(
            "janedoe", authorization="Bearer psk_validtoken", require_public=False
        )

        assert user_settings == private_user_settings
        assert firebase_user is None

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_invalid_psk_token_denied(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        public_user_settings,
    ):
        """Invalid PSK token should return 401."""
        mock_get_settings.return_value = public_user_settings
        mock_extract_token.return_value = "psk_invalidtoken"
        mock_verify_jwt.return_value = None
        mock_verify_public_token.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access(
                "johndoe", authorization="Bearer psk_invalidtoken"
            )

        assert exc_info.value.status_code == 401
        assert "Invalid token" in exc_info.value.detail

    # require_public Parameter Tests
    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_require_public_true_with_private_portfolio(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        private_user_settings,
    ):
        """With require_public=True, private portfolios should return 404 for public tokens."""
        mock_get_settings.return_value = private_user_settings
        mock_extract_token.return_value = "psk_validtoken"
        mock_verify_jwt.return_value = None
        mock_verify_public_token.return_value = True

        with pytest.raises(HTTPException) as exc_info:
            validate_portfolio_access(
                "janedoe", authorization="Bearer psk_validtoken", require_public=True
            )

        assert exc_info.value.status_code == 404
        assert "Portfolio not found" in exc_info.value.detail

    @patch("app.routes.utils.auth_helpers.get_user_settings_by_username")
    @patch("app.routes.utils.auth_helpers.extract_bearer_token")
    @patch("app.routes.utils.auth_helpers.verify_firebase_jwt")
    @patch("app.routes.utils.auth_helpers.verify_public_token")
    def test_require_public_true_with_public_portfolio(
        self,
        mock_verify_public_token,
        mock_verify_jwt,
        mock_extract_token,
        mock_get_settings,
        public_user_settings,
    ):
        """With require_public=True, public portfolios should grant access."""
        mock_get_settings.return_value = public_user_settings
        mock_extract_token.return_value = "psk_validtoken"
        mock_verify_jwt.return_value = None
        mock_verify_public_token.return_value = True

        user_settings, firebase_user = validate_portfolio_access(
            "johndoe", authorization="Bearer psk_validtoken", require_public=True
        )

        assert user_settings == public_user_settings
        assert firebase_user is None
