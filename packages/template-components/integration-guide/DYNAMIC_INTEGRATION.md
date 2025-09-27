# Dynamic Template Components Integration Guide

This guide shows how to integrate the dynamic template components into your Next.js application with API data fetching, JSON fallbacks, and public portfolio publishing.

## Installation

```bash
npm install @portfolioly/template-components
```

## Quick Start

### 1. Basic Setup with API Data

```tsx
import {
  ChatPortfolio,
  HydrationProvider,
  TemplateConfig,
} from "@portfolioly/template-components";
import "@portfolioly/template-components/styles.css";

const config: TemplateConfig = {
  dataSource: "api",
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
    authenticatedPortfolio: "/api/portfolio",
    usernameCheck: "/api/public/username",
  },
  enableDebugLogging: process.env.NODE_ENV === "development",
};

export default function PortfolioPage({ username }: { username?: string }) {
  return (
    <HydrationProvider config={config} username={username}>
      <ChatPortfolio />
    </HydrationProvider>
  );
}
```

### 2. Server-Side Rendering (SSR)

```tsx
// pages/[username].tsx or app/[username]/page.tsx
import {
  getServerSidePortfolioProps,
  createHydratedPage,
  ChatPortfolio,
} from "@portfolioly/template-components";

const config: TemplateConfig = {
  dataSource: "api",
  apiEndpoints: {
    publicPortfolio: process.env.API_URL + "/api/public/portfolio",
  },
};

function PortfolioPage({ portfolioData, username }) {
  return <ChatPortfolio />;
}

export default createHydratedPage(PortfolioPage, config);

export async function getServerSideProps({ params }) {
  return getServerSidePortfolioProps(config, params.username);
}
```

### 3. Static Site Generation (SSG)

```tsx
// For public portfolios with ISR
export async function getStaticProps({ params }) {
  return getStaticPortfolioProps(config, params.username);
}

export async function getStaticPaths() {
  return getStaticPortfolioPaths(config);
}
```

## Configuration Options

### Complete Configuration

```tsx
const config: TemplateConfig = {
  // Data source selection
  dataSource: "hybrid", // 'api' | 'json' | 'hybrid'

  // API endpoints
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
    authenticatedPortfolio: "/api/portfolio",
    usernameCheck: "/api/public/username",
    setUsername: "/api/settings/username",
    setVisibility: "/api/settings/visibility",
  },

  // JSON fallback files
  jsonFiles: {
    portfolioData: "/data/portfolio.json",
  },

  // Authentication
  authToken: "your-jwt-token",

  // Performance
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  // Development
  enableDebugLogging: true,
  enableDummyData: true,
};
```

### Data Source Modes

#### API Mode

```tsx
const config: TemplateConfig = {
  dataSource: "api",
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
    authenticatedPortfolio: "/api/portfolio",
  },
};
```

#### JSON Mode

```tsx
const config: TemplateConfig = {
  dataSource: "json",
  jsonFiles: {
    portfolioData: "/data/portfolio.json",
  },
};
```

#### Hybrid Mode (API with JSON fallback)

```tsx
const config: TemplateConfig = {
  dataSource: "hybrid",
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
  },
  jsonFiles: {
    portfolioData: "/data/portfolio.json",
  },
};
```

## Component Usage

### Chat Portfolio with Dynamic Data

```tsx
import {
  ChatPortfolio,
  usePortfolioData,
} from "@portfolioly/template-components";

function PortfolioWrapper() {
  const { portfolioData, isLoading, error } = usePortfolioData();

  return (
    <ChatPortfolio
      portfolioData={portfolioData}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### Traditional Portfolio

```tsx
import { TraditionalPortfolio } from "@portfolioly/template-components";

