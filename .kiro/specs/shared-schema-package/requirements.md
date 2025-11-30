# Requirements Document

## Introduction

This specification defines the requirements for consolidating duplicate portfolio schema definitions across the monorepo into a single shared package with Zod validation. Currently, portfolio schemas are defined separately in `apps/main/src/types/portfolio.ts` and `packages/template-components/src/types/portfolio.ts`, leading to duplication, inconsistencies, and manual data mapping. The goal is to create a unified, type-safe schema package that eliminates redundancy and leverages Zod for runtime validation and type inference.

## Glossary

- **Schema Package**: A new shared package (`@portfolioly/schema`) containing unified portfolio type definitions and Zod schemas
- **Main App**: The primary Next.js application at `apps/main` that handles portfolio editing and management
- **Template Components**: The shared component library at `packages/template-components` that renders portfolio views
- **Backend Schema**: The Python Pydantic models defined in `backend/app/schemas/portfolio.py` that serve as the source of truth
- **Zod**: A TypeScript-first schema validation library that provides runtime validation and type inference
- **Data Mapper**: Utility functions that transform data between different schema formats
- **Display Format Types**: Flattened, string-based types (e.g., `DisplayProject`, `DisplayWorkExperience`) used by UI components for rendering

## Requirements

### Requirement 1: Create Shared Schema Package

**User Story:** As a developer, I want a single source of truth for portfolio schemas, so that I can avoid duplication and inconsistencies across the codebase.

#### Acceptance Criteria

1. WHEN the Schema Package is created, THE Schema Package SHALL be located at `packages/schema` with proper package.json configuration
2. WHEN the Schema Package is built, THE Schema Package SHALL export both ESM and CJS formats with TypeScript declarations
3. WHEN the Schema Package is imported, THE Schema Package SHALL provide a package name `@portfolioly/schema` accessible to all workspace packages
4. WHEN the Schema Package is configured, THE Schema Package SHALL include Zod as a dependency with proper version constraints
5. WHEN the Schema Package is structured, THE Schema Package SHALL organize exports into logical modules (core types, validation schemas, utilities)

### Requirement 2: Define Zod Schemas Aligned with Backend

**User Story:** As a developer, I want Zod schemas that mirror the backend Pydantic models, so that I can validate API responses and ensure type safety at runtime.

#### Acceptance Criteria

1. WHEN a Zod schema is defined for DateInfo, THE schema SHALL validate month as optional integer between 1 and 12 and year as optional integer between 1900 and 2100
2. WHEN a Zod schema is defined for ProfileType, THE schema SHALL enumerate all profile types matching backend ProfileType enum values
3. WHEN a Zod schema is defined for PersonalInfo, THE schema SHALL include all fields from backend PersonalInfo model with appropriate optional/required constraints
4. WHEN a Zod schema is defined for WorkExperience, THE schema SHALL include structured date fields, technologies array, and markdown highlights field
5. WHEN a Zod schema is defined for Project, THE schema SHALL include images array with ProjectImage schema, demo_video field, and more_context field
6. WHEN a Zod schema is defined for Education, THE schema SHALL include structured date fields and all backend Education model fields
7. WHEN a Zod schema is defined for PortfolioData, THE schema SHALL compose all nested schemas and match backend PortfolioData structure
8. WHEN any Zod schema is defined, THE schema SHALL use z.infer to generate TypeScript types automatically

### Requirement 3: Provide Display Format Types

**User Story:** As a developer, I want display format types optimized for UI rendering, so that components receive flattened, string-based data ready for display.

#### Acceptance Criteria

1. WHEN display types are defined, THE Schema Package SHALL export DisplayProject type with formatted dates and flattened structure
2. WHEN display types are defined, THE Schema Package SHALL export DisplayWorkExperience type with companyName field and formatted date strings
3. WHEN display types are defined, THE Schema Package SHALL export DisplayEducation type with combined degree field and formatted date strings
4. WHEN display types are defined, THE Schema Package SHALL export DisplayPortfolioProfile type with avatarUrl and socials array
5. WHEN display types are defined, THE Schema Package SHALL export SocialLink and SocialType types for profile mapping

### Requirement 4: Implement Data Transformation Utilities

**User Story:** As a developer, I want Zod-powered transformation utilities, so that I can safely convert between backend and display data formats with validation.

#### Acceptance Criteria

