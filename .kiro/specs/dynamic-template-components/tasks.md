# Implementation Plan

- [x] 1. Set up core configuration and data provider infrastructure

  - Create configuration interface and types for template components
  - Implement base data provider class with abstract methods
  - Add error boundary components for graceful error handling
  - _Requirements: 1.1, 1.2, 6.3_

- [ ] 2. Align frontend schema with backend and implement mapping utilities

  - [x] 2.1 Update frontend schema to match backend structure

    - Modify frontend PortfolioData types to align with backend schema structure
    - Add profile_photo_url field to backend Profile schema
    - Update frontend types to use backend naming conventions and optional fields
    - _Requirements: 5.1, 5.2, 2.5_

  - [x] 2.2 Create simple data transformation utilities
    - Write lightweight transformation functions for any necessary field mapping
    - Handle backend Profile array to frontend SocialLink array conversion
    - Add basic error handling for malformed API responses
    - _Requirements: 5.3, 6.3_

- [ ] 3. Create API client implementation

  - [x] 3.1 Implement authenticated API client for private portfolio data

    - Write API client class with methods for authenticated portfolio endpoints
    - Add authentication token handling and header management
    - Implement error handling for authentication failures and token expiration
    - _Requirements: 2.1, 2.2, 8.4_

  - [x] 3.2 Implement public API client for public portfolio access
    - Write API client methods for public portfolio endpoints by username
    - Add username availability checking functionality
    - Implement proper error handling for 404 responses on private portfolios
    - _Requirements: 8.1, 8.3, 7.4_

- [ ] 4. Add JSON file fallback system

  - [x] 4.1 Create JSON file loader

    - Implement JSON file reading and parsing functionality
    - Create error handling for missing or invalid JSON files
    - _Requirements: 3.1, 3.3_

  - [x] 4.2 Implement hybrid data source selection logic
    - Write logic to choose between API and JSON data sources based on configuration
    - Add fallback mechanism from API to JSON when API calls fail
    - Implement data source switching without component remounts
    - _Requirements: 3.2, 3.4_

- [ ] 5. Implement performance optimization

  - [x] 5.1 Add batch data loading functionality
    - Implement single API call to fetch all required portfolio data
    - Create data batching logic to minimize API requests
    - Add support for incremental data loading when needed
    - _Requirements: 9.1, 9.3_

- [ ] 6. Create backend routes for public portfolio system

  - [x] 6.1 Implement public portfolio API endpoints

    - Add GET /public/portfolio/{username} route for public portfolio access
    - Implement access control to only return data for public portfolios
    - Add proper 404 responses for private or non-existent portfolios
    - _Requirements: 8.1, 8.3_

  - [x] 6.2 Add username management API endpoints
    - Create GET /public/username/{username}/available endpoint for availability checking
    - Implement PUT /settings/username endpoint for setting user usernames
    - Add PUT /settings/visibility endpoint for portfolio visibility control
    - _Requirements: 7.1, 7.2, 7.6_

- [ ] 7. Extend backend data models for public portfolio support

  - [x] 7.1 Add UserSettings model and database schema

    - Create UserSettings Pydantic model with username and visibility fields
    - Add database schema for storing user settings and public usernames
    - Implement unique constraints and validation for usernames
    - _Requirements: 7.1, 7.3_

  - [x] 7.2 Extend Profile model with profile_photo_url field
    - Add profile_photo_url field to backend Profile schema
    - Update portfolio service to handle profile photo URL storage and retrieval
    - Ensure backward compatibility with existing portfolio data
    - _Requirements: 2.5, 5.1_

- [ ] 8. Implement username management UI components

  - [x] 8.1 Create username selection component with availability checking

    - Build React component for username input with real-time validation
    - Add debounced API calls for username availability checking
    - Implement loading states and availability indicators
    - _Requirements: 7.1, 7.2_

  - [x] 8.2 Add portfolio visibility toggle component
    - Create toggle component for public/private portfolio visibility
    - Add confirmation dialogs for visibility changes
    - Implement proper state management for visibility settings
    - _Requirements: 7.5, 8.2_

- [ ] 9. Add server-side data fetching support for Next.js

  - [x] 9.1 Implement server-side data provider for SSR/SSG

    - Create server-side compatible data provider that works in Next.js API routes
    - Add support for fetching data during getServerSideProps and getStaticProps
    - Implement proper error handling for server-side data fetching failures
    - _Requirements: 4.1, 4.3_

  - [x] 9.2 Create client-side hydration and data passing utilities
    - Implement utilities to pass server-fetched data to client components
    - Add hydration logic to prevent unnecessary client-side API calls
    - Create data serialization/deserialization for server-client data transfer
    - _Requirements: 4.2, 4.4_

- [ ] 10. Update template components to use dynamic data

  - [x] 10.1 Modify existing portfolio components to accept dynamic data props

    - Update ChatPortfolio and TraditionalPortfolio components to use data provider
    - Replace hardcoded example data with props from data provider
    - Add loading states and error boundaries to all portfolio components
    - _Requirements: 2.1, 2.3, 6.2_

  - [x] 10.2 Add component flagging system for external data dependencies
    - Create documentation and TypeScript interfaces to flag components requiring external data
    - Implement dummy data fallbacks for flagged components when no data is provided
    - Add development-time warnings for components used without proper data configuration
    - _Requirements: 6.1, 6.4_

- [ ] 11. Implement comprehensive error handling and logging

  - [x] 11.1 Add error boundary components with fallback UI

    - Create error boundary components for different error types (network, auth, validation)
    - Implement fallback UI components for each error scenario
    - Add error reporting and logging functionality for debugging
    - _Requirements: 2.3, 6.3_

  - [x] 11.2 Create development and debugging utilities
    - Add debug logging for data source selection and API calls
    - Implement development-mode warnings for configuration issues
    - Create utilities for testing different data sources and error scenarios
    - _Requirements: 6.4_

- [ ] 12. Add integration tests for critical functionality

  - [x] 12.1 Write tests for username uniqueness and access control

    - Create automated tests for concurrent username registration scenarios
    - Add tests to ensure private portfolios return 404 on public API routes
    - Test username validation and sanitization logic
    - _Requirements: 7.3, 8.3_

  - [x] 12.2 Implement data transformation tests
    - Write unit tests for simple data transformation functions
    - Add tests for profile photo URL handling and social link mapping
    - _Requirements: 5.1, 5.3_

- [ ] 13. Create package configuration and documentation

  - [x] 13.1 Update package exports and configuration options

    - Modify package.json to export new configuration interfaces and components
    - Create TypeScript declaration files for all new interfaces and types
    - Add proper tree-shaking support for unused functionality
    - _Requirements: 1.1, 1.4_

  - [x] 13.2 Write integration guide and usage documentation
    - Create comprehensive documentation for configuring API endpoints and data sources
    - Add examples for Next.js server-side data fetching integration
    - Document username management and public portfolio publishing workflows
    - _Requirements: 6.1, 7.1_
