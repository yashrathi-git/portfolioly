"""Tests for portfolio API routes."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.portfolio import PortfolioData, PersonalInfo
from app.schemas.auth import UserToken


class TestPortfolioRoutes:
    """Test portfolio API endpoints."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def mock_user_token(self):
        return UserToken(
            uid="test_user_123",
            email="test@example.com",
            email_verified=True,
            name="Test User",
        )

    @pytest.fixture
    def sample_portfolio_data(self):
        return PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                headline="Software Engineer",
                email="john@example.com",
            )
        )

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_get_portfolio_success(
        self,
        mock_get_service,
        mock_auth,
        client,
        mock_user_token,
        sample_portfolio_data,
    ):
        """Test successful portfolio retrieval."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.get_portfolio_data.return_value = sample_portfolio_data
        mock_get_service.return_value = mock_service

        response = client.get("/portfolio/")

        assert response.status_code == 200
        data = response.json()
        assert data["personal_info"]["full_name"] == "John Doe"
        mock_service.get_portfolio_data.assert_called_once_with("test_user_123")

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_get_portfolio_not_found(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test portfolio retrieval when no portfolio exists."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.get_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        response = client.get("/portfolio/")

        assert response.status_code == 200
        assert response.json() is None

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_save_portfolio_success(
        self,
        mock_get_service,
        mock_auth,
        client,
        mock_user_token,
        sample_portfolio_data,
    ):
        """Test successful portfolio save."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.store_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        response = client.put("/portfolio/", json=sample_portfolio_data.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Portfolio saved successfully"
        mock_service.store_portfolio_data.assert_called_once()

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_delete_portfolio_success(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test successful portfolio deletion."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.delete_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        response = client.delete("/portfolio/")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Portfolio deleted successfully"
        mock_service.delete_portfolio_data.assert_called_once_with("test_user_123")

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_check_portfolio_exists_true(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test portfolio existence check when portfolio exists."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.portfolio_exists.return_value = True
        mock_get_service.return_value = mock_service

        response = client.get("/portfolio/exists")

        assert response.status_code == 200
        data = response.json()
        assert data["exists"] is True
        mock_service.portfolio_exists.assert_called_once_with("test_user_123")

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_check_portfolio_exists_false(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test portfolio existence check when portfolio doesn't exist."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.portfolio_exists.return_value = False
        mock_get_service.return_value = mock_service

        response = client.get("/portfolio/exists")

        assert response.status_code == 200
        data = response.json()
        assert data["exists"] is False
