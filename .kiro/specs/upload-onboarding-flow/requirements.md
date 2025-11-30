# Requirements Document

## Introduction

This feature adds a protected post-authentication onboarding page at `/upload` that allows verified users to auto-populate their portfolio information by uploading LinkedIn PDFs, resume PDFs, and selecting GitHub repositories. The extracted text and repository data will be used to automatically fill in portfolio sections, eliminating the need for manual data entry. The implementation prioritizes simplicity, reliability, and user choice with skippable steps throughout the process.

## Requirements

### Requirement 1

**User Story:** As a verified user who has just signed in or signed up, I want to be redirected to an optional onboarding flow, so that I can auto-populate my portfolio information without manual data entry.

#### Acceptance Criteria

1. WHEN a user successfully signs in or signs up AND their email is verified THEN the system SHALL redirect them to `/upload`
2. WHEN a user successfully signs in or signs up AND their email is not verified THEN the system SHALL redirect them to `/auth/verify-email`
3. WHEN a user accesses `/upload` without being authenticated THEN the system SHALL redirect them to the sign-in page
4. WHEN a user accesses `/upload` without email verification THEN the system SHALL redirect them to the email verification page

### Requirement 2

**User Story:** As a verified user on the upload page, I want to see a clear 3-step wizard interface with progress indication, so that I understand what's expected and can track my progress.

#### Acceptance Criteria

1. WHEN a user lands on `/upload` THEN the system SHALL display a wizard with the title "Let's enrich your portfolio (optional)"
2. WHEN the wizard is displayed THEN the system SHALL show a subtitle "You can skip any step and do this later"
3. WHEN the wizard is active THEN the system SHALL display a progress indicator showing "Step X of 3"
4. WHEN the wizard is displayed THEN the system SHALL show three steps: LinkedIn PDF upload, Resume PDF upload, and GitHub repository selection
5. WHEN any step is active THEN the system SHALL provide a clear "Skip this step" option

### Requirement 3

**User Story:** As a user in the upload wizard, I want to upload my LinkedIn profile PDF in step 1, so that my professional background information can be automatically extracted and populated in my portfolio.

#### Acceptance Criteria

1. WHEN step 1 is active THEN the system SHALL display "Upload LinkedIn PDF" as the step title
2. WHEN step 1 is displayed THEN the system SHALL show a file upload area that accepts PDF files only
3. WHEN step 1 is displayed THEN the system SHALL include a collapsible "How to export your LinkedIn as PDF" section with visual guidance
4. WHEN a user selects a PDF file THEN the system SHALL validate it is under 15MB and is a valid PDF
5. WHEN a valid PDF is uploaded THEN the system SHALL send it to the backend for parsing and display parsing progress
6. WHEN PDF parsing is complete THEN the system SHALL show a preview of extracted text
7. WHEN PDF parsing fails THEN the system SHALL display a friendly error message with retry option
8. IF the uploaded file exceeds 15MB THEN the system SHALL reject it with error message "File too large (max 15MB)"
9. IF the uploaded file is not a PDF THEN the system SHALL reject it with error message "Please upload a PDF file"

### Requirement 4

**User Story:** As a user in the upload wizard, I want to upload my resume PDF in step 2, so that my professional experience and skills can be automatically extracted and populated in my portfolio.

#### Acceptance Criteria

1. WHEN step 2 is active THEN the system SHALL display "Upload Resume PDF" as the step title
2. WHEN step 2 is displayed THEN the system SHALL show a file upload area that accepts PDF files only
3. WHEN a user selects a PDF file THEN the system SHALL validate it is under the configured MAX_FILE_SIZE and is a valid PDF
4. WHEN a valid PDF is uploaded THEN the system SHALL send it to the backend for parsing and display parsing progress
5. WHEN PDF parsing is complete THEN the system SHALL show a preview of extracted text that will be used for auto-population
6. WHEN PDF parsing fails THEN the system SHALL display a friendly error message and allow proceeding to next step
7. IF the uploaded file exceeds the configured MAX_FILE_SIZE THEN the system SHALL reject it with error message "File too large (max {MAX_FILE_SIZE}MB)"
8. IF the uploaded file is not a PDF THEN the system SHALL reject it with error message "Please upload a PDF file"

### Requirement 5

**User Story:** As a user in the upload wizard, I want to enter my GitHub username and select up to 10 repositories in step 3, so that my coding projects and repository information can be automatically imported and displayed in my portfolio.

#### Acceptance Criteria

