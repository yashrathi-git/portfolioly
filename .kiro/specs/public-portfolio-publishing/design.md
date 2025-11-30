# Design Document

## Overview

This feature implements a comprehensive public portfolio publishing system that allows users to share their portfolios at custom URLs (`/p/username`), preview their work in fullscreen mode, and manage public/private access. The design leverages existing authentication infrastructure while introducing new access control logic based on the `chat_settings.access_mode` field.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Portfolio Editor                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Edit Mode    │  │ Preview Mode │  │ Publish Settings     │  │
│  │              │  │              │  │ - Username Editor    │  │
│  │              │  │              │  │ - Public Toggle      │  │
│  │              │  │              │  │ - URL Display        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                              ▼                                 ▼
                    ┌──────────────────┐            ┌──────────────────┐
                    │ /preview         │            │ /p/:username     │
                    │ (Authenticated)  │            │ (Public/Private) │
                    └──────────────────┘            └──────────────────┘
                              │                                 │
                              │                                 │
                              ▼                                 ▼
                    ┌─────────────────────────────────────────────────┐
                    │         Backend: Ensure Token Endpoint          │
                    │                                                 │
                    │  ┌──────────────────────────────────────────┐  │
                    │  │ Authentication Logic:                    │  │
                    │  │                                          │  │
                    │  │ IF Firebase JWT provided:                │  │
                    │  │   → Verify JWT                           │  │
                    │  │   → Return token (ignore access_mode)    │  │
                    │  │                                          │  │
                    │  │ IF only username provided:               │  │
                    │  │   → Check access_mode                    │  │
                    │  │   → IF "public": return token            │  │
                    │  │   → IF "private": return 404             │  │
                    │  └──────────────────────────────────────────┘  │
                    └─────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. PublishSettingsPanel Component

**Location:** `apps/main/src/components/edit/PublishSettingsPanel.tsx`

**Purpose:** Provides UI for managing username, public/private toggle, and displaying the public URL.

**Props:**

```typescript
interface PublishSettingsPanelProps {
  username?: string;
  isPublic: boolean;
  onUsernameChange: (username: string) => Promise<void>;
  onPublicToggle: (isPublic: boolean) => Promise<void>;
  loading?: boolean;
}
```

**State Management:**

- Local state for username editing
- Debounced username validation
- Loading states for API calls
- Error states for validation failures

**UI Elements:**

- Username input with real-time validation
- Availability check indicator
- Public/private toggle switch
- Public URL display with copy button
- Status indicators (published, private, etc.)

#### 2. FullscreenPreviewButton Component

**Location:** `apps/main/src/components/edit/FullscreenPreviewButton.tsx`

**Purpose:** Button to open fullscreen preview in new tab.

**Props:**

```typescript
interface FullscreenPreviewButtonProps {
  disabled?: boolean;
}
```

**Behavior:**

- Opens `/preview` in new tab
- Disabled if no content exists
- Shows tooltip on hover

#### 3. DeployToVercelButton Component

**Location:** `apps/main/src/components/edit/DeployToVercelButton.tsx`

**Purpose:** Placeholder button for future Vercel deployment feature.

**Props:**

```typescript
interface DeployToVercelButtonProps {
  disabled?: boolean;
}
```

**Behavior:**

- Shows "Coming Soon" badge
- Displays informational modal on click
- Styled to indicate future feature

#### 4. Enhanced EditorTopBar

**Location:** `apps/main/src/components/edit/EditorTopBar.tsx` (modify existing)

**Changes:**

- Add PublishSettingsPanel integration
- Add FullscreenPreviewButton
- Add DeployToVercelButton
- Responsive layout for new controls

#### 5. Preview Page Component

**Location:** `apps/main/src/app/preview/page.tsx`

**Purpose:** Fullscreen authenticated preview of user's portfolio.

**Implementation:**

```typescript
export default function PreviewPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAuthenticatedPortfolio();

  // Redirect if not authenticated
  // Fetch portfolio data with Firebase JWT
  // Render Portfolio component fullscreen
}
```

#### 6. Public Portfolio Page Component

**Location:** `apps/main/src/app/p/[username]/page.tsx`

**Purpose:** Public-facing portfolio page accessible without authentication.

**Implementation:**

```typescript
export default function PublicPortfolioPage({
  params,
}: {
  params: { username: string };
}) {
  // Call ensure-token with username only
  // Fetch portfolio data with public token
  // Render Portfolio component
  // Handle 404 for private/non-existent portfolios
}
```

### Backend Modifications

#### 1. Enhanced Ensure Token Endpoint

**Location:** `backend/app/routes/public_portfolio.py` (modify existing)

**Current Implementation Issues:**

- Does not check `access_mode` field
- Uses `is_public` field instead of `chat_settings.access_mode`

**New Authentication Logic:**

