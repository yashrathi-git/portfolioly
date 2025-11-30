# Implementation Plan

## Overview

This implementation plan focuses on migrating from Firebase-based authentication to token-based authentication for public portfolios and chat. Since the app has no users yet, we can make all changes at once without backward compatibility concerns. The plan removes all legacy Firebase authentication code and implements the new token system.

**Key Context:**

- Most chat infrastructure already exists from ai-powered-portfolio-chat spec
- We're modifying existing endpoints and adding new ones
- We're removing legacy authentication code
- Frontend components need token support added
- There is NO NEED FOR ANY MIGRATION SCRIPT. There are no existing user, the app is in dev phase.
- Do NOT write scattered READMEs unless it adds lot of value and it is really hard to understand otherwise.
- Always use `uv` as package manager and always execute python code after cd-ing into the `backend` directory

## Tasks

- [x] 1. Add token configuration and update user settings schema

  - Add GLOBAL_SECRET to backend configuration
  - Update user settings schema with token fields
  - _Requirements: 1, 1.1_

- [x] 1.1 Add GLOBAL_SECRET configuration

  - Update `backend/app/core/config.py` to add GLOBAL_SECRET field
  - Add validator to ensure GLOBAL_SECRET is at least 32 characters
  - Add GLOBAL_SECRET to `backend/.env.example` with documentation
  - Fail application startup if GLOBAL_SECRET is not configured
  - _Requirements: 1_

- [x] 1.2 Update user settings schema

  - Update `backend/app/schemas/user_settings.py`
  - Add `public_token_enabled: bool = True` field
  - Add `public_token_ver: int = 1` field
  - Update Firebase user_settings documents to include these fields (migration)
  - _Requirements: 1.1_

- [ ] 2. Implement token service

  - Create service for token generation and verification
  - Use HMAC-SHA256 with constant-time comparison
  - _Requirements: 1, 1.1_

- [x] 2.1 Create public token service

  - Create `backend/app/services/public_token_service.py`
  - Implement `PublicTokenService` class with `__init__(global_secret: str)`
  - Implement `derive_public_token(username: str, token_version: int) -> str`
  - Use HMAC-SHA256 with message format: f"{username}|v{token_version}"
  - Base64url encode and truncate to 32 characters
  - Prefix with "psk\_" for final token format
  - _Requirements: 1_

- [x] 2.2 Implement token verification

  - Add `verify_public_token(username: str, token: str, token_version: int) -> bool` method
  - Use `hmac.compare_digest()` for constant-time comparison
  - Validate token format (must start with "psk\_")
  - Return False for invalid format or mismatched tokens
  - _Requirements: 1_

- [x] 2.3 Add token service factory

  - Add `get_public_token_service()` factory function
  - Initialize with GLOBAL_SECRET from config
  - Cache service instance for reuse
  - _Requirements: 1_

- [x] 3. Create token request/response schemas

  - Define Pydantic models for token endpoints
  - _Requirements: 2_

- [x] 3.1 Create public token schemas

  - Create `backend/app/schemas/public_token.py`
  - Define `EnsureUsernameRequest` with user_id field (min 1 char)
  - Define `EnsureUsernameResponse` with username field (string)
  - Define `EnsureTokenRequest` with username field (min 1, max 50 chars)
  - Define `EnsureTokenResponse` with token field (string)
  - _Requirements: 1.2, 2_

- [x] 4. Implement POST /public/ensure-username endpoint

  - Create new endpoint for username generation/retrieval
  - Generate username from email if not exists
  - _Requirements: 1.2_

- [x] 4.1 Add username generation helper

  - Update `backend/app/services/user_settings_service.py`
  - Add `generate_username_from_email(email: str) -> str` method
  - Extract part before @ from email
  - Sanitize to alphanumeric + hyphens/underscores
  - Try username alone first
  - If taken, append 6-char URL-safe random string (base62: a-zA-Z0-9)
  - Keep trying until unique (max 10 attempts)
  - _Requirements: 1.2_

- [x] 4.2 Add ensure-username endpoint

  - Update `backend/app/routes/public_portfolio.py`
  - Add POST /ensure-username route handler
  - Accept `EnsureUsernameRequest` with user_id
  - Fetch user settings by user_id
  - If username exists, return it
  - If no username, get user email from Firebase Auth
  - Call `generate_username_from_email` to create username
  - Store username in user_settings
  - Return `EnsureUsernameResponse` with username
  - _Requirements: 1.2_

- [x] 5. Implement POST /public/ensure-token endpoint

  - Create new endpoint for token generation
  - Fetch user settings and validate conditions
  - _Requirements: 2_

