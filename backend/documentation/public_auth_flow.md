# Public Portfolio Authentication Flow

## Overview

This document explains the authentication and authorization system for public portfolio access in Portfolioly. The system supports two authentication methods:

1. **Firebase JWT** - For portfolio owners to access their own portfolios
2. **Public Token** - For public access to portfolios marked as public

## Authentication Methods

### 1. Firebase JWT Authentication

**Format:** `Authorization: Bearer <firebase_jwt_token>`

**Purpose:** Allows portfolio owners to access their own portfolios, regardless of public/private status.

**Verification Process:**

1. Extract token from `Authorization` header
2. Verify token with Firebase Admin SDK
3. Extract user ID from decoded token
4. **Verify ownership** - Check if token user_id matches portfolio owner's user_id
5. If owner: Grant full access
6. If not owner: Deny access (cannot use your JWT to access other portfolios)

**Use Cases:**

- Owner viewing their own portfolio (even if private)
- Owner generating public tokens for their portfolio
- Owner accessing chat functionality for their portfolio

### 2. Public Token Authentication

**Format:** `Authorization: Bearer psk_<32-character-token>`

**Purpose:** Allows public access to portfolios that are explicitly marked as public.

**Token Generation:**

- Deterministic HMAC-SHA256 based tokens
- Format: `psk_` prefix + 32-character base64url string
- Generated from: `username + token_version + GLOBAL_SECRET`
- Version-based invalidation (increment version to invalidate all tokens)

**Verification Process:**

1. Extract token from `Authorization` header
2. Verify token format (starts with `psk_`)
3. Regenerate expected token using username and stored token_version
4. Compare using constant-time comparison (prevents timing attacks)
5. If valid: Grant access (token itself is the authorization)

**Important:** A valid PSK token grants access to the portfolio regardless of `access_mode`. The `access_mode` check only applies when generating tokens via the `ensure-token` endpoint.

**Use Cases:**

- Public viewing portfolios marked as public
- Public chat with portfolios that have public access enabled
- Template app accessing portfolio data

## Public Endpoints

### GET /public/portfolio/{username}

**Purpose:** Retrieve portfolio data by username

**Authentication:** Required (Firebase JWT OR Public Token)

**Authorization Logic:**

```
IF Firebase JWT provided AND valid AND user owns username:
    → Return portfolio (owner access)
ELSE IF Public Token provided AND valid:
    → Return portfolio (token is authorization)
ELSE:
    → Return 401 (invalid/missing token) or 404 (not found)
```

**Response Codes:**

- `200` - Success, portfolio data returned
- `401` - Missing or invalid authentication token
- `404` - Portfolio not found or private (intentionally ambiguous for security)
- `500` - Server error

### POST /public/ensure-token

**Purpose:** Generate a public token for a username

**Authentication:** Optional (Firebase JWT for owner access, public portfolios accessible without auth)

**Authorization Logic:**

```
IF Firebase JWT provided AND valid AND user owns username:
    → Generate and return token (owner access, regardless of access_mode)
ELSE IF no Firebase JWT provided AND portfolio is public:
    → Generate and return token (public access)
ELSE IF Firebase JWT provided BUT user doesn't own username:
    → Check if portfolio is public
    → If public: Generate and return token
    → If private: Return 404 (not found/private)
ELSE:
    → Return 404 (not found/private)
```

**Request Body:**

```json
{
  "username": "string"
}
```

**Response:**

```json
{
  "token": "psk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response Codes:**

- `200` - Success, token returned
- `404` - Portfolio not found, private, or token generation disabled
- `500` - Server error

### POST /public/chat/{username}

**Purpose:** Chat with AI assistant about a portfolio

**Authentication:** Required (Firebase JWT OR Public Token)

**Authorization Logic:**

```
IF Firebase JWT provided AND valid AND user owns username:
    → Allow chat (owner access)
ELSE IF Public Token provided AND valid:
    → Allow chat (token is authorization)
ELSE:
    → Return 401 (invalid/missing token) or 404 (not found)
```

**Additional Checks:**

- Rate limiting (IP-based and portfolio owner usage limits)
- Message length validation
- Portfolio owner usage quotas

### POST /public/ensure-username

**Purpose:** Get or generate a username for a user

**Authentication:** Required (Firebase JWT only)

**Authorization Logic:**

```
IF Firebase JWT provided AND valid AND user_id matches request:
    → Return existing username or generate new one
ELSE:
    → Return 401 (unauthorized)
