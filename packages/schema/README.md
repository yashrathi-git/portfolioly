# @portfolioly/schema

Unified portfolio schema package with Zod validation for the Portfolioly monorepo.

## Overview

`@portfolioly/schema` provides a single source of truth for portfolio data structures across the entire application. It eliminates duplicate type definitions and provides runtime validation using Zod.

### Key Features

- **Type-Safe Schemas**: Zod schemas that match backend Pydantic models exactly
- **Runtime Validation**: Catch data inconsistencies at runtime with detailed error messages
- **Automatic Type Inference**: TypeScript types automatically generated from Zod schemas
- **Data Transformation**: Utilities to convert between backend and display formats
- **Zero Duplication**: Single schema definition shared across frontend and backend
- **Tree-Shakeable**: ESM/CJS dual output with proper tree-shaking support

## Installation

This package is part of the Portfolioly monorepo and is automatically linked via Yarn workspaces.

```bash
# In your app's package.json
{
  "dependencies": {
    "@portfolioly/schema": "workspace:*"
  }
}
```

Then run:

```bash
yarn install
```

## Architecture

The package provides two distinct type systems:

### 1. Backend-Aligned Types

Structured data matching Python Pydantic models with:

- `DateInfo` objects (structured month/year)
- snake_case field names
- Nested structures

### 2. Display Format Types

Flattened, string-based data optimized for UI components with:

- Formatted date strings ("Jan 2020")
- camelCase field names
- Flattened structures

## Usage

### Basic Schema Validation

Validate API responses to ensure data integrity:

```typescript
import { validatePortfolioData, type PortfolioData } from "@portfolioly/schema";

async function fetchPortfolio(userId: string): Promise<PortfolioData> {
  const response = await fetch(`/api/portfolio/${userId}`);
  const data = await response.json();

  // Validates and returns typed data
  return validatePortfolioData(data);
}
```

### Safe Validation (No Exceptions)

Use safe validation when you want to handle errors without try-catch:

```typescript
import { validatePortfolioDataSafe } from "@portfolioly/schema";

const result = validatePortfolioDataSafe(apiResponse);

if (result.success) {
  // result.data is typed as PortfolioData
  console.log(result.data.personal_info?.full_name);
} else {
  // result.error is a ZodError with detailed issues
  console.error("Validation failed:", result.error.issues);
}
```

### Data Transformation

Transform backend data to display format for UI components:

```typescript
import {
  validatePortfolioData,
  mapBackendToDisplay,
  type DisplayPortfolioData,
} from "@portfolioly/schema";

// Validate backend data
const backendData = validatePortfolioData(apiResponse);

// Transform to display format
const displayData: DisplayPortfolioData = mapBackendToDisplay(backendData);

// Use in components
console.log(displayData.profile?.name);
console.log(displayData.experience?.[0]?.start); // "Jan 2020"
console.log(displayData.skills); // ["React", "TypeScript", ...]
```

### Error Handling

Handle validation errors with detailed field-level information:

```typescript
import {
  validatePortfolioData,
  SchemaValidationError,
} from "@portfolioly/schema";

try {
  const portfolio = validatePortfolioData(invalidData);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    // Get field-level errors
    const fieldErrors = error.getFieldErrors();

    // Example output:
    // {
    //   "personal_info.email": ["Invalid email"],
    //   "work_experiences.0.start_date.month": ["Number must be between 1 and 12"]
    // }

    console.error("Validation errors:", fieldErrors);
  }
}
```

### Individual Entity Transformations

Transform individual entities when needed:

```typescript
import {
  mapWorkExperience,
  mapProject,
  mapEducation,
  type WorkExperience,
  type DisplayWorkExperience,
} from "@portfolioly/schema";

const workExp: WorkExperience = {
  organization: "Tech Corp",
  title: "Senior Engineer",
  start_date: { month: 1, year: 2020 },
  end_date: { month: 12, year: 2022 },
  technologies: ["React", "Node.js"],
};

const displayExp: DisplayWorkExperience = mapWorkExperience(workExp);
// {
//   companyName: "Tech Corp",
//   role: "Senior Engineer",
//   start: "Jan 2020",
//   end: "Dec 2022",
//   technologies: ["React", "Node.js"]
// }
```

