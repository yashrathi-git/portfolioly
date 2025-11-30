# Design Document

## Overview

This feature adds profile photo upload capabilities and refines the portfolio data schema to better support markdown-formatted content. The design leverages existing Azure Blob Storage infrastructure, introduces reusable validation utilities, and updates the schema across TypeScript and Python codebases to maintain consistency.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ProfilePhotoUpload Component                          │ │
│  │  - File selection & preview                            │ │
│  │  - Client-side validation (800KB)                      │ │
│  │  - Upload progress tracking                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Updated Form Components                               │ │
│  │  - WorkExperienceForm (markdown textarea)              │ │
│  │  - ProjectsForm (markdown textarea + image upload)     │ │
│  │  - CertificationsForm (issuer field)                   │ │
│  │  - TextBlobsForm (markdown textarea)                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Image Upload Endpoints                                │ │
│  │  - POST /api/portfolio/profile-photo                   │ │
│  │  - POST /api/portfolio/project-images                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AzureBlobStorageService (Enhanced)                    │ │
│  │  - upload_profile_photo()                              │ │
│  │  - upload_project_images()                             │ │
│  │  - delete_blob() for replacements                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Updated Pydantic Schemas                              │ │
│  │  - PersonalInfo (profile_photo_url)                    │ │
│  │  - Profile (removed fields)                            │ │
│  │  - WorkExperience (highlights: str)                    │ │
│  │  - Project (highlights: str, images: List[str])        │ │
│  │  - Certification (issuer: str)                         │ │
│  │  - TextBlobs (achievements: str)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Azure Blob Storage                              │
│  - Container: portfolio-uploads                              │
│  - Paths:                                                    │
│    • {user_id}/profile-photo.{ext}                          │
│    • {user_id}/projects/{timestamp}_{filename}              │
│  - Public read access                                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Configuration Module

**Location:** `backend/app/core/config.py` and `apps/main/src/config/uploadConfig.ts`

**Purpose:** Centralized configuration for image upload constraints.

**Backend Configuration:**

```python
class UploadConfig(BaseModel):
    MAX_IMAGE_SIZE_BYTES: int = 800 * 1024  # 800KB
    MAX_PROJECT_IMAGES: int = 5  # Maximum images per project (configurable)
    MAX_IMAGE_CAPTION_LENGTH: int = 100  # Maximum characters for image captions
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    IMAGE_QUALITY: int = 85  # JPEG/WebP quality for optimization (not applied to GIFs)
    MAX_IMAGE_DIMENSION: int = 1920  # Max width/height for web optimization (not applied to GIFs)
```

**Frontend Configuration:**

```typescript
export const UPLOAD_CONFIG = {
  MAX_IMAGE_SIZE_BYTES: 800 * 1024, // 800KB
  MAX_IMAGE_SIZE_MB: 0.8,
  MAX_PROJECT_IMAGES: 5, // Maximum images per project (configurable)
  MAX_IMAGE_CAPTION_LENGTH: 100, // Maximum characters for image captions
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  IMAGE_QUALITY: 0.85, // Quality for client-side compression (not applied to GIFs)
  MAX_IMAGE_DIMENSION: 1920, // Max width/height for web optimization (not applied to GIFs)
} as const;
```

### 2. Image Optimization Utilities

**Purpose:** Optimize images for web use before uploading to reduce file size and improve performance.

**Frontend Image Optimization:**

