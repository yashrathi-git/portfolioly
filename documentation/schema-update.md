# Portfolio Schema Update - Breaking Changes Documentation

**Date:** January 2025  
**Spec:** `.kiro/specs/profile-photo-schema-enhancements/`  
**Status:** Implementation Complete (Tasks 1-11), Remaining (Tasks 12-18)

## Overview

This document outlines all breaking changes introduced in the portfolio schema enhancement feature. This update adds profile photo upload capabilities, project image management, and refines the portfolio data schema to better support markdown-formatted content.

## Critical Breaking Changes

### 1. Profile Model Changes

**Breaking Change:** The `Profile` model has been significantly simplified.

**Removed Fields:**

- `profile_photo_url` - Moved to `PersonalInfo` model
- `tags` - No longer supported
- `more_context` - No longer supported

**Impact:**

- Any code referencing `Profile.profile_photo_url` must be updated to use `PersonalInfo.profile_photo_url`
- Data migration required for existing portfolios with profile photos
- Tags and more_context data will be lost if not migrated

**Migration Strategy:**

- Application is in development mode with no users
- Database can be cleared and rebuilt with new schema
- No backward compatibility needed

---

### 2. PersonalInfo Model Changes

**Breaking Change:** Profile photo URL moved from Profile to PersonalInfo.

**Added Fields:**

- `profile_photo_url` (Optional[str]) - URL to user's profile photo stored in Azure Blob Storage

**Impact:**

- Profile photo is now a top-level personal info field
- All components displaying profile photos must be updated
- AboutWidget now uses `personal_info.profile_photo_url` instead of `avatarUrl`

---

### 3. WorkExperience Model Changes

**Breaking Change:** Highlights field type changed from array to string.

**Before:**

```python
highlights: Optional[List[str]] = Field(default_factory=list)
```

**After:**

```python
highlights: Optional[str] = None  # Markdown-supported string
```

**Impact:**

- All work experience highlights must be reformatted as markdown strings
- Format: `"- Highlight 1\n- Highlight 2\n- Highlight 3"`
- WorkExperienceForm component updated to use textarea instead of array input
- WorkExperienceWidget updated to render markdown using markdown-to-jsx
- AI extraction prompts updated to generate markdown format

---

### 4. Project Model Changes

**Breaking Changes:** Multiple significant changes to Project model.

**Removed Fields:**

- `role` - No longer supported

**Modified Fields:**

- `highlights`: Changed from `List[str]` to `str` (markdown-supported)
- `images`: Changed from `List[str]` to `List[ProjectImage]`

**Added Fields:**

- `demo_video` (Optional[str]) - YouTube link for project demo
- New `ProjectImage` model with structured image data

**New ProjectImage Model:**

```python
class ProjectImage(BaseModel):
    url: str  # Image URL from Azure Blob Storage
    caption: Optional[str] = Field(None, max_length=100)  # Max 100 characters
    order: int  # Display order (0-indexed)
```

**Impact:**

- Project role data will be lost
- Highlights must be reformatted as markdown strings
- Images now include captions and ordering
- Maximum 5 images per project (configurable via MAX_PROJECT_IMAGES)
- ProjectsForm component significantly updated
- ProjectsWidget updated with carousel-based overlay for images
- AI extraction prompts updated to exclude role field

---

### 5. Certification Model Changes

**Breaking Change:** New required field for certification issuer.

**Added Fields:**

- `issuer` (Optional[str]) - Organization that issued the certification (e.g., "Coursera", "Udemy")

**Impact:**

- CertificationsForm updated with issuer input field
- AI extraction prompts updated to extract issuer information
- Existing certifications without issuer will have null/empty issuer field

---

### 6. TextBlobs Model Changes

**Breaking Change:** Achievements field type changed from implicit format to explicit markdown string.

**Modified Fields:**

- `achievements`: Now explicitly documented as markdown-formatted string

**Format:**

```markdown
- Achievement 1
- Achievement 2
- Achievement 3
```

**Impact:**

