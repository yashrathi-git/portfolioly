# Design Document

## Overview

The upload onboarding flow is a post-authentication feature that allows verified users to auto-populate their portfolio information through a 3-step wizard. The system extracts text from uploaded PDFs (LinkedIn profiles and resumes) and imports GitHub repository data to eliminate manual data entry. The implementation leverages existing UI components, Firebase authentication, and introduces new backend endpoints for PDF processing and GitHub integration.

## Architecture

### High-Level Flow

```mermaid
graph TD
    A[User Signs In/Up] --> B{Email Verified?}
    B -->|No| C[/auth/verify-email]
    B -->|Yes| D[/upload]
    D --> E[Step 1: LinkedIn PDF]
    E --> F[Step 2: Resume PDF]
    F --> G[Step 3: GitHub Repos]
    G --> H[/dashboard]

    E --> I[PDF Parser Service]
    F --> I
    G --> J[GitHub API Service]

    I --> K[Text Extraction]
    J --> L[Repository Data]
    K --> N{Has PDF Data?}
    L --> N
    N -->|Yes| O[AI Processing Service]
    N -->|No| P[Direct GitHub Mapping]
    O --> Q[Structured Data Extraction]
    P --> R[Firebase Storage]
    Q --> R
    R --> M[Portfolio Auto-populated]
```

### System Components

1. **Frontend Wizard** - React components for the 3-step upload flow
2. **PDF Processing Service** - Backend service for parsing PDF documents
3. **GitHub Integration Service** - Backend service for fetching repository data
4. **AI Processing Service** - Modular service for structured data extraction using Azure AI
5. **Portfolio Data Service** - Service for storing structured data in Firebase
6. **Authentication Layer** - Firebase token validation and email verification
7. **Configuration Management** - Centralized constants for file limits and validation

## Components and Interfaces

### Frontend Components (Existing)

The following components are already implemented and will be integrated:

- `UploadWizard` - Main orchestrator component
- `PDFUploadStep` - Handles PDF file uploads with preview
- `GithubRepoStep` - GitHub username input and repository selection
- `StepContainer` - Consistent step layout and navigation
- `ProgressIndicator` - Visual progress tracking

### New Frontend Components

#### `/upload` Page Component

```typescript
// apps/main/src/app/upload/page.tsx
export default function UploadPage() {
  // Protected route with email verification requirement
  // Integrates UploadWizard with backend API calls
  // Handles completion redirect to dashboard
}
```

#### Enhanced GitHub Repository Component

The existing `GithubRepoStep` component will be enhanced to support pagination:

- Load initial 20 repositories (configurable via `GITHUB_REPOS_PER_PAGE`)
- Show "Load More" button when `hasNext` is true
- Append new repositories to existing list
- Maintain selection state across pagination
- Show loading indicator during fetch operations

#### API Integration Utilities

```typescript
// apps/main/src/lib/api/upload.ts
export interface PDFUploadResponse {
  text: string;
  meta: {
    source: "linkedin" | "resume";
    pages: number;
    filename: string;
    size: number;
    blobUrl?: string;
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  stars: number;
  url: string;
  language?: string;
}

export async function uploadPDF(
  file: File,
  source: "linkedin" | "resume"
): Promise<PDFUploadResponse>;
export async function fetchGitHubRepos(
  username: string,
  page?: number
): Promise<PaginatedRepoResponse>;
export async function importGitHubRepos(
  repoIds: number[]
): Promise<{ imported: number }>;
```

### Backend Services

#### PDF Processing Service

```python
# backend/app/services/pdf_processor.py
class PDFProcessor:
    async def parse_pdf(self, file: UploadFile, source: str) -> PDFParseResult
    def validate_pdf(self, file: UploadFile) -> bool
    def extract_text_with_pymupdf(self, pdf_bytes: bytes) -> str
    def get_metadata(self, pdf_bytes: bytes) -> dict
```

#### GitHub Integration Service

```python
# backend/app/services/github_service.py
class GitHubService:
    def __init__(self, token: Optional[str] = None)
    async def fetch_user_repos(self, username: str, page: int = 1, per_page: int = 20) -> PaginatedRepoResponse
    async def get_repo_details(self, owner: str, repo: str) -> GitHubRepo
    def validate_username(self, username: str) -> bool
```

#### AI Processing Service

