"""
Shared pytest fixtures and utilities for testing.

This module provides reusable fixtures for common testing scenarios,
particularly for mocking authentication and rate limiting dependencies.
"""

import pytest
from app.main import app
from app.schemas.auth import UserToken
from app.auth.middleware import require_verified_email
from app.dependencies.rate_limiting import (
    check_pdf_upload_rate_limit,
    check_github_api_rate_limit,
)


@pytest.fixture
def mock_verified_user():
    """
    Override authentication dependency with a verified user.

    Usage:
        def test_something(self, mock_verified_user):
            # Authentication is automatically mocked
            response = client.get("/protected-endpoint")
    """

    async def _mock_user():
        return UserToken(
            uid="test_user_123",
            email="test@example.com",
            email_verified=True,
        )

    app.dependency_overrides[require_verified_email] = _mock_user
    yield
    app.dependency_overrides.pop(require_verified_email, None)


@pytest.fixture
def mock_unverified_user():
    """
    Override authentication dependency with an unverified user.

    Useful for testing email verification requirements.
    """

    async def _mock_user():
        return UserToken(
            uid="test_user_456",
            email="unverified@example.com",
            email_verified=False,
        )

    app.dependency_overrides[require_verified_email] = _mock_user
    yield
    app.dependency_overrides.pop(require_verified_email, None)


@pytest.fixture
def mock_pdf_upload_rate_limit():
    """
    Override PDF upload rate limiting dependency.

    Usage:
        def test_something(self, mock_pdf_upload_rate_limit):
            # Rate limiting is automatically bypassed
            response = client.post("/api/ingest/pdf", ...)
    """

    async def _mock_rate_limit():
        return None

    app.dependency_overrides[check_pdf_upload_rate_limit] = _mock_rate_limit
    yield
    app.dependency_overrides.pop(check_pdf_upload_rate_limit, None)


@pytest.fixture
def mock_github_api_rate_limit():
    """
    Override GitHub API rate limiting dependency.

    Usage:
        def test_something(self, mock_github_api_rate_limit):
            # Rate limiting is automatically bypassed
            response = client.get("/api/github/repos", ...)
    """

    async def _mock_rate_limit():
        return None

    app.dependency_overrides[check_github_api_rate_limit] = _mock_rate_limit
    yield
    app.dependency_overrides.pop(check_github_api_rate_limit, None)


@pytest.fixture
def mock_all_rate_limits(mock_pdf_upload_rate_limit, mock_github_api_rate_limit):
    """
    Override all rate limiting dependencies at once.

    Usage:
        def test_something(self, mock_all_rate_limits):
            # All rate limiting is automatically bypassed
    """
    # This fixture combines both rate limit fixtures
    yield


def create_mock_user(
    uid: str = "test_user", email: str = "test@example.com", verified: bool = True
):
    """
    Helper function to create a mock UserToken.

    Args:
        uid: User ID
        email: User email
        verified: Whether email is verified

    Returns:
        UserToken instance

    Usage:
        user = create_mock_user(uid="custom_id", verified=False)
    """
    return UserToken(uid=uid, email=email, email_verified=verified)
