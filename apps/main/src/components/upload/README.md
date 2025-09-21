# Upload Components - Backend Integration

This directory contains the upload onboarding flow components that are now fully integrated with the backend API.

## Components Overview

### Core Components

- **UploadWizard**: Main orchestrator component that manages the 3-step flow
- **PDFUploadStep**: Handles PDF file uploads with real-time processing
- **GithubRepoStep**: Manages GitHub repository search and selection
- **UploadErrorBoundary**: Error boundary for graceful error handling

### Integration Features

#### Real Backend Integration

- ✅ PDF upload with real text extraction using PyMuPDF
- ✅ GitHub repository fetching with pagination
- ✅ Authentication with Firebase ID tokens
- ✅ Rate limiting (10 PDF uploads/hour, 30 GitHub requests/hour)
- ✅ Comprehensive error handling with user-friendly messages
- ✅ File validation (size, type, content)
- ✅ Progress indication for uploads
- ✅ Retry mechanisms for failed operations

#### API Endpoints Used

- `POST /api/ingest/pdf` - PDF upload and text extraction
- `GET /api/github/repos` - GitHub repository search with pagination
- `POST /api/github/import` - Import selected repositories
- `GET /api/upload/config` - Get upload configuration
- `GET /api/upload/health` - Health check

## Usage

### Basic Usage

```tsx
import UploadWizard from "@/components/upload/UploadWizard";

function MyPage() {
  const handleComplete = () => {
    // Handle completion (e.g., redirect to dashboard)
    router.push("/dashboard");
  };

  return <UploadWizard onComplete={handleComplete} />;
}
```

### With Error Boundary

```tsx
import { UploadErrorBoundary } from "@/components/upload/UploadErrorBoundary";
import UploadWizard from "@/components/upload/UploadWizard";

function MyPage() {
  return (
    <UploadErrorBoundary>
      <UploadWizard onComplete={() => router.push("/dashboard")} />
    </UploadErrorBoundary>
  );
}
```

### Using the Upload Hook Directly

```tsx
import { useUpload } from "@/hooks/useUpload";

function MyComponent() {
  const upload = useUpload();

  const handlePDFUpload = async (file: File) => {
    try {
      await upload.uploadLinkedInPDF(file);
      console.log("Upload successful:", upload.linkedin.result);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePDFUpload(file);
        }}
      />
      {upload.linkedin.uploading && (
        <div>Progress: {upload.linkedin.progress}%</div>
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend Requirements

The backend must be running with the following endpoints available:

- FastAPI server on port 8000
- Firebase authentication configured
- PDF processing service (PyMuPDF)
- GitHub API integration (PyGithub)
- Rate limiting service

## Error Handling

The components include comprehensive error handling:

### User-Friendly Error Messages

- File too large → "File is too large. Please choose a smaller file."
- Invalid file type → "Please upload a PDF file."
- GitHub user not found → "GitHub user not found. Please check the username."
- Rate limit exceeded → "You've reached the upload limit. Please try again later."

### Retry Mechanisms

- Automatic retry with exponential backoff for network errors
- Manual retry buttons for recoverable errors
- Clear error states with suggested actions

### Error Boundary

- Catches JavaScript errors in the upload flow
- Displays fallback UI instead of crashing
- Provides retry and navigation options

## Testing

### Integration Test Component

Use the `UploadIntegrationTest` component to verify the integration:

```tsx
import { UploadIntegrationTest } from "@/components/upload/UploadIntegrationTest";

// Add this to a test page to verify functionality
<UploadIntegrationTest />;
```

### Manual Testing Steps

1. **Configuration Test**: Verify upload config loads correctly
2. **Health Check**: Test backend connectivity
3. **PDF Upload**: Upload a PDF and verify text extraction
4. **GitHub Search**: Search for a GitHub user and verify repositories load
5. **Repository Selection**: Select repositories and verify state management
6. **Error Handling**: Test with invalid files, non-existent users, etc.
7. **Rate Limiting**: Test rate limit enforcement

## State Management

The upload flow uses the `useUpload` hook which provides:

### PDF Upload State

```typescript
interface PDFUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  result: PDFUploadResponse | null;
  error: string | null;
}
```

### GitHub State

```typescript
interface GitHubReposState {
  username: string;
  loading: boolean;
  repos: GitHubRepo[];
  selectedRepoIds: number[];
  pagination: {
    page: number;
    perPage: number;
    totalCount: number;
    hasNext: boolean;
  };
  error: string | null;
}
```

## Performance Considerations

- **Async Processing**: PDF processing runs asynchronously with progress indication
- **Pagination**: GitHub repositories are loaded with pagination to handle large result sets
- **Rate Limiting**: Built-in rate limiting prevents API abuse
- **Error Boundaries**: Prevent crashes from propagating up the component tree
- **Debounced Search**: GitHub username search is debounced to reduce API calls

## Security Features

- **Authentication**: All API calls require Firebase ID tokens
- **Email Verification**: Upload endpoints require verified email addresses
- **File Validation**: Server-side validation of file size, type, and content
- **Rate Limiting**: Per-user rate limits prevent abuse
- **Error Sanitization**: Error messages don't expose sensitive information

## Troubleshooting

### Common Issues

1. **"Configuration not loaded"**

   - Check that the backend is running
   - Verify API_BASE_URL environment variable
   - Check network connectivity

2. **"Authentication failed"**

   - Ensure user is signed in
   - Verify email is verified
   - Check Firebase configuration

3. **"File upload failed"**

   - Check file size (max 15MB)
   - Verify file is a valid PDF
   - Check rate limits

4. **"GitHub user not found"**
   - Verify username is correct
   - Check if user has public repositories
   - Verify GitHub API connectivity

### Debug Mode

Set `NODE_ENV=development` to see detailed error information in the error boundary.
