# Design Document

## Overview

This design outlines the architecture for consolidating duplicate portfolio schema definitions into a unified `@portfolioly/schema` package. The package will use Zod for runtime validation and type inference, providing two distinct type systems:

1. **Backend-Aligned Types**: Structured data matching Python Pydantic models (with `DateInfo` objects, snake_case fields)
2. **Display Format Types**: Flattened, string-based data optimized for UI components (formatted date strings, camelCase fields)

The package eliminates manual type definitions and provides validated transformations between these formats.

## Architecture

### Package Structure

```
packages/schema/
├── src/
│   ├── index.ts                    # Main entry point, re-exports all public APIs
│   ├── schemas/
│   │   ├── core.ts                 # Core Zod schemas (DateInfo, Profile, etc.)
│   │   ├── personal.ts             # PersonalInfo schema
│   │   ├── work.ts                 # WorkExperience schema
│   │   ├── project.ts              # Project and ProjectImage schemas
│   │   ├── education.ts            # Education schema
│   │   ├── certification.ts        # Certification schema
│   │   ├── metadata.ts             # PortfolioMetadata and LayoutSettings schemas
│   │   └── portfolio.ts            # Root PortfolioData schema
│   ├── types/
│   │   ├── backend.ts              # Backend-aligned types (inferred from Zod)
│   │   └── display.ts              # Display format types for UI components
│   ├── transformers/
│   │   ├── date-formatter.ts       # DateInfo to string formatting
│   │   ├── profile-mapper.ts       # Profile to SocialLink mapping
│   │   ├── backend-to-display.ts   # Main transformation function
│   │   └── validators.ts           # Validation utilities
│   └── utils/
│       ├── constants.ts            # Shared constants (month names, etc.)
│       └── errors.ts               # Custom error classes
├── package.json
├── tsconfig.json
├── vite.config.ts                  # Build configuration
└── README.md
```

### Dependency Graph

```
Main App (apps/main)
    ↓ imports
@portfolioly/schema
    ↑ imports
Template Components (packages/template-components)
```

Both `apps/main` and `packages/template-components` will depend on `@portfolioly/schema`, eliminating circular dependencies and duplication.

## Components and Interfaces

### 1. Core Zod Schemas

#### DateInfo Schema

```typescript
import { z } from "zod";

export const DateInfoSchema = z
  .object({
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
  })
  .optional();

export type DateInfo = z.infer<typeof DateInfoSchema>;
```

#### ProfileType Schema

```typescript
export const ProfileTypeSchema = z.enum([
  "linkedin",
  "github",
  "website",
  "portfolio",
  "youtube",
  "twitter",
  "scholar",
  "other",
]);

export type ProfileType = z.infer<typeof ProfileTypeSchema>;
```

#### Profile Schema

```typescript
export const ProfileSchema = z.object({
  type: ProfileTypeSchema.optional(),
  url: z.string().url().optional(),
  label: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
```

### 2. Complex Entity Schemas

#### PersonalInfo Schema

```typescript
export const PersonalInfoSchema = z.object({
  full_name: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  profile_photo_url: z.string().url().optional(),
  profiles: z.array(ProfileSchema).optional().default([]),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
```

#### WorkExperience Schema

```typescript
export const WorkExperienceSchema = z.object({
  organization: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().optional(),
  highlights: z.string().optional(), // Markdown string
  technologies: z.array(z.string()).optional().default([]),
  more_context: z.string().optional(),
});

export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
```

#### Project Schema

```typescript
export const ProjectImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(100).optional(),
  order: z.number().int().min(0),
});

export const ProjectSchema = z.object({
  name: z.string().optional(),
  highlights: z.string().optional(), // Markdown string
  technologies: z.array(z.string()).optional().default([]),
  github: z.string().url().optional(),
  live_link: z.string().url().optional(),
  demo_video: z.string().url().optional(),
  more_context: z.string().optional(), // Markdown string
  images: z.array(ProjectImageSchema).optional().default([]),
});

export type ProjectImage = z.infer<typeof ProjectImageSchema>;
export type Project = z.infer<typeof ProjectSchema>;
```

#### Education Schema

```typescript
export const EducationSchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  start_date: DateInfoSchema,
  end_date: DateInfoSchema,
  is_current: z.boolean().optional(),
  location: z.string().optional(),
  grade: z.string().optional(),
});

export type Education = z.infer<typeof EducationSchema>;
```

### 3. Root Portfolio Schema

