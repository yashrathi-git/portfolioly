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
        mock_service.get_portfolio_data.return_value = None  # No existing portfolio
        mock_service.store_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        response = client.put(
            "/portfolio/", json=sample_portfolio_data.model_dump(mode="json")
        )

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

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_save_portfolio_flushes_stale_labels_on_url_change(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test that profile labels are flushed when URL changes."""
        from app.schemas.portfolio import Profile, ProfileType

        mock_auth.return_value = mock_user_token
        mock_service = Mock()

        # Existing portfolio with a profile that has a label
        existing_portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                profiles=[
                    Profile(
                        type=ProfileType.GITHUB,
                        url="https://github.com/olduser",
                        label="Old GitHub",
                    )
                ],
            )
        )
        mock_service.get_portfolio_data.return_value = existing_portfolio
        mock_service.store_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        # New portfolio with changed URL but same type
        new_portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                profiles=[
                    Profile(
                        type=ProfileType.GITHUB,
                        url="https://github.com/newuser",
                        label="My GitHub",  # This should be flushed
                    )
                ],
            )
        )

        response = client.put(
            "/portfolio/",
            json=new_portfolio.model_dump(mode="json"),
        )

        assert response.status_code == 200

        # Verify store was called with label flushed
        call_args = mock_service.store_portfolio_data.call_args
        stored_portfolio = call_args[0][1]
        assert stored_portfolio.personal_info.profiles[0].label is None

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_save_portfolio_flushes_stale_labels_on_type_change(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test that profile labels are flushed when type changes."""
        from app.schemas.portfolio import Profile, ProfileType

        mock_auth.return_value = mock_user_token
        mock_service = Mock()

        # Existing portfolio with a profile
        existing_portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                profiles=[
                    Profile(
                        type=ProfileType.GITHUB,
                        url="https://example.com",
                        label="GitHub",
                    )
                ],
            )
        )
        mock_service.get_portfolio_data.return_value = existing_portfolio
        mock_service.store_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        # New portfolio with same URL but different type
        new_portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                profiles=[
                    Profile(
                        type=ProfileType.WEBSITE,
                        url="https://example.com",
                        label="My Website",  # This should be flushed
                    )
                ],
            )
        )

        response = client.put(
            "/portfolio/",
            json=new_portfolio.model_dump(mode="json"),
        )

        assert response.status_code == 200

        # Verify store was called with label flushed
        call_args = mock_service.store_portfolio_data.call_args
        stored_portfolio = call_args[0][1]
        assert stored_portfolio.personal_info.profiles[0].label is None

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_save_portfolio_preserves_label_when_url_and_type_match(
        self, mock_get_service, mock_auth, client, mock_user_token
    ):
        """Test that profile labels are preserved when URL and type don't change."""
        from app.schemas.portfolio import Profile, ProfileType

        mock_auth.return_value = mock_user_token
        mock_service = Mock()

        # Existing portfolio with a profile
        existing_portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                profiles=[
                    Profile(
                        type=ProfileType.GITHUB,
                        url="https://github.com/user",
                        label="Old Label",
                    )
                ],
            )
        )
        mock_service.get_portfolio_data.return_value = existing_portfolio
        mock_service.store_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        # New portfolio with same URL and type but new label
        new_portfolio = PortfolioData(
            personal_info=PersonalInfo(
                full_name="John Doe",
                profiles=[
                    Profile(
                        type=ProfileType.GITHUB,
                        url="https://github.com/user",
                        label="New Label",  # This should be kept
                    )
                ],
            )
        )

        response = client.put(
            "/portfolio/",
            json=new_portfolio.model_dump(mode="json"),
        )

        assert response.status_code == 200

        # Verify store was called with new label preserved
        call_args = mock_service.store_portfolio_data.call_args
        stored_portfolio = call_args[0][1]
        assert stored_portfolio.personal_info.profiles[0].label == "New Label"

    @patch("app.routes.portfolio.require_verified_email")
    @patch("app.routes.portfolio.get_portfolio_service")
    def test_save_portfolio_uses_preserve_brandfetch_false(
        self,
        mock_get_service,
        mock_auth,
        client,
        mock_user_token,
        sample_portfolio_data,
    ):
        """Test that save_portfolio calls store with preserve_brandfetch=False."""
        mock_auth.return_value = mock_user_token
        mock_service = Mock()
        mock_service.get_portfolio_data.return_value = None
        mock_service.store_portfolio_data.return_value = None
        mock_get_service.return_value = mock_service

        response = client.put(
            "/portfolio/",
            json=sample_portfolio_data.model_dump(mode="json"),
        )

        assert response.status_code == 200

        # Verify preserve_brandfetch=False was passed
        call_args = mock_service.store_portfolio_data.call_args
        assert call_args[1]["preserve_brandfetch"] is False
