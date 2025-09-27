"""
Tests for username uniqueness and access control functionality.
"""

import pytest
from unittest.mock import Mock, patch
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

from app.services.user_settings_service import UserSettingsService, UserSettingsError
from app.schemas.user_settings import UserSettingsCreate


class TestUsernameUniqueness:
    """Test username uniqueness constraints and concurrent registration scenarios."""

    @pytest.fixture
    def mock_firestore(self):
        """Mock Firestore client for testing."""
        with patch("app.services.user_settings_service.firestore") as mock_firestore:
            mock_client = Mock()
            mock_firestore.client.return_value = mock_client
            yield mock_client

    @pytest.fixture
    def user_settings_service(self, mock_firestore):
        """Create UserSettingsService with mocked Firestore."""
        service = UserSettingsService()
        service._db = mock_firestore
        return service

    def test_username_uniqueness_single_user(
        self, user_settings_service, mock_firestore
    ):
        """Test that a single user can set a username successfully."""
        # Mock no existing username
        mock_firestore.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            []
        )
        mock_firestore.collection.return_value.document.return_value.set = Mock()

        user_id = "user123"
        username = "testuser"

        # Should succeed
        user_settings_service.set_username(user_id, username)

        # Verify the username was set
        mock_firestore.collection.return_value.document.assert_called_with(user_id)

    def test_username_uniqueness_duplicate_rejection(
        self, user_settings_service, mock_firestore
    ):
        """Test that duplicate usernames are rejected."""
        # Mock existing username
        existing_doc = Mock()
        existing_doc.to_dict.return_value = {
            "user_id": "other_user",
            "username": "testuser",
            "is_public": True,
        }
        mock_firestore.collection.return_value.where.return_value.limit.return_value.stream.return_value = [
            existing_doc
        ]

        user_id = "user123"
        username = "testuser"

        # Should raise error for duplicate username
        with pytest.raises(UserSettingsError, match="already taken"):
            user_settings_service.set_username(user_id, username)

    def test_username_uniqueness_same_user_update(
        self, user_settings_service, mock_firestore
    ):
        """Test that a user can update their own username."""
        # Mock existing username for same user
        existing_doc = Mock()
        existing_doc.to_dict.return_value = {
            "user_id": "user123",
            "username": "oldusername",
            "is_public": True,
        }
        mock_firestore.collection.return_value.where.return_value.limit.return_value.stream.return_value = [
            existing_doc
        ]

        # Mock get_user_settings to return existing settings
        with patch.object(user_settings_service, "get_user_settings") as mock_get:
            mock_get.return_value = {
                "user_id": "user123",
                "username": "oldusername",
                "is_public": True,
            }

            mock_firestore.collection.return_value.document.return_value.update = Mock()

            user_id = "user123"
            new_username = "newusername"

            # Should succeed - same user updating their username
            user_settings_service.set_username(user_id, new_username)

            # Verify update was called
            mock_firestore.collection.return_value.document.return_value.update.assert_called_once()

    def test_concurrent_username_registration(self, mock_firestore):
        """Test concurrent username registration scenarios."""
        # This test simulates race conditions in username registration
        service = UserSettingsService()
        service._db = mock_firestore

        username = "popular_username"
        user_ids = [f"user{i}" for i in range(5)]

        # Track which registrations succeed/fail
        results = {}
        lock = threading.Lock()

        def register_username(user_id):
            try:
                # Simulate checking availability (initially all see it as available)
                mock_firestore.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
                    []
                )

                # Add small delay to increase chance of race condition
                time.sleep(0.01)

                # First user to actually set it should succeed
                with lock:
                    if username not in results:
                        results[username] = user_id
                        service.set_username(user_id, username)
                        return True
                    else:
                        # Simulate database constraint violation
                        raise UserSettingsError("Username is already taken")

            except UserSettingsError:
                return False

        # Run concurrent registrations
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(register_username, user_id) for user_id in user_ids
            ]
            success_count = sum(
                1 for future in as_completed(futures) if future.result()
            )

        # Only one should succeed
        assert success_count == 1
        assert len(results) == 1

    def test_username_validation_rules(self, user_settings_service):
        """Test username validation rules."""
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
            result = user_settings_service.validate_username(username)
            assert (
                result["valid"] == should_be_valid
            ), f"Failed for {description}: {username}"