```

**Note:** This endpoint does NOT support public token authentication.

### GET /public/username/{username}/available

**Purpose:** Check if a username is available

**Authentication:** Required (Firebase JWT only)

**Authorization Logic:**

```
IF Firebase JWT provided AND valid:
    → Check username availability
ELSE:
    → Return 401 (unauthorized)
```

**Note:** This endpoint does NOT support public token authentication.

## Implementation Details

### Current Authentication Flow (After Security Fixes)

When a request comes to any public portfolio endpoint:

1. **Token Extraction**: Extract token from `Authorization: Bearer <token>` header
2. **Authentication Check**: If no token → Return 401 immediately
3. **Firebase JWT Verification**: Try to verify as Firebase JWT
   - If valid → Extract user ID and check ownership
   - If owner → Grant full access (skip access_mode check)
   - If not owner → Continue to public token verification
4. **Public Token Verification**: Try to verify as public token
   - If invalid → Return 401
   - If valid → Check `access_mode`
   - If public → Grant access
   - If private → Return 404
5. **Authorization**: Based on authentication result, allow or deny access

### Key Security Principles

1. **Authentication First**: No endpoint allows anonymous access
2. **Ownership Matters**: Firebase JWT only grants owner access to own portfolios
3. **Public Means Public**: Public tokens only work for portfolios marked as public
4. **Fail Secure**: Default to deny; explicit checks required for access
5. **Information Hiding**: Return 404 (not 403) for private portfolios to avoid disclosure

## Helper Functions

### validate_portfolio_access()

**Location:** `backend/app/routes/utils/auth_helpers.py`

**Purpose:** Central authentication and authorization validation for portfolio access

**Parameters:**

- `username` (str) - Portfolio username to access
- `authorization` (Optional[str]) - Authorization header value
- `require_public` (bool) - Whether to enforce public access for non-owners

**Returns:** `Tuple[dict, Optional[UserToken]]`

- `user_settings` - User settings dictionary
- `firebase_user` - UserToken if Firebase JWT was valid, None otherwise

**Logic Flow:**

```python
1. Get user_settings for username
   → If not found: 404

2. Extract token from Authorization header
   → If no token: 401 (authentication required)

3. Try Firebase JWT verification:
   → If valid:
      → Check if user owns username (user_settings.user_id == jwt.uid)
      → If owner: Return (user_settings, firebase_user) ✓
      → If not owner: Continue to public token check

4. Try Public Token verification:
   → If invalid: 401 (invalid token)
   → If valid: Return (user_settings, None) ✓
      (Token itself is authorization - no access_mode check needed)

