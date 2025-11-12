# Authentication Tests

Comprehensive test suite for the public portfolio authentication system.

## Test Structure

### `test_auth_helpers.py`

Unit tests for authentication helper functions in `app/routes/utils/auth_helpers.py`.

**Coverage:**

- `extract_bearer_token()` - Token extraction from Authorization headers
- `verify_firebase_jwt()` - Firebase JWT verification
- `verify_public_token()` - Public token (PSK) verification
- `validate_portfolio_access()` - Complete authentication and authorization flow

**Key Test Scenarios:**

- Valid and invalid token formats
- Owner vs non-owner access
- Firebase JWT vs PSK token authentication
- Public vs private portfolio access
- Edge cases (None, empty strings, malformed tokens)

### `test_public_endpoints.py`

Integration tests for public portfolio API endpoints.

**Endpoints Tested:**

- `GET /public/portfolio/{username}` - Retrieve portfolio data
- `POST /public/ensure-token` - Generate public tokens
- `POST /public/ensure-username` - Get or generate username
- `GET /public/username/{username}/available` - Check username availability

**Test Categories:**

- **No Authentication**: Verify 401 responses when no token provided
- **Owner Access**: Test Firebase JWT owner access to own portfolios
- **Public Token Access**: Test PSK token access to portfolios
- **Non-Owner Access**: Verify non-owners cannot access other portfolios
- **Edge Cases**: Missing data, disabled features, invalid inputs

### `test_public_token_service.py`

Unit tests for the `PublicTokenService` class.

**Coverage:**

- Token generation (deterministic, format, uniqueness)
- Token verification (valid, invalid, version mismatch)
- Security features (constant-time comparison, timing attack resistance)
- Edge cases (special characters, unicode, long usernames)
- Singleton pattern for service instance

## Running Tests

### Run all authentication tests:

```bash
cd backend
uv run pytest tests/auth/ -v
```

### Run specific test file:

```bash
uv run pytest tests/auth/test_auth_helpers.py -v
uv run pytest tests/auth/test_public_endpoints.py -v
uv run pytest tests/auth/test_public_token_service.py -v
```

### Run specific test class:

```bash
uv run pytest tests/auth/test_auth_helpers.py::TestValidatePortfolioAccess -v
```

### Run with coverage:

```bash
uv run pytest tests/auth/ --cov=app.routes.utils.auth_helpers --cov=app.services.public_token_service --cov-report=html
```

## Test Fixtures

Common fixtures used across tests:

- `client` - FastAPI TestClient for endpoint testing
- `public_user_settings` - User settings with public access_mode
- `private_user_settings` - User settings with private access_mode
- `sample_portfolio` - Sample portfolio data for testing
- `service` - PublicTokenService instance

## Security Test Coverage

### Critical Security Tests

1. **No Anonymous Access** ✓

   - All endpoints require authentication
   - Missing token returns 401

2. **Ownership Verification** ✓

   - Firebase JWT only grants owner access
   - Non-owners cannot access other portfolios

3. **PSK Token Authorization** ✓

   - Valid PSK token grants access
   - Invalid PSK token returns 401
   - Token verification uses constant-time comparison

4. **Access Mode Enforcement** ✓

   - Private portfolios only accessible by owner
   - Public portfolios accessible with valid PSK token
   - Token generation respects access_mode

5. **Token Invalidation** ✓
   - Version increment invalidates old tokens
   - Disabled token generation returns 404

## Test Patterns

### Mocking Strategy

- Mock external services (Firebase, user settings)
- Mock at the boundary (service layer)
- Use real logic for helper functions when possible

### Assertion Patterns

```python
# Status code assertions
assert response.status_code == 200
assert response.status_code == 401

# Response content assertions
data = response.json()
assert data["username"] == "expected"
assert "error message" in data["detail"].lower()

# Exception assertions
with pytest.raises(HTTPException) as exc_info:
    function_call()
assert exc_info.value.status_code == 401
```

### Test Naming Convention

- `test_<scenario>_<expected_result>`
- Examples:
  - `test_no_token_returns_401`
  - `test_owner_firebase_jwt_grants_access`
  - `test_valid_psk_token_grants_access`

## Adding New Tests

When adding new authentication features:

1. Add unit tests in `test_auth_helpers.py` for helper functions
2. Add integration tests in `test_public_endpoints.py` for endpoints
3. Add service tests in `test_public_token_service.py` for token logic
4. Update this README with new test coverage

## Related Documentation

- [Public Auth Flow Documentation](../../documentation/public_auth_flow.md)
- [Authentication Helper Functions](../../app/routes/utils/auth_helpers.py)
- [Public Token Service](../../app/services/public_token_service.py)
- [Public Portfolio Routes](../../app/routes/public_portfolio.py)