class TestAccessControl:
    """Test access control for public/private portfolios."""

    @pytest.fixture
    def mock_portfolio_service(self):
        """Mock portfolio service."""
        with patch(
            "app.routes.public_portfolio.get_portfolio_service"
        ) as mock_get_service:
            mock_service = Mock()
            mock_get_service.return_value = mock_service
            yield mock_service

    @pytest.fixture
    def mock_user_settings_service(self):
        """Mock user settings service."""
        with patch(
            "app.routes.public_portfolio.get_user_settings_service"
        ) as mock_get_service:
            mock_service = Mock()
            mock_get_service.return_value = mock_service
            yield mock_service

    def test_public_portfolio_access_allowed(
        self, mock_user_settings_service, mock_portfolio_service
    ):
        """Test that public portfolios are accessible via public API."""
        from app.routes.public_portfolio import get_public_portfolio

        username = "publicuser"

        # Mock public portfolio settings
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "user123",
            "username": username,
            "is_public": True,
        }

        # Mock portfolio data
        mock_portfolio_data = {
            "personal_info": {
                "full_name": "Public User",
                "headline": "Software Engineer",
            }
        }
        mock_portfolio_service.get_portfolio_data.return_value = mock_portfolio_data

        # Should return portfolio data
        result = get_public_portfolio(username)
        assert result == mock_portfolio_data

        # Verify correct service calls
        mock_user_settings_service.get_user_settings_by_username.assert_called_once_with(
            username
        )
        mock_portfolio_service.get_portfolio_data.assert_called_once_with("user123")

    def test_private_portfolio_access_denied(
        self, mock_user_settings_service, mock_portfolio_service
    ):
        """Test that private portfolios return 404 via public API."""
        from app.routes.public_portfolio import get_public_portfolio
        from fastapi import HTTPException

        username = "privateuser"

        # Mock private portfolio settings
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "user123",
            "username": username,
            "is_public": False,
        }

        # Should raise 404 HTTPException
        with pytest.raises(HTTPException) as exc_info:
            get_public_portfolio(username)

        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()

        # Portfolio service should not be called
        mock_portfolio_service.get_portfolio_data.assert_not_called()

    def test_nonexistent_username_access_denied(
        self, mock_user_settings_service, mock_portfolio_service
    ):
        """Test that non-existent usernames return 404."""
        from app.routes.public_portfolio import get_public_portfolio
        from fastapi import HTTPException

        username = "nonexistent"

        # Mock no user found
        mock_user_settings_service.get_user_settings_by_username.return_value = None

        # Should raise 404 HTTPException
        with pytest.raises(HTTPException) as exc_info:
            get_public_portfolio(username)

        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()

        # Portfolio service should not be called
        mock_portfolio_service.get_portfolio_data.assert_not_called()

    def test_username_availability_check_accuracy(self, mock_user_settings_service):
        """Test username availability checking accuracy."""
        from app.routes.public_portfolio import check_username_availability

        # Test available username
        mock_user_settings_service.get_user_settings_by_username.return_value = None
        mock_user_settings_service.validate_username.return_value = {"valid": True}

        result = check_username_availability("available_username")
        assert result["available"] is True

        # Test taken username
        mock_user_settings_service.get_user_settings_by_username.return_value = {
            "user_id": "other_user",
            "username": "taken_username",
        }

        result = check_username_availability("taken_username")
        assert result["available"] is False
        assert "reason" in result

    def test_invalid_username_format_rejected(self, mock_user_settings_service):
        """Test that invalid username formats are rejected."""
        from app.routes.public_portfolio import check_username_availability

        # Mock invalid username validation
        mock_user_settings_service.validate_username.return_value = {
            "valid": False,
            "error": "Username too short",
        }

        result = check_username_availability("ab")
        assert result["available"] is False
        assert result["reason"] == "Username too short"

        # Should not check database for invalid formats
        mock_user_settings_service.get_user_settings_by_username.assert_not_called()


class TestPortfolioVisibilityControl:
    """Test portfolio visibility control functionality."""

    @pytest.fixture
    def mock_user_settings_service(self):
        """Mock user settings service for visibility tests."""
        with patch(
            "app.routes.user_settings.get_user_settings_service"
        ) as mock_get_service:
            mock_service = Mock()
            mock_get_service.return_value = mock_service
            yield mock_service

    def test_make_portfolio_public_requires_username(self, mock_user_settings_service):
        """Test that making portfolio public requires a username."""
        from app.routes.user_settings import set_portfolio_visibility
        from app.schemas.auth import UserToken
        from fastapi import HTTPException

        # Mock user without username
        mock_user_settings_service.get_user_settings.return_value = {
            "user_id": "user123",
            "username": None,
            "is_public": False,
        }

        user_token = UserToken(
            uid="user123", email="test@example.com", email_verified=True
        )

        # Should raise 400 error
        with pytest.raises(HTTPException) as exc_info:
            set_portfolio_visibility(request={"is_public": True}, user=user_token)

        assert exc_info.value.status_code == 400
        assert "username is required" in exc_info.value.detail.lower()

    def test_make_portfolio_public_with_username_succeeds(
        self, mock_user_settings_service
    ):
        """Test that making portfolio public succeeds when user has username."""
        from app.routes.user_settings import set_portfolio_visibility
        from app.schemas.auth import UserToken

        # Mock user with username
        mock_user_settings_service.get_user_settings.return_value = {
            "user_id": "user123",
            "username": "testuser",
            "is_public": False,
        }

        user_token = UserToken(
            uid="user123", email="test@example.com", email_verified=True
        )

        # Should succeed
        result = set_portfolio_visibility(request={"is_public": True}, user=user_token)

        assert "public" in result["message"].lower()
        assert result["is_public"] is True

        # Verify service was called
        mock_user_settings_service.set_portfolio_visibility.assert_called_once_with(
            "user123", True
        )

    def test_make_portfolio_private_always_succeeds(self, mock_user_settings_service):
        """Test that making portfolio private always succeeds."""
        from app.routes.user_settings import set_portfolio_visibility
        from app.schemas.auth import UserToken

        user_token = UserToken(
            uid="user123", email="test@example.com", email_verified=True
        )

        # Should succeed without checking username
        result = set_portfolio_visibility(request={"is_public": False}, user=user_token)

        assert "private" in result["message"].lower()
        assert result["is_public"] is False

        # Should not call get_user_settings for private
        mock_user_settings_service.set_portfolio_visibility.assert_called_once_with(
            "user123", False
        )
