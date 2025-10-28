"""
Tests for username uniqueness and access control functionality.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.user_settings_service import UserSettingsService

client = TestClient(app)


class TestUsernameValidation:
    """Test username validation rules."""

    def test_username_validation_rules(self):
        """Test username validation with various inputs."""
        service = UserSettingsService()

        test_cases = [
            ("ab", False, "too short"),
            ("a" * 31, False, "too long"),
            ("valid_username", True, "valid"),
            ("valid-username", True, "valid with hyphen"),
            ("123username", True, "valid with numbers"),
            ("_invalid", False, "starts with underscore"),
            ("invalid_", False, "ends with underscore"),
            ("-invalid", False, "starts with hyphen"),
            ("invalid-", False, "ends with hyphen"),
            ("invalid@username", False, "contains special chars"),
            ("admin", False, "reserved word"),
            ("API", False, "reserved word case insensitive"),
        ]

        for username, should_be_valid, description in test_cases:
            result = service.validate_username(username)
            assert (
                result["valid"] == should_be_valid
            ), f"Failed for {description}: {username}"


class TestAccessControl:
    """Test access control for public/private portfolios."""

    def test_public_portfolio_access_allowed(self, mock_verified_user):
        """Test that public portfolios are accessible via public API."""
        username = "publicuser"

        with patch(
            "app.routes.utils.auth_helpers.get_user_settings_by_username"
        ) as mock_get_settings, patch(
            "app.routes.public_portfolio.get_portfolio_service"
        ) as mock_get_portfolio_service:

            mock_get_settings.return_value = {
                "user_id": "user123",
                "username": username,
                "chat_settings": {"access_mode": "public"},
            }

            mock_portfolio_data = {
                "personal_info": {
                    "full_name": "Public User",
                    "headline": "Software Engineer",
                }
            }
            mock_portfolio_service = Mock()
            mock_portfolio_service.get_portfolio_data.return_value = mock_portfolio_data
            mock_get_portfolio_service.return_value = mock_portfolio_service

            response = client.get(f"/public/portfolio/{username}")

            assert response.status_code == 200
            data = response.json()
            assert data["personal_info"]["full_name"] == "Public User"
            assert data["personal_info"]["headline"] == "Software Engineer"

    def test_private_portfolio_access_denied(self, mock_verified_user):
        """Test that private portfolios return 404 via public API."""
        username = "privateuser"

        with patch(
            "app.routes.utils.auth_helpers.get_user_settings_by_username"
        ) as mock_get_settings:

            mock_get_settings.return_value = {
                "user_id": "user123",
                "username": username,
                "chat_settings": {"access_mode": "private"},
            }

            response = client.get(f"/public/portfolio/{username}")

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()

    def test_nonexistent_username_access_denied(self, mock_verified_user):
        """Test that non-existent usernames return 404."""
        username = "nonexistent"

        with patch(
            "app.routes.utils.auth_helpers.get_user_settings_by_username"
        ) as mock_get_settings:

            mock_get_settings.return_value = None

            response = client.get(f"/public/portfolio/{username}")

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()

    def test_username_availability_check_accuracy(self, mock_verified_user):
        """Test username availability checking accuracy."""
        # Test available username
        with patch(
            "app.routes.public_portfolio.get_user_settings_by_username"
        ) as mock_get_settings, patch(
            "app.routes.public_portfolio.get_user_settings_service"
        ) as mock_get_service, patch(
            "app.routes.utils.auth_helpers.get_firebase_auth"
        ) as mock_firebase:

            # Mock Firebase auth
            mock_auth = Mock()
            mock_auth.verify_id_token.return_value = {
                "uid": "test_user_123",
                "email": "test@example.com",
                "email_verified": True,
            }
            mock_firebase.return_value = mock_auth

            mock_get_settings.return_value = None
            mock_service = Mock()
            mock_service.validate_username.return_value = {"valid": True}
            mock_get_service.return_value = mock_service

            response = client.get(
                "/public/username/available_username/available",
                headers={"Authorization": "Bearer fake_token"},
            )

            assert response.status_code == 200
            assert response.json()["available"] is True

        # Test taken username
        with patch(
            "app.routes.public_portfolio.get_user_settings_by_username"
        ) as mock_get_settings, patch(
            "app.routes.public_portfolio.get_user_settings_service"
        ) as mock_get_service, patch(
            "app.routes.utils.auth_helpers.get_firebase_auth"
        ) as mock_firebase:

            # Mock Firebase auth
            mock_auth = Mock()
            mock_auth.verify_id_token.return_value = {
                "uid": "test_user_123",
                "email": "test@example.com",
                "email_verified": True,
            }
            mock_firebase.return_value = mock_auth

            mock_get_settings.return_value = {
                "user_id": "other_user",
                "username": "taken_username",
            }
            mock_service = Mock()
            mock_service.validate_username.return_value = {"valid": True}
            mock_get_service.return_value = mock_service

            response = client.get(
                "/public/username/taken_username/available",
                headers={"Authorization": "Bearer fake_token"},
            )

            assert response.status_code == 200
            assert response.json()["available"] is False
            assert "reason" in response.json()

    def test_invalid_username_format_rejected(self, mock_verified_user):
        """Test that invalid username formats are rejected."""
        with patch(
            "app.routes.public_portfolio.get_user_settings_service"
        ) as mock_get_service, patch(
            "app.routes.utils.auth_helpers.get_firebase_auth"
        ) as mock_firebase:

            # Mock Firebase auth
            mock_auth = Mock()
            mock_auth.verify_id_token.return_value = {
                "uid": "test_user_123",
                "email": "test@example.com",
                "email_verified": True,
            }
            mock_firebase.return_value = mock_auth

            mock_service = Mock()
            mock_service.validate_username.return_value = {
                "valid": False,
                "error": "Username too short",
            }
            mock_get_service.return_value = mock_service

            response = client.get(
                "/public/username/ab/available",
                headers={"Authorization": "Bearer fake_token"},
            )

            assert response.status_code == 200
            assert response.json()["available"] is False
            assert response.json()["reason"] == "Username too short"


class TestPortfolioVisibilityControl:
    """Test portfolio visibility control functionality."""

    def test_make_portfolio_public_requires_username(self, mock_verified_user):
        """Test that making portfolio public requires a username."""
        with patch(
            "app.routes.user_settings.get_user_settings_service"
        ) as mock_get_service:

            mock_service = Mock()
            mock_service.get_user_settings.return_value = {
                "user_id": "test_user_123",
                "username": None,
                "chat_settings": {"access_mode": "private"},
            }
            mock_get_service.return_value = mock_service

            response = client.put(
                "/users/me/settings/visibility",
                json={"access_mode": "public"},
            )

            assert response.status_code == 400
            assert "username is required" in response.json()["detail"].lower()

    def test_make_portfolio_public_with_username_succeeds(self, mock_verified_user):
        """Test that making portfolio public succeeds when user has username."""
        with patch(
            "app.routes.user_settings.get_user_settings_service"
        ) as mock_get_service:

            mock_service = Mock()
            mock_service.get_user_settings.return_value = {
                "user_id": "test_user_123",
                "username": "testuser",
                "chat_settings": {"access_mode": "private"},
            }
            mock_get_service.return_value = mock_service

            response = client.put(
                "/users/me/settings/visibility",
                json={"access_mode": "public"},
            )

            assert response.status_code == 200
            assert "public" in response.json()["message"].lower()
            assert response.json()["access_mode"] == "public"

            mock_service.update_access_mode.assert_called_once_with(
                "test_user_123", "public"
            )

    def test_make_portfolio_private_always_succeeds(self, mock_verified_user):
        """Test that making portfolio private always succeeds."""
        with patch(
            "app.routes.user_settings.get_user_settings_service"
        ) as mock_get_service:

            mock_service = Mock()
            mock_get_service.return_value = mock_service

            response = client.put(
                "/users/me/settings/visibility",
                json={"access_mode": "private"},
            )

            assert response.status_code == 200
            assert "private" in response.json()["message"].lower()
            assert response.json()["access_mode"] == "private"

            mock_service.update_access_mode.assert_called_once_with(
                "test_user_123", "private"
            )


class TestAccessModeUpdate:
    """Test access mode update functionality."""

    def test_update_access_mode_to_private(self, mock_verified_user):
        """Test updating access mode to private."""
        with patch(
            "app.routes.user_settings.get_user_settings_service"
        ) as mock_get_service:

            mock_service = Mock()
            mock_get_service.return_value = mock_service

            response = client.patch(
                "/users/me/settings/access-mode",
                json={"access_mode": "private"},
            )

            assert response.status_code == 200
            assert response.json()["success"] is True
            assert response.json()["access_mode"] == "private"

            mock_service.update_access_mode.assert_called_once_with(
                "test_user_123", "private"
            )

    def test_update_access_mode_to_public(self, mock_verified_user):
        """Test updating access mode to public."""
        with patch(
            "app.routes.user_settings.get_user_settings_service"
        ) as mock_get_service:

            mock_service = Mock()
            mock_get_service.return_value = mock_service

            response = client.patch(
                "/users/me/settings/access-mode",
                json={"access_mode": "public"},
            )

            assert response.status_code == 200
            assert response.json()["success"] is True
            assert response.json()["access_mode"] == "public"

            mock_service.update_access_mode.assert_called_once_with(
                "test_user_123", "public"
            )

    def test_update_access_mode_invalid_value(self, mock_verified_user):
        """Test updating access mode with invalid value."""
        response = client.patch(
            "/users/me/settings/access-mode", json={"access_mode": "invalid"}
        )

        assert response.status_code == 422  # Validation error

    def test_update_access_mode_requires_authentication(self):
        """Test that access mode update requires authentication."""
        response = client.patch(
            "/users/me/settings/access-mode", json={"access_mode": "private"}
        )

        assert response.status_code == 401