```typescript
export const LayoutSettingsSchema = z.object({
  layout_mode: z
    .enum(["chat-only", "traditional-only", "both"])
    .optional()
    .default("both"),
  default_layout: z.enum(["chat", "traditional"]).optional().default("chat"),
});

export const PortfolioMetadataSchema = z.object({
  source_type: z.string().optional(),
  extracted_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const TextBlobsSchema = z.object({
  achievements: z.string().optional(), // Markdown string
  additional_context: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string().optional(),
  issuer: z.string().optional(),
  link: z.string().url().optional(),
});

export const PortfolioDataSchema = z.object({
  personal_info: PersonalInfoSchema.optional(),
  work_experiences: z.array(WorkExperienceSchema).optional().default([]),
  projects: z.array(ProjectSchema).optional().default([]),
  education: z.array(EducationSchema).optional().default([]),
  certifications: z.array(CertificationSchema).optional().default([]),
  text_blobs: TextBlobsSchema.optional(),
  metadata: PortfolioMetadataSchema.optional(),
  layout_settings: LayoutSettingsSchema.optional(),
});

export type PortfolioData = z.infer<typeof PortfolioDataSchema>;
```

### 4. Display Format Types

These types represent the flattened, string-based format expected by UI components. They differ from backend types in that dates are formatted strings, nested objects are flattened, and field names match component props.

```typescript
// Social link types for UI display
export type SocialType =
  | "github"
  | "linkedin"
  | "leetcode"
  | "mail"
  | "website"
  | "x"
  | "dribbble"
  | "behance"
  | "link";

export type SocialLink = {
  type: SocialType;
  href: string;
  label?: string;
};

// Display format for UI components
export type DisplayPortfolioProfile = {
  name?: string;
  headline?: string;
  location?: string;
  avatarUrl?: string;
  summary?: string;
  email?: string;
  socials?: SocialLink[];
};

export type DisplayProject = {
  name?: string;
  one_line_description?: string;
  highlights?: string; // Markdown string
  technologies?: string[];
  github?: string;
  live_link?: string;
  demo_video?: string;
  more_context?: string;
  images?: ProjectImage[];
};

export type DisplayEducation = {
  school?: string;
  degree?: string; // Combined degree + branch
  start?: string; // Formatted date string
  end?: string; // Formatted date string or "Present"
  location?: string;
  grade?: string;
};

export type DisplayWorkExperience = {
  companyName?: string;
  role?: string;
  location?: string;
  start?: string; // Formatted date string
  end?: string; // Formatted date string or "Present"
  points?: string; // Markdown string
  technologies?: string[];
};

export type DisplayPortfolioData = {
  profile?: DisplayPortfolioProfile;
  projects: DisplayProject[];
  education: DisplayEducation[];
  experience?: DisplayWorkExperience[];
  skills?: string[];
  achievements?: string[];
  certificates?: string[];
  layout_settings?: {
    layout_mode?: string;
    default_layout?: string;
  };
};
```

## Data Models

### Transformation Flow

```
Backend API Response (unknown)
    ↓
Zod Validation (PortfolioDataSchema.parse)
    ↓
Backend-Aligned Type (PortfolioData)
    ↓
Transformation (mapBackendToDisplay)
    ↓
Display Format Type (DisplayPortfolioData)
    ↓
Template Components Rendering
```

### Transformation Functions

#### Date Formatter

```typescript
export function formatDateInfo(dateInfo?: DateInfo): string {
  if (!dateInfo) return "";

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (dateInfo.year && dateInfo.month) {
    return `${monthNames[dateInfo.month - 1]} ${dateInfo.year}`;
  } else if (dateInfo.year) {
    return dateInfo.year.toString();
  }

  return "";
}
```

#### Profile to Social Mapper

```typescript
const PROFILE_TO_SOCIAL_MAP: Record<ProfileType, SocialType> = {
  linkedin: "linkedin",
  github: "github",
  website: "website",
  portfolio: "website",
  twitter: "x",
  youtube: "link",
  scholar: "link",
  other: "link",
};

export function mapProfilesToSocials(profiles: Profile[] = []): SocialLink[] {
  return profiles
    .filter((profile) => profile.url && profile.type)
    .map((profile) => ({
      type: PROFILE_TO_SOCIAL_MAP[profile.type!] || "link",
      href: profile.url!,
      label: profile.label || profile.type || "Link",
    }));
}
```

#### Entity Mappers

