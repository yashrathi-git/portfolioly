# Project Structure

## Monorepo Organization

```
portfolioly/
├── apps/                    # Applications
│   ├── main/               # Main portfolio app (Next.js)
│   └── template/           # Template viewer app (Next.js)
├── packages/               # Shared packages
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
