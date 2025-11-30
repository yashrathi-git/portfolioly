# Requirements Document

## Introduction

This feature will transform the template-components package from using hardcoded data to dynamically fetching portfolio information from backend APIs. The package will support both API-based data fetching and fallback to local JSON files, with configurable endpoints and server-side data loading capabilities for Next.js applications.

## Requirements

### Requirement 1

**User Story:** As a developer using the template-components package, I want to configure API endpoints for portfolio data so that I can connect to different backend services.

#### Acceptance Criteria

1. WHEN initializing the template components THEN the system SHALL accept configurable API endpoint URLs
2. WHEN no API endpoints are provided THEN the system SHALL use default endpoint configurations
3. IF custom endpoints are provided THEN the system SHALL validate endpoint URL formats
4. WHEN endpoint configuration changes THEN the system SHALL update data fetching behavior accordingly

### Requirement 2

**User Story:** As a developer, I want the template components to fetch portfolio data from backend APIs so that the displayed information is always current and dynamic.

#### Acceptance Criteria

1. WHEN the component loads THEN the system SHALL fetch portfolio data from the configured API endpoints
2. WHEN API calls are successful THEN the system SHALL populate components with the fetched data
3. IF API calls fail THEN the system SHALL handle errors gracefully and show appropriate fallback content
4. WHEN data is being fetched THEN the system SHALL display loading states to users
5. WHEN portfolio data includes a profile_photo_url THEN the system SHALL display the profile photo in relevant components

### Requirement 3

**User Story:** As a developer, I want the option to use local JSON files instead of API calls so that I can work offline or use static data when needed.

#### Acceptance Criteria

1. WHEN JSON file mode is enabled THEN the system SHALL load portfolio data from local JSON files
2. WHEN both API and JSON options are available THEN the system SHALL prioritize the mode specified by the consumer
3. IF JSON files are missing or invalid THEN the system SHALL fall back to API calls or show error states
4. WHEN switching between JSON and API modes THEN the system SHALL update data sources without requiring component remounts

### Requirement 4

**User Story:** As a Next.js developer, I want portfolio data to be loaded server-side so that I can improve performance and SEO.

#### Acceptance Criteria

1. WHEN using Next.js THEN the system SHALL support server-side data fetching
2. WHEN data is fetched server-side THEN the system SHALL pass the data to client components efficiently
3. IF server-side fetching fails THEN the system SHALL fall back to client-side data fetching
4. WHEN data is loaded server-side THEN the system SHALL prevent unnecessary client-side API calls

### Requirement 5

**User Story:** As a developer, I want the template components to handle schema differences between frontend and backend so that data integration is seamless.

#### Acceptance Criteria

1. WHEN backend schema differs from frontend schema THEN the system SHALL map backend data to frontend schema format
2. WHEN backend schema is the authoritative source THEN the system SHALL prioritize backend data structure
3. IF schema mapping fails THEN the system SHALL log errors and use fallback data structures
4. WHEN new fields are added to backend schema THEN the system SHALL handle them gracefully without breaking existing functionality

### Requirement 6

**User Story:** As a developer, I want components that require external data to be clearly identified so that I can handle them appropriately during development.

#### Acceptance Criteria

1. WHEN components require external data THEN the system SHALL flag them in documentation
2. WHEN flagged components are used without data THEN the system SHALL display dummy/placeholder data
3. IF flagged components receive invalid data THEN the system SHALL show error boundaries with helpful messages
4. WHEN debugging data issues THEN the system SHALL provide clear logging about data source and status

### Requirement 7

**User Story:** As a user, I want to publish my portfolio publicly with a custom username so that others can view my portfolio without authentication.

#### Acceptance Criteria

1. WHEN a user wants to publish their portfolio THEN the system SHALL provide a UI to choose a unique username
2. WHEN a username is selected THEN the system SHALL validate username availability and format requirements
3. IF a username is already taken THEN the system SHALL prompt the user to choose a different username
4. WHEN a portfolio is set to public THEN the system SHALL make it accessible via public API endpoints using the chosen username
5. WHEN a portfolio is private THEN the public API SHALL return "not found" responses for that username
6. WHEN a user changes their username THEN the system SHALL update all public links and maintain data consistency

### Requirement 8

**User Story:** As a system, I want to enforce proper access controls for portfolio data so that private portfolios remain secure while public ones are accessible.

#### Acceptance Criteria

1. WHEN accessing portfolio data via public API THEN the system SHALL only return data for portfolios marked as public
2. WHEN accessing portfolio data via authenticated routes THEN the system SHALL return data for the authenticated user regardless of public/private status
3. IF a portfolio is private and accessed via public API THEN the system SHALL return a 404 not found response
4. WHEN viewing portfolio in the /edit page THEN the system SHALL use authenticated routes to fetch data
5. WHEN viewing a public portfolio THEN the system SHALL use public API endpoints with the username parameter

### Requirement 9

**User Story:** As a developer, I want efficient data loading that fetches all required data at once so that I can minimize API calls and improve performance.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL fetch all required portfolio data in a single batch
2. WHEN data is fetched THEN the system SHALL cache it for reuse across components
3. IF partial data loading is needed THEN the system SHALL support incremental data fetching
4. WHEN data changes THEN the system SHALL provide mechanisms to refresh cached data
5. WHEN multiple components need the same data THEN the system SHALL share the cached data instead of making duplicate requests