```typescript
// apps/main/src/lib/utils/imageOptimization.ts
import Compressor from "compressorjs";
import { UPLOAD_CONFIG } from "@/config/uploadConfig";

export async function optimizeImage(file: File): Promise<File> {
  // GIFs are not optimized to preserve animation - just validate size
  if (file.type === "image/gif") {
    if (file.size > UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `GIF size must be under ${UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB`
      );
    }
    return file;
  }

  // Use compressorjs for image optimization
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: UPLOAD_CONFIG.IMAGE_QUALITY,
      maxWidth: UPLOAD_CONFIG.MAX_IMAGE_DIMENSION,
      maxHeight: UPLOAD_CONFIG.MAX_IMAGE_DIMENSION,
      mimeType: "image/webp", // Convert to WebP for better compression
      convertTypes: ["image/png", "image/jpeg"], // Convert PNG/JPEG to WebP
      strict: true, // Return original if compressed is larger
      checkOrientation: true, // Auto-rotate based on EXIF
      retainExif: false, // Remove EXIF data for privacy
      success(result) {
        // Result is a Blob, convert to File
        const optimizedFile = new File(
          [result],
          file.name.replace(/\.[^.]+$/, ".webp"),
          {
            type: "image/webp",
            lastModified: Date.now(),
          }
        );
        resolve(optimizedFile);
      },
      error(err) {
        reject(new Error(`Image optimization failed: ${err.message}`));
      },
    });
  });
}
```

**Backend Image Optimization (using Pillow):**

```python
# backend/app/utils/image_optimization.py
from PIL import Image
from io import BytesIO
from fastapi import UploadFile
from ..core.config import settings

async def optimize_image(file: UploadFile) -> BytesIO:
    """Optimize image for web use - resize and compress. GIFs are not optimized to preserve animation."""
    contents = await file.read()
    await file.seek(0)

    # GIFs are returned as-is to preserve animation
    if file.content_type == 'image/gif':
        output = BytesIO(contents)
        output.seek(0)
        return output

    img = Image.open(BytesIO(contents))

    # Convert RGBA to RGB if necessary (not for GIFs)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background

    # Resize if needed
    max_dim = settings.upload.MAX_IMAGE_DIMENSION
    if img.width > max_dim or img.height > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    # Save as WebP with quality setting
    output = BytesIO()
    img.save(output, format='WEBP', quality=settings.upload.IMAGE_QUALITY, optimize=True)
    output.seek(0)

    return output
```

### 3. Validation Utilities

**Backend Validator:**

```python
# backend/app/utils/image_validation.py
from fastapi import UploadFile, HTTPException
from ..core.config import settings

async def validate_image_upload(file: UploadFile) -> None:
    """Validate image file size and type."""
    # Check content type
    if file.content_type not in settings.upload.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Invalid image type")

    # Check file size
    contents = await file.read()
    if len(contents) > settings.upload.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(400, f"Image size exceeds {settings.upload.MAX_IMAGE_SIZE_BYTES / 1024}KB")

    await file.seek(0)  # Reset for subsequent reads
```

**Frontend Validator:**

```typescript
// apps/main/src/lib/utils/imageValidation.ts
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid image type. Please upload JPEG, PNG, or WebP.",
    };
  }

  if (file.size > UPLOAD_CONFIG.MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size must be under ${UPLOAD_CONFIG.MAX_IMAGE_SIZE_MB}MB`,
    };
  }

  return { valid: true };
}
```

### 4. Enhanced Azure Blob Storage Service

**Location:** `backend/app/services/azure_blob_storage.py`

**Design Principles:**

- All operations are asynchronous to prevent blocking the server
- Image optimization and upload happen in the background
- Per-user storage limits enforced (configurable MAX_PROJECT_IMAGES)
- Old images are deleted when replaced to prevent storage bloat
- Each user can store: 1 profile photo + up to 5 project images (configurable)

**New Methods:**

```python
async def upload_profile_photo(
    self,
    *,
    user_id: str,
    upload_file: UploadFile,
) -> Optional[str]:
    """
    Upload profile photo, replacing existing if present.
    Returns public URL on success.
    """
    # Delete existing profile photo first
    await self._delete_user_profile_photo(user_id)

    # Determine file extension
    ext = self._get_file_extension(upload_file.filename)
    blob_name = f"{user_id}/profile-photo{ext}"

    # Upload with public access
    return await self._upload_blob(blob_name, upload_file, metadata={
        "user_id": user_id,
        "type": "profile_photo"
    })

async def upload_project_image(
    self,
    *,
    user_id: str,
    upload_file: UploadFile,
) -> Optional[str]:
    """
    Upload project image with unique timestamp-based naming.
    Returns public URL on success.
    """
    timestamp = int(time.time() * 1000)
    ext = self._get_file_extension(upload_file.filename)
    safe_filename = self._sanitize_filename(upload_file.filename)
    blob_name = f"{user_id}/projects/{timestamp}_{safe_filename}"

    return await self._upload_blob(blob_name, upload_file, metadata={
        "user_id": user_id,
        "type": "project_image"
    })