- TextBlobsForm updated to use textarea with markdown helper text
- AI extraction prompts updated to format achievements as markdown bullet points
- Each achievement on its own line with bullet point

---

## New Features & Capabilities

### 7. Profile Photo Upload

**New Capability:** Users can upload, replace, and delete profile photos.

**Technical Details:**

- Stored in Azure Blob Storage with public read access
- Maximum file size: 800KB
- Supported formats: JPEG, PNG, WebP, GIF
- Automatic image optimization (except GIFs)
- Client-side optimization using compressorjs library
- Server-side optimization using Pillow library
- Automatic replacement when uploading new photo (old photo deleted)

**New Components:**

- `ProfilePhotoUpload.tsx` - Upload component with drag-and-drop
- New API endpoints: `POST /api/portfolio/profile-photo`, `DELETE /api/portfolio/profile-photo`

---

### 8. Project Image Management

**New Capability:** Users can upload up to 5 images per project with captions.

**Technical Details:**

- Maximum 5 images per project (configurable)
- Each image can have a caption (max 100 characters)
- Images are ordered and can be reordered
- Supported formats: JPEG, PNG, WebP, GIF
- Automatic image optimization (except GIFs)
- Images stored in Azure Blob Storage
- Concurrent upload processing for better performance

**New Components:**

- `ProjectImageUpload.tsx` - Multi-image upload with captions and reordering
- Carousel-based project overlay for image display
- New API endpoints: `POST /api/portfolio/project-images`, `DELETE /api/portfolio/project-images/{image_url}`

---

### 9. Image Optimization

**New Capability:** All uploaded images are automatically optimized for web use.

**Optimization Details:**

- Frontend: compressorjs library
- Backend: Pillow library
- Resize to max 1920px dimension (maintains aspect ratio)
- Convert to WebP format for better compression
- 85% quality setting
- GIFs are NOT optimized (preserves animation)
- GIFs only validated for size (max 800KB)

**Configuration:**

- `MAX_IMAGE_SIZE_BYTES`: 800KB
- `MAX_IMAGE_DIMENSION`: 1920px
- `IMAGE_QUALITY`: 85%
- `MAX_PROJECT_IMAGES`: 5 (configurable)
- `MAX_IMAGE_CAPTION_LENGTH`: 100 characters

---

## TypeScript Schema Changes

All Python schema changes are mirrored in TypeScript through the `@portfolioly/schema` package:

**Centralized Schema Package:**

The project now uses `@portfolioly/schema` as the single source of truth for all portfolio data structures. This package provides:

- **Zod Schemas**: Runtime validation matching backend Pydantic models
- **Type Inference**: Automatic TypeScript types from Zod schemas
- **Data Transformation**: Utilities to convert between backend and display formats
- **Validation Functions**: `validatePortfolioData()` and `validatePortfolioDataSafe()`

**Files Updated:**

- `packages/schema/src/schemas/*.ts` - Zod schema definitions
- `packages/schema/src/types/display.ts` - Display format types
- `packages/schema/src/transformers/*.ts` - Data transformation utilities
- `apps/main/src/types/portfolio.ts` - Now imports from `@portfolioly/schema`
- `packages/template-components/src/types/portfolio.ts` - Now imports from `@portfolioly/schema`

**Key Changes:**

- `Profile` interface: Removed `profile_photo_url`, `tags`, `more_context`
- `PersonalInfo` interface: Added `profile_photo_url`
- `ProjectImage` interface: New interface with `url`, `caption`, `order`
- `Project` interface: Removed `role`, changed `highlights` to string, added `demo_video`, changed `images` to `ProjectImage[]`
- `WorkExperience` interface: Changed `highlights` from `string[]` to `string`
- `Certification` interface: Added `issuer`
- `TextBlobs` interface: `achievements` explicitly documented as markdown string

**Migration to Schema Package:**

All apps and packages now import types from `@portfolioly/schema`:

```typescript
// Before
import { PortfolioData } from "../types/portfolio";

// After
import { type PortfolioData } from "@portfolioly/schema";
```

