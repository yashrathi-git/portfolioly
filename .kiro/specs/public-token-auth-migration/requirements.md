# Requirements Document

## Introduction

This feature migrates the existing public portfolio and chat system from Firebase-based public/private access control to a deterministic token-based authentication system. The new system uses HMAC-SHA256 tokens derived from a global secret and per-user version numbers to secure public portfolio access and chat functionality. Portfolio owners can immediately invalidate tokens by incrementing their version number. This is a minimal migration that removes legacy Firebase authentication checks while maintaining existing rate limiting and usage tracking. Since the app has no users yet, we can safely remove all legacy code without backward compatibility concerns.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want a deterministic token generation system for public portfolios, so that tokens are stable, verifiable, and don't require database lookups.

#### Acceptance Criteria

1. WHEN the system generates a public token THEN it SHALL use HMAC-SHA256 with a global secret from environment variables
2. WHEN generating a token THEN it SHALL combine username and per-user token version (e.g., "username|v1") as the message
3. WHEN encoding the token THEN it SHALL use base64url encoding and truncate to 32 characters
4. WHEN formatting the token THEN it SHALL prefix with "psk\_" (e.g., "psk_abc123...")
5. WHEN verifying a token THEN it SHALL use constant-time comparison to prevent timing attacks
6. WHEN the per-user token version changes THEN old tokens SHALL become invalid immediately with no grace period
7. WHEN the global secret is not configured THEN the system SHALL fail to start with a clear error message

### Requirement 1.1

**User Story:** As a portfolio owner, I want per-user token settings in my profile, so that I can control token generation and invalidate tokens when needed.

#### Acceptance Criteria

1. WHEN user settings are created THEN they SHALL include public_token_enabled (bool, default true)
2. WHEN user settings are created THEN they SHALL include public_token_ver (int, default 1)
3. WHEN generating a token THEN the system SHALL read the user's public_token_ver from Firebase
4. WHEN verifying a token THEN the system SHALL read the user's public_token_ver and compare with token version
5. WHEN public_token_enabled is false THEN token generation SHALL fail with HTTP 404
6. WHEN public_token_ver is incremented THEN all previous tokens SHALL become invalid immediately
7. WHEN a token is verified with an old version THEN the system SHALL return HTTP 401

### Requirement 1.2

**User Story:** As a new user without a username, I want the system to automatically generate a username from my email, so that I can access public portfolio features immediately.

#### Acceptance Criteria

1. WHEN requesting username for a user_id THEN the system SHALL accept POST /public/ensure-username with { user_id: string }
2. WHEN the user already has a username THEN the system SHALL return the existing username
3. WHEN the user has no username THEN the system SHALL generate one from the email (part before @)
4. WHEN generating a username THEN the system SHALL first try the email prefix alone
5. WHEN the email prefix is taken THEN the system SHALL append a URL-safe random string (6 characters)
6. WHEN the username is generated THEN the system SHALL store it in user_settings
7. WHEN the username is generated THEN the system SHALL return { username: string }

### Requirement 2

**User Story:** As a frontend application, I want an endpoint to obtain public tokens for portfolios, so that I can authenticate subsequent API calls.

#### Acceptance Criteria

1. WHEN requesting a token THEN the system SHALL accept POST /public/ensure-token with { username: string }
2. WHEN the username exists and portfolio is public and public*token_enabled is true THEN the system SHALL return { token: "psk*..." }
3. WHEN the username does not exist THEN the system SHALL return HTTP 404
4. WHEN the portfolio is private (is_public == false) THEN the system SHALL return HTTP 404
5. WHEN public_token_enabled is false THEN the system SHALL return HTTP 404
6. WHEN the portfolio data is missing THEN the system SHALL return HTTP 404
7. WHEN the same username is requested multiple times THEN the system SHALL return the same token (deterministic based on version)
8. WHEN the request is valid THEN the system SHALL respond within 200ms

### Requirement 3

**User Story:** As a portfolio visitor, I want to view public portfolios with optional token authentication, so that I can access portfolio data securely.

#### Acceptance Criteria

1. WHEN fetching a portfolio THEN the system SHALL accept GET /public/portfolio/{username}
2. WHEN the Authorization header is present THEN the system SHALL verify the Bearer token for that username
3. WHEN the Authorization header is present and token is invalid THEN the system SHALL return HTTP 401
4. WHEN the Authorization header is not present THEN the system SHALL skip token verification
5. WHEN the portfolio is private (is_public == false) THEN the system SHALL return HTTP 404
6. WHEN the portfolio is public THEN the system SHALL return the portfolio JSON data
7. WHEN the portfolio does not exist THEN the system SHALL return HTTP 404
8. WHEN no Authorization header is provided for a public portfolio THEN the system SHALL return the portfolio data (backward compatible)