- [x] 5.1 Add ensure-token endpoint

  - Update `backend/app/routes/public_portfolio.py`
  - Add POST /ensure-token route handler
  - Accept `EnsureTokenRequest` body
  - Fetch user settings by username from Firebase
  - Return 404 if username doesn't exist
  - Return 404 if is_public == false
  - Return 404 if public_token_enabled == false
  - Get public_token_ver from user settings
  - Call token service to generate token
  - Return `EnsureTokenResponse` with token
  - _Requirements: 2_

- [x] 6. Update GET /public/portfolio/{username} for optional token auth

  - Add optional Authorization header support
  - Verify token when present
  - _Requirements: 3_

- [x] 6.1 Add optional token verification to portfolio endpoint

  - Update `backend/app/routes/public_portfolio.py` GET /portfolio/{username}
  - Add optional `authorization: Optional[str] = Header(None)` parameter
  - If authorization header present:
    - Extract Bearer token
    - Fetch user settings to get public_token_ver
    - Verify token using token service
    - Return 401 if token invalid
  - Keep existing is_public check (404 if false)
  - Return portfolio data if all checks pass
  - _Requirements: 3_

- [ ] 7. Create POST /public/chat/{username} endpoint with required token

  - Move chat from /api/chat to /public/chat
  - Require token authentication
  - Reuse existing chat infrastructure
  - _Requirements: 4_

- [x] 7.1 Create public chat endpoint

  - Create `backend/app/routes/public_chat.py` or update `public_portfolio.py`
  - Add POST /chat/{username} route under /public router
  - Require `authorization: str = Header(...)` (not optional)
  - Extract Bearer token from authorization header
  - Fetch user settings by username to get public_token_ver
  - Verify token using token service
  - Return 401 if token missing or invalid
  - Check is_public == true, return 404 if false
  - Get client IP address for rate limiting
  - _Requirements: 4_

- [x] 7.2 Integrate with existing chat infrastructure

  - Call existing rate limiting with updated keys (IP, username, token)
  - Fetch portfolio data using existing portfolio service
  - Call existing AIChatService for chat processing
  - Use existing ChatStorageService for conversation storage
  - Increment portfolio owner usage counter
  - Return StreamingResponse with SSE format (reuse existing logic)
  - _Requirements: 4_

- [x] 8. Update rate limiting for token-based keys

  - Modify rate limiting to use token instead of user_id
  - _Requirements: 4, 8_

- [x] 8.1 Update chat rate limiting dependencies

  - Update `backend/app/dependencies/chat_rate_limiting.py`
  - Modify rate limit key format from `chat_ip_{ip}_user_{user_id}` to `chat_ip_{ip}_username_{username}_token_{token_hash}`
  - Use first 8 characters of token for token_hash
  - Update `check_chat_ip_rate_limit` to accept username and token parameters
  - Keep existing rate limit logic (50 req/hour per IP)
  - _Requirements: 4, 8_

- [x] 9. Remove legacy Firebase authentication code

  - Delete unused files and remove auth checks
  - _Requirements: 5_

- [x] 9.1 Delete portfolio_access.py dependency

  - Delete `backend/app/dependencies/portfolio_access.py` file
  - Remove all imports of `check_portfolio_access` from other files
  - _Requirements: 5_

- [x] 9.2 Remove old /api/chat/{username} endpoint

  - Delete or comment out the old chat endpoint in `backend/app/routes/chat.py`
  - Remove the entire `/api/chat` router if no other endpoints exist
  - Remove imports related to `check_portfolio_access`
  - _Requirements: 5_

- [x] 9.3 Clean up Firebase auth references

  - Search for and remove any Firebase auth token verification in public routes
  - Remove user_id-based logic from public endpoints
  - Ensure no authenticated user checks remain in public API routes
  - _Requirements: 5_

- [x] 10. Update frontend template components for token support

  - Add token props to components
  - Update API clients to use tokens
  - _Requirements: 6_

- [x] 10.1 Update Portfolio component props

  - Update `packages/template-components/src/components/Portfolio.tsx`
  - Add `publicToken?: string` to component props interface
  - Pass publicToken to child components that need it
  - _Requirements: 6_

- [x] 10.2 Update ChatPortfolio component props

  - Update `packages/template-components/src/components/ChatPortfolio.tsx`
  - Add `publicToken?: string` to component props interface
  - Pass publicToken to API client calls
  - Show error if publicToken is undefined when trying to chat
  - _Requirements: 6_

- [x] 10.3 Update public API client

  - Update `packages/template-components/src/clients/public-api-client.ts`
  - Update `fetchPublicPortfolio` to accept optional publicToken parameter
  - Add Authorization header if publicToken provided: `Bearer ${publicToken}`
  - Update chat function to require publicToken parameter
  - Add Authorization header for chat: `Bearer ${publicToken}`
  - Throw error if chat called without publicToken
  - _Requirements: 6_

