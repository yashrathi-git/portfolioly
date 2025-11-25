"""
Shared pytest fixtures and utilities for testing.

This module provides reusable fixtures for common testing scenarios,
particularly for mocking authentication, rate limiting, and Firestore dependencies.

## Available Fixtures

### Authentication Fixtures
- `mock_verified_user`: Mock a verified user for endpoints requiring email verification
- `mock_unverified_user`: Mock an unverified user for testing verification flows
- `mock_authenticated_user`: Mock an authenticated user for rate-limited endpoints

### Rate Limiting Fixtures
- `mock_pdf_upload_rate_limit`: Bypass PDF upload rate limiting
- `mock_github_api_rate_limit`: Bypass GitHub API rate limiting
- `mock_all_rate_limits`: Bypass all rate limiting at once

### Firestore Fixtures
- `mock_firestore_client`: Provides a complete mock Firestore client with data
- `mock_firestore_empty`: Provides an empty mock Firestore client

## Usage Examples

### Testing with Authentication
```python
def test_protected_endpoint(self, client, mock_authenticated_user):
    response = client.get("/users/me/settings")
    assert response.status_code == 200
```

### Testing with Firestore
```python
def test_user_settings(self, client, mock_authenticated_user, mock_firestore_client):
    # Add test data
    mock_firestore_client.collection("user_settings").add_document(
        "test_user_123",
        {"username": "testuser", "notify_for_resume_feature": True}
    )

    # Test endpoint
    response = client.get("/users/me/settings")
    assert response.json()["notify_for_resume_feature"] is True
```
"""

import pytest
from unittest.mock import Mock, patch
from app.main import app
from app.schemas.auth import UserToken
from app.auth.middleware import require_verified_email
from app.dependencies.rate_limiting import (
    check_pdf_upload_rate_limit,
    check_github_api_rate_limit,
    rate_limited_core_user,
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
def mock_public_portfolio_rate_limit():
    """Override public portfolio rate limiting dependency."""
    from app.dependencies.rate_limiting import limit_public_portfolio_requests

    async def _mock_rate_limit():
        return None

    app.dependency_overrides[limit_public_portfolio_requests] = _mock_rate_limit
    yield
    app.dependency_overrides.pop(limit_public_portfolio_requests, None)


@pytest.fixture
def mock_public_username_rate_limit():
    """Override public username rate limiting dependency."""
    from app.dependencies.rate_limiting import limit_public_username_requests

    async def _mock_rate_limit():
        return None

    app.dependency_overrides[limit_public_username_requests] = _mock_rate_limit
    yield
    app.dependency_overrides.pop(limit_public_username_requests, None)


@pytest.fixture
def mock_all_rate_limits(
    mock_pdf_upload_rate_limit,
    mock_github_api_rate_limit,
    mock_public_portfolio_rate_limit,
    mock_public_username_rate_limit,
):
    """
    Override all rate limiting dependencies at once.

    Usage:
        def test_something(self, mock_all_rate_limits):
            # All rate limiting is automatically bypassed
    """
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


@pytest.fixture
def mock_authenticated_user():
    """
    Override rate_limited_core_user dependency with an authenticated user.

    This fixture is useful for testing endpoints that require authentication
    via the rate_limited_core_user dependency.

    Usage:
        def test_something(self, mock_authenticated_user):
            # Authentication is automatically mocked
            response = client.get("/users/me/settings")
    """

    async def _mock_user():
        return UserToken(
            uid="test_user_123",
            email="test@example.com",
            email_verified=True,
        )

    app.dependency_overrides[rate_limited_core_user] = _mock_user
    yield
    app.dependency_overrides.pop(rate_limited_core_user, None)


class MockFirestoreDocument:
    """Mock Firestore document for testing."""

    def __init__(self, data=None, exists=True):
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        """Return document data as dictionary."""
        return self._data

    def get(self):
        """Return self to simulate document retrieval."""
        return self

    def set(self, data):
        """Simulate setting document data."""
        self._data = data

    def update(self, data):
        """Simulate updating document data."""
        self._data.update(data)

    def delete(self):
        """Simulate deleting document."""
        self._data = {}
        self.exists = False


class MockFirestoreCollection:
    """Mock Firestore collection for testing."""

    def __init__(self):
        self._documents = {}

    def document(self, doc_id):
        """Get or create a mock document."""
        if doc_id not in self._documents:
            self._documents[doc_id] = MockFirestoreDocument(exists=False)
        return self._documents[doc_id]

    def add_document(self, doc_id, data, exists=True):
        """Helper to add a document with data."""
        self._documents[doc_id] = MockFirestoreDocument(data=data, exists=exists)
        return self._documents[doc_id]


class MockFirestoreClient:
    """Mock Firestore client for testing."""

    def __init__(self):
        self._collections = {}

    def collection(self, collection_name):
        """Get or create a mock collection."""
        if collection_name not in self._collections:
            self._collections[collection_name] = MockFirestoreCollection()
        return self._collections[collection_name]


@pytest.fixture
def mock_firestore_client():
    """
    Provide a mock Firestore client with helper methods.

    This fixture creates a complete mock of the Firestore client that can be
    used to simulate database operations without actually connecting to Firestore.

    Usage:
        def test_something(self, mock_firestore_client):
            # Add test data
            mock_firestore_client.collection("user_settings").add_document(
                "test_user_123",
                {"username": "testuser", "notify_for_resume_feature": True}
            )

            # Test code that uses Firestore
            response = client.get("/users/me/settings")

    Returns:
        MockFirestoreClient: A mock Firestore client instance
    """
    from app.services.user_settings_service import get_user_settings_service

    mock_client = MockFirestoreClient()

    # Get the singleton service and patch its db property
    service = get_user_settings_service()
    original_db = service._db

    # Replace the db with our mock
    service._db = mock_client

    yield mock_client

    # Restore original db
    service._db = original_db


@pytest.fixture
def mock_firestore_empty():
    """
    Provide a mock Firestore client with no data.

    Useful for testing scenarios where no user settings exist yet.

    Usage:
        def test_new_user(self, mock_firestore_empty):
            response = client.get("/users/me/settings")
            # Should return default values
    """
    from app.services.user_settings_service import get_user_settings_service

    mock_client = MockFirestoreClient()

    # Get the singleton service and patch its db property
    service = get_user_settings_service()
    original_db = service._db

    # Replace the db with our mock
    service._db = mock_client

    yield mock_client

    # Restore original db
    service._db = original_db
