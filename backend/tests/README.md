# Testing Utilities

This directory contains shared testing utilities and fixtures for the backend test suite.

## conftest.py

The `conftest.py` file provides reusable pytest fixtures for common testing scenarios, particularly for mocking authentication and rate limiting dependencies.

### Available Fixtures

#### Authentication Fixtures

##### `mock_verified_user`

Mocks authentication with a verified user.

```python
def test_something(self, client, mock_verified_user):
    # Authentication is automatically mocked with a verified user
    response = client.get("/protected-endpoint")
    assert response.status_code == 200
```

**User Details:**

- UID: `test_user_123`
- Email: `test@example.com`
- Email Verified: `True`

##### `mock_unverified_user`

Mocks authentication with an unverified user (useful for testing email verification requirements).

```python
def test_requires_verification(self, client, mock_unverified_user):
    # Authentication is mocked with an unverified user
    response = client.get("/protected-endpoint")
    assert response.status_code == 403  # Email verification required
```

**User Details:**

- UID: `test_user_456`
- Email: `unverified@example.com`
- Email Verified: `False`

#### Rate Limiting Fixtures

##### `mock_pdf_upload_rate_limit`

Bypasses PDF upload rate limiting.

```python
def test_pdf_upload(self, client, mock_verified_user, mock_pdf_upload_rate_limit):
    # Rate limiting is automatically bypassed
    response = client.post("/api/ingest/pdf", ...)
```

##### `mock_github_api_rate_limit`

Bypasses GitHub API rate limiting.

```python
def test_github_repos(self, client, mock_verified_user, mock_github_api_rate_limit):
    # Rate limiting is automatically bypassed
    response = client.get("/api/github/repos", ...)
```

##### `mock_all_rate_limits`

Bypasses all rate limiting at once (combines both rate limit fixtures).

```python
def test_something(self, client, mock_verified_user, mock_all_rate_limits):
    # All rate limiting is automatically bypassed
```

### Helper Functions

#### `create_mock_user(uid, email, verified)`

Creates a custom mock UserToken for specific test scenarios.

```python
from tests.conftest import create_mock_user

def test_custom_user(self):
    user = create_mock_user(
        uid="custom_id",
        email="custom@example.com",
        verified=False
    )
    # Use the custom user in your test
```

## Usage Patterns

### Basic Test Class Setup

For tests that require authentication and rate limiting:

```python
class TestMyEndpoint:
    """Test cases for my endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    # Use shared fixtures from conftest.py
    @pytest.fixture(autouse=True)
    def setup(self, mock_verified_user, mock_pdf_upload_rate_limit):
        """Setup authentication and rate limiting for all tests."""
        yield

    def test_something(self, client):
        # Authentication and rate limiting are automatically mocked
        response = client.get("/my-endpoint")
        assert response.status_code == 200
```

### Selective Fixture Usage

You can use fixtures selectively for specific tests:

```python
class TestMyEndpoint:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_with_auth(self, client, mock_verified_user):
        # Only this test has authentication mocked
        response = client.get("/protected")
        assert response.status_code == 200

    def test_without_auth(self, client):
        # This test doesn't mock authentication
        response = client.get("/public")
        assert response.status_code == 200
```

### Custom User Scenarios

For tests requiring specific user configurations:

```python
def test_unverified_user_blocked(self, client, mock_unverified_user):
    """Test that unverified users cannot access protected resources."""
    response = client.get("/protected-endpoint")
    assert response.status_code == 403
```

## Why Use These Fixtures?

### Before (Incorrect Approach)

```python
@patch("app.routes.upload.require_verified_email")  # ❌ Doesn't work with FastAPI
def test_something(self, mock_auth, client):
    mock_auth.return_value = Mock(uid="test_user")
    response = client.get("/protected")
    # Test fails with 401 Unauthorized
```

### After (Correct Approach)

```python
def test_something(self, client, mock_verified_user):  # ✅ Works correctly
    response = client.get("/protected")
    # Test passes with 200 OK
```

## Key Benefits

1. **Correct FastAPI Testing**: Uses `app.dependency_overrides` which is the official FastAPI way to mock dependencies
2. **Reusability**: Write once, use everywhere
3. **Consistency**: All tests use the same mocking approach
4. **Maintainability**: Changes to auth logic only need updates in one place
5. **Clarity**: Test code is cleaner and more focused on what's being tested

## References

- [FastAPI Testing Dependencies](https://fastapi.tiangolo.com/advanced/testing-dependencies/)
- [Pytest Fixtures](https://docs.pytest.org/en/stable/fixture.html)
- [conftest.py Documentation](https://docs.pytest.org/en/stable/reference/fixtures.html#conftest-py-sharing-fixtures-across-multiple-files)

## Examples

See `test_upload_routes.py` for complete examples of how to use these fixtures in practice.