See the [Schema Package README](../packages/schema/README.md) for complete usage documentation.

---

## Component Updates

### Form Components

**WorkExperienceForm.tsx:**

- Replaced highlights array input with single textarea
- Added helper text about markdown support
- Updated validation logic

**ProjectsForm.tsx:**

- Replaced highlights array input with single textarea
- Removed role field input
- Added demo_video input field (YouTube link)
- Added more_context textarea with markdown support
- Integrated ProjectImageUpload component
- Updated validation logic

**CertificationsForm.tsx:**

- Added issuer input field

**TextBlobsForm.tsx:**

- Updated achievements field to textarea
- Added markdown helper text

### Display Components

**AboutWidget.tsx:**

- Updated to use `personal_info.profile_photo_url`
- Maintains fallback to initials if no photo

**ProjectsWidget.tsx:**

- Updated to render markdown highlights
- Added carousel-based overlay for project details
- Displays project images in carousel
- Embeds YouTube demo video
- Displays markdown-formatted more_context

**WorkExperienceWidget.tsx:**

- Updated to render markdown highlights using markdown-to-jsx

---

## API Changes

### New Endpoints

**Profile Photo:**

- `POST /api/portfolio/profile-photo` - Upload/replace profile photo
- `DELETE /api/portfolio/profile-photo` - Delete profile photo

**Project Images:**

- `POST /api/portfolio/project-images` - Upload multiple project images (max 5)
- `DELETE /api/portfolio/project-images/{image_url}` - Delete specific project image

### Endpoint Characteristics

- All endpoints are fully asynchronous
- Image optimization happens before upload
- Concurrent processing for multiple images using `asyncio.gather`
- Proper authentication and authorization checks
- Rate limiting applied
- Comprehensive error handling

---

## Azure Blob Storage Changes

### New Methods

**AzureBlobStorageService:**

- `upload_profile_photo()` - Upload with automatic replacement
- `delete_user_profile_photo()` - Delete existing profile photo
- `upload_project_image()` - Upload with timestamp-based naming
- `delete_blob_by_url()` - Delete specific blob by URL

### Storage Structure

**Profile Photos:**

- Path: `{user_id}/profile-photo.{ext}`
- Automatic replacement (old photo deleted)

**Project Images:**

- Path: `{user_id}/projects/{timestamp}_{filename}`
- Unique naming prevents conflicts

### Storage Limits

- 1 profile photo per user
- Up to 5 project images per user (configurable)
- Old images automatically deleted when replaced

---

## AI Extraction Prompt Changes

**Updated Instructions:**

1. **Work Experience Highlights:**

   - Format as markdown string with bullet points
   - Format: `"- Highlight 1\n- Highlight 2"`

2. **Project Highlights:**

   - Format as markdown string with bullet points
   - Do NOT extract "role" field
   - Extract demo_video if YouTube link mentioned

3. **Certifications:**

   - Extract issuer/organization
   - Examples: "Coursera", "Udemy", "AWS", "Google"

4. **Achievements:**

   - Format as markdown bullet points
   - Each achievement on its own line

5. **Profile Links:**

   - Do NOT extract profile_photo_url, tags, or more_context
   - Only extract: type, url, label

6. **Project Images:**
   - Images are uploaded separately by users
   - Not extracted from PDFs

---

## Data Migration Notes

**Important:** This application is in development mode with no existing users.

**Migration Strategy:**

- Database can be cleared and rebuilt with new schema
- No backward compatibility required
- No migration scripts needed

**If Migration Were Required:**

- Convert `List[str]` highlights to markdown strings: `"\n".join(f"- {item}" for item in highlights)`
- Move profile_photo_url from Profile to PersonalInfo
- Convert image URLs to ProjectImage objects with default order
- Set default values for new fields (issuer, demo_video)

---

## Testing Requirements

**Critical Test Areas:**

1. **Profile Photo:**

   - Upload, replace, delete flows
   - Size validation (800KB limit)
   - Format validation (JPEG, PNG, WebP, GIF)
   - Optimization (except GIFs)

