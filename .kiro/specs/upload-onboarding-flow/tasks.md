# Implementation Plan

- [x] 1. Set up backend configuration and dependencies

  - Add PyMuPDF, PyGithub, python-multipart, aiofiles, and tiktoken to backend dependencies
  - Create upload configuration constants in `backend/app/core/upload_config.py`
  - Add GitHub API token environment variable support
  - Add token counting configuration constants for tiktoken
  - _Requirements: 7.6, 7.7, 7.8, 13.8_

- [x] 2. Implement rate limiting service

  - Create in-memory rate limiter class in `backend/app/services/rate_limiter.py`
  - Implement sliding window rate limiting with configurable limits
  - Create FastAPI dependencies for PDF upload and GitHub API rate limiting
  - Write unit tests for rate limiting functionality
  - _Requirements: 7.8, 8.4_

- [x] 3. Create PDF processing service

  - Implement PDF processor class using PyMuPDF for text extraction
  - Add file validation for size, type, and content integrity
  - Create PDF metadata extraction functionality
  - Write unit tests for PDF processing with various file types and edge cases
  - _Requirements: 3.4, 3.5, 4.4, 4.5, 8.1, 8.2, 8.3_

- [x] 4. Implement GitHub integration service

  - Create GitHub service class using PyGithub for repository fetching
  - Implement paginated repository retrieval with configurable page size
  - Add username validation and error handling for non-existent users
  - Write unit tests for GitHub API integration with mocked responses
  - _Requirements: 5.3, 5.4, 5.8, 5.9, 9.1, 9.2, 9.4, 9.5_

- [x] 5. Create PDF upload API endpoint

  - Implement `/ingest/pdf` POST endpoint with file upload handling
  - Add authentication, email verification, and rate limiting middleware
  - Integrate PDF processing service for text extraction
  - Return structured response with text and metadata
  - Write integration tests for the complete PDF upload flow
  - _Requirements: 3.4, 3.5, 3.6, 3.7, 7.1, 7.2, 7.3, 8.1, 8.2_

- [x] 6. Create GitHub repository API endpoints

  - Implement `/github/repos` GET endpoint with pagination support
  - Add username parameter validation and rate limiting
  - Implement `/github/import` POST endpoint for repository selection
  - Return paginated repository data with proper error handling
  - Write integration tests for GitHub API endpoints
  - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 9.1, 9.2, 9.3, 9.6_

- [x] 7. Create upload page with route protection

  - Implement `/upload` page component with ProtectedRoute wrapper
  - Add email verification requirement to route protection
  - Integrate UploadWizard component with proper props
  - Handle completion redirect to dashboard
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3_

- [x] 8. Implement API integration utilities

  - Create upload API client functions for PDF upload and GitHub integration
  - Add proper error handling and loading states
  - Implement file validation on frontend before upload
  - Add authentication token handling for API requests
  - _Requirements: 3.3, 3.7, 3.8, 4.3, 4.7, 4.8, 5.8, 5.9_

- [x] 9. Enhance GitHub repository component with pagination

  - Update GithubRepoStep component to support paginated loading
  - Add "Load More" functionality when hasNext is true
  - Maintain selection state across pagination
  - Show loading indicators during fetch operations
  - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [x] 10. Connect PDF upload components to backend

  - Remove dummy data from PDFUploadStep components
  - Integrate real PDF upload API calls with progress indication
  - Add proper error handling that allows proceeding to next step on failure
  - Display extracted text preview from backend response
  - _Requirements: 3.4, 3.5, 3.6, 3.7, 4.4, 4.5, 4.6, 4.7_

- [x] 11. Connect GitHub component to backend

  - Remove dummy data from GithubRepoStep component
  - Integrate real GitHub API calls for repository fetching
  - Implement repository import functionality
  - Add proper error handling for GitHub API failures
  - _Requirements: 5.3, 5.4, 5.8, 5.9_

- [x] 12. Update authentication flow for upload redirect

  - Modify post-authentication redirect logic to route verified users to `/upload`
  - Ensure unverified users still go to `/auth/verify-email`
  - Update middleware to allow `/upload` route access
  - Test complete authentication and redirect flow
  - _Requirements: 1.1, 1.2, 6.3_

- [x] 13. Add comprehensive error handling

  - Implement proper HTTP status codes for all error scenarios
  - Add user-friendly error messages that allow proceeding to next step
  - Create error boundary components for upload wizard
  - Add logging for backend errors with minimal PII
  - _Requirements: 3.7, 3.8, 4.7, 4.8, 5.8, 5.9, 7.5_

- [x] 14. Write backend integration tests

  - Create end-to-end tests for complete upload workflow
  - Test authentication and authorization scenarios
  - Test rate limiting behavior and edge cases
  - Test file upload limits and validation
  - Test GitHub API integration with various scenarios
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 15. Performance optimization and cleanup

  - Optimize PDF processing for memory usage and speed
  - Implement proper file cleanup after processing
  - Add request/response compression for API endpoints
  - Optimize GitHub API calls with proper timeout handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3_