1. WHEN step 3 is active THEN the system SHALL display "Select GitHub repositories" as the step title
2. WHEN step 3 is displayed THEN the system SHALL show an input field for GitHub username
3. WHEN a user enters a GitHub username and clicks fetch THEN the system SHALL retrieve their public repositories
4. WHEN repositories are fetched THEN the system SHALL display them in a searchable modal with name, description, and star count
5. WHEN the repository modal is open THEN the system SHALL allow users to select up to 10 repositories
6. WHEN more than 10 repositories are selected THEN the system SHALL prevent additional selections and show a message "Maximum 10 repositories allowed"
7. WHEN repositories are selected THEN the system SHALL display the selected count
8. WHEN GitHub API fails THEN the system SHALL display a friendly error message and allow proceeding to next step
9. IF the GitHub username doesn't exist THEN the system SHALL show error message "GitHub user not found"

### Requirement 6

**User Story:** As a user completing the upload wizard, I want to finish the process and be taken to my dashboard, so that I can start using the main application features.

#### Acceptance Criteria

1. WHEN a user completes all steps or skips to the end THEN the system SHALL display a completion screen
2. WHEN the completion screen is shown THEN the system SHALL provide a "Go to Dashboard" button
3. WHEN "Go to Dashboard" is clicked THEN the system SHALL navigate to `/dashboard`
4. WHEN the wizard is completed THEN the system SHALL not show the upload flow again unless explicitly accessed

### Requirement 7

**User Story:** As a system administrator, I want all upload endpoints to be properly authenticated and secured, so that only verified users can access the functionality.

#### Acceptance Criteria

1. WHEN any backend upload endpoint is called THEN the system SHALL require a valid Firebase ID token in the Authorization header
2. WHEN an invalid or missing token is provided THEN the system SHALL return HTTP 401 Unauthorized
3. WHEN a valid token is provided but email is not verified THEN the system SHALL return HTTP 403 Forbidden
4. WHEN file uploads are processed THEN the system SHALL sanitize filenames and validate file types server-side
5. WHEN PDF parsing occurs THEN the system SHALL handle parsing failures gracefully and return appropriate error responses
6. WHEN file size validation occurs THEN the system SHALL use a configurable MAX_FILE_SIZE constant (default 15MB) to prevent abuse
7. WHEN file type validation occurs THEN the system SHALL use a configurable ALLOWED_FILE_TYPES constant to restrict uploads
8. WHEN rate limiting is needed THEN the system SHALL implement configurable limits per user per endpoint to prevent abuse

### Requirement 8

**User Story:** As a system, I want to process PDF uploads asynchronously and return extracted text immediately, so that the user experience remains responsive.

#### Acceptance Criteria

1. WHEN a PDF is uploaded to `/ingest/pdf` THEN the system SHALL parse it using pypdf and return extracted text within 5 seconds
2. WHEN PDF parsing is successful THEN the system SHALL return JSON with text, metadata, and file information
3. WHEN PDF parsing fails THEN the system SHALL return HTTP 422 with error details
4. WHEN the system processes PDFs THEN it SHALL not persist the files by default (text extraction only)
5. WHEN Azure Blob storage is enabled via config THEN the system SHALL optionally upload raw PDFs and return blob URLs

### Requirement 9

**User Story:** As a system, I want to interact with GitHub API to fetch user repositories, so that users can select their projects for portfolio inclusion.

#### Acceptance Criteria

1. WHEN `/github/repos` endpoint is called with a username THEN the system SHALL fetch public repositories using PyGithub
2. WHEN GitHub API is successful THEN the system SHALL return repository data including name, description, and star count
3. WHEN GitHub API rate limits are hit THEN the system SHALL return HTTP 429 with appropriate retry headers
4. WHEN a GitHub username doesn't exist THEN the system SHALL return HTTP 404 with user-friendly error message
5. WHEN GitHub API is unavailable THEN the system SHALL return HTTP 503 with retry information
6. WHEN repository import is requested THEN the system SHALL accept up to 10 selected repositories and return import confirmation

### Requirement 10

**User Story:** As a user completing the upload wizard, I want my uploaded data to be processed by AI and stored in a structured format, so that my portfolio information is automatically populated with accurate, organized data.

#### Acceptance Criteria