```python
# backend/app/services/ai_processor.py
class AIProcessor:
    def __init__(self, api_key: str, endpoint: str)
    async def extract_structured_data(
        self,
        linkedin_text: Optional[str],
        resume_text: Optional[str],
        github_repos: List[GitHubRepo]
    ) -> PortfolioData
    def create_extraction_prompt(
        self,
        linkedin_text: Optional[str],
        resume_text: Optional[str],
        github_repos: List[GitHubRepo]
    ) -> str
    async def validate_response(self, response: dict) -> PortfolioData
```

#### Portfolio Data Service

```python
# backend/app/services/portfolio_service.py
class PortfolioService:
    def __init__(self, firebase_client)
    async def store_portfolio_data(self, user_id: str, data: PortfolioData) -> str  # returns doc id
    async def map_github_only_data(self, github_repos: List[GitHubRepo]) -> PortfolioData
    def validate_portfolio_data(self, data: PortfolioData) -> bool
```

Storage layout:

```text
Firestore:
  portfolios/{userId}  # single document per user; latest snapshot only (no history)
```

#### Configuration Service

```python
# backend/app/core/config.py (UploadSettings)
# Augmented with Azure Inference and monthly AI quota
class UploadSettings(BaseModel):
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_FILE_TYPES: List[str] = ["application/pdf"]
    MAX_GITHUB_REPOS: int = 10
    GITHUB_REPOS_PER_PAGE: int = 20
    GITHUB_API_TIMEOUT: int = 30
    ENABLE_AZURE_STORAGE: bool = False

    # Azure AI Inference configuration
    AZURE_AI_ENDPOINT: str  # e.g., https://<region>.api.azure.com/ai
    AZURE_AI_API_KEY: str
    AI_MODEL_NAME: str = "gpt-4o-mini"
    AI_REQUEST_TIMEOUT: int = 60
    MAX_TOKENS_PER_REQUEST: int = 120000
    MODEL_ENCODING: str = "o200k"  # for tiktoken if used

    # Rate limiting
    RATE_LIMIT_PDF_UPLOADS_PER_HOUR: int = 10
    RATE_LIMIT_GITHUB_REQUESTS_PER_HOUR: int = 30
    AI_REQUESTS_PER_MONTH: int = 10  # per-user, persisted in Firestore
    RATE_LIMIT_STORAGE_BACKEND: str = "memory"
```

#### Rate Limiting Service

```python
# backend/app/services/rate_limiter.py
class RateLimiter:
    def __init__(self, backend: str = "memory")
    async def check_rate_limit(self, user_id: str, endpoint: str, limit: int, window_seconds: int) -> bool
    async def increment_counter(self, user_id: str, endpoint: str, window_seconds: int) -> int
    async def get_reset_time(self, user_id: str, endpoint: str, window_seconds: int) -> int
```

```python
# backend/app/services/ai_usage_limiter.py (new)
class AIMonthlyUsageLimiter:
    def __init__(self, firestore_client)
    async def check_and_increment(self, user_id: str, limit_per_month: int) -> tuple[bool, dict]
    # returns (allowed, meta) where meta includes reset_date and current_count
```

### API Endpoints

#### PDF Upload Endpoint

```python
@router.post("/ingest/pdf")
async def upload_pdf(
    file: UploadFile,
    source: str = Query(..., regex="^(linkedin|resume)$"),
    user: UserToken = Depends(require_verified_email),
    rate_limiter: RateLimiter = Depends(get_rate_limiter)
) -> PDFUploadResponse
```

#### GitHub Repository Endpoints

```python
@router.get("/github/repos")
async def get_github_repos(
    username: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: UserToken = Depends(require_verified_email),
    rate_limiter: RateLimiter = Depends(get_rate_limiter)
) -> PaginatedRepoResponse

@router.post("/submit")
async def submit_upload_data(
    request: UploadSubmissionRequest,
    user: UserToken = Depends(require_verified_email),
    ai_processor: AIProcessor = Depends(get_ai_processor),
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    _ai_monthly_limit: None = Depends(check_ai_monthly_limit_if_needed)
) -> UploadSubmissionResponse
```

Submit behavior:

- If only GitHub repos are provided (no PDFs): map directly to `PortfolioData` and store; skip AI and monthly limit.
- If any PDF is present: build prompt with LinkedIn/Resume text + GitHub repos; call Azure AI with JSON schema response format; validate, store.
- On monthly limit exceeded: return 429 with `Retry-After` and reset date headers.
- On AI timeout: return 504 with retry guidance.

Submit response shape (success):

