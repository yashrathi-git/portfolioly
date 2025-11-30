# Requirements Document

## Introduction

This specification defines the routing refactor for Portfolioly to establish a clear separation between public and authenticated experiences. The refactor will move the public landing page to `/` and create a protected dashboard at `/dashboard` with a modern, card-based interface that serves as the main hub for authenticated users.

## Glossary

- **Landing Page**: The public-facing homepage at `/` that serves as the entry point for unauthenticated users
- **Dashboard**: The protected main view at `/dashboard` that serves as the hub for authenticated users
- **HeaderBar**: The global navigation component that appears across all pages
- **Protected Route**: A route that requires authentication and optionally email verification
- **Resume Feature Notification**: A user preference stored in Firestore to notify users when the resume maker feature launches

## Requirements

### Requirement 1

**User Story:** As an unauthenticated visitor, I want to land on a public homepage at `/`, so that I can learn about Portfolioly and sign up.

#### Acceptance Criteria

1. WHEN an unauthenticated user visits `/` THEN the system SHALL display a public landing page with product information and sign-up options
2. WHEN an authenticated user visits `/` THEN the system SHALL display the landing page with a call-to-action to navigate to `/dashboard`
3. WHEN the landing page is displayed THEN the system SHALL include clear navigation options to sign up or sign in
4. WHEN an authenticated user clicks the dashboard link on `/` THEN the system SHALL navigate to `/dashboard`

### Requirement 2

**User Story:** As an authenticated user, I want to access my main dashboard at `/dashboard`, so that I can quickly navigate to key features.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access `/dashboard` THEN the system SHALL redirect to `/` with a prompt to sign in
2. WHEN an authenticated but unverified user attempts to access `/dashboard` THEN the system SHALL redirect to the email verification screen
3. WHEN an authenticated and verified user accesses `/dashboard` THEN the system SHALL display the dashboard interface
4. WHEN the dashboard loads THEN the system SHALL display a welcome message with the user's name or email

### Requirement 3

**User Story:** As an authenticated user, I want to see action cards on my dashboard, so that I can quickly access the features I need.

#### Acceptance Criteria

1. WHEN the dashboard displays THEN the system SHALL show four action cards: Edit Portfolio, Create New, Analyze Chats, and Resume Maker
2. WHEN a user clicks the Edit Portfolio card THEN the system SHALL navigate to the existing edit route
3. WHEN a user clicks the Create New card THEN the system SHALL navigate to `/upload`
4. WHEN a user clicks the Analyze Chats card THEN the system SHALL navigate to the existing analysis route
5. WHEN the Resume Maker card displays THEN the system SHALL show it as disabled with "Coming Soon" status

### Requirement 4

**User Story:** As a user interested in the resume maker feature, I want to toggle a notification preference, so that I can be notified when the feature launches.

#### Acceptance Criteria

1. WHEN the Resume Maker card displays THEN the system SHALL include a "Notify Me" toggle button
2. WHEN a user clicks the Notify Me button THEN the system SHALL toggle the `notify_for_resume_feature` boolean field in the user's Firestore document
3. WHEN the toggle state changes THEN the system SHALL persist the change to Firestore immediately
4. WHEN the dashboard loads THEN the system SHALL display the current notification preference state from Firestore
5. WHEN the Firestore update fails THEN the system SHALL display an error message and revert the toggle state

### Requirement 5

**User Story:** As a user, I want the global header to navigate to the appropriate page based on my authentication status, so that I have a consistent navigation experience.

#### Acceptance Criteria

1. WHEN an unauthenticated user clicks the app name in the header THEN the system SHALL navigate to `/`
2. WHEN an authenticated and verified user clicks the app name in the header THEN the system SHALL navigate to `/dashboard`
3. WHEN the header displays for authenticated users THEN the system SHALL show navigation links to key features
4. WHEN the header displays for unauthenticated users THEN the system SHALL show sign in and sign up options

### Requirement 6

**User Story:** As a developer, I want the dashboard UI to be beautiful and minimalistic, so that users have a pleasant experience.

#### Acceptance Criteria

1. WHEN the dashboard renders THEN the system SHALL use a card-based layout with consistent spacing and styling
2. WHEN action cards are displayed THEN the system SHALL include appropriate icons and visual hierarchy
3. WHEN the Resume Maker card is displayed THEN the system SHALL be visually distinct from active cards through dimmed or disabled styling
4. WHEN cards are hovered THEN the system SHALL provide subtle visual feedback
5. WHEN the dashboard is viewed on mobile devices THEN the system SHALL adapt the layout responsively
