# Requirements Document

## Introduction

This feature optimizes the portfolio data extraction workflow by implementing direct structured parsing for LinkedIn PDFs when combined with GitHub data, bypassing expensive AI processing. The system will use the existing pdf_parser package enhanced with pymupdf4llm for markdown conversion, enabling deterministic extraction of LinkedIn profile data without AI costs or rate limits.

## Glossary

- **System**: The Portfolioly backend upload processing system
- **pdf_parser Package**: The Python package located at `packages/pdf_parser` that handles LinkedIn PDF parsing
- **pymupdf4llm**: A library that converts PDF documents to markdown format optimized for LLM processing
- **Direct Extraction Path**: Processing workflow that uses rule-based parsing instead of AI
- **AI Processing Path**: Processing workflow that uses Azure AI Inference for data extraction
- **LinkedIn PDF**: A PDF export from LinkedIn containing user profile information
- **Resume PDF**: A general resume document in PDF format

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to use pymupdf4llm for PDF-to-markdown conversion in the pdf_parser package, so that LinkedIn PDFs are converted to a consistent markdown format suitable for structured parsing.

#### Acceptance Criteria

1. WHEN the pdf_parser package is configured THEN the System SHALL include pymupdf4llm version 0.1.8 as a fixed dependency
2. WHEN the pdf_parser package dependencies are managed THEN the System SHALL use uv package manager for dependency resolution
3. WHEN a PDF file is provided to the pdf_parser package THEN the System SHALL convert it to markdown using pymupdf4llm
4. WHEN markdown conversion occurs THEN the System SHALL use pymupdf4llm's default settings optimized for LLM processing
5. WHEN the pdf_parser package is installed THEN the System SHALL properly declare all required dependencies including pymupdf4llm

### Requirement 2

**User Story:** As a backend service, I want to convert LinkedIn PDFs to markdown using pymupdf4llm before parsing, so that the pdf_parser package receives clean markdown text for structured extraction.

#### Acceptance Criteria

1. WHEN the backend receives LinkedIn PDF bytes THEN the System SHALL convert them to markdown using pymupdf4llm
2. WHEN markdown conversion is successful THEN the System SHALL pass the markdown text to pdf_parser's parse_profile function
3. WHEN markdown conversion fails THEN the System SHALL raise an appropriate exception with error details
4. WHEN the pdf_parser package is used THEN the System SHALL only accept markdown text as input
5. WHEN the pdf_parser package is called THEN the System SHALL use the existing parse_profile function without modification

### Requirement 3

**User Story:** As a developer, I want the pdf_parser package to have properly managed dependencies, so that version conflicts are avoided and the package is reliably installable.

#### Acceptance Criteria

1. WHEN dependencies are specified THEN the System SHALL use a pyproject.toml file with uv-compatible configuration
2. WHEN pymupdf4llm is specified THEN the System SHALL pin it to exactly version 0.1.8
3. WHEN PyMuPDF is specified THEN the System SHALL use a compatible version range that works with pymupdf4llm 0.1.8
4. WHEN the package is installed THEN the System SHALL resolve all dependencies without conflicts
5. WHEN uv is used for installation THEN the System SHALL successfully install all dependencies in a clean environment

### Requirement 4

**User Story:** As a system, I want to detect when only LinkedIn PDF and GitHub data are submitted, so that I can route the request to direct extraction instead of AI processing.

#### Acceptance Criteria

1. WHEN the /submit endpoint receives a request THEN the System SHALL check if linkedin_pdf is present and resume_pdf is absent
2. WHEN only LinkedIn PDF and GitHub repos are present THEN the System SHALL route to the direct extraction path
3. WHEN resume PDF is present THEN the System SHALL route to the AI processing path regardless of other data
4. WHEN only GitHub repos are present THEN the System SHALL route to the existing GitHub-only mapping path
5. WHEN routing decisions are made THEN the System SHALL log the selected processing path for debugging

### Requirement 5

**User Story:** As a system, I want to use the pdf_parser package to extract structured data from LinkedIn PDFs, so that I can populate portfolio information without AI processing costs.