1. WHEN a transformation utility is implemented, THE utility SHALL use Zod parse or safeParse methods to validate input data
2. WHEN mapBackendToDisplay is called with valid backend data, THE utility SHALL return validated display format data
3. WHEN mapBackendToDisplay is called with invalid data, THE utility SHALL throw descriptive validation errors with field-level details
4. WHEN date formatting is performed, THE utility SHALL convert DateInfo objects to formatted strings (e.g., "Jan 2020")
5. WHEN profile mapping is performed, THE utility SHALL convert Profile arrays to SocialLink arrays with correct type mapping
6. WHEN work experience mapping is performed, THE utility SHALL flatten organization to companyName and format date ranges
7. WHEN project mapping is performed, THE utility SHALL extract first line for one_line_description from highlights markdown
8. WHEN education mapping is performed, THE utility SHALL combine degree and branch fields with "in" separator

### Requirement 5: Migrate Main App to Shared Schema

**User Story:** As a developer, I want the main app to use the shared schema package, so that I can eliminate duplicate type definitions and leverage Zod validation.

#### Acceptance Criteria

1. WHEN the Main App imports portfolio types, THE Main App SHALL import from `@portfolioly/schema` instead of local types file
2. WHEN the Main App validates API responses, THE Main App SHALL use Zod schemas from shared package for runtime validation
3. WHEN the Main App type-checks, THE Main App SHALL have zero TypeScript errors after migration
4. WHEN the Main App data mapper is removed, THE Main App SHALL use transformation utilities from shared schema package
5. WHEN the Main App builds, THE Main App SHALL successfully compile with shared schema package dependency

### Requirement 6: Migrate Template Components to Shared Schema

**User Story:** As a developer, I want template components to use the shared schema package, so that I can eliminate duplicate type definitions and ensure consistency.

#### Acceptance Criteria

1. WHEN Template Components import portfolio types, THE Template Components SHALL import from `@portfolioly/schema` instead of local types file
2. WHEN Template Components type-check, THE Template Components SHALL have zero TypeScript errors after migration
3. WHEN Template Components data mapper is removed, THE Template Components SHALL use transformation utilities from shared schema package
4. WHEN Template Components build, THE Template Components SHALL successfully compile with shared schema package dependency
5. WHEN Template Components render, THE Template Components SHALL display portfolio data correctly with no visual regressions

### Requirement 7: Validate API Integration

**User Story:** As a developer, I want API responses validated with Zod, so that I can catch data inconsistencies early and provide better error messages.

#### Acceptance Criteria

1. WHEN portfolio API client receives response, THE API client SHALL validate response data using Zod schema before returning
2. WHEN validation succeeds, THE API client SHALL return typed data with full TypeScript inference
3. WHEN validation fails, THE API client SHALL throw error with detailed field-level validation messages
4. WHEN API response has extra fields, THE Zod schema SHALL strip unknown fields by default
5. WHEN API response has missing optional fields, THE Zod schema SHALL accept response and provide undefined for missing fields

### Requirement 8: Maintain Test Coverage

**User Story:** As a developer, I want comprehensive tests for schema validation and transformations, so that I can ensure reliability and catch regressions.

#### Acceptance Criteria

1. WHEN schema validation tests are written, THE tests SHALL cover all Zod schemas with valid and invalid input cases
2. WHEN transformation tests are written, THE tests SHALL verify correct mapping from backend to frontend formats
3. WHEN edge case tests are written, THE tests SHALL handle missing optional fields, empty arrays, and null values
4. WHEN existing data mapper tests exist, THE tests SHALL be migrated to test shared schema package utilities
5. WHEN all tests run, THE tests SHALL pass with 100% success rate after migration

### Requirement 9: Update Documentation

**User Story:** As a developer, I want clear documentation for the shared schema package, so that I can understand how to use it correctly.

#### Acceptance Criteria

1. WHEN schema package README is created, THE README SHALL document all exported types, schemas, and utilities with examples
2. WHEN migration guide is created, THE guide SHALL provide step-by-step instructions for consuming the shared schema package
3. WHEN API documentation is created, THE documentation SHALL explain Zod validation patterns and error handling
4. WHEN type documentation is created, THE documentation SHALL clarify differences between backend-aligned types and legacy types
5. WHEN examples are provided, THE examples SHALL demonstrate common use cases like API validation and data transformation

### Requirement 10: Ensure Zero Breaking Changes

**User Story:** As a developer, I want the migration to be non-breaking, so that existing functionality continues to work without modifications.

#### Acceptance Criteria

1. WHEN Main App runs after migration, THE Main App SHALL display portfolios correctly with no visual or functional changes
2. WHEN Template Components render after migration, THE Template Components SHALL display all portfolio sections correctly
3. WHEN portfolio editing is performed, THE portfolio editor SHALL save and load data correctly
4. WHEN API requests are made, THE API integration SHALL work correctly with validation enabled
5. WHEN end-to-end tests run, THE tests SHALL pass with 100% success rate after migration
