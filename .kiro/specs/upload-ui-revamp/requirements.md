# Requirements Document

## Introduction

This feature revamps the upload onboarding UI from a sequential 3-step wizard to a streamlined source-selection-first approach. The primary goal is to get users started quickly with a single data source. Users will choose one data source (LinkedIn PDF, Resume PDF, or GitHub), complete that upload, and proceed to their portfolio. An optional, subtle "Add Source" feature allows users to combine multiple sources if desired, but this is secondary to the main flow. The new design prioritizes speed, clarity, and minimalism while maintaining all existing functionality.

## Glossary

- **Upload System**: The frontend application component that handles portfolio data import
- **Data Source**: A method for importing portfolio data (LinkedIn PDF, Resume PDF, or GitHub)
- **Source Selector**: The initial UI component where users choose their first data source
- **Source Card**: An individual upload interface for a specific data source
- **Add Source Button**: UI control that allows users to select additional data sources after completing one

## Requirements

### Requirement 1

**User Story:** As a verified user landing on the upload page, I want to see a clear selection of data sources to choose from, so that I understand my options and can make an informed choice about how to populate my portfolio.

#### Acceptance Criteria

1. WHEN a verified user accesses `/upload` THEN the Upload System SHALL display a source selector with three options: LinkedIn PDF, Resume PDF, and GitHub
2. WHEN the source selector is displayed THEN the Upload System SHALL show each option as a visually distinct card with an icon, title, and brief description
3. WHEN the source selector is displayed THEN the Upload System SHALL include a motivational page title "Create Your Portfolio in Seconds" and subtitle "Choose a source to get started - you can always add more later"
4. WHEN the LinkedIn option is displayed THEN the Upload System SHALL include the subtitle "No authentication required"
5. WHEN the GitHub option is displayed THEN the Upload System SHALL include the subtitle "Generated from GitHub username"
6. WHEN the source selector is displayed THEN the Upload System SHALL provide an "I'll fill it manually" option that navigates directly to the edit page

### Requirement 2

**User Story:** As a user viewing the source selector, I want each data source option to be clearly explained with helpful context, so that I can understand what each source provides and make the best choice for my needs.

#### Acceptance Criteria

1. WHEN the LinkedIn PDF option is displayed THEN the Upload System SHALL show the description "Instantly import your work experience and education"
2. WHEN the Resume PDF option is displayed THEN the Upload System SHALL show the description "Transform your resume into a beautiful portfolio"
3. WHEN the GitHub option is displayed THEN the Upload System SHALL show the description "Showcase your best projects and code"
4. WHEN a user hovers over a source option THEN the Upload System SHALL provide visual feedback indicating the option is interactive
5. WHEN source options are displayed THEN the Upload System SHALL use appropriate icons (LinkedIn logo, document icon, GitHub logo) for visual clarity

### Requirement 3

**User Story:** As a user who has selected a data source, I want to see only the upload interface for that specific source, so that I can focus on completing the task without distraction.

#### Acceptance Criteria

1. WHEN a user selects LinkedIn PDF THEN the Upload System SHALL display only the LinkedIn PDF upload interface
2. WHEN a user selects Resume PDF THEN the Upload System SHALL display only the Resume PDF upload interface
3. WHEN a user selects GitHub THEN the Upload System SHALL display only the GitHub repository selection interface
4. WHEN a source-specific interface is displayed THEN the Upload System SHALL hide the source selector
5. WHEN a source-specific interface is displayed THEN the Upload System SHALL show a "Back" button to return to source selection
6. WHEN a source-specific interface is displayed THEN the Upload System SHALL maintain all existing functionality from the original step-based implementation

### Requirement 4

**User Story:** As a user who has completed uploading from one source, I want an optional way to add data from additional sources without it being the primary focus, so that I can quickly proceed to my portfolio or optionally enhance it with more data.

#### Acceptance Criteria

1. WHEN a user successfully completes a source upload THEN the Upload System SHALL display a subtle "Add Source" link or button in a non-prominent location
2. WHEN the "Add Source" option is displayed THEN the Upload System SHALL position it in a corner or secondary area that doesn't distract from the primary "Continue" action
3. WHEN the "Add Source" option is clicked THEN the Upload System SHALL show the source selector again
4. WHEN the source selector is shown after completing a source THEN the Upload System SHALL visually indicate which sources have already been used
5. WHEN multiple sources have been added THEN the Upload System SHALL display a compact summary showing all active sources
6. WHEN the source summary is displayed THEN the Upload System SHALL allow users to remove individual sources

