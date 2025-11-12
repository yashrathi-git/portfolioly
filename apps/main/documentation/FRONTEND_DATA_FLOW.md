# Frontend Data Flow Documentation

## Overview

This document explains how portfolio data flows through the frontend application, from API requests to component rendering. The system uses a two-stage transformation approach with strong type safety throughout.

## Architecture Diagram

```
Backend API (FastAPI)
    ↓ JSON Response
API Client Layer (portfolio.ts)
    ↓ Firebase Auth + Fetch
Zod Validation (@portfolioly/schema)
    ↓ PortfolioData type
Transformation Layer (mapBackendToDisplay)
    ↓ DisplayPortfolioData type
React Components
    ↓ Props drilling
UI Rendering (Template Components)
```

## Data Flow Stages

### 1. Backend API Response

**Endpoint**: `GET /portfolio/`  
**Authentication**: Firebase ID Token (Bearer)

The backend returns raw JSON matching the Pydantic schema:

```json
{
  "personal_info": {
    "full_name": "John Doe",
    "headline": "Senior Software Engineer",
    "email": "john@example.com",
    "profile_photo_url": "https://...",
    "profiles": [{ "type": "github", "url": "https://github.com/johndoe" }],
    "tags": ["React", "TypeScript"]
  },
  "work_experiences": [
    {
      "organization": "Tech Corp",
      "title": "Senior Engineer",
      "start_date": { "month": 1, "year": 2020 },
      "end_date": { "month": 12, "year": 2022 },
      "is_current": false,
      "highlights": "- Led team of 5\n- Built features",
      "technologies": ["React", "Node.js"],
      "logo_url": "https://..."
    }
  ],
  "projects": [
    {
      "name": "My App",
      "highlights": "- Built web app\n- Used React",
      "technologies": ["React", "TypeScript"],
      "github": "https://github.com/...",
      "images": []
    }
  ],
  "education": [
    {
      "institution": "MIT",
      "degree": "Bachelor of Science",
      "branch": "Computer Science",
      "start_date": { "year": 2016 },
      "end_date": { "year": 2020 }
    }
  ]
}
```

### 2. API Client Layer

**Location**: `src/lib/api/portfolio.ts`

The API client handles:

- Firebase authentication token retrieval
- HTTP request/response handling
- Error handling and retry logic
- Type-safe response parsing

```typescript
// Fetch portfolio with authentication
export async function getUserPortfolio(): Promise<PortfolioData | null> {
  const headers = await getAuthHeaders(); // Gets Firebase token
  const response = await fetch(`${API_BASE_URL}/portfolio/`, {
    method: "GET",
    headers,
  });
  return await handleResponse<PortfolioData | null>(response);
}
```

### 3. React Hook Layer

**Location**: `src/hooks/useAuthenticatedPortfolio.ts`

Manages state and provides data to components:

```typescript
export function useAuthenticatedPortfolio() {
  const { user } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const portfolioData = await getUserPortfolio();
      setData(portfolioData);
    }
  }, [user]);

  return { data, isLoading, error, refetch };
}
```

### 4. Schema Validation

**Package**: `@portfolioly/schema`  
**Location**: `packages/schema/src/schemas/`

Zod schemas validate the backend response at runtime:

```typescript
// Validates structure and types
const PortfolioDataSchema = z.object({
  personal_info: PersonalInfoSchema,
  work_experiences: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
  // ...
});

export type PortfolioData = z.infer<typeof PortfolioDataSchema>;
```

**Key Features**:

- Runtime type checking
- Automatic type inference
- Preprocessing for flexible input (arrays, dates, nulls)
- Graceful error handling with `.catch()` defaults

### 5. Data Transformation

**Location**: `packages/schema/src/transformers/backend-to-display.ts`

Transforms backend format to UI-optimized display format:

```typescript
export function mapBackendToDisplay(
  backendData: PortfolioData
): DisplayPortfolioData {
  return {
    profile: {
      name: personalInfo?.full_name,
      headline: personalInfo?.headline,
      avatarUrl: personalInfo?.profile_photo_url,
      socials: mapProfilesToSocials(personalInfo?.profiles),
      tags: personalInfo?.tags,
    },
    experience: work_experiences.map(mapWorkExperience),
    projects: projects.map(mapProject),
    education: education.map(mapEducation),
    skills: extractAndDeduplicateSkills(work_experiences, projects),
    certificates: formatCertifications(certifications),
  };
}
```

