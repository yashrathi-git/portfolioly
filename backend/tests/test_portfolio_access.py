"""Tests for portfolio access control dependency."""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException, Request

from app.dependencies.portfolio_access import (
    check_portfolio_access,
    PortfolioAccessError,
)
from app.schemas.auth import UserToken


@pytest.fixture
def mock_request():
    """Create a mock FastAPI request."""
    request = Mock(spec=Request)
    request.client.host = "127.0.0.1"
    return request


@pytest.fixture
def mock_user_settings_service():
    """Create a mock user settings service."""
    with patch("app.dependencies.portfolio_access.get_user_settings_service") as mock:
        yield mock.return_value


@pytest.fixture
def mock_verify_token():
    """Create a mock token verification function."""
    with patch("app.dependencies.portfolio_access.verify_firebase_token") as mock:
        yield mock


class TestPortfolioAccessControl:
    """Test portfolio access control dependency."""

    @pytest.mark.asyncio
    async def test_public_portfolio_unauthenticated_access(
        self, mock_request, mock_user_settings_service
    ):
        """Test that unauthenticated users can access public portfolios."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public", "enabled": True},
        }

        # Execute
        result = await check_portfolio_access(
            username="johndoe", request=mock_request, authorization=None
        )

        # Verify
        assert result == "owner123"
        mock_user_settings_service.get_user_settings_by_username.assert_called_once_with(
            "johndoe"
        )

    @pytest.mark.asyncio
    async def test_public_portfolio_authenticated_access(
        self, mock_request, mock_user_settings_service
    ):
        """Test that authenticated users can access public portfolios."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public", "enabled": True},
        }

        # Execute
        result = await check_portfolio_access(
            username="johndoe",
            request=mock_request,
            authorization="Bearer valid_token",
        )

        # Verify
        assert result == "owner123"

    @pytest.mark.asyncio
    async def test_private_portfolio_unauthenticated_denied(
        self, mock_request, mock_user_settings_service
    ):
        """Test that unauthenticated users cannot access private portfolios."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "private", "enabled": True},
        }

        # Execute & Verify
        with pytest.raises(PortfolioAccessError) as exc_info:
            await check_portfolio_access(
                username="johndoe", request=mock_request, authorization=None
            )

        assert exc_info.value.status_code == 401
        assert "Authentication required" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_private_portfolio_owner_access(
        self, mock_request, mock_user_settings_service, mock_verify_token
    ):
        """Test that portfolio owner can access their own private portfolio."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "private", "enabled": True},
        }

        mock_token = Mock(spec=UserToken)
        mock_token.uid = "owner123"
        mock_verify_token.return_value = mock_token

        # Execute
        result = await check_portfolio_access(
            username="johndoe",
            request=mock_request,
            authorization="Bearer valid_token",
        )

        # Verify
        assert result == "owner123"
        mock_verify_token.assert_called_once_with("Bearer valid_token")

    @pytest.mark.asyncio
    async def test_private_portfolio_non_owner_denied(
        self, mock_request, mock_user_settings_service, mock_verify_token
    ):
        """Test that non-owners cannot access private portfolios."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "private", "enabled": True},
        }

        mock_token = Mock(spec=UserToken)
        mock_token.uid = "different_user456"
        mock_verify_token.return_value = mock_token

        # Execute & Verify
        with pytest.raises(PortfolioAccessError) as exc_info:
            await check_portfolio_access(
                username="johndoe",
                request=mock_request,
                authorization="Bearer valid_token",
            )

        assert exc_info.value.status_code == 403
        assert "do not have permission" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_portfolio_not_found(self, mock_request, mock_user_settings_service):
        """Test that non-existent portfolios return 404."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = None

        # Execute & Verify
        with pytest.raises(HTTPException) as exc_info:
            await check_portfolio_access(
                username="nonexistent", request=mock_request, authorization=None
            )

        assert exc_info.value.status_code == 404
        assert "Portfolio not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_chat_disabled(self, mock_request, mock_user_settings_service):
        """Test that disabled chat returns 403."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "public", "enabled": False},
        }

        # Execute & Verify
        with pytest.raises(PortfolioAccessError) as exc_info:
            await check_portfolio_access(
                username="johndoe", request=mock_request, authorization=None
            )

        assert exc_info.value.status_code == 403
        assert "not enabled" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_default_public_access_when_no_chat_settings(
        self, mock_request, mock_user_settings_service
    ):
        """Test that portfolios without chat settings default to public access."""
        # Setup - no chat_settings field
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
        }

        # Execute
        result = await check_portfolio_access(
            username="johndoe", request=mock_request, authorization=None
        )

        # Verify - should allow access with default public mode
        assert result == "owner123"

    @pytest.mark.asyncio
    async def test_invalid_token_for_private_portfolio(
        self, mock_request, mock_user_settings_service, mock_verify_token
    ):
        """Test that invalid tokens are rejected for private portfolios."""
        # Setup
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "owner123",
            "username": "johndoe",
            "chat_settings": {"access_mode": "private", "enabled": True},
        }

        from app.auth.middleware import AuthenticationError

        mock_verify_token.side_effect = AuthenticationError(
            "Invalid token", "INVALID_TOKEN"
        )

        # Execute & Verify
        with pytest.raises(PortfolioAccessError) as exc_info:
            await check_portfolio_access(
                username="johndoe",
                request=mock_request,
                authorization="Bearer invalid_token",
            )

        assert exc_info.value.status_code == 401
        assert "Invalid authentication token" in str(exc_info.value.detail)