```json
{
  "success": true,
  "message": "Upload data submitted successfully",
  "data": {
    "user_id": "<uid>",
    "path": "github_only" | "ai",
    "linkedin_pdf_submitted": true | false,
    "resume_pdf_submitted": true | false,
    "github_repos_count": 3,
    "portfolio_doc_id": "<docId>",
    "submitted_at": "2025-09-24T12:34:56Z"
  }
}
```

## Data Models

### Frontend Data Models

```typescript
interface ParsedPdf {
  filename: string;
  sizeKB: number;
  pages: number;
  previewText: string;
  source: "linkedin" | "resume";
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  stars: number;
  url: string;
  language?: string;
}

interface PaginatedRepoResponse {
  repos: GitHubRepo[];
  totalCount: number;
  page: number;
  perPage: number;
  hasNext: boolean;
}

interface UploadWizardState {
  linkedin: ParsedPdf | null;
  resume: ParsedPdf | null;
  selectedRepoIds: number[];
}
```

### Backend Data Models

```python
class PDFUploadResponse(BaseModel):
    text: str
    meta: PDFMetadata

class PDFMetadata(BaseModel):
    source: Literal["linkedin", "resume"]
    pages: int
    filename: str
    size: int
    blob_url: Optional[str] = None

class GitHubRepo(BaseModel):
    id: int
    name: str
    description: str
    stars: int
    url: str
    language: Optional[str] = None

class GitHubImportRequest(BaseModel):
    repo_ids: List[int] = Field(..., max_items=10)

class PaginatedRepoResponse(BaseModel):
    repos: List[GitHubRepo]
    total_count: int
    page: int
    per_page: int
    has_next: bool

class GitHubImportResponse(BaseModel):
    imported: int
    message: str

class DateInfo(BaseModel):
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=1900, le=2100)

class Profile(BaseModel):
    type: Optional[str] = None
    url: Optional[str] = None
    label: Optional[str] = None

class PersonalInfo(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profiles: Optional[List[Profile]] = None
    tags: Optional[List[str]] = None
    more_context: Optional[str] = None

class WorkExperience(BaseModel):
    organization: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    highlights: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    more_context: Optional[str] = None

class Project(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    highlights: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    github: Optional[str] = None
    live_link: Optional[str] = None
    more_context: Optional[str] = None

class Education(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    location: Optional[str] = None
    grade: Optional[str] = None

class Certification(BaseModel):
    name: Optional[str] = None
    link: Optional[str] = None

class TextBlobs(BaseModel):
    achievements: Optional[str] = None
    additional_context: Optional[str] = None

class Metadata(BaseModel):
    source_type: Optional[str] = None
    extracted_at: Optional[str] = None
    notes: Optional[str] = None

class PortfolioData(BaseModel):
    personal_info: Optional[PersonalInfo] = None
    work_experiences: Optional[List[WorkExperience]] = None
    projects: Optional[List[Project]] = None
    education: Optional[List[Education]] = None
    certifications: Optional[List[Certification]] = None
    text_blobs: Optional[TextBlobs] = None
    metadata: Optional[Metadata] = None
```

## Error Handling

### Frontend Error Handling

1. **File Validation Errors**

   - File size exceeding limit
   - Invalid file type
   - Corrupted PDF files

2. **Network Errors**

   - API timeout during PDF processing
   - GitHub API rate limiting
   - Connection failures

3. **Authentication Errors**
   - Token expiration during upload
   - Email verification required

### Backend Error Handling

1. **HTTP Status Codes**

   - `400 Bad Request` - Invalid file or parameters
   - `401 Unauthorized` - Missing or invalid token
   - `403 Forbidden` - Email not verified
   - `413 Payload Too Large` - File size exceeded
   - `415 Unsupported Media Type` - Invalid file type
   - `422 Unprocessable Entity` - PDF parsing failed
   - `429 Too Many Requests` - Rate limiting
   - `503 Service Unavailable` - External API failures

2. **Error Response Format**

```python
class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    retry_after: Optional[int] = None
```

## Testing Strategy

### Lean Testing Policy

- Emphasize core, hard-to-manually-test functionality.
- Prefer fewer, high-signal tests over exhaustive coverage.

Priorities:

- Rate limiting (hourly PDF/GitHub; monthly AI with reset) — deterministic unit tests.
- Submit endpoint paths — minimal cases:
  - GitHub-only happy path (no AI).
  - PDF+AI happy path (mocked Azure response) and invalid JSON from AI.
  - 429 monthly AI limit and reset date handling.
  - Timeout (504) behavior.
- PDF processing — basic validation and one extraction success case.
- GitHub service — username validation and one paginated fetch with mock.

