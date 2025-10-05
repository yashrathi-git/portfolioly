"""
Tests for chat rate limiting functionality.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from fastapi import HTTPException, Request
from datetime import datetime, timedelta

from app.dependencies.chat_rate_limiting import (
    check_chat_ip_rate_limit,
    check_portfolio_owner_usage_limit,
    increment_portfolio_owner_usage,
    validate_chat_input_length,
    validate_system_prompt_length,
    validate_tool_arguments_length,
)
from app.constants.chat_config import ChatConfig


@pytest.fixture
def mock_request():
    """Create a mock FastAPI request."""
    request = Mock(spec=Request)
    request.client = Mock()
    request.client.host = "192.168.1.1"
    return request


@pytest.fixture
def mock_rate_limiter():
    """Create a mock rate limiter."""
    limiter = AsyncMock()
    limiter.check_rate_limit = AsyncMock()
    limiter.increment_counter = AsyncMock()
    return limiter


class TestIPRateLimiting:
    """Tests for IP-based rate limiting."""

    @pytest.mark.asyncio
    async def test_ip_rate_limit_allowed(self, mock_request, mock_rate_limiter):
        """Test that requests within limit are allowed."""
        mock_rate_limiter.check_rate_limit.return_value = (True, 10, 1234567890)
        mock_rate_limiter.increment_counter.return_value = 11

        username = "testuser"
        token = "psk_abc123def456"

        with patch(
            "app.dependencies.chat_rate_limiting.get_rate_limiter",
            return_value=mock_rate_limiter,
        ):
            ip_address = await check_chat_ip_rate_limit(mock_request, username, token)

        assert ip_address == "192.168.1.1"
        mock_rate_limiter.check_rate_limit.assert_called_once()
        # Verify the composite key includes IP, username, and token hash
        call_args = mock_rate_limiter.check_rate_limit.call_args
        assert "192.168.1.1_testuser_psk_abc1" in call_args[1]["user_id"]
        mock_rate_limiter.increment_counter.assert_called_once()

    @pytest.mark.asyncio
    async def test_ip_rate_limit_exceeded(self, mock_request, mock_rate_limiter):
        """Test that requests exceeding limit are rejected."""
        mock_rate_limiter.check_rate_limit.return_value = (False, 50, 1234567890)

        username = "testuser"
        token = "psk_abc123def456"

        with patch(
            "app.dependencies.chat_rate_limiting.get_rate_limiter",
            return_value=mock_rate_limiter,
        ):
            with pytest.raises(HTTPException) as exc_info:
                await check_chat_ip_rate_limit(mock_request, username, token)

        assert exc_info.value.status_code == 429
        assert "CHAT_IP_RATE_LIMIT_EXCEEDED" in str(exc_info.value.detail)
        mock_rate_limiter.increment_counter.assert_not_called()

    @pytest.mark.asyncio
    async def test_ip_rate_limit_unknown_client(self, mock_rate_limiter):
        """Test handling of requests without client info."""
        request = Mock(spec=Request)
        request.client = None

        mock_rate_limiter.check_rate_limit.return_value = (True, 1, 1234567890)
        mock_rate_limiter.increment_counter.return_value = 2

        username = "testuser"
        token = "psk_abc123def456"

        with patch(
            "app.dependencies.chat_rate_limiting.get_rate_limiter",
            return_value=mock_rate_limiter,
        ):
            ip_address = await check_chat_ip_rate_limit(request, username, token)

        assert ip_address == "unknown"

    @pytest.mark.asyncio
    async def test_different_tokens_separate_limits(
        self, mock_request, mock_rate_limiter
    ):
        """Test that different tokens get separate rate limit buckets."""
        mock_rate_limiter.check_rate_limit.return_value = (True, 10, 1234567890)
        mock_rate_limiter.increment_counter.return_value = 11

        username = "testuser"
        token1 = "psk_abc123def456"
        token2 = "psk_xyz789ghi012"

        with patch(
            "app.dependencies.chat_rate_limiting.get_rate_limiter",
            return_value=mock_rate_limiter,
        ):
            await check_chat_ip_rate_limit(mock_request, username, token1)
            call_args_1 = mock_rate_limiter.check_rate_limit.call_args[1]["user_id"]

            await check_chat_ip_rate_limit(mock_request, username, token2)
            call_args_2 = mock_rate_limiter.check_rate_limit.call_args[1]["user_id"]

        # Verify different tokens create different composite keys
        assert call_args_1 != call_args_2
        assert "psk_abc1" in call_args_1
        assert "psk_xyz7" in call_args_2


class TestPortfolioOwnerUsageTracking:
    """Tests for portfolio owner usage tracking."""

    @pytest.mark.asyncio
    async def test_usage_limit_not_exceeded(self):
        """Test that requests within monthly limit are allowed."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "chat_settings": {
                "monthly_message_count": 50,
                "monthly_message_limit": 100,
                "month_reset_date": datetime.utcnow().isoformat(),
            }
        }

        with patch(
            "firebase_admin.firestore.client",
            return_value=mock_db,
        ):
            mock_db.collection.return_value.document.return_value.get.return_value = (
                mock_doc
            )

            # Should not raise exception
            await check_portfolio_owner_usage_limit("user123")

    @pytest.mark.asyncio
    async def test_usage_limit_exceeded(self):
        """Test that requests exceeding monthly limit are rejected."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "chat_settings": {
                "monthly_message_count": 100,
                "monthly_message_limit": 100,
                "month_reset_date": datetime.utcnow().isoformat(),
            }
        }

        with patch(
            "firebase_admin.firestore.client",
            return_value=mock_db,
        ):
            mock_db.collection.return_value.document.return_value.get.return_value = (
                mock_doc
            )

            with pytest.raises(HTTPException) as exc_info:
                await check_portfolio_owner_usage_limit("user123")

            assert exc_info.value.status_code == 429
            assert "PORTFOLIO_OWNER_LIMIT_EXCEEDED" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_usage_counter_reset_new_month(self):
        """Test that counter resets when entering a new month."""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True

        # Set reset date to last month
        last_month = datetime.utcnow() - timedelta(days=35)
        mock_doc.to_dict.return_value = {
            "chat_settings": {
                "monthly_message_count": 100,
                "monthly_message_limit": 100,
                "month_reset_date": last_month.isoformat(),
            }
        }

        mock_ref = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_ref
        mock_ref.get.return_value = mock_doc

        with patch(
            "firebase_admin.firestore.client",
            return_value=mock_db,
        ):
            # Should not raise exception because counter is reset
            await check_portfolio_owner_usage_limit("user123")

            # Verify update was called to reset counter
            mock_ref.update.assert_called_once()
            update_args = mock_ref.update.call_args[0][0]
            assert update_args["chat_settings.monthly_message_count"] == 0

    @pytest.mark.asyncio
    async def test_increment_usage(self):
        """Test incrementing portfolio owner usage counter."""
        mock_db = MagicMock()
        mock_ref = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"chat_settings": {"monthly_message_count": 51}}

        mock_db.collection.return_value.document.return_value = mock_ref
        mock_ref.get.return_value = mock_doc

        with patch(
            "firebase_admin.firestore.client",
            return_value=mock_db,
        ):
            count = await increment_portfolio_owner_usage("user123")

            assert count == 51
            mock_ref.update.assert_called_once()


class TestInputValidation:
    """Tests for input validation."""

    def test_validate_short_message(self):
        """Test that short messages pass validation."""
        message = "Hello, how are you?"
        validate_chat_input_length(message)

    def test_validate_long_message(self):
        """Test that very long messages are rejected."""
        message = "a" * (ChatConfig.MAX_USER_INPUT_CHARS + 1)

        with pytest.raises(HTTPException) as exc_info:
            validate_chat_input_length(message)

        assert exc_info.value.status_code == 400
        assert "INPUT_LENGTH_EXCEEDED" in str(exc_info.value.detail)

    def test_validate_system_prompt_valid(self):
        """Test that valid system prompts pass validation."""
        prompt = "You are a helpful assistant."
        validate_system_prompt_length(prompt)

    def test_validate_system_prompt_too_long(self):
        """Test that very long system prompts are rejected."""
        prompt = "a" * (ChatConfig.MAX_SYSTEM_PROMPT_CHARS + 1)

        with pytest.raises(ValueError):
            validate_system_prompt_length(prompt)

    def test_validate_tool_arguments_valid(self):
        """Test that moderate tool argument payloads pass validation."""
        arguments = "{" + '"data": "x"' + "}" * 1
        validate_tool_arguments_length(arguments)

    def test_validate_tool_arguments_too_long(self):
        """Test that very large tool argument payloads are rejected."""
        arguments = "a" * (ChatConfig.MAX_TOOL_ARGUMENT_CHARS + 1)

        with pytest.raises(ValueError):
            validate_tool_arguments_length(arguments)