### 6. Entity Transformations

#### Work Experience Transformation

```typescript
// Input (Backend)
{
  organization: "Tech Corp",
  title: "Senior Engineer",
  start_date: {month: 1, year: 2020},
  end_date: {month: 12, year: 2022},
  is_current: false,
  highlights: "- Led team\n- Built features",
  technologies: ["React", "Node.js"]
}

// Output (Display)
{
  companyName: "Tech Corp",        // Renamed
  role: "Senior Engineer",         // Renamed
  start: "Jan 2020",              // Formatted
  end: "Dec 2022",                // Formatted
  points: "- Led team\n- Built features", // Renamed
  technologies: ["React", "Node.js"]
}
```

#### Project Transformation

```typescript
// Input
{
  name: "My App",
  card_image_url: "https://storage.azure.com/card.webp",
  highlights: "- Built web app\n- Used React\n- Deployed to AWS",
  images: [{url: "https://storage.azure.com/img1.webp", order: 0}]
}

// Output
{
  name: "My App",
  cardImageUrl: "https://storage.azure.com/card.webp", // Mapped!
  one_line_description: "Built web app", // Extracted first line!
  highlights: "- Built web app\n- Used React\n- Deployed to AWS",
  images: [{url: "https://storage.azure.com/img1.webp", order: 0}]
}
```

#### Education Transformation

```typescript
// Input
{
  institution: "MIT",
  degree: "Bachelor of Science",
  branch: "Computer Science",
  start_date: {year: 2016},
  end_date: {year: 2020}
}

// Output
{
  school: "MIT",                                    // Renamed
  degree: "Bachelor of Science in Computer Science", // Combined!
  start: "2016",
  end: "2020"
}
```

#### Profile to Social Links

```typescript
// Input
profiles: [
  { type: "github", url: "https://github.com/user" },
  { type: "twitter", url: "https://twitter.com/user" },
];

// Output
socials: [
  { type: "github", href: "https://github.com/user", label: "github" },
  { type: "x", href: "https://twitter.com/user", label: "twitter" }, // Mapped!
];
```

### 7. Component Integration

#### Portfolio Editor

**Location**: `src/components/edit/PortfolioEditor.tsx`

```typescript
function PortfolioEditor() {
  const { data, isLoading, error } = useAuthenticatedPortfolio();

  // Data flows to form components
  return (
    <>
      <PersonalInfoForm data={data?.personal_info} />
      <WorkExperienceForm data={data?.work_experiences} />
      <ProjectsForm data={data?.projects} />
      <EducationForm data={data?.education} />
    </>
  );
}
```

#### Portfolio Preview

**Location**: `src/components/edit/PortfolioPreview.tsx`

```typescript
function PortfolioPreview({ data }: { data: PortfolioData }) {
  // Transform to display format
  const displayData = useMemo(() => mapBackendToDisplay(data), [data]);

  // Pass to template components
  return <Portfolio portfolioData={displayData} isPreview={true} />;
}
```

#### Public Portfolio Page

**Location**: `src/app/p/[username]/page.tsx`

```typescript
export default function PublicPortfolioPage({ params }) {
  const [data, setData] = useState<PortfolioData | null>(null);

  useEffect(() => {
    const { data: portfolioData } = await fetchPublicPortfolio(params.username);
    setData(portfolioData);
  }, [params.username]);

  const displayData = mapPortfolioDataToTemplate(data);

  return (
    <Portfolio
      portfolioData={displayData}
      isOwner={false}
      username={params.username}
    />
  );
}
```

## Template Components Data Flow

### Traditional Portfolio Layout

```typescript
// packages/template-components/src/components/TraditionalPortfolio.tsx
<TraditionalPortfolio data={displayData}>
  <Hero profile={data.profile} />
  <WorkExperience items={data.experience} />
  <Projects items={data.projects} />
  <Education items={data.education} />
  <Skills items={data.skills} />
</TraditionalPortfolio>
```

### Chat Portfolio Layout

```typescript
// packages/template-components/src/components/ChatPortfolio.tsx
<ChatPortfolio portfolioData={displayData}>
  <Thread portfolioData={displayData}>
    <WorkExperienceWidget items={data.experience} />
    <ProjectsWidget projects={data.projects} />
    <AboutWidget profile={data.profile} skills={data.skills} />
  </Thread>
</ChatPortfolio>
```