#### Acceptance Criteria

1. WHEN the direct extraction path is selected THEN the System SHALL use the pdf_parser package to parse LinkedIn PDF markdown
2. WHEN pdf_parser returns structured data THEN the System SHALL map it to the PortfolioData schema
3. WHEN GitHub repos are also provided THEN the System SHALL merge GitHub project data with LinkedIn data
4. WHEN merging data THEN the System SHALL prioritize GitHub repository information over LinkedIn project mentions
5. WHEN extraction is complete THEN the System SHALL store the combined PortfolioData in Firebase

### Requirement 6

**User Story:** As a system, I want to map pdf_parser output to PortfolioData schema, so that directly extracted data matches the same structure as AI-processed data.

#### Acceptance Criteria

1. WHEN pdf_parser returns contact information THEN the System SHALL map it to PersonalInfo fields (email, phone, profiles)
2. WHEN pdf_parser returns experience data THEN the System SHALL map it to WorkExperience objects with proper date formatting
3. WHEN pdf_parser returns education data THEN the System SHALL map it to Education objects
4. WHEN pdf_parser returns certifications THEN the System SHALL map them to Certification objects
5. WHEN pdf_parser returns skills THEN the System SHALL map them to PersonalInfo.tags array
6. WHEN pdf_parser returns languages THEN the System SHALL include them in PersonalInfo.more_context or text_blobs
7. WHEN mapping is complete THEN the System SHALL validate the resulting PortfolioData against the schema

### Requirement 7

**User Story:** As a user submitting LinkedIn PDF and GitHub data, I want my data to be processed quickly without AI delays, so that I can see my portfolio populated faster.

#### Acceptance Criteria

1. WHEN direct extraction is used THEN the System SHALL complete processing in under 3 seconds
2. WHEN direct extraction is used THEN the System SHALL not consume AI processing quota
3. WHEN direct extraction is used THEN the System SHALL not check monthly AI rate limits
4. WHEN direct extraction completes THEN the System SHALL return a success response indicating "direct_extraction" as the processing type
5. WHEN direct extraction is used THEN the System SHALL still enrich company logos in the background

### Requirement 8

**User Story:** As a system administrator, I want proper error handling for direct extraction failures, so that users can fall back to AI processing if needed.

#### Acceptance Criteria

1. WHEN pdf_parser fails to parse LinkedIn PDF THEN the System SHALL log the error with details
2. WHEN direct extraction fails THEN the System SHALL return an error response indicating the failure
3. WHEN direct extraction fails THEN the System SHALL not automatically fall back to AI processing
4. WHEN extraction errors occur THEN the System SHALL provide clear error messages to the user
5. WHEN critical parsing errors occur THEN the System SHALL return HTTP 422 with actionable error details

### Requirement 9

**User Story:** As a developer, I want the pdf_parser package integration to be testable, so that I can verify correct behavior without manual testing.

#### Acceptance Criteria

1. WHEN tests are written THEN the System SHALL include unit tests for markdown conversion
2. WHEN tests are written THEN the System SHALL include unit tests for LinkedIn data mapping to PortfolioData
3. WHEN tests are written THEN the System SHALL include integration tests for the direct extraction path in /submit
4. WHEN tests are written THEN the System SHALL use sample LinkedIn PDFs for realistic testing
5. WHEN tests run THEN the System SHALL verify that GitHub data is properly merged with LinkedIn data

### Requirement 10

**User Story:** As a system, I want to maintain the existing AI processing path for resume PDFs, so that resume data continues to be processed with AI intelligence.

#### Acceptance Criteria

1. WHEN resume_pdf is present in the submission THEN the System SHALL always use AI processing
2. WHEN both LinkedIn and resume PDFs are present THEN the System SHALL use AI processing
3. WHEN AI processing is used THEN the System SHALL follow existing rate limiting and quota rules
4. WHEN AI processing is used THEN the System SHALL merge all data sources (LinkedIn, resume, GitHub) intelligently
5. WHEN processing path is selected THEN the System SHALL clearly indicate in logs whether AI or direct extraction was used
