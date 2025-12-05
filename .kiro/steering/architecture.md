---
inclusion: always
---

# Project Architecture

## Monorepo Structure (Yarn Workspaces)

```
portfolioly/
├── apps/
│   ├── main/          # Next.js 15 main application (portfolioly.app)
│   └── template/      # Deployable portfolio template app
├── packages/
│   ├── schema/        # Shared Zod schemas (portfolioly-schema)
│   ├── template-components/  # Reusable React components
│   └── pdf_parser/    # Python LinkedIn PDF extraction
└── backend/           # FastAPI Python backend
```

## Tech Stack

### Frontend (apps/main)

- Next.js 15 with App Router and Turbopack
- React 19
- Tailwind CSS v4
- Radix UI primitives
- Framer Motion for animations
- Firebase Auth
- Vercel AI SDK

### Backend (backend/)

- FastAPI with Python 3.11+
- Firebase Admin SDK
- Pydantic for validation
- Azure AI / OpenAI for AI extraction
- Azure Blob Storage for images
- Upstash Redis for rate limiting

### Shared Packages

- `portfolioly-schema`: Zod schemas matching backend Pydantic models
- `portfolioly-template-components`: Reusable portfolio UI components

## Key Patterns

- Schema-first development: Define in `packages/schema`, use everywhere
- Backend validates with Pydantic, frontend validates with Zod
- Use `mapBackendToDisplay()` for transforming API data to UI format
- Always validate API responses with schema validators

## Resume Builder Architecture

### Frontend Structure

```
apps/main/src/
├── components/resume/
│   ├── templates/           # Classic, Modern, Minimal templates
│   │   ├── registry.ts      # Template registry singleton
│   │   └── types.ts         # ResumeTemplateProps interface
│   ├── import/              # LinkedIn, GitHub, Portfolio importers
│   ├── ResumeEditor.tsx     # Main editor with section editors
│   ├── LivePreview.tsx      # Preview with zoom controls
│   ├── TemplateSelector.tsx # Template thumbnail grid
│   └── SectionReorder.tsx   # Drag-and-drop reordering
├── lib/resume/
│   ├── resumeTransformer.ts # Data transformation utilities
│   └── pdfExport.ts         # Browser print PDF export
├── hooks/
│   ├── useResume.ts         # CRUD hooks (useResumeList, useResume)
│   └── useResumeEditor.ts   # Editor state with undo/redo
└── types/resume.ts          # ResumeData TypeScript types
```

### Backend Structure

```
backend/app/
├── routes/resume.py         # /api/resumes endpoints
├── services/resume_service.py # CRUD operations
└── schemas/resume.py        # Pydantic models
```

### Firebase Storage

```
users/{uid}/resumes/{resumeId}/
  - id, name, template_id, section_order
  - personal_info, summary, work_experiences
  - education, projects, skills, certifications
  - created_at, updated_at
```

### Key APIs

- `POST /api/resumes` - Create resume
- `GET /api/resumes` - List user resumes
- `GET /api/resumes/{id}` - Get single resume
- `PUT /api/resumes/{id}` - Update resume
- `DELETE /api/resumes/{id}` - Delete resume
- `POST /api/resumes/{id}/duplicate` - Duplicate resume

### Data Transformers

- `ResumeTransformer.fromLinkedIn()` - LinkedIn → ResumeData
- `ResumeTransformer.fromGitHub()` - GitHub repos → Projects
- `ResumeTransformer.fromPortfolio()` - Portfolio → ResumeData
- `ResumeTransformer.mergeGitHubProjects()` - Add repos to resume
