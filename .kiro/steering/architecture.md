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