```typescript
export function mapWorkExperience(exp: WorkExperience): DisplayWorkExperience {
  return {
    companyName: exp.organization,
    role: exp.title,
    location: exp.location,
    start: formatDateInfo(exp.start_date),
    end: exp.is_current ? "Present" : formatDateInfo(exp.end_date),
    points: exp.highlights,
    technologies: exp.technologies,
  };
}

export function mapProject(project: Project): DisplayProject {
  // Extract first line from highlights for one_line_description
  const getFirstLine = (highlights?: string): string | undefined => {
    if (!highlights) return undefined;
    const lines = highlights.split("\n").filter((line) => line.trim());
    return lines[0]?.replace(/^[-*+]\s+/, "").trim() || undefined;
  };

  return {
    name: project.name,
    one_line_description: getFirstLine(project.highlights),
    highlights: project.highlights,
    technologies: project.technologies,
    github: project.github,
    live_link: project.live_link,
    demo_video: project.demo_video,
    more_context: project.more_context,
    images: project.images,
  };
}

export function mapEducation(edu: Education): DisplayEducation {
  // Combine degree and branch
  const degreeParts = [edu.degree, edu.branch].filter(Boolean);
  const degree =
    degreeParts.length > 1
      ? `${degreeParts[0]} in ${degreeParts[1]}`
      : degreeParts[0];

  return {
    school: edu.institution,
    degree,
    start: formatDateInfo(edu.start_date),
    end: edu.is_current ? "Present" : formatDateInfo(edu.end_date),
    location: edu.location,
    grade: edu.grade,
  };
}
```

#### Main Transformation Function

```typescript
export function mapBackendToDisplay(
  backendData: PortfolioData
): DisplayPortfolioData {
  const personalInfo = backendData.personal_info || {};

  // Extract skills from technologies across work and projects
  const skills = new Set<string>();
  backendData.work_experiences?.forEach((exp) => {
    exp.technologies?.forEach((tech) => skills.add(tech));
  });
  backendData.projects?.forEach((project) => {
    project.technologies?.forEach((tech) => skills.add(tech));
  });

  return {
    profile: {
      name: personalInfo.full_name,
      headline: personalInfo.headline,
      location: personalInfo.location,
      email: personalInfo.email,
      summary: personalInfo.summary,
      avatarUrl: personalInfo.profile_photo_url,
      socials: mapProfilesToSocials(personalInfo.profiles),
    },
    projects: (backendData.projects || []).map(mapProject),
    education: (backendData.education || []).map(mapEducation),
    experience: (backendData.work_experiences || []).map(mapWorkExperience),
    skills: Array.from(skills),
    achievements: backendData.text_blobs?.achievements
      ? [backendData.text_blobs.achievements]
      : [],
    certificates: (backendData.certifications || [])
      .map((cert) => {
        const parts = [cert.name, cert.issuer].filter(Boolean);
        return parts.length > 0 ? parts.join(" - ") : "";
      })
      .filter(Boolean),
    layout_settings: backendData.layout_settings,
  };
}
```

### Validation Utilities

```typescript
export class SchemaValidationError extends Error {
  constructor(message: string, public readonly zodError: z.ZodError) {
    super(message);
    this.name = "SchemaValidationError";
  }

  getFieldErrors(): Record<string, string[]> {
    return this.zodError.flatten().fieldErrors;
  }
}

export function validatePortfolioData(data: unknown): PortfolioData {
  const result = PortfolioDataSchema.safeParse(data);

  if (!result.success) {
    throw new SchemaValidationError(
      "Portfolio data validation failed",
      result.error
    );
  }

  return result.data;
}

export function validatePortfolioDataSafe(
  data: unknown
):
  | { success: true; data: PortfolioData }
  | { success: false; error: z.ZodError } {
  const result = PortfolioDataSchema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}
```

## Error Handling

### Validation Error Handling

1. **API Layer**: Catch validation errors and return user-friendly messages
2. **Component Layer**: Display field-level errors in forms
3. **Logging**: Log full Zod error details for debugging

```typescript
// Example API client usage
export async function fetchPortfolio(userId: string): Promise<PortfolioData> {
  try {
    const response = await fetch(`/api/portfolio/${userId}`);
    const data = await response.json();

    // Validate with Zod
    return validatePortfolioData(data);
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      console.error("Validation errors:", error.getFieldErrors());
      throw new Error("Invalid portfolio data received from server");
    }
    throw error;
  }
}
```

### Transformation Error Handling