- [x] 10.4 Create token types

  - Create or update `packages/template-components/src/types/index.ts`
  - Add `EnsureTokenRequest` interface
  - Add `EnsureTokenResponse` interface
  - Add `PortfolioConfig` interface with apiBaseUrl, username, publicToken
  - _Requirements: 6_

- [x] 11. Implement preview page username and token fetching

  - Add username generation and token fetch logic to preview page
  - Handle loading and error states
  - _Requirements: 1.2, 7_

- [x] 11.1 Add username and token fetching to preview page

  - Update `apps/template/src/app/page.tsx` (or relevant preview page)
  - Add state for username, publicToken, loading, and error
  - For authenticated users: Call POST /public/ensure-username with user_id first
  - Store returned username in state
  - Add useEffect to fetch token when username is available
  - Call POST /public/ensure-token with username
  - Handle 404 as "Portfolio not found"
  - Store token in state when received
  - Only render Portfolio component when both username and token available
  - Show loading screen while fetching
  - Show error screen if fetch fails
  - _Requirements: 1.2, 7_

- [x] 11.2 Pass token to Portfolio component

  - Update Portfolio component instantiation in preview page
  - Pass apiBaseUrl, username, and publicToken props
  - Ensure all three props are available before rendering
  - _Requirements: 7_

- [ ] 12. Backend integration testing

  - Test token generation and verification
  - Test all endpoints with token auth
  - Test rate limiting with tokens
  - _Requirements: All_

- [ ] 12.1 Test token service

  - Create `backend/tests/test_public_token_service.py`
  - Test `derive_public_token` generates consistent tokens for same username + version
  - Test different versions generate different tokens
  - Test token format validation (starts with "psk\_", correct length)
  - Test `verify_public_token` returns True for valid tokens
  - Test `verify_public_token` returns False for invalid tokens
  - Test `verify_public_token` returns False for wrong version
  - Test constant-time comparison behavior
  - _Requirements: 1_

- [ ] 12.2 Test /public/ensure-username endpoint

  - Create or update `backend/tests/test_public_portfolio_routes.py`
  - Test username retrieval for existing username
  - Test username generation from email for new users
  - Test username uniqueness (tries base, then with suffix)
  - Test URL-safe random string generation
  - Mock Firebase Auth and user_settings queries
  - _Requirements: 1.2_

- [ ] 12.3 Test /public/ensure-token endpoint

  - Create or update `backend/tests/test_public_portfolio_routes.py`
  - Test successful token generation for public portfolio with token enabled
  - Test 404 for non-existent username
  - Test 404 for private portfolio (is_public == false)
  - Test 404 for token disabled (public_token_enabled == false)
  - Test deterministic token generation (same username returns same token)
  - Mock Firebase user_settings queries
  - _Requirements: 2_

- [ ] 12.4 Test /public/portfolio/{username} with token

  - Update `backend/tests/test_public_portfolio_routes.py`
  - Test portfolio fetch with valid token returns data
  - Test portfolio fetch with invalid token returns 401
  - Test portfolio fetch without token returns data (backward compatible)
  - Test private portfolio returns 404 regardless of token
  - Mock Firebase queries and token service
  - _Requirements: 3_

- [ ] 12.5 Test /public/chat/{username} endpoint

  - Create `backend/tests/test_public_chat_routes.py`
  - Test chat with valid token processes request
  - Test chat without Authorization header returns 401
  - Test chat with invalid token returns 401
  - Test chat with private portfolio returns 404
  - Test rate limiting with token-based keys
  - Mock AIChatService, ChatStorageService, and Firebase
  - _Requirements: 4, 8_

- [ ] 12.6 Test rate limiting with tokens

  - Update `backend/tests/test_chat_rate_limiting.py`
  - Test rate limit keys use (IP, username, token) format
  - Test different tokens get separate rate limit buckets
  - Test same token shares limits across requests
  - Test token version change creates new rate limit bucket
  - _Requirements: 8_

- [ ] 13. Update documentation

  - Document token system and API changes
  - _Requirements: All_

- [ ] 13.1 Update API documentation

  - Update `backend/README.md` or create API docs
  - Document POST /public/ensure-username endpoint
  - Document POST /public/ensure-token endpoint
  - Document updated GET /public/portfolio/{username} with optional token
  - Document POST /public/chat/{username} with required token
  - Include example requests and responses
  - Document token format and generation
  - Document username generation logic
  - _Requirements: All_

- [ ] 13.2 Update frontend integration guide
  - Update `packages/template-components/integration-guide/README.md`
  - Document new token props for Portfolio and ChatPortfolio components
  - Document token fetching flow for preview pages
  - Include example code for token integration
  - _Requirements: 6, 7_