```python
@router.post("/ensure-token", response_model=EnsureTokenResponse)
def ensure_token(
    request: EnsureTokenRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Generate a public token for a username.

    Authentication rules:
    1. WITH Firebase JWT: Always return token (owner access)
    2. WITHOUT Firebase JWT: Check access_mode
       - IF access_mode == "public": return token
       - IF access_mode == "private": return 404
    """

    # Get user settings
    user_settings = get_user_settings_by_username(request.username)

    if not user_settings:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Check if token generation is disabled
    if not user_settings.get("public_token_enabled", True):
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Extract and verify Firebase JWT if provided
    token = extract_bearer_token(authorization)
    has_firebase_auth = False

    if token:
        firebase_user = verify_firebase_jwt(token)
        if firebase_user:
            has_firebase_auth = True
            # Owner access - return token regardless of access_mode

    # If no Firebase auth, check access_mode
    if not has_firebase_auth:
        chat_settings = user_settings.get("chat_settings", {})
        access_mode = chat_settings.get("access_mode", "private")

        if access_mode != "public":
            # Portfolio is private and no owner auth
            raise HTTPException(status_code=404, detail="Portfolio not found")

    # Generate and return token
    token_version = user_settings.get("public_token_ver", 1)
    token_service = get_public_token_service()
    token = token_service.derive_public_token(request.username, token_version)

    return EnsureTokenResponse(token=token)
```

**Key Changes:**

1. Check `chat_settings.access_mode` instead of `is_public`
2. Default to "private" if `access_mode` not set
3. Allow owner access (Firebase JWT) regardless of `access_mode`
4. Return 404 for private portfolios without authentication

#### 2. User Settings Update Endpoint

**Location:** `backend/app/routes/user_settings.py` (modify existing)

**New Endpoint for Access Mode:**

```python
@router.patch("/settings/access-mode")
def update_access_mode(
    request: AccessModeUpdateRequest,
    authorization: str = Header(...)
):
    """Update the portfolio access mode (public/private)."""

    # Verify Firebase JWT
    firebase_user = verify_firebase_jwt(extract_bearer_token(authorization))

    # Update chat_settings.access_mode
    user_settings_service = get_user_settings_service()
    user_settings_service.update_access_mode(
        firebase_user.uid,
        request.access_mode
    )

    return {"success": True, "access_mode": request.access_mode}
```

**Schema:**

```python
class AccessModeUpdateRequest(BaseModel):
    access_mode: Literal["public", "private"]
```

#### 3. User Settings Service Enhancement

**Location:** `backend/app/services/user_settings_service.py` (modify existing)

**New Method:**

```python
def update_access_mode(self, user_id: str, access_mode: str) -> None:
    """Update the access mode for a user's portfolio."""

    user_ref = self.db.collection("user_settings").document(user_id)

    user_ref.update({
        "chat_settings.access_mode": access_mode,
        "updated_at": firestore.SERVER_TIMESTAMP
    })
```

### API Client Functions

#### 1. Public Token API Client

**Location:** `apps/main/src/lib/api/publicToken.ts` (modify existing)

**No changes needed** - existing `fetchUsernameAndToken` function already supports the authentication flow.

#### 2. User Settings API Client

**Location:** `apps/main/src/lib/api/userSettings.ts` (new file)

```typescript
export async function updateUsername(
  userId: string,
  username: string,
  authToken: string
): Promise<void> {
  const response = await fetch(`${env.API_BASE_URL}/user-settings/settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update username");
  }
}

export async function updateAccessMode(
  accessMode: "public" | "private",
  authToken: string
): Promise<void> {
  const response = await fetch(
    `${env.API_BASE_URL}/user-settings/settings/access-mode`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ access_mode: accessMode }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update access mode");
  }
}

export async function checkUsernameAvailability(
  username: string,
  authToken: string
): Promise<{ available: boolean; reason?: string }> {
  const response = await fetch(
    `${env.API_BASE_URL}/public/username/${username}/available`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check username availability");
  }

  return response.json();
}

export async function getUserSettings(
  authToken: string
): Promise<UserSettings> {
  const response = await fetch(`${env.API_BASE_URL}/user-settings/settings`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user settings");
  }

  return response.json();
}
```

#### 3. Public Portfolio API Client

**Location:** `apps/main/src/lib/api/publicPortfolio.ts` (new file)

```typescript
export async function fetchPublicPortfolio(
  username: string
): Promise<PortfolioData> {
  // Step 1: Get public token
  const tokenResponse = await fetch(`${env.API_BASE_URL}/public/ensure-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!tokenResponse.ok) {
    if (tokenResponse.status === 404) {
      throw new Error("Portfolio not found");
    }
    throw new Error("Failed to access portfolio");
  }

  const { token } = await tokenResponse.json();

  // Step 2: Fetch portfolio data with token
  const portfolioResponse = await fetch(
    `${env.API_BASE_URL}/public/portfolio/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!portfolioResponse.ok) {
    throw new Error("Failed to load portfolio");
  }

  return portfolioResponse.json();
}
```

## Data Models

### UserSettings Schema Enhancement

**Location:** `backend/app/schemas/user_settings.py`

**Current Schema:** Already has `chat_settings.access_mode` field

**No changes needed** - the existing schema already supports the required fields.

### Frontend Types

**Location:** `apps/main/src/types/userSettings.ts` (new file)

```typescript
export interface UserSettings {
  username?: string;
  is_public: boolean;
  chat_settings?: {
    enabled: boolean;
    access_mode: "public" | "private";
  };
  created_at?: string;
  updated_at?: string;
}

