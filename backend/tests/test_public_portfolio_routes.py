"""Tests for public portfolio API routes."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.portfolio import PortfolioData, PersonalInfo
from app.schemas.auth import UserToken


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
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_without_token(
        self,
        mock_validate_access,
        mock_get_portfolio_service,
        client,
        sample_user_settings,
        sample_portfolio_data,
    ):
        """Test successful portfolio retrieval without token (backward compatible)."""
        # Mock validate_portfolio_access
        mock_validate_access.return_value = (sample_user_settings, None)

        # Mock portfolio service
        mock_portfolio_service = Mock()
        mock_portfolio_service.get_portfolio_data.return_value = sample_portfolio_data
        mock_get_portfolio_service.return_value = mock_portfolio_service

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 200
        data = response.json()
        assert data["personal_info"]["full_name"] == "John Doe"
        mock_validate_access.assert_called_once_with(
            username="johndoe", authorization=None, require_public=False
        )
        mock_portfolio_service.get_portfolio_data.assert_called_once_with(
            "test_user_123"
        )

    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_with_valid_token(
        self,
        mock_validate_access,
        mock_get_portfolio_service,
        client,
        sample_user_settings,
        sample_portfolio_data,
    ):
        """Test successful portfolio retrieval with valid token."""
        # Mock validate_portfolio_access
        mock_validate_access.return_value = (sample_user_settings, None)

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
        mock_validate_access.assert_called_once_with(
            username="johndoe",
            authorization="Bearer psk_validtoken123",
            require_public=False,
        )

    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_with_invalid_token(
        self,
        mock_validate_access,
        client,
    ):
        """Test portfolio retrieval with invalid token returns 401."""
        # Mock validate_portfolio_access to raise 401
        from fastapi import HTTPException

        mock_validate_access.side_effect = HTTPException(
            status_code=401, detail="Invalid token"
        )

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_invalidtoken"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"

    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_with_malformed_auth_header(
        self,
        mock_validate_access,
        client,
        sample_user_settings,
    ):
        """Test portfolio retrieval with malformed authorization header returns 401."""
        # Mock validate_portfolio_access to raise 401
        from fastapi import HTTPException

        mock_validate_access.side_effect = HTTPException(
            status_code=401, detail="Invalid token"
        )

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "InvalidFormat token123"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"

    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_username_not_found(
        self,
        mock_validate_access,
        client,
    ):
        """Test portfolio retrieval for non-existent username returns 404."""
        # Mock validate_portfolio_access to raise 404
        from fastapi import HTTPException

        mock_validate_access.side_effect = HTTPException(
            status_code=404, detail="Portfolio not found"
        )

        response = client.get("/public/portfolio/nonexistent")

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_private_portfolio(
        self,
        mock_validate_access,
        client,
    ):
        """Test portfolio retrieval for private portfolio returns 404."""
        # Mock validate_portfolio_access to raise 404 for private portfolio
        from fastapi import HTTPException

        mock_validate_access.side_effect = HTTPException(
            status_code=404, detail="Portfolio not found"
        )

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    @patch("app.routes.public_portfolio.get_portfolio_service")
    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_no_portfolio_data(
        self,
        mock_validate_access,
        mock_get_portfolio_service,
        client,
        sample_user_settings,
    ):
        """Test portfolio retrieval when no portfolio data exists returns 404."""
        # Mock validate_portfolio_access
        mock_validate_access.return_value = (sample_user_settings, None)

        # Mock portfolio service - return None for no portfolio data
        mock_portfolio_service = Mock()
        mock_portfolio_service.get_portfolio_data.return_value = None
        mock_get_portfolio_service.return_value = mock_portfolio_service

        response = client.get("/public/portfolio/johndoe")

        assert response.status_code == 404
        assert response.json()["detail"] == "Portfolio not found"

    @patch("app.routes.public_portfolio.validate_portfolio_access")
    def test_get_public_portfolio_with_token_different_version(
        self,
        mock_validate_access,
        client,
    ):
        """Test portfolio retrieval with token when version has changed returns 401."""
        # Mock validate_portfolio_access to raise 401 for invalid token version
        from fastapi import HTTPException

        mock_validate_access.side_effect = HTTPException(
            status_code=401, detail="Invalid token"
        )

        response = client.get(
            "/public/portfolio/johndoe",
            headers={"Authorization": "Bearer psk_oldversiontoken"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"