2. **Project Images:**

   - Multi-image upload (max 5)
   - Caption input (max 100 chars)
   - Image ordering
   - Concurrent uploads
   - Delete functionality

3. **Markdown Rendering:**

   - Highlights in work experience
   - Highlights in projects
   - Achievements in text blobs
   - More context in projects

4. **Schema Validation:**

   - Pydantic model validation
   - TypeScript type checking
   - API request/response validation

5. **Async Operations:**
   - Verify non-blocking behavior
   - Test concurrent uploads
   - Error handling in async flows

---

## Performance Considerations

**Optimizations Implemented:**

1. **Image Optimization:**

   - Client-side compression before upload
   - Server-side optimization as backup
   - WebP format for better compression

2. **Concurrent Processing:**

   - Multiple images uploaded concurrently
   - asyncio.gather for parallel operations

3. **Storage Efficiency:**
   - Automatic deletion of replaced images
   - Configurable limits prevent bloat
   - Optimized image sizes reduce bandwidth

---

## Security Considerations

**Security Measures:**

1. **File Upload:**

   - Type validation (client and server)
   - Size validation (800KB limit)
   - Content type verification

2. **Access Control:**

   - User ownership verification
   - Authentication required for uploads
   - Authorization checks for deletions

3. **Storage:**
   - Public read-only access for images
   - User-specific blob paths
   - Ownership verification before deletion

---

## Dependencies Added

**Frontend:**

- `compressorjs` - Client-side image compression
- `embla-carousel-react` - Carousel component for project images

**Backend:**

- `pillow` - Server-side image optimization

---

## Configuration Files Updated

**Backend:**

- `backend/app/core/config.py` - Upload configuration
- `backend/app/utils/image_validation.py` - Validation utilities
- `backend/app/utils/image_optimization.py` - Optimization utilities

**Frontend:**

- `apps/main/src/config/uploadConfig.ts` - Upload configuration
- `apps/main/src/lib/utils/imageValidation.ts` - Validation utilities
- `apps/main/src/lib/utils/imageOptimization.ts` - Optimization utilities

---

## Breaking Change Summary

| Component                 | Change Type    | Impact Level | Migration Required   |
| ------------------------- | -------------- | ------------ | -------------------- |
| Profile Model             | Field Removal  | HIGH         | Yes (if data exists) |
| PersonalInfo Model        | Field Addition | MEDIUM       | No                   |
| WorkExperience.highlights | Type Change    | HIGH         | Yes                  |
| Project.role              | Field Removal  | HIGH         | Yes (data loss)      |
| Project.highlights        | Type Change    | HIGH         | Yes                  |
| Project.images            | Type Change    | HIGH         | Yes                  |
| Project.demo_video        | Field Addition | LOW          | No                   |
| Certification.issuer      | Field Addition | LOW          | No                   |
| TextBlobs.achievements    | Format Change  | MEDIUM       | Yes                  |

---

## Rollback Considerations

**If Rollback Needed:**

1. Revert schema changes in both Python and TypeScript
2. Restore old form components
3. Remove new API endpoints
4. Remove image upload components
5. Clear Azure Blob Storage (if needed)
6. Restore old AI extraction prompts

**Note:** Since database can be cleared in dev mode, rollback is straightforward.

---

## Future Enhancements

**Potential Future Work:**

1. Video upload support for projects
2. Image galleries for work experience
3. Bulk image operations
4. Image editing capabilities
5. Advanced carousel features (zoom, fullscreen)
6. Image lazy loading optimization
7. CDN integration for faster delivery
8. Image cleanup for deleted portfolios

---

## References

- **Spec Location:** `.kiro/specs/profile-photo-schema-enhancements/`
- **Requirements:** `requirements.md`
- **Design:** `design.md`
- **Tasks:** `tasks.md`
- **Completed Tasks:** 1-11
- **Remaining Tasks:** 12-18

---

## Contact & Support

For questions about these changes, refer to:

- Design document for technical details
- Requirements document for business logic
- Tasks document for implementation steps
