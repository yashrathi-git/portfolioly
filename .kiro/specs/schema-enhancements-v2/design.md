# Design Document

## Overview

This design document outlines the implementation approach for enhancing the portfolio schema with additional fields across three layers: the shared schema package, the Python backend, and the React frontend editor. The enhancements focus on improving visual presentation through logos, card images, technology tags, and better field labeling.

## Architecture

### Three-Layer Schema Architecture

```
┌─────────────────────────────────────────┐
│   Frontend (apps/main)                  │
│   - Edit forms with new fields          │
│   - Image upload components             │
│   - Helper text and labels              │
└──────────────┬──────────────────────────┘
               │ imports from
               ▼
┌─────────────────────────────────────────┐
│   Schema Package (@portfolioly/schema)  │
│   - Zod schemas (source of truth)       │
│   - TypeScript types                    │
│   - Validation rules                    │
└─────────────────────────────────────────┘
               │ mirrored by
               ▼
┌─────────────────────────────────────────┐
│   Backend (Python FastAPI)              │
│   - Pydantic models                     │
│   - API validation                      │
│   - Database storage                    │
└─────────────────────────────────────────┘
```

### Data Flow

1. User edits portfolio in frontend forms
2. Frontend validates against Zod schemas
3. Data sent to backend API
4. Backend validates against Pydantic models
5. Data stored in Firestore
6. Data retrieved and transformed for display

## Components and Interfaces

### 1. Schema Package Updates

**File: `packages/schema/src/schemas/personal.ts`**

Add new fields to `PersonalInfoSchema`:

- `tags`: Array of strings for technology tags
- `chatfolio_headline`: Optional string for chat portfolio headline

```typescript
export const PersonalInfoSchema = z.object({
  // ... existing fields
  tags: z.array(z.string()).optional().default([]),
  chatfolio_headline: z.string().nullable().optional(),
});
```

**File: `packages/schema/src/schemas/work.ts`**

Add logo field to `WorkExperienceSchema`:

- `logo_url`: Optional string for company logo URL

```typescript
export const WorkExperienceSchema = z.object({
  // ... existing fields
  logo_url: z.string().nullable().optional(),
});
```

**File: `packages/schema/src/schemas/education.ts`**

Add logo field to `EducationSchema`:

- `logo_url`: Optional string for institution logo URL

```typescript
export const EducationSchema = z.object({
  // ... existing fields
  logo_url: z.string().nullable().optional(),
});
```

**File: `packages/schema/src/schemas/project.ts`**

Add card image field to `ProjectSchema`:

- `card_image_url`: Optional string for project card thumbnail

```typescript
export const ProjectSchema = z.object({
  // ... existing fields
  card_image_url: z.string().nullable().optional(),
});
```

### 2. Backend Schema Updates

**File: `backend/app/schemas/portfolio.py`**

Mirror all schema changes in Pydantic models:

```python
class PersonalInfo(BaseModel):
    # ... existing fields
    tags: Optional[List[str]] = Field(default_factory=list)
    chatfolio_headline: Optional[str] = None

class WorkExperience(BaseModel):
    # ... existing fields
    logo_url: Optional[str] = None

class Education(BaseModel):
    # ... existing fields
    logo_url: Optional[str] = None

class Project(BaseModel):
    # ... existing fields
    card_image_url: Optional[str] = Field(
        None,
        description="Card image URL for project thumbnail (supports GIFs)"
    )
```

### 3. Frontend Form Updates

#### PersonalInfoForm Component

**File: `apps/main/src/components/edit/PersonalInfoForm.tsx`**

Add two new form fields:

1. **Technology Tags Field**

   - Use existing `TagInput` component
   - Label: "Technology Tags"
   - Helper text: "These tags will be displayed on your chat portfolio page"
   - Position: After location field

2. **ChatFolio Headline Field**
   - Use standard `Input` component
   - Label: "ChatFolio Headline"
   - Helper text: "This headline will be shown on the front page of your chat portfolio"
   - Position: After headline field

#### WorkExperienceForm Component

**File: `apps/main/src/components/edit/WorkExperienceForm.tsx`**

Add logo URL field:

- Use standard `Input` component
- Label: "Company Logo URL"
- Helper text: "URL to the company logo image"
- Position: After location field in the grid

#### EducationForm Component

**File: `apps/main/src/components/edit/EducationForm.tsx`**

Add logo URL field:

- Use standard `Input` component
- Label: "Institution Logo URL"
- Helper text: "URL to the institution logo image"
- Position: After grade field

#### ProjectsForm Component

**File: `apps/main/src/components/edit/ProjectsForm.tsx`**

1. **Add Card Image Upload Field**

   - Create new component similar to `ProjectImageUpload` but for single image
   - Label: "Card Image"
   - Helper text: "This image will be shown on the project card. Supports static images and animated GIFs."
   - Position: Before project images section
   - Support both static images and GIF files