async def _delete_user_profile_photo(self, user_id: str) -> None:
    """Delete existing profile photo for user if it exists."""
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        blob_name = f"{user_id}/profile-photo{ext}"
        try:
            blob_client = self._container_client.get_blob_client(blob_name)
            await blob_client.delete_blob()
            logger.info(f"Deleted existing profile photo: {blob_name}")
            return
        except Exception:
            continue  # Blob doesn't exist, try next extension
```

### 5. Backend API Endpoints

**Location:** `backend/app/routes/portfolio.py`

**Design Principle:** All endpoints are fully asynchronous. Image optimization and upload operations run without blocking the server.

**New Endpoints:**

```python
@router.post("/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    azure_service: AzureBlobStorageService = Depends(get_azure_blob_storage_service),
) -> dict:
    """Upload or replace user's profile photo. Fully async operation."""
    await validate_image_upload(file)

    # Optimize image for web use
    optimized_image = await optimize_image(file)

    photo_url = await azure_service.upload_profile_photo(
        user_id=user_id,
        upload_file=optimized_image
    )

    if not photo_url:
        raise HTTPException(500, "Failed to upload profile photo")

    # Update portfolio data with new photo URL (async)
    await portfolio_service.update_profile_photo(user_id, photo_url)

    return {"photo_url": photo_url}

@router.post("/project-images")
async def upload_project_images(
    files: List[UploadFile] = File(...),
    user_id: str = Depends(get_current_user_id),
    azure_service: AzureBlobStorageService = Depends(get_azure_blob_storage_service),
) -> dict:
    """Upload multiple project images (max 5). Fully async operation."""
    if len(files) > settings.upload.MAX_PROJECT_IMAGES:
        raise HTTPException(400, f"Maximum {settings.upload.MAX_PROJECT_IMAGES} images per project")

    # Process all images concurrently for better performance
    upload_tasks = []
    for file in files:
        await validate_image_upload(file)
        optimized_image = await optimize_image(file)
        task = azure_service.upload_project_image(
            user_id=user_id,
            upload_file=optimized_image
        )
        upload_tasks.append(task)

    # Wait for all uploads to complete
    uploaded_urls = await asyncio.gather(*upload_tasks)
    uploaded_urls = [url for url in uploaded_urls if url]  # Filter out None values

    return {"image_urls": uploaded_urls}

@router.delete("/profile-photo")
async def delete_profile_photo(
    user_id: str = Depends(get_current_user_id),
    azure_service: AzureBlobStorageService = Depends(get_azure_blob_storage_service),
) -> dict:
    """Delete user's profile photo from storage and portfolio data."""
    await azure_service.delete_user_profile_photo(user_id)
    await portfolio_service.update_profile_photo(user_id, None)
    return {"success": True}

@router.delete("/project-images/{image_url:path}")
async def delete_project_image(
    image_url: str,
    user_id: str = Depends(get_current_user_id),
    azure_service: AzureBlobStorageService = Depends(get_azure_blob_storage_service),
) -> dict:
    """Delete a specific project image from storage."""
    # Extract blob name from URL and verify it belongs to the user
    if f"/{user_id}/projects/" not in image_url:
        raise HTTPException(403, "Unauthorized to delete this image")

    await azure_service.delete_blob_by_url(image_url)
    return {"success": True}
```

### 5. Updated Pydantic Schemas

**Location:** `backend/app/schemas/portfolio.py`

**Schema Changes:**

```python
class Profile(BaseModel):
    """User profile/social media link information."""
    type: Optional[ProfileType] = None
    url: Optional[str] = None
    label: Optional[str] = None
    # REMOVED: profile_photo_url, tags, more_context

class PersonalInfo(BaseModel):
    """Personal information section of the portfolio."""
    full_name: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_photo_url: Optional[str] = None  # NEW: Moved from Profile
    profiles: Optional[List[Profile]] = Field(default_factory=list)

class WorkExperience(BaseModel):
    """Work experience entry with structured dates."""
    organization: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[DateInfo] = None
    end_date: Optional[DateInfo] = None
    is_current: Optional[bool] = None
    highlights: Optional[str] = None  # CHANGED: str instead of List[str], markdown supported
    technologies: Optional[List[str]] = Field(default_factory=list)
    more_context: Optional[str] = None

