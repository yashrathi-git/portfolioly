# Technology Stack

## Build System & Package Management

- **Monorepo**: Yarn workspaces with multiple apps and packages
- **Package Manager**: Yarn 4.9.4 (configured via `.yarnrc.yml`)
- **TypeScript**: Shared base config in `tsconfig.base.json`

## Frontend Stack

### Main Application (`apps/main`)

- **Framework**: Next.js 15.5.3 with App Router
- **Runtime**: React 19.1.0
- **Build Tool**: Next.js with Turbopack (--turbopack flag)
- **Styling**: Tailwind CSS 4.x with custom animations
- **UI Components**: Radix UI primitives + custom components
- **State Management**: React Context (AuthContext, ThemeProvider)
- **Authentication**: Firebase 12.3.0
- **Animations**: Framer Motion 12.23.21
- **Icons**: Lucide React
- **Notifications**: Sonner

### Schema Package (`packages/schema`)

- **Build Tool**: Vite 5.x with TypeScript
- **Validation**: Zod 3.x for runtime schema validation
- **Output**: ESM + CJS formats with TypeScript declarations
- **Purpose**: Single source of truth for portfolio data structures

### Template Components Package (`packages/template-components`)

- **Build Tool**: Vite 5.x with React SWC plugin
- **Output**: ESM + CJS formats with TypeScript declarations
- **Peer Dependencies**: React 18+, Framer Motion, Lucide React
- **Schema Dependency**: Imports from `@portfolioly/schema`

### Template App (`apps/template`)

- **Framework**: Next.js (standalone template viewer)

## Backend Stack (`backend/`)

- **Framework**: FastAPI with standard extras
- **Python**: 3.11+ (managed with `uv` package manager)
- **Authentication**: Firebase Admin SDK
- **File Processing**: PyMuPDF (PDF), python-magic (file types)
- **AI Integration**: Azure AI Inference with tiktoken
- **GitHub Integration**: PyGithub
- **Configuration**: Pydantic Settings with python-dotenv
- **Testing**: pytest with asyncio support

## Common Commands

### Development

```bash
# Start main app
yarn dev:main

# Start template app
yarn dev:template

# Build all workspaces
yarn build

# Watch mode for all packages
yarn watch

# Backend development
cd backend && uv run python run.py
```

### Backend Specific

```bash
# Setup backend environment
cd backend && uv venv && uv pip sync requirements.txt

# Run tests
cd backend && uv run pytest

# Direct uvicorn
cd backend && uv run uvicorn app.main:app --reload
```

## Key Libraries & Patterns

- **UI**: Radix UI + Tailwind CSS + class-variance-authority
- **Forms**: Custom form components with validation
- **Schema Validation**: Zod for runtime type checking and validation
- **Error Handling**: Structured error boundaries and toast notifications
- **Data Fetching**: Custom hooks with error handling
- **Data Transformation**: Centralized mappers in `@portfolioly/schema`
- **Theming**: next-themes with CSS custom properties
- **File Uploads**: Multipart form handling with progress tracking