### Shared Sections

Both layouts use the same shared section components:

```typescript
// packages/template-components/src/components/shared/WorkExperienceSection.tsx
function WorkExperienceSection({ items, variant }) {
  return items.map((work) => (
    <ResumeCard
      title={work.companyName}
      subtitle={work.role}
      period={`${work.start} - ${work.end}`}
      description={work.points}
      badges={work.technologies}
      logoUrl={work.logoUrl}
    />
  ));
}
```

## Data Update Flow

### Editing Portfolio Data

```
User edits form
    ↓
Form state updates (React state)
    ↓
Save button clicked
    ↓
API call: PUT /portfolio/
    ↓
Backend validates & saves
    ↓
Success response
    ↓
Refetch portfolio data
    ↓
UI updates with new data
```

### Image Upload Flow

```
User selects image
    ↓
Client-side validation (size, type)
    ↓
FormData creation
    ↓
API call: POST /portfolio/profile-photo
    ↓
Backend: Optimize → Upload to Azure → Return URL
    ↓
Update portfolio data with new URL
    ↓
Save portfolio data
    ↓
UI shows new image
```

## Key Files Reference

### API Layer

- `src/lib/api/portfolio.ts` - Portfolio CRUD operations
- `src/lib/api/publicPortfolio.ts` - Public portfolio fetching
- `src/lib/api/upload.ts` - File upload operations

### Hooks

- `src/hooks/useAuthenticatedPortfolio.ts` - Authenticated data fetching
- `src/hooks/useUpload.ts` - Upload workflow management

### Schema Package

- `packages/schema/src/schemas/portfolio.ts` - Root schema
- `packages/schema/src/transformers/backend-to-display.ts` - Main transformer
- `packages/schema/src/transformers/entity-mappers.ts` - Entity transformers
- `packages/schema/src/types/display.ts` - Display type definitions

### Components

- `src/components/edit/PortfolioEditor.tsx` - Main editor
- `src/components/edit/PortfolioPreview.tsx` - Live preview
- `src/app/p/[username]/page.tsx` - Public portfolio page

## Type Safety

The entire data flow is type-safe:

```typescript
// Backend response → Validated type
PortfolioData (Zod validated)
    ↓
// Transformation → Display type
DisplayPortfolioData (TypeScript inferred)
    ↓
// Component props → Typed props
DisplayWorkExperience[] | DisplayProject[] | etc.
```

TypeScript ensures:

- No runtime type errors
- Autocomplete in IDEs
- Refactoring safety
- Clear data contracts

## Error Handling

### API Errors

```typescript
try {
  const data = await getUserPortfolio();
} catch (error) {
  if (error instanceof PortfolioAPIError) {
    // Handle specific API errors
    if (error.status === 401) {
      // Redirect to login
    } else if (error.status >= 500) {
      // Show server error message
    }
  }
}
```

### Validation Errors

```typescript
try {
  const validated = validatePortfolioData(rawData);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    const fieldErrors = error.getFieldErrors();
    // Show field-specific errors in forms
  }
}
```

## Performance Optimizations

1. **Memoization**: Transform data only when source changes

   ```typescript
   const displayData = useMemo(() => mapBackendToDisplay(data), [data]);
   ```

2. **Lazy Loading**: Dynamic imports for heavy components

   ```typescript
   const Portfolio = dynamic(() => import("@portfolioly/template-components"));
   ```

3. **Caching**: React Query or SWR for data caching (future enhancement)

## Best Practices

1. **Always validate API responses** using Zod schemas
2. **Transform data at the boundary** (API → Component)
3. **Use TypeScript types** for all data structures
4. **Handle loading and error states** in components
5. **Memoize expensive transformations** with useMemo
6. **Keep components pure** - no data transformation in render

## Debugging Tips

1. **Check network tab** for API responses
2. **Use React DevTools** to inspect component props
3. **Add console.logs** in transformation functions
4. **Validate data shape** with Zod's `.safeParse()`
5. **Check error boundaries** for caught errors

## Future Enhancements

- Real-time data synchronization with WebSockets
- Optimistic UI updates for better UX
- Data caching with React Query
- Offline support with service workers
- GraphQL for more efficient data fetching