De-prioritize broad E2E; keep a minimal smoke flow once the above are stable.

### Frontend Testing

1. **Component Testing**

   - Upload wizard navigation flow
   - File upload validation
   - GitHub repository selection
   - Error state handling

2. **Integration Testing**

   - API call integration
   - Authentication flow
   - Route protection

3. **E2E Testing**
   - Minimal smoke flow for onboarding
   - Error banner rendering for rate-limit/timeout

### Backend Testing

1. **Unit Testing**

   - PDF parsing functionality
   - GitHub API integration
   - Authentication middleware
   - File validation

2. **Integration Testing**

   - End-to-end API workflows
   - Firebase token validation
   - External API mocking

3. **Performance Testing**
   - PDF processing performance
   - Concurrent upload handling
   - Memory usage during file processing

## Security Considerations

### Authentication & Authorization

1. **Token Validation**

   - Firebase ID token verification on all endpoints
   - Email verification requirement enforcement
   - Token expiration handling

2. **File Security**

   - Server-side file type validation
   - Filename sanitization
   - File size limits enforcement
   - Malicious file detection

3. **Rate Limiting**
   - Per-user PDF upload limits (10 uploads/hour)
   - Per-user GitHub API request limits (30 requests/hour)
   - In-memory rate limiting with optional Redis backend
   - HTTP 429 responses with `Retry-After` headers
   - Abuse prevention and DDoS protection

### Data Privacy

1. **File Handling**

   - No persistent storage by default
   - Optional Azure Blob storage with encryption
   - Secure file deletion after processing

2. **GitHub Integration**
   - Public repository access only
   - No token storage
   - User consent for data access

## Performance Optimization

### Asynchronous Processing

1. **PDF Processing**

   - Non-blocking file upload
   - Streaming file processing
   - Progress indication

2. **GitHub API**
   - Concurrent repository fetching
   - Response caching
   - Timeout handling

### Resource Management

1. **Memory Management**

   - Streaming file processing
   - Garbage collection optimization
   - Memory leak prevention

2. **Network Optimization**
   - Request compression
   - Response caching
   - Connection pooling

## Configuration Management

### Environment Variables

```python
# Backend Configuration
GITHUB_API_TOKEN=optional_token_for_higher_limits
MAX_FILE_SIZE_MB=15
ALLOWED_FILE_TYPES=application/pdf
MAX_GITHUB_REPOS=10
ENABLE_AZURE_STORAGE=false
AZURE_STORAGE_CONNECTION_STRING=optional
AZURE_AI_ENDPOINT=your_azure_ai_inference_endpoint
AZURE_AI_API_KEY=your_azure_ai_key
AI_MODEL_NAME=gpt-4o-mini
AI_REQUEST_TIMEOUT=60
AI_REQUESTS_PER_MONTH=10
```

```typescript
// Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MAX_FILE_SIZE_MB=15
NEXT_PUBLIC_MAX_GITHUB_REPOS=10
```

### Runtime Configuration

1. **Configurable Constants**

   - File size limits
   - Repository selection limits
   - API timeouts
   - Feature flags

2. **Feature Toggles**
   - Azure Blob storage
   - GitHub integration
   - PDF processing fallbacks

## Deployment Considerations

### Dependencies

1. **Backend Dependencies**

   - `PyMuPDF` (fitz) for PDF text extraction
   - `PyGithub` for GitHub API integration
   - `python-multipart` for file uploads
   - `aiofiles` for async file handling
   - `azure-ai-inference` for Azure AI structured responses
   - (optional) `tiktoken` for token counting/truncation

2. **Frontend Dependencies**
   - Existing UI components (already implemented)
   - File upload utilities
   - Progress indication libraries

### Infrastructure

1. **Storage Requirements**

   - Temporary file storage for processing
   - Optional Azure Blob storage
   - Memory requirements for PDF processing

2. **External Services**
   - GitHub API access
   - Firebase authentication
   - Optional Azure Blob storage

## Migration Strategy

### Phase 1: Core Infrastructure

1. Backend PDF processing endpoints
2. GitHub API integration
3. Authentication middleware updates

### Phase 2: Frontend Integration

1. Upload page implementation
2. API integration utilities
3. Route protection updates

### Phase 3: Enhancement

1. Azure Blob storage integration
2. Performance optimizations
3. Advanced error handling

This design leverages the existing UI components and authentication infrastructure while introducing robust backend services for PDF processing and GitHub integration. The modular approach allows for incremental implementation and future enhancements.