export interface PublishStatus {
  hasUsername: boolean;
  isPublic: boolean;
  publicUrl?: string;
  canPublish: boolean;
}
```

## Error Handling

### Frontend Error Scenarios

1. **Username Validation Errors**

   - Display inline error messages
   - Show specific validation rules
   - Suggest alternatives if taken

2. **Network Errors**

   - Show toast notifications
   - Provide retry buttons
   - Maintain form state

3. **Authentication Errors**
   - Redirect to sign-in
   - Preserve intended action
   - Show clear error messages

### Backend Error Responses

1. **404 - Portfolio Not Found**

   - Username doesn't exist
   - Portfolio is private (without auth)
   - Token generation disabled

2. **401 - Unauthorized**

   - Invalid Firebase JWT
   - Missing authentication

3. **400 - Bad Request**

   - Invalid username format
   - Invalid access mode value

4. **409 - Conflict**
   - Username already taken

## Testing Strategy

### Frontend Tests

1. **Component Tests**

   - PublishSettingsPanel rendering
   - Username validation logic
   - Toggle state management
   - URL copy functionality

2. **Integration Tests**

   - Preview page authentication flow
   - Public portfolio page rendering
   - Error state handling

3. **E2E Tests**
   - Complete publishing workflow
   - Public access verification
   - Private portfolio blocking

### Backend Tests

1. **Unit Tests**

   - Ensure token authentication logic
   - Access mode checking
   - Username validation

2. **Integration Tests**

   - Full publishing workflow
   - Token generation with different auth states
   - Error scenarios

3. **API Tests**
   - Endpoint response formats
   - Authentication requirements
   - Error status codes

## UI/UX Design

### Publish Settings Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│  📤 Publish Settings                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Username                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ johndoe                                    ✓    │   │
│  └─────────────────────────────────────────────────┘   │
│  Available                                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ○ Keep Private    ● Make Public                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Your Public URL                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ portfolioly.com/p/johndoe              📋 Copy │   │
│  └─────────────────────────────────────────────────┘   │
│  ✓ Portfolio is live and publicly accessible           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Editor Top Bar Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Edit Portfolio                                                  │
│  Welcome back, John!                                             │
│                                                                  │
│  [Edit] [Preview]  |  [Preview Fullscreen] [Deploy to Vercel ⭐] │
│                    |  [Save Changes]                            │
└──────────────────────────────────────────────────────────────────┘
```

### Public Portfolio 404 Page

```
┌─────────────────────────────────────────┐
│                                         │
│              🔍                         │
│                                         │
│      Portfolio Not Found                │
│                                         │
│  This portfolio doesn't exist or        │
│  is not publicly accessible.            │
│                                         │
│  [← Back to Home]                       │
│                                         │
└─────────────────────────────────────────┘
```

## Security Considerations

1. **Access Control**

   - Verify Firebase JWT for owner access
   - Check `access_mode` for public access
   - Return 404 (not 403) for private portfolios to avoid enumeration

2. **Token Security**

   - Use deterministic tokens for caching
   - Support token invalidation via version increment
   - Rate limit token generation

3. **Username Security**

   - Validate format server-side
   - Prevent reserved usernames
   - Case-insensitive uniqueness check

4. **Data Privacy**
   - Don't expose private portfolios in any way
   - Log access attempts for security monitoring
   - Sanitize error messages

## Performance Considerations

1. **Caching Strategy**

   - Cache public portfolios at CDN level
   - Cache user settings in frontend
   - Invalidate on updates

2. **Lazy Loading**

   - Load publish settings on demand
   - Defer username availability checks
   - Progressive enhancement for preview

3. **Optimistic Updates**
   - Update UI immediately on toggle
   - Rollback on error
   - Show loading states

## Migration Strategy

1. **Existing Users**

   - Default `access_mode` to "private"
   - Migrate `is_public` to `access_mode` if needed
   - Preserve existing usernames

2. **Backward Compatibility**
   - Support both `is_public` and `access_mode` during transition
   - Deprecate `is_public` gradually
   - Update documentation

## Future Enhancements

1. **Vercel Deployment**

   - One-click deployment
   - Custom domain support
   - Build configuration

2. **Analytics**

   - View count tracking
   - Visitor analytics
   - Engagement metrics

3. **SEO Optimization**
   - Meta tags generation
   - Sitemap inclusion
   - Social media previews