function Portfolio() {
  return (
    <TraditionalPortfolio
      data={portfolioData}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

### Username Management

```tsx
import {
  UsernameSelector,
  VisibilityToggle,
} from "@portfolioly/template-components";

function SettingsPage() {
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div>
      <UsernameSelector
        config={config}
        currentUsername={username}
        onUsernameChange={(username, isValid) => {
          if (isValid) setUsername(username);
        }}
      />

      <VisibilityToggle
        isPublic={isPublic}
        username={username}
        onVisibilityChange={async (newVisibility) => {
          // Handle visibility change
          setIsPublic(newVisibility);
        }}
      />
    </div>
  );
}
```

## Backend Integration

### Required API Endpoints

#### Public Portfolio Access

```typescript
// GET /api/public/portfolio/{username}
// Returns: PortfolioData | null (404 if private/not found)
```

#### Authenticated Portfolio Access

```typescript
// GET /api/portfolio
// Headers: Authorization: Bearer {token}
// Returns: PortfolioData | null
```

#### Username Management

```typescript
// GET /api/public/username/{username}/available
// Returns: { available: boolean, reason?: string }

// PUT /api/settings/username
// Body: { username: string }
// Headers: Authorization: Bearer {token}

// PUT /api/settings/visibility
// Body: { is_public: boolean }
// Headers: Authorization: Bearer {token}
```

### Backend Schema

The backend should use this schema structure:

```python
# Python/Pydantic example
class PersonalInfo(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    profiles: Optional[List[Profile]] = Field(default_factory=list)

class Profile(BaseModel):
    type: Optional[str] = None  # 'github', 'linkedin', etc.
    url: Optional[str] = None
    label: Optional[str] = None
    profile_photo_url: Optional[str] = None

class PortfolioData(BaseModel):
    personal_info: Optional[PersonalInfo] = None
    work_experiences: Optional[List[WorkExperience]] = None
    projects: Optional[List[Project]] = None
    education: Optional[List[Education]] = None
    # ... other fields
```

## JSON File Structure

For JSON mode or hybrid fallback, create a file matching the backend schema:

```json
{
  "personal_info": {
    "full_name": "John Doe",
    "headline": "Software Engineer",
    "location": "San Francisco, CA",
    "profiles": [
      {
        "type": "github",
        "url": "https://github.com/johndoe",
        "label": "GitHub Profile"
      }
    ]
  },
  "projects": [
    {
      "name": "Awesome Project",
      "role": "Lead Developer",
      "highlights": ["Built with React", "Deployed to AWS"],
      "technologies": ["React", "Node.js"],
      "github": "https://github.com/johndoe/awesome-project"
    }
  ],
  "work_experiences": [
    {
      "organization": "Tech Corp",
      "title": "Senior Engineer",
      "start_date": { "month": 1, "year": 2020 },
      "end_date": { "month": 12, "year": 2023 },
      "highlights": ["Led team of 5", "Improved performance by 40%"]
    }
  ]
}
```

## Error Handling

### Error Boundaries

Components automatically include error boundaries:

```tsx
import { PortfolioErrorBoundary } from "@portfolioly/template-components";

<PortfolioErrorBoundary fallbackData={exampleData}>
  <ChatPortfolio />
</PortfolioErrorBoundary>;
```

### Custom Error Handling

```tsx
function Portfolio() {
  const { portfolioData, error, refetch } = usePortfolioData();

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    );
  }

  return <ChatPortfolio portfolioData={portfolioData} />;
}
```

## Development & Debugging

### Debug Logging

```tsx
const config: TemplateConfig = {
  enableDebugLogging: true,
  // ... other config
};

// View logs in browser console
```

### Component Flagging

Components that require external data are automatically flagged:

```tsx
import { logFlaggedComponents } from "@portfolioly/template-components";

// In development, log all flagged components
logFlaggedComponents({
  ChatPortfolio,
  TraditionalPortfolio,
  // ... other components
});
```

### Performance Monitoring

```tsx
import { performanceMonitor } from "@portfolioly/template-components";

// Monitor data loading performance
performanceMonitor.startTimer("portfolio-load");
// ... load data
const loadTime = performanceMonitor.endTimer("portfolio-load");
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import type {
  TemplateConfig,
  PortfolioData,
  BackendPortfolioData,
  DataProvider,
  ComponentDataRequirements,
} from "@portfolioly/template-components";
```

## Best Practices

### 1. Use Server-Side Rendering for Public Portfolios

```tsx
// Better SEO and performance
export async function getServerSideProps({ params }) {
  return getServerSidePortfolioProps(config, params.username);
}
```

### 2. Implement Proper Caching

```tsx
const config: TemplateConfig = {
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};
```

### 3. Provide JSON Fallbacks

```tsx
const config: TemplateConfig = {
  dataSource: "hybrid", // API with JSON fallback
  jsonFiles: {
    portfolioData: "/data/portfolio.json",
  },
};
```

### 4. Handle Loading States

```tsx
<ChatPortfolio portfolioData={data} isLoading={isLoading} error={error} />
```

### 5. Use Error Boundaries

```tsx
<PortfolioErrorBoundary>
  <ChatPortfolio />
</PortfolioErrorBoundary>
```

## Migration Guide

### From Static to Dynamic

1. **Update imports:**

```tsx
// Before
import { ChatPortfolio } from "@portfolioly/template-components";

// After
import {
  ChatPortfolio,
  HydrationProvider,
  TemplateConfig,
} from "@portfolioly/template-components";
```

2. **Add configuration:**

```tsx
const config: TemplateConfig = {
  dataSource: "api",
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
  },
};
```

3. **Wrap with provider:**

```tsx
<HydrationProvider config={config}>
  <ChatPortfolio />
</HydrationProvider>
```

4. **Update props:**

```tsx
// Before
<ChatPortfolio portfolioData={staticData} />

// After (data comes from provider)
<ChatPortfolio />
```

## Troubleshooting

### Common Issues

1. **"No data provider found"**

   - Ensure components are wrapped with `HydrationProvider`

2. **"Failed to fetch portfolio data"**

   - Check API endpoint configuration
   - Verify backend is running and accessible

3. **"Username already taken"**

   - Implement proper error handling for username conflicts

4. **Components showing dummy data**
   - Check `enableDummyData` configuration
   - Verify API responses match expected schema

### Debug Tools

```tsx
import { generateDebugReport } from "@portfolioly/template-components";

const debugInfo = generateDebugReport(config, portfolioData);
console.log("Debug Report:", debugInfo);
```
