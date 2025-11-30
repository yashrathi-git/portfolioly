# Implementation Plan

- [x] 1. Set up schema package infrastructure

  - Create `packages/schema` directory with proper structure
  - Configure package.json with name `@portfolioly/schema`, dependencies (zod), and build scripts
  - Set up tsconfig.json extending workspace base configuration
  - Configure Vite build for ESM/CJS dual output with TypeScript declarations
  - Add package to workspace in root package.json
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement core Zod schemas

  - [x] 2.1 Create DateInfo and ProfileType schemas

    - Write DateInfoSchema with month (1-12) and year (1900-2100) validation
    - Write ProfileTypeSchema enum with all profile types
    - Export inferred TypeScript types
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Create Profile and PersonalInfo schemas

    - Write ProfileSchema with type, url, and label fields
    - Write PersonalInfoSchema with all personal fields including profile_photo_url
    - Add email validation and URL validation
    - _Requirements: 2.3, 2.8_

  - [x] 2.3 Create WorkExperience schema

    - Write WorkExperienceSchema with structured date fields
    - Include highlights as markdown string field
    - Include technologies array with default empty array
    - _Requirements: 2.4, 2.8_

  - [x] 2.4 Create Project and ProjectImage schemas

    - Write ProjectImageSchema with url, caption (max 100 chars), and order
    - Write ProjectSchema with images array, demo_video, and more_context fields
    - Add URL validation for all link fields
    - _Requirements: 2.5, 2.8_

  - [x] 2.5 Create Education schema

    - Write EducationSchema with structured date fields
    - Include all backend Education model fields
    - _Requirements: 2.6, 2.8_

  - [x] 2.6 Create supporting schemas

    - Write CertificationSchema with name, issuer, and link fields
    - Write TextBlobsSchema with achievements and additional_context
    - Write LayoutSettingsSchema with layout_mode and default_layout enums
    - Write PortfolioMetadataSchema with source_type, extracted_at, and notes
    - _Requirements: 2.8_

  - [x] 2.7 Create root PortfolioData schema
    - Write PortfolioDataSchema composing all nested schemas
    - Set appropriate default values for array fields
    - Export inferred PortfolioData type
    - _Requirements: 2.7, 2.8_

- [x] 3. Implement display format types

  - [x] 3.1 Define social link types

    - Create SocialType union type with all social platforms
    - Create SocialLink interface with type, href, and label
    - _Requirements: 3.5_

  - [x] 3.2 Define display format types
    - Create DisplayPortfolioProfile with avatarUrl and socials
    - Create DisplayProject with one_line_description and formatted fields
    - Create DisplayEducation with combined degree field and formatted dates
    - Create DisplayWorkExperience with companyName and formatted dates
    - Create DisplayPortfolioData composing all display types
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Implement transformation utilities

  - [x] 4.1 Create date formatting utility

    - Write formatDateInfo function converting DateInfo to string
    - Handle month+year format ("Jan 2020")
    - Handle year-only format ("2020")
    - Handle missing/undefined dates (return empty string)
    - _Requirements: 4.4_

  - [x] 4.2 Create profile mapping utility

    - Write PROFILE_TO_SOCIAL_MAP constant mapping ProfileType to SocialType
    - Write mapProfilesToSocials function converting Profile[] to SocialLink[]
    - Filter out profiles without URLs
    - _Requirements: 4.5_

  - [x] 4.3 Create entity mapping utilities

    - Write mapWorkExperience function flattening to DisplayWorkExperience
    - Write mapProject function extracting first line for one_line_description
    - Write mapEducation function combining degree and branch fields
    - Handle "Present" for current positions/education
    - _Requirements: 4.6, 4.7, 4.8_

  - [x] 4.4 Create main transformation function

    - Write mapBackendToDisplay function orchestrating all transformations
    - Extract and deduplicate skills from work experiences and projects
    - Map certifications to formatted strings with issuer
    - Handle optional fields gracefully
    - _Requirements: 4.2_

  - [x] 4.5 Create validation utilities
    - Write SchemaValidationError class extending Error with zodError property
    - Write validatePortfolioData function using PortfolioDataSchema.parse
    - Write validatePortfolioDataSafe function using safeParse
    - Add getFieldErrors method to SchemaValidationError
    - _Requirements: 4.1, 4.3_

