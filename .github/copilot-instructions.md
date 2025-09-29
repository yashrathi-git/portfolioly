# Portfolioly AI Coding Instructions

## Architecture Overview

**Monorepo Structure**: Yarn workspaces with 3 main components:
- `apps/main` - Next.js 15 + Firebase auth main application
- `packages/template-components` - Reusable portfolio UI components (Vite library)
- `backend` - FastAPI + Firebase + Azure AI service (Python 3.11+)

**Critical Data Flow**: Backend AI extracts portfolio data from PDFs/GitHub → stores in Firestore → Main app fetches and transforms → renders using template components.

## Core Patterns & Conventions

### 1. Portfolio Data Mapping (Main App)
Two distinct `PortfolioData` types exist - **never confuse them**:

```typescript
// Main app schema (backend API format)
import type { PortfolioData } from "@/types/portfolio"

// Template component schema (UI format)
import type { PortfolioData } from "@portfolioly/template-components"

// Always map between them using:
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper"
```

**Example pattern** (`apps/main/src/components/edit/PortfolioPreview.tsx`):
```typescript
const templateData = useMemo(() => {
  return mapPortfolioDataToTemplate(data); // Main → Template
}, [data]);
```

### 2. Authentication Architecture (Main App)

**Firebase Auth with Email Verification**:
- Use `withAuth(Component, { requireVerification: true })` for protected pages
- Auth context in `apps/main/src/lib/auth/AuthContext.tsx` provides: `user`, `loading`, `verificationStatus`
- Backend requires `RequireVerifiedEmail` dependency for sensitive endpoints
- See `apps/main/documentation/EMAIL_VERIFICATION.md` for complete flow

**Protected route pattern**:
```typescript
// In page files
export default withAuth(MyPage, { requireVerification: true });
```

### 3. Backend API Design (FastAPI)

**Centralized Schemas**: All Pydantic models in `backend/app/schemas/`
```python
# Import from centralized location
from app.schemas.portfolio import PortfolioData
from app.schemas.auth import UserToken
from app.schemas.upload import UploadSubmissionRequest
```

**Service Pattern**: Business logic in services (`backend/app/services/`), routes stay thin
```python
# Route example
@router.get("/", response_model=Optional[PortfolioData])
async def get_portfolio(
    user: UserToken = RequireVerifiedEmail,
    service: PortfolioService = Depends(get_portfolio_service)
):
    return await service.get_user_portfolio(user.uid)
```

**Authentication middleware**:
- `RequireAuth` - Any authenticated user
- `RequireVerifiedEmail` - Email verified users only
- Config: `REQUIRE_EMAIL_VERIFICATION=true` in `.env`

### 4. AI Processing (Backend)

**Token Management**: Azure AI inference with prompt caching in `backend/app/services/ai_processor.py`
- Max 50K tokens per request (configurable)
- Uses tiktoken for accurate counting
- Truncates PDF text intelligently to fit limits

**Extraction flow** (`backend/app/services/ai_workflow.py`):
1. PDF parsing → text extraction
2. GitHub API → repo metadata
3. AI processor → structured PortfolioData (JSON Schema response format)
4. Firestore storage

**Key files**:
- `backend/app/constants/extraction_prompts.py` - AI prompts
- `backend/app/services/pdf_processor.py` - PyMuPDF text extraction
- `backend/app/services/github_service.py` - PyGithub integration

### 5. Template Component Integration

**Import compiled CSS** to ensure styles load:
```typescript
import "@portfolioly/template-components/style.css";
```

**Typography system** (`packages/template-components/src/lib/typography.ts`):
- Use `typography.content.base` (15px), `typography.heading.primary` (20→24px)
- Consistent responsive scaling defined in central config
- Avoid arbitrary font sizes - reference the typography system

**Provider pattern**:
```typescript
<TemplateProvider>
  <PortfolioProvider portfolioData={templateData}>
    <ChatPortfolio {...props} />
  </PortfolioProvider>
</TemplateProvider>
```

## Development Workflows

### Build & Dev Commands
```bash
# Root level (all workspaces)
yarn build                    # Build all packages
yarn watch                    # Watch mode for all

# Main app
yarn dev:main                 # Next.js dev server (port 3000)
yarn build:main               # Production build

# Template components
cd packages/template-components
yarn build                    # Vite library build (generates dist/)
yarn watch                    # Watch mode for development

# Backend (uses uv for dependency management)
cd backend
uv run fastapi dev           # Development server (port 8000)
pytest                       # Run tests
```

### Testing Strategy
- **Frontend**: Tests in `apps/main/src/__tests__/` (auth, routing)
- **Backend**: Tests in `backend/tests/` - covers AI workflow, services, schemas
- Backend tests use pytest-asyncio for async operations

### Environment Setup

**Backend** (`backend/.env`):
```env
GOOGLE_APPLICATION_CREDENTIALS=./firebaseServiceKeyJson/firebaseServiceKey.json
REQUIRE_EMAIL_VERIFICATION=true
FRONTEND_ORIGIN=http://localhost:3000
AZURE_AI_ENDPOINT=<your-endpoint>
AZURE_AI_API_KEY=<your-key>
```

