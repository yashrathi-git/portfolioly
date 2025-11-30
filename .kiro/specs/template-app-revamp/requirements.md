# Requirements Document

## Introduction

This specification defines the requirements for revamping the template app (`apps/template`) to properly consume the Portfolio component from `@portfolioly/template-components` package. The current template app is outdated with old schema types, invalid props, and incorrect package dependencies. The revamp will create a new wrapper component that makes portfolioData optional and automatically fetches from the API when not provided, then update the template app to use this simplified approach.

## Glossary

- **Template App**: The standalone Next.js application in `apps/template` that displays a single portfolio
- **Template Components Package**: The shared package `@portfolioly/template-components` containing reusable portfolio UI components
- **PortfolioWrapper**: A new wrapper component that abstracts API calls and data fetching
- **Public Token**: Authentication token used to access public portfolio data and chat functionality
- **Backend API**: The FastAPI backend service that provides portfolio data
- **DisplayPortfolioData**: The frontend-optimized portfolio data format from `@portfolioly/schema`

## Requirements

### Requirement 1: Create PortfolioWrapper Component

**User Story:** As a template app developer, I want a simple wrapper component that handles all data fetching logic, so that I can display a portfolio with minimal configuration.

#### Acceptance Criteria

1. THE Template Components Package SHALL provide a PortfolioWrapper component that wraps the Portfolio component
2. WHEN portfolioData prop is provided, THE PortfolioWrapper SHALL use the provided data without making API calls
3. WHEN portfolioData prop is not provided AND username and apiBaseUrl are provided, THE PortfolioWrapper SHALL fetch portfolio data from the backend API using PublicApiClient
4. THE PortfolioWrapper SHALL accept publicToken as an optional prop for authenticated API access
5. THE PortfolioWrapper SHALL pass all Portfolio props through to the underlying Portfolio component

### Requirement 2: Implement Data Fetching Logic

**User Story:** As a template app developer, I want the component to automatically fetch portfolio data from the backend, so that I don't need to write custom API integration code.

#### Acceptance Criteria

1. WHEN username and apiBaseUrl are provided, THE PortfolioWrapper SHALL call the public portfolio API endpoint
2. IF publicToken is provided, THE PortfolioWrapper SHALL include it in the Authorization header
3. WHILE data is being fetched, THE PortfolioWrapper SHALL display a loading state
4. IF the API request fails, THEN THE PortfolioWrapper SHALL display an error state with the error message
5. WHEN portfolio data is successfully fetched, THE PortfolioWrapper SHALL transform it to DisplayPortfolioData format

### Requirement 3: Leverage Existing Portfolio Component Features

**User Story:** As a template app developer, I want the wrapper to leverage all existing Portfolio component features, so that I don't need to reimplement functionality.

#### Acceptance Criteria

1. THE PortfolioWrapper SHALL rely on Portfolio component's built-in suggestion generation
2. THE PortfolioWrapper SHALL rely on Portfolio component's built-in profile generation
3. THE PortfolioWrapper SHALL rely on Portfolio component's built-in layout switching (chat/traditional)
4. THE PortfolioWrapper SHALL pass through all Portfolio props (isOwner, isPreview, profile, suggestions, etc.)
5. THE PortfolioWrapper SHALL only handle data fetching and loading/error states

### Requirement 4: Revamp Template App

**User Story:** As a template app maintainer, I want the template app to use the new PortfolioWrapper component, so that it serves as a clean reference implementation.

#### Acceptance Criteria

1. THE Template App SHALL use PortfolioWrapper with only environment variable configuration
2. THE Template App SHALL read username, apiBaseUrl, and publicToken from environment variables
3. THE Template App SHALL NOT manually fetch or transform portfolio data
4. THE Template App SHALL include TemplateProvider for theme support
5. THE Template App page.tsx SHALL be less than 50 lines of code

### Requirement 5: Update Package Dependencies

**User Story:** As a template app developer, I want correct package dependencies, so that the app builds and runs without errors.

#### Acceptance Criteria

1. THE Template App package.json SHALL include @portfolioly/template-components as a workspace dependency
2. THE Template App SHALL NOT include @portfolioly/schema directly (imported via template-components)
3. THE Template App SHALL NOT include duplicate UI dependencies already in template-components
4. THE Template App SHALL use the same React and Next.js versions as the main app
5. THE Template App SHALL have minimal dependencies (Next.js, React, template-components, and styling)

### Requirement 6: Environment Variable Configuration

**User Story:** As a template app deployer, I want clear environment variable configuration, so that I can easily deploy the template to different environments.

#### Acceptance Criteria

1. THE Template App SHALL require NEXT_PUBLIC_USERNAME environment variable
2. THE Template App SHALL require NEXT_PUBLIC_API_BASE_URL environment variable with a default value
3. THE Template App SHALL accept optional NEXT_PUBLIC_PUBLIC_TOKEN environment variable
4. THE Template App .env.example SHALL document all required and optional environment variables
5. THE Template App SHALL provide helpful error messages when required environment variables are missing

### Requirement 7: Export PortfolioWrapper

**User Story:** As a package consumer, I want PortfolioWrapper exported from the template-components package, so that I can import and use it in my applications.

#### Acceptance Criteria

1. THE Template Components Package SHALL export PortfolioWrapper from src/index.ts
2. THE Template Components Package SHALL export PortfolioWrapperProps type
3. THE Template Components Package SHALL include PortfolioWrapper in the package build output
4. THE Template Components Package documentation SHALL include usage examples for PortfolioWrapper
5. THE PortfolioWrapper SHALL be tree-shakeable when not used