- [x] 5. Create package exports and documentation

  - [x] 5.1 Set up main index.ts exports

    - Export all Zod schemas from schemas directory
    - Export all backend-aligned types
    - Export all display format types
    - Export all transformation utilities
    - Export validation utilities and error classes
    - _Requirements: 1.5_

  - [x] 5.2 Write package README

    - Document package purpose and architecture
    - Provide installation instructions
    - Show examples of schema validation
    - Show examples of data transformation
    - Document error handling patterns
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x] 5.3 Add JSDoc comments
    - Add JSDoc to all exported schemas with descriptions
    - Add JSDoc to all transformation functions with examples
    - Add JSDoc to validation utilities
    - Document type parameters and return types
    - _Requirements: 9.4_

- [x] 6. Build and verify schema package

  - Run build command and verify ESM/CJS outputs
  - Verify TypeScript declarations are generated
  - Test package imports in isolation
  - Verify tree-shaking works correctly
  - _Requirements: 1.2, 1.5_

- [x] 7. Migrate template-components package

  - [x] 7.1 Add schema package dependency

    - Add `@portfolioly/schema` to package.json dependencies
    - Run yarn install to link workspace package
    - _Requirements: 6.4_

  - [x] 7.2 Update type imports

    - Replace imports from local types/portfolio.ts with @portfolioly/schema
    - Update all component files using portfolio types
    - Update data-mapper.ts imports
    - _Requirements: 6.1_

  - [x] 7.3 Replace data mapper with shared utilities

    - Remove local utils/data-mapper.ts file
    - Update all usages to import from @portfolioly/schema
    - Update function names (mapBackendToFrontend → mapBackendToDisplay)
    - _Requirements: 6.3_

  - [x] 7.4 Remove local portfolio types file

    - Delete src/types/portfolio.ts
    - Verify no remaining imports from deleted file
    - _Requirements: 6.1_

  - [x] 7.5 Verify template-components build
    - Run build command and verify success
    - Check for TypeScript errors
    - Verify no breaking changes in exports
    - _Requirements: 6.2, 6.4_

- [x] 8. Migrate main app

  - [x] 8.1 Add schema package dependency

    - Add `@portfolioly/schema` to apps/main/package.json dependencies
    - Run yarn install to link workspace package
    - _Requirements: 5.5_

  - [x] 8.2 Update type imports

    - Replace imports from local types/portfolio.ts with @portfolioly/schema
    - Update all component files using portfolio types
    - Update API client files
    - _Requirements: 5.1_

  - [x] 8.3 Add Zod validation to API clients

    - Update portfolio API client to use validatePortfolioData
    - Add error handling for SchemaValidationError
    - Log validation errors for debugging
    - _Requirements: 5.2, 7.1, 7.2, 7.3_

  - [x] 8.4 Replace data mapper with shared utilities

    - Remove local utils/portfolioDataMapper.ts file
    - Update all usages to import from @portfolioly/schema
    - Update function names to match new API
    - _Requirements: 5.4_

  - [x] 8.5 Remove local portfolio types file

    - Delete src/types/portfolio.ts
    - Verify no remaining imports from deleted file
    - _Requirements: 5.1_

  - [x] 8.6 Verify main app build
    - Run build command and verify success
    - Check for TypeScript errors
    - Verify no runtime errors
    - _Requirements: 5.2, 5.5_

- [ ] 9. End-to-end testing and validation

  - [ ] 9.1 Test portfolio viewing flow

    - Load portfolio page and verify data displays correctly
    - Check all sections render (profile, projects, education, experience)
    - Verify no visual regressions
    - Test both chat and traditional layouts
    - _Requirements: 6.6, 10.1, 10.2_

  - [ ] 9.2 Test portfolio editing flow

    - Open portfolio editor and verify data loads
    - Make changes and save
    - Verify changes persist correctly
    - Test image uploads and profile photo
    - _Requirements: 10.3_

  - [ ] 9.3 Test API validation

    - Test with valid portfolio data
    - Test with invalid data (missing required fields, wrong types)
    - Verify error messages are descriptive
    - Test with extra unknown fields (should be stripped)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.4_

  - [ ] 9.4 Run full test suite
    - Run all existing tests in main app
    - Run all existing tests in template-components
    - Verify 100% pass rate
    - _Requirements: 10.5_

- [ ] 10. Final documentation and cleanup
  - Update main project documentation referencing new schema package
  - Remove any deprecated code or comments
  - Final code review and merge
  - _Requirements: 9.1, 9.2_