**Frontend** (`apps/main/.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Rate Limiting & Resource Management

### In-Memory Rate Limiter (Sliding Window)
**Critical**: Uses in-memory storage with automatic cleanup to prevent memory bloat
- Implementation: `backend/app/services/rate_limiter.py` (`InMemoryRateLimiter`)
- Sliding window algorithm tracks timestamps per user/endpoint
- Auto-expires old requests outside time window
- **Storage structure**: `{user_id: {endpoint: deque[timestamps]}}`

**Per-Hour Limits** (configurable in `backend/app/core/config.py`):
- PDF uploads: 10/hour per user
- GitHub API requests: 10/hour per user
- Window: 3600 seconds (1 hour)

**Protected Routes** (via dependencies in `backend/app/dependencies/rate_limiting.py`):
```python
# PDF upload rate limiting
POST /api/ingest/pdf - check_pdf_upload_rate_limit dependency

# GitHub API rate limiting  
GET /api/github/repos - check_github_api_rate_limit dependency
```

### AI Processing Rate Limiter (Firebase Persistent)
**Monthly limit**: 10 AI processing requests per user
- Implementation: `backend/app/services/ai_rate_limiter.py` (`AIRateLimiter`)
- Persistent storage in Firestore collection `ai_rate_limits`
- Auto-resets on first day of each month
- Applied in `POST /api/submit` before AI workflow execution

**Error handling**:
```python
try:
    rate_limit_info = ai_rate_limiter.check_rate_limit(user.uid)
    # ... process AI request
    ai_rate_limiter.increment_usage(user.uid)
except AIRateLimitError as e:
    raise HTTPException(429, detail={"error_code": "AI_RATE_LIMIT_EXCEEDED"})
```

### Prompt Caching (Filesystem)
AI prompts cached to disk for debugging/auditing:
- Location: `backend/app/services/prompt_cache/`
- Auto-cleanup: keeps only last 10 cache files
- Format: `ai_prompt_YYYYMMDD_HHMMSS.txt`
- **Purpose**: Debug token counting issues, audit AI inputs (not for performance)

## Authentication & Route Protection

### Protected Route Patterns
All routes use FastAPI dependencies for consistent auth enforcement:

**Email Verified Required** (`require_verified_email`):
- `GET/PUT/DELETE /portfolio` - Portfolio CRUD
- `GET/PUT/DELETE /settings/*` - User settings
- `POST /api/ingest/pdf` - PDF upload
- `GET /api/github/repos` - GitHub repo listing
- `POST /api/submit` - AI processing submission

**Any Authenticated User** (`require_authenticated_user`):
- `GET /auth/me` - Current user info
- `POST /auth/verify-email-status` - Check verification status

**Public (No Auth)**:
- `GET /public/portfolio/{username}` - Public portfolios
- `GET /public/username/{username}/available` - Username availability
- `GET /health` - Health check

### Error Response Patterns
Standardized error codes in responses:
- `AUTH_ERROR` - Invalid/missing token
- `MISSING_TOKEN` - No Authorization header
- `INVALID_TOKEN` - Token verification failed
- `EMAIL_NOT_VERIFIED` - Email verification required (403)
- `RATE_LIMIT_EXCEEDED` - Rate limit hit (429)
- `AI_RATE_LIMIT_EXCEEDED` - Monthly AI limit hit (429)

Example structured error:
```json
{
  "detail": {
    "message": "Rate limit exceeded. Maximum 10 PDF uploads per hour.",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 2847,
    "current_count": 10,
    "limit": 10
  }
}
```

## Key Integration Points

### Username & Public Portfolios
- User settings service (`backend/app/services/user_settings_service.py`) manages usernames + visibility
- Public route: `GET /public/portfolio/{username}` returns portfolio if `is_public=true`
- Username validation: 3-30 chars, alphanumeric + hyphens/underscores, no reserved words
- Making portfolio public requires username first

### Data Transformation Pipeline
1. Backend receives PDF + GitHub data
2. AI extraction → `PortfolioData` (backend schema)
3. Stored in Firestore at `/portfolios/{user_id}`
4. Frontend fetches via `getUserPortfolio()` in `apps/main/src/lib/api/portfolio.ts`
5. Mapper converts to template schema before rendering

## Common Pitfalls & Best Practices

### Data & Types
- ❌ Don't use template component types directly in main app - always map data
- ❌ Don't use arbitrary font sizes - reference `typography` system in template-components
- ✅ Always import schemas from `app.schemas.*` in backend (centralized location)
- ✅ Use `workspace:*` protocol for monorepo package references

### Authentication & Security
- ❌ Don't bypass authentication middleware on sensitive backend routes
- ❌ Don't use `require_authenticated_user` for routes handling sensitive data - use `require_verified_email`
- ✅ Check existing route protection patterns before adding new endpoints
- ✅ Use structured error codes for consistent frontend error handling

### Rate Limiting & Memory
- ❌ Don't store unbounded data in in-memory rate limiter - cleanup is automatic but be aware
- ❌ Don't forget rate limiting dependencies on upload/processing endpoints
- ✅ AI rate limits are persistent (Firebase), upload rate limits are in-memory (resets on restart)
- ✅ Prompt cache auto-cleans to 10 files max - no manual intervention needed

### Development Workflow
- ❌ Don't forget to rebuild template-components after changes (`yarn build`)
- ❌ Don't trust markdown docs as source of truth - verify patterns in actual code
- ✅ Run backend tests after modifying AI prompts or schemas to ensure compatibility
- ✅ Check rate limiter config in `.env` when testing upload flows
