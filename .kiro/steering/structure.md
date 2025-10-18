# Project Structure

## Monorepo Organization

```
portfolioly/
├── apps/                    # Applications
│   ├── main/               # Main portfolio app (Next.js)
│   └── template/           # Template viewer app (Next.js)
├── packages/               # Shared packages
│   ├── schema/             # Unified portfolio schema with Zod validation
│   └── template-components/ # Reusable portfolio components
├── backend/                # Python FastAPI backend
├── documentation/          # Project documentation
└── .kiro/                 # Kiro AI assistant configuration
```

## Main App Structure (`apps/main/`)

### Core Directories

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components organized by feature
- `src/lib/` - Utilities, configurations, and services
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions

### Component Organization

```
src/components/
├── ui/           # Base UI components (buttons, inputs, etc.)
├── auth/         # Authentication-related components
├── edit/         # Portfolio editing components
└── upload/       # File upload workflow components
```

### Library Organization

```
src/lib/
├── auth/         # Authentication logic and context
├── api/          # API client functions
├── utils/        # Utility functions and error handling
└── services/     # External service integrations
```

## Backend Structure (`backend/`)

### Core Directories

- `app/` - Main application code
- `tests/` - Test files (mirrors app structure)
- `firebaseServiceKeyJson/` - Firebase credentials

### App Organization

```
app/
├── core/         # Configuration and initialization
├── auth/         # Authentication middleware
├── routes/       # API route handlers
├── services/     # Business logic services
├── schemas/      # Pydantic models for validation
├── constants/    # Application constants
└── dependencies/ # FastAPI dependencies
```

## Schema Package (`packages/schema/`)

### Structure

```
src/
├── schemas/      # Zod schema definitions
│   ├── core.ts          # Core types (DateInfo, Profile)
│   ├── personal.ts      # PersonalInfo schema
│   ├── work.ts          # WorkExperience schema
│   ├── project.ts       # Project and ProjectImage schemas
│   ├── education.ts     # Education schema
│   ├── certification.ts # Certification schema
│   ├── metadata.ts      # Metadata schemas
│   └── portfolio.ts     # Root PortfolioData schema
├── transformers/ # Data transformation utilities
│   ├── backend-to-display.ts # Backend to display format
│   ├── entity-mappers.ts     # Individual entity mappers
│   ├── profile-mapper.ts     # Profile to social link mapping
│   ├── date-formatter.ts     # Date formatting utilities
│   └── validators.ts         # Validation utilities
├── types/        # TypeScript type definitions
│   └── display.ts # Display format types
└── index.ts      # Public API exports
```

## Template Components Package (`packages/template-components/`)

### Structure

```
src/
├── components/   # React components
│   ├── chat/    # Chat-based portfolio components
│   ├── portfolio-traditional/ # Traditional layout components
│   └── widgets/ # Reusable portfolio widgets
├── providers/   # React context providers
├── clients/     # API and data clients
├── utils/       # Utility functions
├── types/       # TypeScript definitions
└── config/      # Configuration files
```

## Key Conventions

### File Naming

- **React Components**: PascalCase (e.g., `PortfolioEditor.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuthenticatedPortfolio.ts`)
- **Utilities**: camelCase (e.g., `errorHandling.ts`)
- **API Routes**: kebab-case directories (e.g., `verify-email/`)
- **Python Files**: snake_case (e.g., `ai_processor.py`)

### Import Organization

- External libraries first
- Internal imports grouped by: components, hooks, utils, types
- Relative imports last

### Configuration Files

- `.env` files for environment variables (never commit secrets)
- `components.json` for shadcn/ui configuration
- `tailwind.config.ts` for styling configuration
- `tsconfig.json` extends base configuration

### Testing

- **Frontend**: Tests in `__tests__` directories or `.test.tsx` files
- **Backend**: Tests in `tests/` directory mirroring `app/` structure
- **Naming**: `test_*.py` for Python, `*.test.ts` for TypeScript

### Documentation

- Feature documentation in `documentation/` directory
- Component instructions in `INSTRUCTIONS.md` files
- API documentation in backend `README.md`
- Architecture decisions in `.kiro/specs/` directories
- Package documentation in `packages/*/README.md` files

### Shared Packages

- **Schema Package**: All packages and apps import from `@portfolioly/schema` for type definitions and validation
- **Template Components**: Reusable UI components that consume schema types
- **Workspace Protocol**: Packages linked via `workspace:*` in package.json
