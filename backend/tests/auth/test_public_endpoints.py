"""Comprehensive integration tests for public portfolio endpoints."""

import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.portfolio import PortfolioData, PersonalInfo


class TestGetPublicPortfolio:
    """Test GET /public/portfolio/{username} endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def sample_portfolio(self):
        return PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                headline="Software Engineer",
                email="john@example.com",
            )
        )

    @pytest.fixture
    def public_settings(self):
        return {
            "user_id": "user123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
            "public_token_ver": 1,
        }

    @pytest.fixture
    def private_settings(self):
        return {
            "user_id": "user456",
            "username": "janedoe",
            "chat_settings": {"access_mode": "private"},
            "public_token_ver": 1,
        }

    # No Authentication Tests
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_no_auth_returns_401(self, mock_validate, client):
        """Should return 401 when no authentication is provided."""
        from fastapi import HTTPException

        mock_validate.side_effect = HTTPException(
            status_code=401, detail="Authentication required"
        )

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 401
        assert response.json()["detail"] == "Authentication required"

    # Owner Access with Firebase JWT
    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_owner_access_private_portfolio(
        self,
        mock_validate,
        mock_get_service,
        client,
        private_settings,
        sample_portfolio,
    ):
        """Owner should access their own private portfolio with Firebase JWT."""
        from app.schemas.auth import UserToken

        firebase_user = UserToken(
            uid="user456", email="janedoe@example.com", email_verified=True
        )
        mock_validate.return_value = (private_settings, firebase_user)

        mock_service = Mock()
        mock_service.get_portfolio_data.return_value = sample_portfolio
        mock_get_service.return_value = mock_service

        response = client.get(
            "/public/portfolio/janedoe",
            headers={"Authorization": "Bearer firebase_jwt_token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["personal_info"]["full_name"] == "John Doe"

    # Public Token Access
    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_valid_psk_token_access(
        self, mock_validate, mock_get_service, client, public_settings, sample_portfolio
    ):
        """Valid PSK token should grant access to portfolio."""
        mock_validate.return_value = (public_settings, None)

        mock_service = Mock()
        mock_service.get_portfolio_data.return_value = sample_portfolio
        mock_get_service.return_value = mock_service

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_validtoken123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["personal_info"]["full_name"] == "John Doe"

    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_invalid_psk_token_denied(self, mock_validate, client):
        """Invalid PSK token should return 401."""
        from fastapi import HTTPException

        mock_validate.side_effect = HTTPException(
            status_code=401, detail="Invalid token"
        )

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_invalidtoken"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"

    # Non-Owner Firebase JWT
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_non_owner_firebase_jwt_denied(self, mock_validate, client):
        """Non-owner with Firebase JWT should not access other portfolios."""
        from fastapi import HTTPException

        mock_validate.side_effect = HTTPException(
            status_code=401, detail="Invalid token"
        )

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer other_user_firebase_jwt"},
        )

        assert response.status_code == 401

    # Portfolio Not Found
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_username_not_found(self, mock_validate, client):
        """Should return 404 for non-existent username."""
        from fastapi import HTTPException

        mock_validate.side_effect = HTTPException(
            status_code=404, detail="Portfolio not found"
        )

        response = client.get(
            "/public/portfolio/nonexistent",
            headers={"Authorization": "Bearer psk_token"},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    # No Portfolio Data
    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_no_portfolio_data_returns_404(
        self, mock_validate, mock_get_service, client, public_settings
    ):
        """Should return 404 when user has no portfolio data."""
        mock_validate.return_value = (public_settings, None)

        mock_service = Mock()
        mock_service.get_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_validtoken"},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"


class TestEnsureToken:
    """Test POST /public/ensure-token endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def public_settings(self):
        return {
            "user_id": "user123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
            "public_token_enabled": True,
            "public_token_ver": 1,
        }

    @pytest.fixture
    def private_settings(self):
        return {
            "user_id": "user456",
            "username": "janedoe",
            "chat_settings": {"access_mode": "private"},
            "public_token_enabled": True,
            "public_token_ver": 1,
        }

    # Owner Access
    @patch("app.routes.public_portfolio.get_public_token_service")
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_owner_gets_token_for_private_portfolio(
        self,
        mock_get_settings,
        mock_extract_token,
        mock_verify_jwt,
        mock_get_token_service,
        client,
        private_settings,
    ):
        """Owner should get token for their own private portfolio."""
        from app.schemas.auth import UserToken

        mock_get_settings.return_value = private_settings
        mock_extract_token.return_value = "firebase_jwt"

        owner_token = UserToken(
            uid="user456", email="janedoe@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = owner_token

        mock_token_service = Mock()
        mock_token_service.derive_public_token.return_value = "psk_generated_token"
        mock_get_token_service.return_value = mock_token_service

        response = client.post(
            "/public/ensure-token",
            json={"username": "janedoe"},
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["token"] == "psk_generated_token"

    # Public Portfolio Access
    @patch("app.routes.public_portfolio.get_public_token_service")
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_public_portfolio_token_without_auth(
        self, mock_get_settings, mock_get_token_service, client, public_settings
    ):
        """Should generate token for public portfolio without authentication."""
        mock_get_settings.return_value = public_settings

        mock_token_service = Mock()
        mock_token_service.derive_public_token.return_value = "psk_public_token"
        mock_get_token_service.return_value = mock_token_service

        response = client.post(
            "/public/ensure-token",
            json={"username": "johndoe"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["token"] == "psk_public_token"

    # Private Portfolio Without Auth
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_private_portfolio_without_auth_denied(
        self, mock_get_settings, client, private_settings
    ):
        """Should return 404 for private portfolio without authentication."""
        mock_get_settings.return_value = private_settings

        response = client.post(
            "/public/ensure-token",
            json={"username": "janedoe"},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    # Non-Owner Access
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_non_owner_private_portfolio_denied(
        self,
        mock_get_settings,
        mock_extract_token,
        mock_verify_jwt,
        client,
        private_settings,
    ):
        """Non-owner should not get token for private portfolio."""
        from app.schemas.auth import UserToken

        mock_get_settings.return_value = private_settings
        mock_extract_token.return_value = "firebase_jwt"

        different_user = UserToken(
            uid="different_user", email="other@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = different_user

        response = client.post(
            "/public/ensure-token",
            json={"username": "janedoe"},
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 404

    # Token Generation Disabled
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_token_generation_disabled(self, mock_get_settings, client):
        """Should return 404 when token generation is disabled."""
        settings = {
            "user_id": "user123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
            "public_token_enabled": False,  # Disabled
            "public_token_ver": 1,
        }
        mock_get_settings.return_value = settings

        response = client.post(
            "/public/ensure-token",
            json={"username": "johndoe"},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    # Username Not Found
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_username_not_found(self, mock_get_settings, client):
        """Should return 404 for non-existent username."""
        mock_get_settings.return_value = None

        response = client.post(
            "/public/ensure-token",
            json={"username": "nonexistent"},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    # Token Version
    @patch("app.routes.public_portfolio.get_public_token_service")
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    def test_token_uses_correct_version(
        self, mock_get_settings, mock_get_token_service, client
    ):
        """Should use correct token version from settings."""
        settings = {
            "user_id": "user123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public"},
            "public_token_enabled": True,
            "public_token_ver": 5,  # Custom version
        }
        mock_get_settings.return_value = settings

        mock_token_service = Mock()
        mock_token_service.derive_public_token.return_value = "psk_v5_token"
        mock_get_token_service.return_value = mock_token_service

        response = client.post(
            "/public/ensure-token",
            json={"username": "johndoe"},
        )

        assert response.status_code == 200
        mock_token_service.derive_public_token.assert_called_once_with("johndoe", 5)


class TestEnsureUsername:
    """Test POST /public/ensure-username endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    # Valid Request
    @patch("app.routes.public_portfolio.get_firebase_auth")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    def test_generate_username_from_email(
        self,
        mock_extract_token,
        mock_verify_jwt,
        mock_get_settings_service,
        mock_get_auth,
        client,
    ):
        """Should generate username from email for new user."""
        from app.schemas.auth import UserToken

        mock_extract_token.return_value = "firebase_jwt"

        firebase_user = UserToken(
            uid="user123", email="john.doe@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = firebase_user

        mock_settings_service = Mock()
        mock_settings_service.get_user_settings.return_value = (
            None  # No existing username
        )
        mock_settings_service.generate_username_from_email.return_value = "johndoe"
        mock_get_settings_service.return_value = mock_settings_service

        mock_auth = Mock()
        mock_user_record = Mock()
        mock_user_record.email = "john.doe@example.com"
        mock_auth.get_user.return_value = mock_user_record
        mock_get_auth.return_value = mock_auth

        response = client.post(
            "/public/ensure-username",
            json={"user_id": "user123"},
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "johndoe"
        mock_settings_service.set_username.assert_called_once_with("user123", "johndoe")

    # Existing Username
    @patch("app.routes.public_portfolio.get_user_settings_service")
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    def test_return_existing_username(
        self,
        mock_extract_token,
        mock_verify_jwt,
        mock_get_settings_service,
        client,
    ):
        """Should return existing username if user already has one."""
        from app.schemas.auth import UserToken

        mock_extract_token.return_value = "firebase_jwt"

        firebase_user = UserToken(
            uid="user123", email="john.doe@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = firebase_user

        mock_settings_service = Mock()
        mock_settings_service.get_user_settings.return_value = {
            "user_id": "user123",
            "username": "existinguser",
        }
        mock_get_settings_service.return_value = mock_settings_service

        response = client.post(
            "/public/ensure-username",
            json={"user_id": "user123"},
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "existinguser"
        mock_settings_service.set_username.assert_not_called()

    # No Authentication
    def test_no_auth_returns_422(self, client):
        """Should return 422 when required Authorization header is missing."""
        response = client.post(
            "/public/ensure-username",
            json={"user_id": "user123"},
        )

        # FastAPI returns 422 for missing required headers
        assert response.status_code == 422

    # Wrong User
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    def test_wrong_user_returns_403(self, mock_extract_token, mock_verify_jwt, client):
        """Should return 403 when JWT user doesn't match request user_id."""
        from app.schemas.auth import UserToken

        mock_extract_token.return_value = "firebase_jwt"

        firebase_user = UserToken(
            uid="different_user", email="other@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = firebase_user

        response = client.post(
            "/public/ensure-username",
            json={"user_id": "user123"},  # Different from JWT uid
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Unauthorized"


class TestUsernameAvailability:
    """Test GET /public/username/{username}/available endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    # Available Username
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    def test_username_available(
        self,
        mock_extract_token,
        mock_verify_jwt,
        mock_get_settings_service,
        mock_get_settings_by_username,
        client,
    ):
        """Should return available=true for unused username."""
        from app.schemas.auth import UserToken

        mock_extract_token.return_value = "firebase_jwt"

        firebase_user = UserToken(
            uid="user123", email="test@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = firebase_user

        mock_settings_service = Mock()
        mock_settings_service.validate_username.return_value = {"valid": True}
        mock_get_settings_service.return_value = mock_settings_service

        mock_get_settings_by_username.return_value = None  # Username not taken

        response = client.get(
            "/public/username/newusername/available",
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is True

    # Taken Username
    @patch("app.routes.public_portfolio.get_user_settings_by_username")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    def test_username_taken(
        self,
        mock_extract_token,
        mock_verify_jwt,
        mock_get_settings_service,
        mock_get_settings_by_username,
        client,
    ):
        """Should return available=false for taken username."""
        from app.schemas.auth import UserToken

        mock_extract_token.return_value = "firebase_jwt"

        firebase_user = UserToken(
            uid="user123", email="test@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = firebase_user

        mock_settings_service = Mock()
        mock_settings_service.validate_username.return_value = {"valid": True}
        mock_get_settings_service.return_value = mock_settings_service

        mock_get_settings_by_username.return_value = {
            "user_id": "other_user",
            "username": "takenusername",
        }

        response = client.get(
            "/public/username/takenusername/available",
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is False
        assert "already taken" in data["reason"].lower()

    # Invalid Format
    @patch("app.routes.public_portfolio.get_user_settings_service")
    @patch("app.routes.public_portfolio.verify_firebase_jwt")
    @patch("app.routes.public_portfolio.extract_bearer_token")
    def test_invalid_username_format(
        self,
        mock_extract_token,
        mock_verify_jwt,
        mock_get_settings_service,
        client,
    ):
        """Should return available=false for invalid username format."""
        from app.schemas.auth import UserToken

        mock_extract_token.return_value = "firebase_jwt"

        firebase_user = UserToken(
            uid="user123", email="test@example.com", email_verified=True
        )
        mock_verify_jwt.return_value = firebase_user

        mock_settings_service = Mock()
        mock_settings_service.validate_username.return_value = {
            "valid": False,
            "error": "Username must be alphanumeric",
        }
        mock_get_settings_service.return_value = mock_settings_service

        response = client.get(
            "/public/username/invalid@username/available",
            headers={"Authorization": "Bearer firebase_jwt"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is False
        assert "alphanumeric" in data["reason"].lower()

    # No Authentication
    def test_no_auth_returns_422(self, client):
        """Should return 422 when required Authorization header is missing."""
        response = client.get("/public/username/testuser/available")

        # FastAPI returns 422 for missing required headers
        assert response.status_code == 422
