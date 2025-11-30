# Design Document

## Overview

The portfolio edit page is a protected route that provides authenticated users with a comprehensive interface to manage their portfolio data. The page combines form-based editing with real-time preview capabilities, leveraging existing components and Firebase for data persistence.

## Architecture

### Route Protection

- The edit page is a protected route requiring user authentication
- Uses existing auth middleware and route guards
- Redirects unauthenticated users to sign-in page
- Integrates with Firebase Auth for user session management

### Component Structure

```
/edit (Protected Route)
├── PortfolioEditPage (Main container)
├── PortfolioEditor (Form sections)
│   ├── PersonalInfoForm
│   ├── ProfilesForm
│   ├── WorkExperienceForm
│   ├── ProjectsForm
│   ├── EducationForm
│   ├── CertificationsForm
│   └── TextBlobForm
└── PortfolioPreview (ChatPortfolio integration)
```

### Data Flow

1. User authentication verification
2. Fetch existing portfolio data from Firebase
3. Populate forms with existing data (all fields optional)
4. Real-time local state updates during editing
5. Persist changes to Firebase on save
6. Update preview in real-time

## Components and Interfaces

### TypeScript Schema

Create `apps/main/src/types/portfolio.ts` that mirrors the backend schema:

```typescript
// Core types matching backend/app/schemas/portfolio.py
export interface DateInfo {
  month?: number;
  year?: number;
}

export interface Profile {
  type?: ProfileType;
  url?: string;
  label?: string;
  tags?: string[];
  more_context?: string;
}

export interface PersonalInfo {
  full_name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  profiles?: Profile[];
}

export interface WorkExperience {
  organization?: string;
  title?: string;
  location?: string;
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean;
  highlights?: string[];
  technologies?: string[];
  more_context?: string;
}

// ... other interfaces matching backend schema

export interface PortfolioData {
  personal_info?: PersonalInfo;
  work_experiences?: WorkExperience[];
  projects?: Project[];
  education?: Education[];
  certifications?: Certification[];
  text_blobs?: TextBlobs;
  metadata?: PortfolioMetadata;
}
```

### Main Edit Page Component

`apps/main/src/app/edit/page.tsx`:

- Protected route using existing auth guards
- Manages portfolio data state
- Handles Firebase CRUD operations
- Coordinates between editor and preview

### Firebase Integration

- Extend existing Firebase configuration
- Create portfolio service for CRUD operations
- Handle user-specific data storage
- Implement real-time updates if needed

### Preview Integration

- Use ChatPortfolio component from template-components package
- Transform portfolio data to match ChatPortfolio props
- Provide fallback content for missing data
- Real-time preview updates

## Data Models

### Firebase Document Structure

```
users/{userId}/portfolio: {
  personal_info: PersonalInfo,
  work_experiences: WorkExperience[],
  projects: Project[],
  education: Education[],
  certifications: Certification[],
  text_blobs: TextBlobs,
  metadata: {
    updated_at: timestamp,
    version: string
  }
}
```

### State Management

- Local React state for form data
- Optimistic updates for better UX
- Debounced auto-save functionality
- Conflict resolution for concurrent edits

## Error Handling

### Data Loading Errors

- Network connectivity issues
- Firebase permission errors
- Malformed data handling
- Graceful degradation with empty forms

### Save Operation Errors

- Validation errors with field-specific feedback
- Network failures with retry mechanisms
- Permission errors with clear messaging
- Optimistic update rollback on failure

### Form Validation

- Client-side validation using existing patterns
- Optional field validation (no required fields)
- Real-time validation feedback
- Consistent error messaging

## Implementation Notes

### Existing Component Integration

- Update import paths in copied edit components
- Ensure compatibility with existing UI components
- Maintain consistent styling with app theme
- Preserve accessibility features

### Performance Considerations

- Lazy load preview component
- Debounce save operations
- Optimize Firebase queries
- Implement loading states

### Security

- Validate user permissions for data access
- Sanitize user input before saving
- Implement rate limiting for save operations
- Secure Firebase rules for user data
