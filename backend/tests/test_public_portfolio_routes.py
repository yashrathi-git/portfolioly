"""Tests for public portfolio API routes."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.portfolio import PortfolioData, PersonalInfo


class TestPublicPortfolioRoutes:
    """Test public portfolio API endpoints."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def sample_portfolio_data(self):
        return PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                headline="Software Engineer",
                email="john@example.com",
            )
        )

    @pytest.fixture
    def sample_user_settings(self):
        return {
            "user_id": "test_user_123",
            "username": "johndoe",
            "is_public": True,
            "public_token_enabled": True,
            "public_token_ver": 1,
        }

    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_without_token(
        self,
        mock_get_user_settings_service,
        mock_get_portfolio_service,
        client,
        sample_user_settings,
        sample_portfolio_data,
    ):
        """Test successful portfolio retrieval without token (backward compatible)."""
        # Mock user settings service
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            sample_user_settings
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        # Mock portfolio service
        mock_portfolio_service = Mock()
        mock_portfolio_service.get_portfolio_data.return_value = sample_portfolio_data
        mock_get_portfolio_service.return_value = mock_portfolio_service

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 200
        data = response.json()
        assert data["personal_info"]["full_name"] == "John Doe"
        mock_user_settings_service.get_user_settings_by_username.assert_called_once_with(
            "johndoe"
        )
        mock_portfolio_service.get_portfolio_data.assert_called_once_with(
            "test_user_123"
        )

    @patch("app.routes.public_portfolio.get_public_token_service")
    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_with_valid_token(
        self,
        mock_get_user_settings_service,
        mock_get_portfolio_service,
        mock_get_token_service,
        client,
        sample_user_settings,
        sample_portfolio_data,
    ):
        """Test successful portfolio retrieval with valid token."""
        # Mock user settings service
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            sample_user_settings
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        # Mock token service
        mock_token_service = Mock()
        mock_token_service.verify_public_token.return_value = True
        mock_get_token_service.return_value = mock_token_service

        # Mock portfolio service
        mock_portfolio_service = Mock()
        mock_portfolio_service.get_portfolio_data.return_value = sample_portfolio_data
        mock_get_portfolio_service.return_value = mock_portfolio_service

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_validtoken123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["personal_info"]["full_name"] == "John Doe"
        mock_token_service.verify_public_token.assert_called_once_with(
            "johndoe", "psk_validtoken123", 1
        )

    @patch("app.routes.public_portfolio.get_public_token_service")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_with_invalid_token(
        self,
        mock_get_user_settings_service,
        mock_get_token_service,
        client,
        sample_user_settings,
    ):
        """Test portfolio retrieval with invalid token returns 401."""
        # Mock user settings service
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            sample_user_settings
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        # Mock token service - return False for invalid token
        mock_token_service = Mock()
        mock_token_service.verify_public_token.return_value = False
        mock_get_token_service.return_value = mock_token_service

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_invalidtoken"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"

    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_with_malformed_auth_header(
        self,
        mock_get_user_settings_service,
        client,
        sample_user_settings,
    ):
        """Test portfolio retrieval with malformed authorization header returns 401."""
        # Mock user settings service
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            sample_user_settings
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "InvalidFormat token123"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"

    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_username_not_found(
        self,
        mock_get_user_settings_service,
        client,
    ):
        """Test portfolio retrieval for non-existent username returns 404."""
        # Mock user settings service - return None for non-existent username
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = None
        mock_get_user_settings_service.return_value = mock_user_settings_service

        response = client.get("/public/portfolio/nonexistent")

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_private_portfolio(
        self,
        mock_get_user_settings_service,
        client,
        sample_user_settings,
    ):
        """Test portfolio retrieval for private portfolio returns 404."""
        # Mock user settings service - return settings with is_public=False
        private_settings = sample_user_settings.copy()
        private_settings["is_public"] = False
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            private_settings
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_no_portfolio_data(
        self,
        mock_get_user_settings_service,
        mock_get_portfolio_service,
        client,
        sample_user_settings,
    ):
        """Test portfolio retrieval when no portfolio data exists returns 404."""
        # Mock user settings service
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            sample_user_settings
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        # Mock portfolio service - return None for no portfolio data
        mock_portfolio_service = Mock()
        mock_portfolio_service.get_portfolio_data.return_value = None
        mock_get_portfolio_service.return_value = mock_portfolio_service

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    @patch("app.routes.public_portfolio.get_public_token_service")
    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.get_user_settings_service")
    def test_get_public_portfolio_with_token_different_version(
        self,
        mock_get_user_settings_service,
        mock_get_portfolio_service,
        mock_get_token_service,
        client,
        sample_user_settings,
        sample_portfolio_data,
    ):
        """Test portfolio retrieval with token when version has changed returns 401."""
        # Mock user settings service with version 2
        settings_v2 = sample_user_settings.copy()
        settings_v2["public_token_ver"] = 2
        mock_user_settings_service = Mock()
        mock_user_settings_service.get_user_settings_by_username.return_value = (
            settings_v2
        )
        mock_get_user_settings_service.return_value = mock_user_settings_service

        # Mock token service - return False for old version token
        mock_token_service = Mock()
        mock_token_service.verify_public_token.return_value = False
        mock_get_token_service.return_value = mock_token_service

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_oldversiontoken"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"
        # Verify token was checked with version 2
        mock_token_service.verify_public_token.assert_called_once_with(
            "johndoe", "psk_oldversiontoken", 2
        )