2. **Update More Context Field Label**
   - Change label from "More context" to "Detailed Description"
   - Update helper text to: "This markdown-supported description will be shown when users click on the project card"
   - Keep field name as `more_context` for backward compatibility

### 4. Image Upload Component for Card Images

**New File: `apps/main/src/components/edit/ProjectCardImageUpload.tsx`**

Create a simplified version of `ProjectImageUpload` for single card image:

- Support single image upload
- Accept both static images (JPEG, PNG, WebP) and GIF files
- Apply compression/optimization for static images only
- Preserve GIF animation by skipping compression for GIF files
- Display preview with remove option
- Reuse existing upload utilities and validation

## Data Models

### TypeScript Types (Generated from Zod)

```typescript
// PersonalInfo
interface PersonalInfo {
  full_name?: string | null;
  headline?: string | null;
  chatfolio_headline?: string | null; // NEW
  summary?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  profile_photo_url?: string | null;
  profiles?: Profile[];
  tags?: string[]; // NEW
}

// WorkExperience
interface WorkExperience {
  organization?: string | null;
  title?: string | null;
  location?: string | null;
  logo_url?: string | null; // NEW
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean | null;
  highlights?: string | null;
  technologies?: string[];
  more_context?: string | null;
}

// Education
interface Education {
  institution?: string | null;
  degree?: string | null;
  branch?: string | null;
  logo_url?: string | null; // NEW
  start_date?: DateInfo;
  end_date?: DateInfo;
  is_current?: boolean | null;
  location?: string | null;
  grade?: string | null;
}

// Project
interface Project {
  name?: string | null;
  card_image_url?: string | null; // NEW
  highlights?: string | null;
  technologies?: string[];
  github?: string | null;
  live_link?: string | null;
  demo_video?: string | null;
  more_context?: string | null;
  images?: ProjectImage[];
}
```

## Error Handling

### Validation Errors

1. **Schema Validation**

   - Zod validates on frontend before submission
   - Pydantic validates on backend API
   - Display validation errors inline in forms

2. **Image Upload Errors**

   - File type validation (reject unsupported formats)
   - File size validation (max 10MB for card images)
   - Network errors during upload
   - Display error toasts with clear messages

3. **URL Validation**
   - Logo URLs validated as strings (no strict URL validation)
   - Users responsible for providing valid URLs
   - No automatic URL fetching or validation

### Backward Compatibility

- All new fields are optional with defaults
- Existing portfolios without new fields continue to work
- Frontend gracefully handles missing fields
- Backend accepts payloads without new fields

## Testing Strategy

### Schema Package Tests

1. **Validation Tests**
   - Test new fields accept valid values
   - Test optional fields can be omitted
   - Test default values are applied correctly
   - Test array fields accept empty arrays

### Backend Tests

1. **Model Validation Tests**

   - Test Pydantic models accept new fields
   - Test serialization/deserialization
   - Test backward compatibility with old data

2. **API Integration Tests**
   - Test portfolio update with new fields
   - Test portfolio retrieval includes new fields
   - Test partial updates work correctly

### Frontend Tests

1. **Component Tests**

   - Test form fields render correctly
   - Test field updates trigger onChange
   - Test helper text displays correctly
   - Test TagInput integration

2. **Integration Tests**
   - Test form submission with new fields
   - Test data persistence and retrieval
   - Test image upload for card images

## Implementation Notes

### Image Upload Strategy

For project card images, we'll reuse the existing image upload infrastructure:

- Use `ImageUploadService` from backend
- Apply same validation rules as project images
- Store in Azure Blob Storage with similar naming convention
- Special handling for GIF files to preserve animation

### GIF File Handling

GIF files require special treatment:

1. Detect GIF files by MIME type or extension
2. Skip compression/optimization for GIFs
3. Upload GIF files directly to storage
4. Apply size limits (max 10MB) to prevent abuse

### UI/UX Considerations

1. **Helper Text Clarity**

   - All new fields include descriptive helper text
   - Explain where/how the data will be displayed
   - Use consistent formatting across forms

2. **Field Positioning**

   - Place related fields together
   - Maintain logical flow in forms
   - Avoid disrupting existing form layouts

3. **Progressive Enhancement**
   - New fields are optional
   - Users can skip fields they don't need
   - Forms remain functional without new fields

## Migration Strategy

### Database Migration

No database migration required:

- Firestore is schema-less
- New fields automatically supported
- Existing documents remain valid

### Code Deployment

1. Deploy schema package updates first
2. Deploy backend with new Pydantic models
3. Deploy frontend with updated forms
4. No downtime required

### Rollback Plan

If issues arise:

1. Revert frontend deployment
2. Revert backend deployment
3. Schema package changes are backward compatible
4. Existing data remains intact