class ProjectImage(BaseModel):
    """Project image with optional caption."""
    url: str = Field(..., description="Image URL from Azure Blob Storage")
    caption: Optional[str] = Field(None, max_length=100, description="Optional caption (max 100 chars)")
    order: int = Field(..., description="Display order (0-indexed)")

class Project(BaseModel):
    """Project information with links and technologies."""
    name: Optional[str] = None
    # REMOVED: role
    highlights: Optional[str] = None  # CHANGED: str instead of List[str], markdown supported
    technologies: Optional[List[str]] = Field(default_factory=list)
    github: Optional[str] = None
    live_link: Optional[str] = None
    demo_video: Optional[str] = Field(None, description="YouTube link for project demo video")
    more_context: Optional[str] = Field(None, description="Markdown-supported detailed description")
    images: Optional[List[ProjectImage]] = Field(default_factory=list, description="Ordered list of images with captions (max 5)")

class Certification(BaseModel):
    """Certification information."""
    name: Optional[str] = None
    issuer: Optional[str] = Field(None, description="Issuing organization (e.g., Coursera, Udemy)")
    link: Optional[str] = None

class TextBlobs(BaseModel):
    """Unstructured text information that couldn't be categorized."""
    achievements: Optional[str] = Field(None, description="Markdown-formatted achievements, one per line with bullet points")
    additional_context: Optional[str] = None
```

### 6. Updated TypeScript Schemas

**Location:** `apps/main/src/types/portfolio.ts` and `packages/template-components/src/types/portfolio.ts`

**Schema Changes:** Mirror the Python schema changes exactly.

### 7. ProfilePhotoUpload Component

**Location:** `apps/main/src/components/edit/ProfilePhotoUpload.tsx`

**Component Structure:**

```typescript
export function ProfilePhotoUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Show preview
    setPreview(URL.createObjectURL(file));
    setError(null);
    setUploading(true);

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/portfolio/profile-photo", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error("Upload failed");

      const { photo_url } = await response.json();
      onChange(photo_url);
    } catch (err) {
      setError("Failed to upload photo. Please try again.");
      setPreview(value || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <div className="size-24 rounded-full overflow-hidden bg-secondary">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No photo
            </div>
          )}
        </div>

        {/* Upload button */}
        <div>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) =>
              e.target.files?.[0] && handleFileSelect(e.target.files[0])
            }
            className="hidden"
            id="profile-photo-input"
          />
          <label htmlFor="profile-photo-input">
            <Button as="span" disabled={uploading}>
              {uploading
                ? "Uploading..."
                : value
                ? "Replace Photo"
                : "Upload Photo"}
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Max size: 800KB. Formats: JPEG, PNG, WebP
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### 8. Updated Form Components

**WorkExperienceForm Changes:**

- Replace highlights array input with a single textarea
- Add helper text informing users that markdown is supported
- Update validation to accept string instead of array

**ProjectsForm Changes:**

- Replace highlights array input with a single textarea
- Remove role field
- Add input field for demo_video (YouTube link)
- Add textarea for more_context with helper text about markdown support
- Add ProjectImageUpload component for multiple image uploads (max 5 per project)
- Display uploaded images with remove functionality
- Client-side image optimization before upload

**CertificationsForm Changes:**

- Add issuer input field between name and link

**TextBlobsForm Changes:**

- Update achievements field to use textarea
- Add helper text informing users that markdown is supported

**Note:** No special markdown editor is needed. Simple textareas with helper text are sufficient. The existing `markdown-to-jsx` library already handles rendering in the display components.

### 9. Widget Updates

**AboutWidget:**

```typescript
// Use profile_photo_url from personal_info instead of avatarUrl
const photoUrl = portfolioData?.personal_info?.profile_photo_url;
```

**ProjectsWidget & Experience Widget:**

- Render markdown from highlights string using existing `markdown-to-jsx` library
- Display project images in gallery format when available
- Render more_context markdown when project tile is expanded

### 10. AI Prompt Updates

**Location:** `backend/app/constants/extraction_prompts.py`

**Key Changes:**