- [x] 16. Create portfolio data schema models

  - Define Pydantic models matching the exact portfolio schema structure provided
  - Implement DateInfo model with numeric month (1-12) and 4-digit year fields
  - Create PersonalInfo (includes profiles[] and tags[]), WorkExperience, Project, Education, Certification, Profile, and TextBlobs models
  - Create PortfolioData root model with personal_info, work_experiences, projects, education, certifications, text_blobs, and metadata (profiles and tags nested under personal_info)
  - Make all fields optional to handle incomplete PDF extraction data
  - Add validation rules and field constraints to all models
  - Write just-enough unit tests for critical validation paths (lean tests)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.10, 12.11_

- [x] 17. Create PortfolioService for data persistence and mapping

  - Implement PortfolioService class for Firestore storage (single doc at `portfolios/{userId}`; no history)
  - Add methods for storing and retrieving portfolio data in Firestore
  - Implement GitHub-only direct mapping to PortfolioData (projects and technologies)
  - Add Firebase configuration and connection management
  - Implement error handling for Firebase operations
  - Write lean tests for mapping and storage happy path
  - _Requirements: 10.1, 10.4, 10.7, 13.6_

- [x] 18. Create AI processing service with cost controls

  - Implement modular AIProcessor class using Azure AI Inference SDK
  - Add structured response formatting using Pydantic model JSON schema with ChatCompletionsResponseFormat.create_json_format
  - Create validate_response method that converts AI JSON output to Pydantic models and validates field completeness
  - Create validate_portfolio_data method for final data validation before storage
  - Implement tiktoken-based token counting with configurable MAX_TOKENS_PER_REQUEST constant
  - Add intelligent text truncation logic that prioritizes resume content over LinkedIn and preserves key sections
  - Create token counting constants and configuration for different model encodings
  - Implement response validation and error handling for malformed AI responses
  - Write lean tests for AI service with mocked responses and truncation scenarios
  - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6, 11.7, 12.9, 13.3, 13.4, 13.5, 13.8, 13.9, 13.10_

- [x] 19. Create extraction prompts constants

  - Create backend/app/constants/extraction_prompts.py file for AI prompt management (backend is canonical)
  - Create comprehensive prompt that handles multiple data sources (LinkedIn PDF, Resume PDF, GitHub repos)
  - Include clear instructions for combining information from multiple sources intelligently
  - Add data prioritization rules: resume information over LinkedIn for conflicts, GitHub data over PDF projects
  - Include instructions for handling unstructured PDF data where fields may be missing
  - Add explicit instruction to return empty structured output when data is irrelevant or insufficient
  - Add clarifying questions and conflict resolution guidance
  - Create token limit constants (MAX_TOKENS_PER_REQUEST, MODEL_ENCODING) for tiktoken configuration
  - Document prompt structure and customization options
  - _Requirements: 10.5, 10.6, 11.3, 12.9, 13.8, 13.10_

- [x] 20. Update submit endpoint with AI processing

  - Modify existing submit endpoint to handle AI processing workflow
  - Add conditional logic for GitHub-only vs PDF+AI processing paths
  - Integrate AI processor and portfolio service dependencies
  - Implement monthly AI limit (10/user) via constant and Firestore-backed counters
  - Implement loading state management and progress indication
  - Add error handling that proceeds to placeholder screen on AI processing failures
  - Write lean integration tests for submit happy paths and rate limit
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7, 10.9, 11.8, 11.9_

- [x] 21. Add AI processing rate limiting with Firebase persistence

  - Create Firebase-backed monthly rate limit tracking with fields: user_id, usage_count, reset_date (first day of month UTC)
  - Enforce permanent monthly limit of 10 AI processing requests per user via constant
  - Add rate limit headers and proper HTTP 429 responses with monthly reset information
  - Create FastAPI dependency for checking AI processing rate limits before processing
  - Add graceful degradation when rate limits are exceeded
  - Write targeted tests for limit enforcement and reset logic
  - _Requirements: 11.6, 11.8, 11.9, 13.1, 13.2, 13.6, 13.7_

- [x] 22. Update frontend for AI processing states

  - Add loading screen with progress indication during AI processing
  - Create placeholder completion screen for AI processing failures
  - Update success messaging to reflect AI-powered data extraction
  - Implement error handling that shows placeholder screen with "feature coming soon" message
  - _Requirements: 10.3, 10.7, 10.9_

- [x] 23. Write targeted tests for AI workflow

  - Focus on hard-to-manually-test flows (rate limits, AI response validation, error paths)
  - Test GitHub-only data path without AI processing
  - Test PDF+AI processing path with minimal representative cases
  - Test error scenarios and fallback behaviors
  - Keep test count lean; emphasize core functionality and correctness
  - _Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.8, 11.8, 11.9_

- [ ] 23. Write comprehensive tests for AI workflow
  - Create end-to-end tests for complete AI processing workflow
  - Test GitHub-only data path without AI processing
  - Test PDF+AI processing path with various data combinations
  - Test error scenarios and fallback behaviors
  - Test data prioritization rules (resume > LinkedIn, GitHub > PDF projects)
  - _Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.8_
