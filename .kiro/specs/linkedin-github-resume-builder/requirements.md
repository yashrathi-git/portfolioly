# Requirements Document

## Introduction

This feature enables users to transform their LinkedIn profile or GitHub data into a professional, ATS-friendly resume. The system leverages existing data extraction infrastructure (LinkedIn PDF parser, GitHub API integration) while using a dedicated ResumeData schema optimized for resume generation. Users can create multiple resume versions, customize content, and export to PDF.

The feature is implemented entirely within the main app (`apps/main`) for simplicity and faster iteration, with a separate Firebase collection for resume storage.

## Glossary

- **Resume_Builder**: The system component that transforms imported data into formatted resume documents
- **Resume_Template**: An HTML/React component that renders ResumeData in a print-optimized resume format
- **ResumeData**: A dedicated data schema for resume content, separate from PortfolioData, stored in Firebase
- **Live_Preview**: Real-time visual representation of the resume as users make changes or select templates
- **PDF_Export**: The process of converting the HTML resume to a downloadable PDF document using browser print
- **ATS**: Applicant Tracking System - software used by employers to parse and filter resumes
- **Template_Selector**: UI component allowing users to choose between different resume styles
- **Resume_Collection**: Firebase collection at `users/{uid}/resumes` storing multiple resume versions

## Requirements

### Requirement 1

**User Story:** As a user, I want to import my LinkedIn profile data, so that I can generate a resume without manual data entry.

#### Acceptance Criteria

1. WHEN a user uploads a LinkedIn PDF THEN the Resume_Builder SHALL extract personal information, work experience, education, and certifications using the existing LinkedIn extractor service
2. WHEN LinkedIn data extraction completes THEN the Resume_Builder SHALL transform the extracted data into ResumeData format and display in the Live_Preview within 3 seconds
3. IF the LinkedIn PDF parsing fails THEN the Resume_Builder SHALL display a specific error message indicating the parsing issue
4. WHEN a user has existing portfolio data THEN the Resume_Builder SHALL offer to import from their portfolio as an alternative data source

### Requirement 2

**User Story:** As a user, I want to import my GitHub repositories, so that I can showcase my projects on my resume.

#### Acceptance Criteria

1. WHEN a user enters a valid GitHub username THEN the Resume_Builder SHALL fetch public repositories using the existing GitHub service
2. WHEN GitHub repositories are fetched THEN the Resume_Builder SHALL display repositories sorted by stars for user selection
3. WHEN a user selects repositories THEN the Resume_Builder SHALL include them in the projects section of the resume
4. IF the GitHub API returns an error THEN the Resume_Builder SHALL display the appropriate error message with retry option

### Requirement 3

**User Story:** As a user, I want to see a live preview of my resume, so that I can see how it looks before downloading.

#### Acceptance Criteria

1. WHEN portfolio data is loaded THEN the Resume_Builder SHALL render a Live_Preview of the resume using the selected template
2. WHEN a user changes the selected template THEN the Live_Preview SHALL update within 500 milliseconds
3. WHEN a user edits any resume field THEN the Live_Preview SHALL reflect the change immediately
4. THE Live_Preview SHALL display the resume at a readable scale with zoom controls

### Requirement 4

**User Story:** As a user, I want to choose from multiple resume templates, so that I can select a style that matches my preferences.

#### Acceptance Criteria

1. THE Resume_Builder SHALL provide at least 3 distinct Resume_Template options (Classic, Modern, Minimal)
2. WHEN a user views the Template_Selector THEN the Resume_Builder SHALL display thumbnail previews of each template
3. WHEN a user selects a template THEN the Resume_Builder SHALL apply that template to the Live_Preview
4. THE Resume_Builder SHALL persist the user's template selection for future sessions

### Requirement 5

**User Story:** As a user, I want to download my resume as a PDF, so that I can use it for job applications.

#### Acceptance Criteria

1. WHEN a user clicks the download button THEN the Resume_Builder SHALL generate a PDF from the current Live_Preview
2. THE generated PDF SHALL maintain the exact layout and formatting shown in the Live_Preview
3. THE generated PDF SHALL be ATS-friendly with selectable text and proper heading hierarchy
4. WHEN PDF generation completes THEN the Resume_Builder SHALL trigger a browser download with filename format "resume-{name}.pdf"

### Requirement 6

**User Story:** As a user, I want to edit my resume content inline, so that I can customize the extracted data.

#### Acceptance Criteria

1. WHEN a user clicks on an editable field in the resume THEN the Resume_Builder SHALL enable inline editing for that field
2. WHEN a user modifies work experience highlights THEN the Resume_Builder SHALL support markdown formatting
3. WHEN a user saves edits THEN the Resume_Builder SHALL persist changes to the resume data
4. THE Resume_Builder SHALL provide undo/redo functionality for content edits

### Requirement 7

**User Story:** As a user, I want my resume to be ATS-compatible, so that it passes automated screening systems.

#### Acceptance Criteria

1. THE Resume_Template SHALL use semantic HTML with proper heading hierarchy (h1, h2, h3)
2. THE Resume_Template SHALL avoid complex layouts that confuse ATS parsers (tables for layout, multi-column CSS)
3. THE Resume_Template SHALL include all text as selectable content (no text-as-images)
4. THE Resume_Template SHALL use standard section headings recognized by ATS systems (Experience, Education, Skills, Projects)

### Requirement 8

**User Story:** As a user, I want to reorder sections on my resume, so that I can prioritize the most relevant information.

#### Acceptance Criteria

1. WHEN a user drags a section THEN the Resume_Builder SHALL allow reordering of resume sections
2. WHEN sections are reordered THEN the Live_Preview SHALL update to reflect the new order
3. THE Resume_Builder SHALL persist section order preferences for future sessions
4. THE Resume_Builder SHALL provide default section ordering based on common resume conventions

### Requirement 9

**User Story:** As a developer, I want resume templates to be modular and maintainable, so that new templates can be added easily.

#### Acceptance Criteria

1. THE Resume_Template components SHALL accept a standardized ResumeData interface as props
2. THE Resume_Template components SHALL be located in `apps/main/src/components/resume/templates/` for maintainability
3. WHEN a new template is added THEN the Resume_Builder SHALL automatically include it in the Template_Selector via a template registry
4. THE Resume_Template components SHALL use CSS modules or scoped styles to prevent style conflicts

### Requirement 10

**User Story:** As a user, I want to save multiple resume versions, so that I can tailor resumes for different job applications.

#### Acceptance Criteria

1. WHEN a user creates a new resume THEN the Resume_Builder SHALL store it in the Resume_Collection with a unique ID
2. WHEN a user views their resumes THEN the Resume_Builder SHALL display a list of saved resumes with names and last modified dates
3. WHEN a user duplicates a resume THEN the Resume_Builder SHALL create a copy with a new ID and editable name
4. WHEN a user deletes a resume THEN the Resume_Builder SHALL remove it from the Resume_Collection after confirmation

### Requirement 11

**User Story:** As a user, I want a dedicated ResumeData schema, so that my resume content can be optimized for resume formatting.

#### Acceptance Criteria

1. THE ResumeData schema SHALL include structured fields for personal_info, summary, work_experiences, education, projects, skills, and certifications
2. THE ResumeData schema SHALL store work experience highlights as an array of strings for bullet point rendering
3. THE ResumeData schema SHALL include a skills field with categorized skill groups (Languages, Frameworks, Tools)
4. THE ResumeData schema SHALL store section_order as an array to persist user's preferred section arrangement
5. THE ResumeData schema SHALL include template_id to persist the user's selected template