1. WHEN a user submits the upload form with only GitHub data THEN the system SHALL directly map the GitHub data to the portfolio schema and store it in Firebase
2. WHEN a user submits the upload form with PDF data (LinkedIn or resume or both) THEN the system SHALL send all data to an AI model for structured extraction
3. WHEN AI processing is initiated THEN the system SHALL display a loading screen to the user with progress indication
4. WHEN AI processing is complete THEN the system SHALL store the structured response in Firebase under the user's profile
5. WHEN conflicting information exists between data sources THEN the system SHALL prioritize resume PDF data over LinkedIn PDF data
6. WHEN project information conflicts between sources THEN the system SHALL prioritize GitHub repository data over PDF-extracted project data
7. WHEN AI processing fails THEN the system SHALL display an error message and proceed to a placeholder completion screen
8. WHEN data is successfully stored THEN the system SHALL redirect the user to the dashboard with a success message
9. WHEN AI processing fails THEN the system SHALL show a placeholder screen indicating the feature will be available later

### Requirement 11

**User Story:** As a system administrator, I want AI processing to be modular and configurable, so that I can easily switch between different AI providers without changing the core application logic.

#### Acceptance Criteria

1. WHEN AI processing is needed THEN the system SHALL use a configurable AI service class that can be easily replaced
2. WHEN the AI service is initialized THEN it SHALL support Azure AI Inference with structured response formatting
3. WHEN AI prompts are needed THEN the system SHALL load them from a separate constants file for easy modification
4. WHEN the AI service processes data THEN it SHALL return responses in a standardized Pydantic model format
5. WHEN AI service configuration changes THEN the system SHALL not require changes to the core upload logic
6. WHEN AI processing occurs THEN the system SHALL handle rate limiting and API failures gracefully
7. WHEN the AI service validates responses THEN it SHALL use a validate_response method that converts AI JSON output to Pydantic models and validates field completeness
8. WHEN AI processing is requested THEN the system SHALL enforce a user-level rate limit of 10 AI processing requests per month per user
9. WHEN the monthly rate limit is exceeded THEN the system SHALL return HTTP 429 with a clear message about the monthly limit and reset date

### Requirement 12

**User Story:** As a system, I want to extract structured portfolio data using AI with a comprehensive schema, so that all user information is properly organized and stored.

#### Acceptance Criteria

1. WHEN AI processes user data THEN it SHALL extract personal_info including full_name, headline, summary, email, phone, location, and profiles array
2. WHEN AI processes user data THEN it SHALL extract work_experiences with organization, title, location, start_date/end_date (month/year), is_current, highlights, technologies, and more_context
3. WHEN AI processes user data THEN it SHALL extract projects with name, role, highlights, technologies, github, live_link, and more_context
4. WHEN AI processes user data THEN it SHALL extract education with institution, degree, branch, start_date/end_date (month/year), is_current, location, and grade
5. WHEN AI processes user data THEN it SHALL extract certifications with name and link
6. WHEN AI processes user data THEN it SHALL extract profiles array with type (linkedin, github, website, portfolio, youtube, twitter, scholar, other), url, label, tags, and more_context
7. WHEN AI processes user data THEN it SHALL use structured month/year dates with numeric month (1-12) and 4-digit year format
8. WHEN AI processes user data THEN it SHALL make all fields optional to handle incomplete or missing information from unstructured PDFs
9. WHEN AI processes user data THEN it SHALL combine information from multiple sources intelligently with clear data prioritization rules
10. WHEN AI processes user data THEN it SHALL include metadata with source_type, extracted_at timestamp, and notes
11. WHEN AI processes user data THEN it SHALL include text_blobs section with achievements and additional_context for unstructured information

### Requirement 13

**User Story:** As a system administrator, I want to implement persistent rate limiting and cost controls for AI processing, so that users cannot exceed their plan limits or generate excessive API costs.

#### Acceptance Criteria

1. WHEN AI processing rate limits are tracked THEN the system SHALL store user usage data in Firebase for persistence across sessions
2. WHEN a user's monthly AI processing limit is checked THEN the system SHALL query Firebase to get current usage count and reset date
3. WHEN AI processing is requested THEN the system SHALL enforce a configurable maximum token/character limit per request to control costs
4. WHEN input text exceeds the token limit THEN the system SHALL automatically truncate the text to fit within the limit while preserving important information
5. WHEN truncating text THEN the system SHALL prioritize resume content over LinkedIn content and preserve structured sections
6. WHEN the monthly limit resets THEN the system SHALL automatically reset the user's usage counter in Firebase on the first day of each month
7. WHEN rate limit data is stored THEN the system SHALL include user_id, current_usage_count, reset_date, and last_request_timestamp
8. WHEN token counting occurs THEN the system SHALL use tiktoken library with a configurable MAX_TOKENS_PER_REQUEST constant (default 50,000 tokens)
9. WHEN text truncation is needed THEN the system SHALL implement intelligent truncation that preserves key sections like work experience and education
10. WHEN AI processes irrelevant or insufficient data THEN the system SHALL be instructed to return empty structured output rather than hallucinating information