### Date Formatting

Format date objects to human-readable strings:

```typescript
import { formatDateInfo, type DateInfo } from "@portfolioly/schema";

const date1: DateInfo = { month: 1, year: 2020 };
formatDateInfo(date1); // "Jan 2020"

const date2: DateInfo = { year: 2020 };
formatDateInfo(date2); // "2020"

formatDateInfo(undefined); // ""
```

### Profile to Social Link Mapping

Convert backend profiles to UI-friendly social links:

```typescript
import {
  mapProfilesToSocials,
  type Profile,
  type SocialLink,
} from "@portfolioly/schema";

const profiles: Profile[] = [
  { type: "github", url: "https://github.com/user", label: "GitHub" },
  { type: "linkedin", url: "https://linkedin.com/in/user" },
  { type: "twitter", url: "https://twitter.com/user" },
];

const socials: SocialLink[] = mapProfilesToSocials(profiles);
// [
//   { type: "github", href: "https://github.com/user", label: "GitHub" },
//   { type: "linkedin", href: "https://linkedin.com/in/user", label: "linkedin" },
//   { type: "x", href: "https://twitter.com/user", label: "twitter" }
// ]
```

## API Reference

### Schemas

#### Core Schemas

- `DateInfoSchema` - Date with optional month and year
- `ProfileTypeSchema` - Enum of profile types
- `ProfileSchema` - Social/professional profile link

#### Entity Schemas

- `PersonalInfoSchema` - Personal information and contact details
- `WorkExperienceSchema` - Work experience entry
- `ProjectSchema` - Project information
- `ProjectImageSchema` - Project image with caption
- `EducationSchema` - Education entry
- `CertificationSchema` - Certification information

#### Metadata Schemas

- `TextBlobsSchema` - Unstructured text data
- `LayoutSettingsSchema` - Portfolio layout preferences
- `PortfolioMetadataSchema` - Extraction metadata

#### Root Schema

- `PortfolioDataSchema` - Complete portfolio data structure

### Types

#### Backend-Aligned Types

All types are inferred from Zod schemas:

- `DateInfo`, `ProfileType`, `Profile`
- `PersonalInfo`, `WorkExperience`, `Project`, `ProjectImage`
- `Education`, `Certification`
- `TextBlobs`, `LayoutSettings`, `PortfolioMetadata`
- `PortfolioData` (root type)

#### Display Format Types

- `SocialType`, `SocialLink`
- `DisplayPortfolioProfile`
- `DisplayProject`
- `DisplayEducation`
- `DisplayWorkExperience`
- `DisplayPortfolioData` (root display type)

### Transformation Functions

- `formatDateInfo(dateInfo?: DateInfo): string` - Format date to string
- `mapProfilesToSocials(profiles: Profile[]): SocialLink[]` - Convert profiles to social links
- `mapWorkExperience(exp: WorkExperience): DisplayWorkExperience` - Transform work experience
- `mapProject(project: Project): DisplayProject` - Transform project
- `mapEducation(edu: Education): DisplayEducation` - Transform education
- `mapBackendToDisplay(data: PortfolioData): DisplayPortfolioData` - Main transformation function

### Validation Functions

- `validatePortfolioData(data: unknown): PortfolioData` - Validate and return typed data (throws on error)
- `validatePortfolioDataSafe(data: unknown): Result` - Validate without throwing
- `SchemaValidationError` - Custom error class with `getFieldErrors()` method

## Examples

### Complete API Client Example