```python
PORTFOLIO_EXTRACTION_PROMPT = """
...

## Work Experience
- Extract highlights as a markdown-formatted string with bullet points
- Format: "- Highlight 1\n- Highlight 2\n- Highlight 3"
- Each highlight should be on its own line starting with "- "

## Projects
- Do NOT extract a "role" field
- Extract highlights as a markdown-formatted string with bullet points
- The more_context field supports markdown formatting for detailed descriptions
- Extract demo_video if a YouTube link is mentioned for the project
- Format highlights: "- Highlight 1\n- Highlight 2"
- Images will be uploaded separately by users (not extracted from PDFs)

## Certifications
- Extract the issuer/organization that provided the certification
- Examples: "Coursera", "Udemy", "AWS", "Google", "Microsoft"

## Achievements
- Format achievements as markdown bullet points
- Each achievement should be on its own line starting with "- "
- Format: "- Achievement 1\n- Achievement 2\n- Achievement 3"

## Profile Links
- Do NOT extract profile_photo_url, tags, or more_context fields
- Only extract: type, url, label
...
"""
```

## Data Models

### Updated Portfolio Data Flow

```
PDF/GitHub → AI Extraction → PortfolioData (Python) → Firestore →
Frontend API → PortfolioData (TypeScript) → UI Components
```

## Error Handling

**Note:** No migration strategy is needed as the application is in development mode with no existing users. The database can be cleared and rebuilt with the new schema.

### Frontend Error Scenarios

1. **File Too Large:** Display inline error with size limit
2. **Invalid Format:** Display supported formats message
3. **Upload Failed:** Show retry button with error details
4. **Network Error:** Display offline message with retry option

### Backend Error Scenarios

1. **Validation Failure:** Return 400 with specific error message
2. **Azure Upload Failure:** Log error, return 500 with generic message
3. **Authentication Failure:** Return 401 with auth error
4. **Rate Limiting:** Return 429 with retry-after header

### Error Response Format

```typescript
{
  "error": "Image size exceeds 800KB",
  "code": "IMAGE_TOO_LARGE",
  "details": {
    "max_size_kb": 800,
    "actual_size_kb": 1024
  }
}
```

## Testing Strategy

### Unit Tests

1. **Image Validation:**

   - Test file size validation (under/over limit)
   - Test file type validation (valid/invalid types)
   - Test edge cases (empty file, corrupted file)

2. **Azure Blob Service:**

   - Test profile photo upload
   - Test profile photo replacement
   - Test project image upload
   - Test error handling

3. **Schema Validation:**
   - Test Pydantic models with new fields
   - Test markdown string validation
   - Test backward compatibility

### Integration Tests

1. **Upload Flow:**

   - Test complete profile photo upload flow
   - Test project image upload flow
   - Test concurrent uploads

2. **Data Migration:**
   - Test old schema to new schema conversion
   - Test mixed data handling

### E2E Tests

1. **User Journey:**
   - Upload profile photo in editor
   - View photo in preview
   - Replace existing photo
   - Upload project images
   - Edit markdown-formatted highlights

## Performance Considerations

1. **Image Optimization:**

   - Consider client-side image compression before upload
   - Use WebP format for better compression
   - Lazy load project images

2. **Blob Storage:**

   - Use CDN for faster image delivery
   - Set appropriate cache headers
   - Implement image cleanup for deleted portfolios

3. **Frontend:**
   - Debounce markdown preview rendering
   - Use virtual scrolling for large image galleries
   - Optimize image preview generation

## Security Considerations

1. **File Upload:**

   - Validate file types on both client and server
   - Scan uploaded files for malware (future enhancement)
   - Use signed URLs for temporary upload access (future enhancement)

2. **Access Control:**

   - Verify user owns portfolio before allowing uploads
   - Implement rate limiting on upload endpoints
   - Validate file content matches declared type

3. **Storage:**
   - Use public read-only access for images
   - Implement blob lifecycle policies for cleanup
   - Monitor storage usage per user

## Deployment Considerations

1. **Database Migration:**

   - Deploy schema changes with backward compatibility
   - Run migration script for existing portfolios
   - Monitor migration progress and errors

2. **Feature Flags:**

   - Enable profile photo upload gradually
   - Monitor upload success rates
   - Rollback capability if issues arise

3. **Monitoring:**
   - Track upload success/failure rates
   - Monitor Azure Blob Storage usage
   - Alert on validation error spikes