```typescript
export function mapBackendToDisplaySafe(
  backendData: unknown
):
  | { success: true; data: DisplayPortfolioData }
  | { success: false; error: Error } {
  try {
    // First validate
    const validated = validatePortfolioData(backendData);
    // Then transform
    const display = mapBackendToDisplay(validated);
    return { success: true, data: display };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Unknown transformation error"),
    };
  }
}
```

## Testing Strategy

### Unit Tests

1. **Schema Validation Tests** (`schemas/*.test.ts`)

   - Valid data passes validation
   - Invalid data fails with correct error messages
   - Optional fields work correctly
   - Default values are applied
   - URL validation works
   - Date range validation works

2. **Transformation Tests** (`transformers/*.test.ts`)

   - Date formatting handles all cases (month+year, year only, missing)
   - Profile to social mapping handles all profile types
   - Work experience mapping preserves all fields
   - Project mapping extracts first line correctly
   - Education mapping combines degree and branch
   - Skills extraction deduplicates correctly

3. **Validator Tests** (`utils/validators.test.ts`)
   - validatePortfolioData throws on invalid data
   - validatePortfolioDataSafe returns correct result shape
   - SchemaValidationError provides field errors

### Integration Tests

1. **Main App Integration**

   - API client validates responses correctly
   - Portfolio editor loads and saves data
   - Type inference works in IDE

2. **Template Components Integration**
   - Components render with transformed data
   - No visual regressions
   - All portfolio sections display correctly

### Migration Tests

1. **Backward Compatibility**
   - Existing data mapper tests pass with new utilities
   - All existing components work without changes
   - No breaking changes in public APIs

## Migration Plan

### Phase 1: Create Schema Package

1. Create `packages/schema` directory structure
2. Set up build configuration (Vite + TypeScript)
3. Add Zod dependency
4. Implement core Zod schemas
5. Implement display format types
6. Implement transformation utilities
7. Write comprehensive tests
8. Build and verify package exports

### Phase 2: Migrate Template Components

1. Add `@portfolioly/schema` dependency
2. Update imports to use shared schema
3. Remove local `types/portfolio.ts`
4. Remove local `utils/data-mapper.ts`
5. Update components to use new transformation utilities
6. Run tests and fix any issues
7. Verify build succeeds

### Phase 3: Migrate Main App

1. Add `@portfolioly/schema` dependency
2. Update imports to use shared schema
3. Remove local `types/portfolio.ts`
4. Remove local `utils/portfolioDataMapper.ts`
5. Update API clients to use Zod validation
6. Update components to use new transformation utilities
7. Run tests and fix any issues
8. Verify build succeeds

### Phase 4: Validation & Testing

1. Run full test suite
2. Test portfolio editing flow end-to-end
3. Test portfolio viewing flow end-to-end
4. Verify no visual regressions
5. Test API error handling
6. Performance testing

### Phase 5: Documentation & Cleanup

1. Write package README
2. Add JSDoc comments to all exports
3. Create migration guide
4. Update main documentation
5. Remove deprecated code
6. Final review and merge

## Performance Considerations

1. **Bundle Size**: Zod adds ~14KB gzipped, acceptable for the benefits
2. **Validation Performance**: Zod validation is fast (<1ms for typical portfolio data)
3. **Tree Shaking**: Proper exports ensure unused code is eliminated
4. **Build Time**: Minimal impact, schema package builds in <2s

## Security Considerations

1. **URL Validation**: All URL fields validated with Zod's `.url()` method
2. **Email Validation**: Email fields validated with Zod's `.email()` method
3. **String Length Limits**: Caption fields limited to 100 characters
4. **Unknown Field Stripping**: Zod strips unknown fields by default (`.strict()` not used)
5. **XSS Prevention**: Markdown fields should be sanitized before rendering (handled by components)

## Backward Compatibility

1. **Display Types**: All existing template component types preserved with new names
2. **Optional Fields**: All fields remain optional to match current behavior
3. **Default Values**: Arrays default to `[]` to prevent undefined errors
4. **Gradual Migration**: Both apps can migrate independently

## Future Enhancements

1. **Stricter Validation**: Add `.strict()` mode for production validation
2. **Custom Validators**: Add business logic validators (e.g., end_date > start_date)
3. **Schema Versioning**: Support multiple schema versions for API evolution
4. **OpenAPI Generation**: Generate OpenAPI specs from Zod schemas
5. **Form Generation**: Auto-generate forms from Zod schemas