```typescript
import {
  validatePortfolioData,
  mapBackendToDisplay,
  SchemaValidationError,
  type PortfolioData,
  type DisplayPortfolioData,
} from "@portfolioly/schema";

export class PortfolioApiClient {
  async fetchPortfolio(userId: string): Promise<DisplayPortfolioData> {
    try {
      const response = await fetch(`/api/portfolio/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate backend data
      const validated: PortfolioData = validatePortfolioData(data);

      // Transform to display format
      return mapBackendToDisplay(validated);
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        console.error("Invalid portfolio data:", error.getFieldErrors());
        throw new Error("Received invalid data from server");
      }
      throw error;
    }
  }
}
```

### Form Validation Example

```typescript
import { PersonalInfoSchema, type PersonalInfo } from "@portfolioly/schema";

function validatePersonalInfoForm(formData: unknown): PersonalInfo {
  const result = PersonalInfoSchema.safeParse(formData);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;

    // Display errors in form
    if (errors.email) {
      showFieldError("email", errors.email[0]);
    }
    if (errors.profile_photo_url) {
      showFieldError("profile_photo_url", errors.profile_photo_url[0]);
    }

    throw new Error("Form validation failed");
  }

  return result.data;
}
```

## Development

### Building the Package

```bash
# Build once
yarn workspace @portfolioly/schema build

# Watch mode
yarn workspace @portfolioly/schema watch
```

### Type Checking

```bash
yarn workspace @portfolioly/schema type-check
```

## Migration Guide

### From Local Types

If you're migrating from local type definitions:

**Before:**

```typescript
import { PortfolioData } from "../types/portfolio";
import { mapBackendToFrontend } from "../utils/data-mapper";
```

**After:**

```typescript
import { type PortfolioData, mapBackendToDisplay } from "@portfolioly/schema";
```

### Key Changes

1. **Function Rename**: `mapBackendToFrontend` → `mapBackendToDisplay`
2. **Import Path**: Local imports → `@portfolioly/schema`
3. **Validation**: Add runtime validation with `validatePortfolioData`
4. **Error Handling**: Use `SchemaValidationError` for validation errors

## Best Practices

### 1. Always Validate API Responses

```typescript
// ✅ Good
const data = validatePortfolioData(apiResponse);

// ❌ Bad - no validation
const data = apiResponse as PortfolioData;
```

### 2. Use Safe Validation for User Input

```typescript
// ✅ Good - handles errors gracefully
const result = validatePortfolioDataSafe(userInput);
if (!result.success) {
  showErrors(result.error);
}

// ❌ Bad - throws exceptions for user errors
try {
  const data = validatePortfolioData(userInput);
} catch (error) {
  // User errors shouldn't throw
}
```

### 3. Transform Once, Use Everywhere

```typescript
// ✅ Good - transform at data layer
const displayData = mapBackendToDisplay(backendData);
<Portfolio data={displayData} />

// ❌ Bad - transforming in components
<Portfolio data={backendData} /> // Component has to transform
```

### 4. Leverage Type Inference

```typescript
// ✅ Good - let Zod infer types
import { type PortfolioData } from '@portfolioly/schema';

// ❌ Bad - manually defining types
interface PortfolioData { ... }
```

## Troubleshooting

### Build Errors

If you encounter build errors after adding the dependency:

```bash
# Clean and rebuild
yarn clean
yarn build
```

### Type Errors

If TypeScript can't find types:

```bash
# Ensure package is built
yarn workspace @portfolioly/schema build

# Restart TypeScript server in your IDE
```

### Validation Errors

If validation fails unexpectedly:

```typescript
// Log the full error details
const result = validatePortfolioDataSafe(data);
if (!result.success) {
  console.log(
    "Validation issues:",
    JSON.stringify(result.error.issues, null, 2)
  );
}
```

## Contributing

When adding new fields or schemas:

1. Update the Zod schema in `src/schemas/`
2. Add JSDoc comments with examples
3. Update transformation functions if needed
4. Add tests for new functionality
5. Update this README with examples

## License

Part of the Portfolioly monorepo.