### Requirement 5

**User Story:** As a user managing multiple data sources, I want to see a clear overview of what I've uploaded, so that I can understand what data will be used to generate my portfolio.

#### Acceptance Criteria

1. WHEN at least one source has been uploaded THEN the Upload System SHALL display a "Sources Added" section
2. WHEN the "Sources Added" section is displayed THEN the Upload System SHALL show each source as a compact card with source type and status
3. WHEN a source card is displayed THEN the Upload System SHALL include a remove button to delete that source
4. WHEN a source is removed THEN the Upload System SHALL update the UI immediately without requiring page refresh
5. WHEN all sources are removed THEN the Upload System SHALL return to the initial source selector state

### Requirement 6

**User Story:** As a user who has added at least one source, I want a prominent and clear way to complete the upload process quickly and proceed to my portfolio, so that I can start using my populated portfolio data without unnecessary delays.

#### Acceptance Criteria

1. WHEN at least one source has been uploaded THEN the Upload System SHALL display a prominent "Continue to Edit" button as the primary call-to-action
2. WHEN the "Continue to Edit" button is displayed THEN the Upload System SHALL position it prominently and make it visually distinct from the optional "Add Source" option
3. WHEN the "Continue to Edit" button is clicked THEN the Upload System SHALL submit all uploaded data to the backend
4. WHEN data submission is in progress THEN the Upload System SHALL display a loading screen with progress indication
5. WHEN data submission succeeds THEN the Upload System SHALL navigate to the edit page with a success message
6. WHEN data submission fails THEN the Upload System SHALL display an error message and allow the user to retry or proceed to edit page
7. WHEN no sources have been uploaded and user chooses to skip THEN the Upload System SHALL navigate directly to the edit page without backend submission

### Requirement 7

**User Story:** As a user interacting with the upload interface, I want the UI to be beautiful, elegant, and minimalistic, so that I have a pleasant and intuitive experience.

#### Acceptance Criteria

1. WHEN any upload UI component is displayed THEN the Upload System SHALL use consistent spacing, typography, and color scheme aligned with the application design system
2. WHEN interactive elements are displayed THEN the Upload System SHALL provide smooth transitions and animations
3. WHEN the UI is displayed THEN the Upload System SHALL use ample whitespace to create a clean, uncluttered appearance
4. WHEN text content is displayed THEN the Upload System SHALL use clear, concise copy that avoids technical jargon
5. WHEN the UI is displayed on mobile devices THEN the Upload System SHALL maintain visual elegance and usability with responsive design

### Requirement 8

**User Story:** As a user uploading a LinkedIn PDF, I want subtle guidance about the authentication requirement, so that I understand this is a simple file upload without complex authentication.

#### Acceptance Criteria

1. WHEN the LinkedIn PDF upload interface is displayed THEN the Upload System SHALL include a subtle note "No LinkedIn authentication required - just upload your PDF"
2. WHEN the LinkedIn PDF help section is displayed THEN the Upload System SHALL maintain existing instructions for exporting LinkedIn as PDF
3. WHEN the LinkedIn PDF upload interface is displayed THEN the Upload System SHALL use reassuring language to reduce user friction

### Requirement 9

**User Story:** As a user connecting GitHub, I want clear information about what's required, so that I understand I only need to provide my username without complex authentication.

#### Acceptance Criteria

1. WHEN the GitHub interface is displayed THEN the Upload System SHALL include a note "Simply enter your GitHub username - no authentication needed"
2. WHEN the GitHub interface is displayed THEN the Upload System SHALL clearly indicate that only public repositories will be accessed
3. WHEN the GitHub interface is displayed THEN the Upload System SHALL maintain existing functionality for repository selection

### Requirement 10

**User Story:** As a developer maintaining the upload system, I want the new UI to reuse existing backend APIs and logic, so that the changes are frontend-only and minimize risk of breaking existing functionality.

#### Acceptance Criteria

1. WHEN the new UI is implemented THEN the Upload System SHALL use all existing backend endpoints without modification
2. WHEN the new UI is implemented THEN the Upload System SHALL maintain the same data flow and submission logic
3. WHEN the new UI is implemented THEN the Upload System SHALL preserve all existing error handling and validation
4. WHEN the new UI is implemented THEN the Upload System SHALL maintain compatibility with existing rate limiting and security measures
5. WHEN the new UI is implemented THEN the Upload System SHALL reuse existing upload hooks and API client functions
