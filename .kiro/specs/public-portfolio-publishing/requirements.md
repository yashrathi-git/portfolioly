# Requirements Document

## Introduction

This feature enables users to publish their portfolios publicly at a custom URL (`hostname/p/username`), preview their portfolio in fullscreen mode, and prepare for future Vercel deployment. The system provides a seamless publishing workflow with username management, public/private access control, and authenticated preview capabilities.

## Glossary

- **Portfolio Editor**: The authenticated editing interface where users modify their portfolio content
- **Public Portfolio**: A portfolio accessible at `/p/username` without authentication when published
- **Fullscreen Preview**: An authenticated preview mode showing the portfolio in a dedicated page
- **Publishing System**: The backend service managing portfolio visibility and access control
- **Username**: A unique identifier (3-30 characters, alphanumeric with hyphens/underscores) for public portfolio URLs
- **Access Mode**: Setting determining if portfolio is "public" or "private" in `chat_settings.access_mode`
- **Public Token**: A deterministic token (`psk_xxx...`) for accessing portfolio data
- **Firebase JWT**: Authentication token for logged-in users
- **Ensure Token Endpoint**: Backend API that returns public tokens based on authentication and access mode

## Requirements

### Requirement 1: Fullscreen Preview Mode

**User Story:** As a portfolio owner, I want to preview my portfolio in fullscreen mode, so that I can see exactly how it will appear to visitors before publishing.

#### Acceptance Criteria

1. WHEN the user clicks a "Preview Fullscreen" button in preview mode, THE Portfolio Editor SHALL open the portfolio in a new browser tab at `/preview`
2. WHEN the `/preview` route is accessed, THE System SHALL verify the user is authenticated via Firebase JWT
3. IF the user is not authenticated, THEN THE System SHALL redirect to the sign-in page
4. WHEN an authenticated user accesses `/preview`, THE System SHALL fetch their portfolio data using their Firebase JWT token
5. WHEN portfolio data is retrieved, THE System SHALL render the portfolio using the template-components Portfolio component with full interactivity

### Requirement 2: Publishing Controls in Editor

**User Story:** As a portfolio owner, I want to manage my portfolio's public visibility from the editor, so that I can control who can access my portfolio.

#### Acceptance Criteria

1. WHEN the user is in edit or preview mode, THE Portfolio Editor SHALL display a "Publish Settings" section in the top bar or a dedicated panel
2. WHEN the Publish Settings section is rendered, THE System SHALL display the current username with an edit capability
3. WHEN the user edits their username, THE System SHALL validate the username format (3-30 chars, alphanumeric with hyphens/underscores, no leading/trailing special chars)
4. WHEN the username is valid and available, THE System SHALL update the username via the backend API
5. WHEN the Publish Settings section is rendered, THE System SHALL display a toggle for "Make Portfolio Public"
6. WHEN the user toggles "Make Portfolio Public" to enabled, THE System SHALL update `chat_settings.access_mode` to "public" via the backend API
7. WHEN the portfolio is public, THE System SHALL display the full public URL (`hostname/p/username`) with a copy button
8. WHEN the portfolio is private, THE System SHALL display a message indicating the portfolio is not publicly accessible

### Requirement 3: Public Portfolio Route

**User Story:** As a visitor, I want to access a published portfolio at `/p/username`, so that I can view the portfolio owner's work without authentication.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/p/username`, THE System SHALL call the ensure-token endpoint with only the username parameter
2. WHEN the ensure-token endpoint receives a username-only request, THE System SHALL check if the username exists
3. IF the username does not exist, THEN THE System SHALL return a 404 error
4. WHEN the username exists, THE System SHALL check if `chat_settings.access_mode` is set to "public"
5. IF the access mode is "private", THEN THE System SHALL return a 404 error
6. WHEN the access mode is "public", THE System SHALL return a valid public token
7. WHEN the public token is received, THE System SHALL fetch the portfolio data using the public token
8. WHEN portfolio data is retrieved, THE System SHALL render the portfolio using the template-components Portfolio component
9. WHEN rendering fails or data is unavailable, THE System SHALL display an appropriate error message

### Requirement 4: Enhanced Ensure Token Authentication

**User Story:** As a system, I want to support both authenticated and public token generation, so that portfolio owners can preview privately while allowing public access when published.

#### Acceptance Criteria

1. WHEN the ensure-token endpoint receives a request with a Firebase JWT token, THE System SHALL verify the JWT token
2. WHEN the JWT token is valid, THE System SHALL return a public token regardless of the `access_mode` setting
3. WHEN the ensure-token endpoint receives a request with only a username, THE System SHALL check the `access_mode` setting
4. IF `access_mode` is "public", THEN THE System SHALL return a public token
5. IF `access_mode` is "private" AND no valid JWT is provided, THEN THE System SHALL return a 404 error
6. WHEN token generation is disabled (`public_token_enabled` is false), THE System SHALL return a 404 error regardless of authentication

### Requirement 5: Deploy to Vercel Button (Placeholder)

**User Story:** As a portfolio owner, I want to see a "Deploy to Vercel" button, so that I can prepare for future deployment capabilities.

#### Acceptance Criteria

1. WHEN the user is in edit or preview mode, THE Portfolio Editor SHALL display a "Deploy to Vercel" button in the top bar
2. WHEN the user clicks the "Deploy to Vercel" button, THE System SHALL display a message indicating this feature is coming soon
3. THE Deploy button SHALL be visually styled to indicate it is a future feature (e.g., with a "Coming Soon" badge)

### Requirement 6: User Experience and Discoverability

**User Story:** As a portfolio owner, I want publishing controls to be easily discoverable and intuitive, so that I can quickly publish my portfolio without confusion.

#### Acceptance Criteria

1. WHEN the user first accesses the editor, THE System SHALL display a prominent indicator if the portfolio is not yet published
2. WHEN the user has not set a username, THE System SHALL display a prompt to set a username in the Publish Settings
3. WHEN the username is set but the portfolio is private, THE System SHALL display a clear call-to-action to make the portfolio public
4. WHEN the portfolio is public, THE System SHALL display the public URL prominently with visual confirmation (e.g., green checkmark)
5. THE Publish Settings section SHALL use clear, non-technical language for all controls and messages
6. WHEN the user hovers over the public URL, THE System SHALL display a tooltip indicating "Click to copy"
7. WHEN the user copies the public URL, THE System SHALL display a temporary success message

### Requirement 7: Error Handling and Edge Cases

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN a visitor accesses a non-existent username at `/p/username`, THE System SHALL display a 404 page with a message "Portfolio not found"
2. WHEN a visitor accesses a private portfolio at `/p/username`, THE System SHALL display a 404 page (not revealing the portfolio exists)
3. WHEN the ensure-token endpoint fails, THE System SHALL log the error and return an appropriate HTTP status code
4. WHEN username validation fails, THE System SHALL display specific error messages (e.g., "Username must be at least 3 characters")
5. WHEN a username is already taken, THE System SHALL display "Username is already taken" with optional suggestions
6. WHEN the backend is unavailable, THE System SHALL display a user-friendly error message with retry options