5. If no valid authentication: 401
```

**Security Considerations:**

- ALWAYS requires authentication (no anonymous access)
- Ownership verification prevents cross-user access with Firebase JWT
- Public token access requires explicit public status
- Returns 404 for private portfolios (avoids information disclosure)
- Uses constant-time comparison for token verification

### extract_bearer_token()

**Purpose:** Extract token from Authorization header

**Format:** `Authorization: Bearer <token>`

**Returns:** Token string without "Bearer " prefix, or None if invalid format

### verify_firebase_jwt()

**Purpose:** Verify Firebase JWT token

**Returns:** UserToken object if valid, None if invalid

**Note:** Does NOT verify ownership - caller must check

### verify_public_token()

**Purpose:** Verify public token for a username

**Returns:** True if token is valid, False otherwise

**Verification:**

- Regenerates expected token
- Uses constant-time comparison
- Checks token version from user_settings

## Access Control Matrix

| Endpoint                                  | Owner (Firebase JWT) | Non-Owner (Firebase JWT) | Valid PSK Token | No Auth     |
| ----------------------------------------- | -------------------- | ------------------------ | --------------- | ----------- |
| GET /public/portfolio/{username}          | ✓ Always             | ✗ 401                    | ✓ Always        | ✗ 401       |
| POST /public/chat/{username}              | ✓ Always             | ✗ 401                    | ✓ Always        | ✗ 401       |
| POST /public/ensure-token                 | ✓ Always             | ✓ If public              | N/A             | ✓ If public |
| POST /public/ensure-username              | ✓ If owner           | ✗ 403                    | ✗ 401           | ✗ 401       |
| GET /public/username/{username}/available | ✓ Any user           | ✓ Any user               | ✗ 401           | ✗ 401       |

**Key:**

- ✓ = Access granted
- ✗ = Access denied (with HTTP status code)
- "If public" = Only if portfolio's `access_mode` is set to "public"
- "Always" = Access granted regardless of `access_mode` (PSK token is authorization)
- N/A = Not applicable (endpoint doesn't accept PSK tokens as input)

## User Settings Schema

**Relevant Fields:**

```python
{
  "user_id": "string",              # Firebase user ID (owner)
  "username": "string",             # Unique username
  "public_token_ver": 1,            # Token version (increment to invalidate)
  "public_token_enabled": true,     # Enable/disable token generation
  "chat_settings": {
    "access_mode": "public|private" # Portfolio visibility
  }
}
```

## Security Best Practices

### 1. Always Require Authentication

- Never allow anonymous access to portfolio data
- Return 401 if no token provided
- Return 401 if token is invalid

### 2. Verify Ownership for Firebase JWT

- Check if `jwt.uid == user_settings.user_id`
- Don't assume any valid JWT means owner access
- Prevents cross-user access vulnerabilities

### 3. PSK Token is Authorization

- A valid PSK token grants full access to the portfolio
- No need to check `access_mode` when PSK token is valid
- The `access_mode` check only applies when generating tokens (ensure-token endpoint)
- This design treats the PSK token as a capability-based authorization mechanism

### 4. Use Constant-Time Comparison

- Prevents timing attacks on token verification
- Use `hmac.compare_digest()` for token comparison

### 5. Version-Based Token Invalidation

- Increment `public_token_ver` to invalidate all tokens
- Useful for security incidents or access revocation

### 6. Rate Limiting

- IP-based rate limiting for public access
- Portfolio owner usage quotas for chat
- Prevents abuse and resource exhaustion

## Security Fixes Applied (November 2024)

### ✅ FIX 1: Authentication Now Required

**Previous Issue:** When `authorization=None` and `require_public=False`, the function returned success without any authentication, allowing anonymous access to all portfolios.

**Fix Applied:**

- `validate_portfolio_access()` now ALWAYS requires authentication
- Returns 401 if no token is provided
- No anonymous access is permitted to any portfolio endpoint

**Impact:** All public portfolio endpoints now require either a valid Firebase JWT or a valid public token.

### ✅ FIX 2: Ownership Verification Added

**Previous Issue:** Any valid Firebase JWT granted access to any portfolio, allowing users to access other users' private portfolios.

**Fix Applied:**

- Added ownership verification: `jwt.uid == user_settings.user_id`
- Firebase JWT only grants owner access if the user owns the username
- Non-owners with Firebase JWT are treated as having a public token (must check access_mode)

**Impact:** Users can only access their own portfolios with Firebase JWT. Other portfolios require public tokens and must be marked as public.

### ✅ FIX 3: Clarified Authentication Flow

**Previous Issue:** The `require_public` parameter was confusing and accidentally disabled all authentication when set to `False`.

**Fix Applied:**

- Clarified that `require_public` only affects public token access validation
- Authentication is ALWAYS required regardless of `require_public` value
- Updated documentation and function docstrings

**Impact:** Clear separation between authentication (always required) and authorization (depends on ownership and access_mode).

## Testing Checklist

All security tests are implemented in `backend/tests/test_auth_security_fix.py`:

- [x] Owner can access their own portfolio with Firebase JWT (even if private)
- [x] Owner cannot access other portfolios with their Firebase JWT
- [x] Public token works for public portfolios
- [x] Public token fails for private portfolios (returns 404)
- [x] No token returns 401 (authentication required)
- [x] Invalid token returns 401
- [x] Token version increment invalidates old tokens
- [x] Rate limiting works correctly
- [x] Constant-time comparison prevents timing attacks

### Running Security Tests

```bash
cd backend
uv run pytest tests/test_auth_security_fix.py -v
```

## Related Files

### Core Implementation

- `backend/app/routes/public_portfolio.py` - Public portfolio endpoints
- `backend/app/routes/public_portfolio_chat.py` - Chat endpoint handler
- `backend/app/routes/utils/auth_helpers.py` - Authentication helper functions (security-critical)
- `backend/app/services/public_token_service.py` - Token generation and verification
- `backend/app/services/user_settings_service.py` - User settings management
- `backend/app/schemas/public_token.py` - Request/response schemas

### Testing

- `backend/tests/test_auth_security_fix.py` - Security-focused integration tests
- `backend/tests/test_public_portfolio_routes.py` - Public portfolio endpoint tests
- `backend/tests/test_username_management.py` - Username and access control tests

### Documentation

- `backend/documentation/public_auth_flow.md` - This file (authentication flow documentation)
