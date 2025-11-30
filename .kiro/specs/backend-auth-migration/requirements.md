# Requirements Document

## Introduction

This feature migrates the authentication flow from direct frontend Firebase interaction to a backend-managed authentication system. Currently, the frontend directly interacts with Firebase for all authentication operations (sign up, sign in, email verification). This creates several challenges:

- **Security concerns**: Firebase configuration and logic exposed on the client
- **Rate limiting**: No centralized control over authentication attempts
- **Configuration complexity**: Firebase setup required on frontend
- **Username management**: No automatic username assignment during registration

The new system will route all authentication operations through backend APIs, providing better security, centralized rate limiting, and automatic username generation for new users.

## Requirements

### Requirement 1: Backend Authentication API Endpoints

**User Story:** As a developer, I want backend API endpoints for all authentication operations, so that the frontend can delegate authentication logic to a secure backend service.

#### Acceptance Criteria

1. WHEN a user attempts to sign up THEN the system SHALL provide a POST `/api/auth/signup` endpoint that accepts email and password
2. WHEN a user attempts to sign in THEN the system SHALL provide a POST `/api/auth/signin` endpoint that accepts email and password
3. WHEN a user needs to verify their email THEN the system SHALL provide a POST `/api/auth/send-verification-email` endpoint
4. WHEN a user completes email verification THEN the system SHALL provide a GET `/api/auth/verify-email` endpoint that accepts a verification token
5. WHEN a user needs to sign out THEN the system SHALL provide a POST `/api/auth/signout` endpoint
6. IF any authentication endpoint receives invalid credentials THEN the system SHALL return appropriate HTTP error codes (400, 401, 403)
7. WHEN authentication is successful THEN the system SHALL return a custom token that the frontend can use with Firebase

### Requirement 2: Automatic Username Generation

**User Story:** As a new user, I want a unique username automatically assigned when I create my account, so that I don't have to manually choose one during registration.

#### Acceptance Criteria

1. WHEN a user signs up THEN the system SHALL generate a username based on their email prefix
2. WHEN generating a username THEN the system SHALL append random numbers to ensure uniqueness
3. WHEN checking username uniqueness THEN the system SHALL query Firestore to verify no existing user has that username
4. IF a generated username exists THEN the system SHALL retry with different random numbers up to 5 attempts
5. WHEN a username is successfully generated THEN the system SHALL store it in the user's Firestore document
6. WHEN username generation fails after maximum retries THEN the system SHALL return an error to the frontend

### Requirement 3: Rate Limiting for Authentication

**User Story:** As a system administrator, I want rate limiting on authentication endpoints, so that the system is protected from brute force attacks and abuse.

#### Acceptance Criteria

1. WHEN authentication endpoints are called THEN the system SHALL apply rate limiting based on IP address
2. WHEN a user exceeds sign-in attempts THEN the system SHALL limit to 5 attempts per 15 minutes per IP
3. WHEN a user exceeds sign-up attempts THEN the system SHALL limit to 3 attempts per hour per IP
4. WHEN rate limit is exceeded THEN the system SHALL return HTTP 429 with a clear error message
5. WHEN verification email is requested THEN the system SHALL limit to 3 requests per hour per user

### Requirement 4: Frontend Authentication Client

**User Story:** As a frontend developer, I want a clean API client for authentication operations, so that I can easily integrate backend authentication into existing components.

#### Acceptance Criteria

1. WHEN the frontend needs authentication functions THEN the system SHALL provide a centralized auth API client module
2. WHEN calling auth functions THEN the client SHALL handle HTTP requests to backend endpoints
3. WHEN authentication succeeds THEN the client SHALL receive and store the custom Firebase token
4. WHEN authentication fails THEN the client SHALL return structured error messages
5. WHEN network errors occur THEN the client SHALL provide user-friendly error messages
6. WHEN the auth client is used THEN it SHALL maintain the same interface as current Firebase methods to minimize migration effort

### Requirement 5: Backward Compatible Migration

**User Story:** As a developer, I want the migration to be backward compatible with existing user sessions, so that current users are not logged out or disrupted.

#### Acceptance Criteria

1. WHEN existing users have active Firebase sessions THEN the system SHALL continue to honor those sessions
2. WHEN the AuthContext is updated THEN it SHALL work with both old Firebase tokens and new backend-issued tokens
3. WHEN protected routes check authentication THEN they SHALL accept tokens from both authentication methods
4. WHEN the migration is complete THEN existing Firebase configuration SHALL remain functional for token validation
5. IF a user is already signed in THEN they SHALL NOT be required to sign in again after deployment

### Requirement 6: Secure Token Management

**User Story:** As a security-conscious developer, I want secure token handling between backend and frontend, so that user sessions are protected.

#### Acceptance Criteria

1. WHEN the backend creates a custom token THEN it SHALL use Firebase Admin SDK with proper credentials
2. WHEN tokens are transmitted THEN they SHALL be sent over HTTPS only
3. WHEN the frontend receives a token THEN it SHALL store it securely and use it for Firebase authentication
4. WHEN a token expires THEN the system SHALL provide clear feedback to the user
5. WHEN token validation fails THEN the system SHALL require re-authentication
6. WHEN sensitive operations occur THEN the backend SHALL verify the token with Firebase Admin SDK

### Requirement 7: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN authentication fails due to invalid credentials THEN the system SHALL return "Invalid email or password"
2. WHEN email is already in use THEN the system SHALL return "Email already registered"
3. WHEN email format is invalid THEN the system SHALL return "Invalid email format"
4. WHEN password is too weak THEN the system SHALL return specific password requirements
5. WHEN rate limit is hit THEN the system SHALL return "Too many attempts, please try again later"
6. WHEN network errors occur THEN the system SHALL return "Connection error, please try again"
7. WHEN verification email fails to send THEN the system SHALL return "Failed to send verification email"

### Requirement 8: Minimal Frontend Changes

**User Story:** As a developer, I want minimal changes to existing frontend components, so that the migration is low-effort and reduces risk of bugs.

#### Acceptance Criteria

1. WHEN updating LoginForm THEN it SHALL only change the authentication function calls
2. WHEN updating SignUpForm THEN it SHALL only change the authentication function calls
3. WHEN updating AuthContext THEN it SHALL maintain the same public interface
4. WHEN components use auth state THEN they SHALL continue to work without modification
5. WHEN the migration is complete THEN no changes SHALL be required to protected routes or middleware
6. WHEN testing the migration THEN existing test files SHALL require minimal updates