### Requirement 4

**User Story:** As a portfolio visitor, I want to chat with public portfolios using token authentication, so that my conversations are secure and rate-limited properly.

#### Acceptance Criteria

1. WHEN chatting with a portfolio THEN the system SHALL accept POST /public/chat/{username}
2. WHEN the request is made THEN the system SHALL require Authorization: Bearer <PublicToken> header
3. WHEN the Authorization header is missing THEN the system SHALL return HTTP 401
4. WHEN the token is invalid for the username THEN the system SHALL return HTTP 401
5. WHEN the portfolio is private (is_public == false) THEN the system SHALL return HTTP 404
6. WHEN the portfolio is public and token is valid THEN the system SHALL process the chat request
7. WHEN rate limiting is applied THEN the system SHALL key limits by (IP, username, token) tuple
8. WHEN the chat is processed THEN the system SHALL reuse existing chat flow (ChatRequest, AIChatService, ChatStorageService)
9. WHEN monthly usage is tracked THEN the system SHALL increment the portfolio owner's counter

### Requirement 5

**User Story:** As a developer, I want to remove all legacy Firebase authentication code from public endpoints, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN migrating the code THEN the system SHALL remove the `check_portfolio_access` dependency from chat routes
2. WHEN migrating the code THEN the system SHALL remove Firebase authentication middleware from public routes
3. WHEN migrating the code THEN the system SHALL remove the `portfolio_access.py` dependency file
4. WHEN migrating the code THEN the system SHALL update rate limiting to use token-based keys instead of user_id
5. WHEN migrating the code THEN the system SHALL remove any references to authenticated user checks in public endpoints
6. WHEN the migration is complete THEN all public endpoints SHALL only use token-based authentication
7. WHEN the migration is complete THEN no legacy authentication code SHALL remain in the public API routes

### Requirement 6

**User Story:** As a frontend developer, I want template components to accept token configuration, so that I can pass tokens for authenticated API calls.

#### Acceptance Criteria

1. WHEN initializing template components THEN they SHALL accept apiBaseUrl (string) as a prop
2. WHEN initializing template components THEN they SHALL accept username (string) as a prop
3. WHEN initializing template components THEN they SHALL accept publicToken (string | undefined) as a prop
4. WHEN fetching portfolio data THEN components SHALL call GET {apiBaseUrl}/public/portfolio/{username}
5. WHEN publicToken is provided THEN components SHALL include Authorization: Bearer {publicToken} header
6. WHEN making chat requests THEN components SHALL call POST {apiBaseUrl}/public/chat/{username}
7. WHEN making chat requests THEN components SHALL include Authorization: Bearer {publicToken} header
8. WHEN publicToken is undefined THEN portfolio fetch SHALL proceed without Authorization header (backward compatible)
9. WHEN publicToken is undefined THEN chat requests SHALL fail with clear error message

### Requirement 7

**User Story:** As a preview page developer, I want to fetch tokens before rendering portfolio components, so that all API calls are properly authenticated.

#### Acceptance Criteria

1. WHEN the preview page loads for authenticated users THEN it SHALL call POST /public/ensure-username with { user_id } to get/generate username
2. WHEN username is received THEN it SHALL call POST {apiBaseUrl}/public/ensure-token with { username }
3. WHEN the token is received THEN it SHALL store it in component state
4. WHEN both username and token are available THEN it SHALL pass them to template components
5. WHEN the token fetch fails THEN it SHALL display an appropriate error message
6. WHEN the portfolio is private THEN it SHALL display "Portfolio not found" message
7. WHEN the username generation fails THEN it SHALL display an appropriate error message

### Requirement 8

**User Story:** As a system administrator, I want existing rate limiting to continue working with the new token system, so that abuse prevention remains effective.

#### Acceptance Criteria

1. WHEN rate limiting chat requests THEN the system SHALL continue to enforce 50 requests per hour per IP
2. WHEN rate limiting with tokens THEN the system SHALL key limits by (IP, username, token) instead of (IP, user_id)
3. WHEN rate limiting portfolio requests THEN the system SHALL continue to use IP-based limits
4. WHEN monthly usage is tracked THEN the system SHALL continue to increment portfolio owner counters
5. WHEN rate limits are exceeded THEN the system SHALL return HTTP 429 with retry-after headers
6. WHEN rate limit records expire THEN the system SHALL automatically clean them up
7. WHEN the token changes THEN rate limit counters SHALL reset for that token (new token = new limit window)
