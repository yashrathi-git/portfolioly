# Design Document

## Overview

This design outlines the migration of authentication from direct frontend Firebase interaction to a backend-managed authentication system. The backend will act as a secure intermediary between the frontend and Firebase, providing centralized rate limiting, automatic username generation, and improved security.

**Key Insight from Firebase SDK Research**: Firebase Admin SDK cannot verify passwords. The frontend must use Firebase Client SDK to verify credentials, then send the ID token to the backend for additional processing. This hybrid approach maintains security while enabling backend control.

The migration follows a low-effort approach by maintaining the existing AuthContext interface while swapping out the underlying implementation to call backend APIs.

## Architecture

### High-Level Flow

```
Frontend (React)
    ↓
AuthContext (Updated)
    ↓
Firebase Client SDK (password verification)
    ↓
Auth API Client (New)
    ↓
Backend API Endpoints (New)
    ↓
Firebase Admin SDK (token verification, user creation)
    ↓
Firestore user_settings (Username storage)
```

### Authentication Flow Comparison

**Current Flow (Direct Firebase)**:

1. Frontend calls Firebase Client SDK directly
2. Firebase handles authentication
3. Frontend receives user object
4. No username generation

**New Flow (Backend-Managed)**:

**Sign Up**:

1. Frontend calls backend `/api/auth/signup`
2. Backend creates user with Admin SDK
3. Backend generates unique username
4. Backend stores username in user_settings
5. Backend creates custom token
6. Frontend signs in with custom token
7. Frontend sends verification email via Client SDK

**Sign In**:

1. Frontend verifies password with Firebase Client SDK
2. Frontend gets ID token
3. Frontend calls backend `/api/auth/verify-credentials` with ID token
4. Backend verifies token, fetches user_settings
5. Backend creates new custom token
6. Frontend signs in with custom token

### Key Components

1. **Backend Auth Routes** (`backend/app/routes/auth.py`): New FastAPI endpoints for authentication operations
2. **Auth Service** (`backend/app/services/auth_service.py`): Business logic for authentication and username generation
3. **Auth Schemas** (`backend/app/schemas/auth.py`): Pydantic models for request/response validation (extend existing)
4. **Frontend Auth API Client** (`apps/main/src/lib/api/auth.ts`): HTTP client for backend auth endpoints
5. **Updated AuthContext** (`apps/main/src/lib/auth/AuthContext.tsx`): Modified to use backend API
6. **Rate Limiting**: Reuse existing rate limiter infrastructure with new auth-specific limits
7. **User Settings Service**: Leverage existing `user_settings_service.py` for username management

## Components and Interfaces

### Backend Components

#### 1. Auth Routes (`backend/app/routes/auth.py`)

New FastAPI router with the following endpoints:

```python
POST /api/auth/signup
- Request: { email, password, displayName }
- Response: { customToken, user: { uid, email, displayName, username } }
- Rate limit: 3 requests per hour per IP
- Creates user with Admin SDK, generates username, returns custom token

POST /api/auth/verify-credentials
- Request: { idToken }
- Response: { customToken, user: { uid, email, emailVerified, displayName, username } }
- Rate limit: 5 requests per 15 minutes per IP
- Verifies ID token from frontend, returns new custom token with user data

POST /api/auth/send-verification-email (OPTIONAL - may not be needed)
- Request: Authorization header with ID token
- Response: { success: true, message }
- Rate limit: 3 requests per hour per user
- Note: Frontend can call Firebase Client SDK directly (sendEmailVerification)
- This endpoint is optional and only needed if backend rate limiting is required

GET /api/auth/refresh-user
- Request: Authorization header with current token
- Response: { user: { uid, email, emailVerified, displayName, username } }
- Refreshes user data after email verification
```

#### 2. Auth Service (`backend/app/services/auth_service.py`)

Core business logic:

```python
class AuthService:
    def __init__(self):
        self.user_settings_service = get_user_settings_service()

    async def sign_up(email: str, password: str, display_name: str) -> dict:
        """
        1. Create Firebase user with Admin SDK (auth.create_user)
        2. Generate unique username from email
        3. Create user_settings document with username via user_settings_service
        4. Create custom token (auth.create_custom_token)
        5. Return token and user data

        Note: Email verification sent by frontend after sign-in with custom token
        """

    async def verify_and_get_user(id_token: str) -> dict:
        """
        1. Verify ID token with Admin SDK (auth.verify_id_token)
        2. Fetch user_settings from Firestore via user_settings_service
        3. Create new custom token (auth.create_custom_token)
        4. Return token and user data with username

        Note: Used after frontend verifies password with Client SDK
        """

    async def generate_username(email: str) -> str:
        """
        1. Extract prefix from email (before @)
        2. Sanitize (lowercase, remove special chars, keep alphanumeric)
        3. Append 4 random digits
        4. Check user_settings collection for uniqueness
        5. Retry up to 5 times if collision
        6. Return unique username

        Note: Leverages existing user_settings_service.validate_username()
        and user_settings_service.get_user_settings_by_username()
        """

    async def get_user_data(uid: str) -> dict:
        """
        1. Get Firebase user record (auth.get_user)
        2. Get user_settings from Firestore via user_settings_service
        3. Combine and return user data with username
        """

    async def send_verification_email(uid: str) -> bool:
        """
        OPTIONAL METHOD - May not be needed

        If implemented:
        1. Get user from Firebase Admin SDK
        2. Generate verification link (auth.generate_email_verification_link)
        3. Would need custom email service to send (Firebase doesn't auto-send from Admin SDK)

        RECOMMENDED: Let frontend use Client SDK's sendEmailVerification() instead
        - Automatic email delivery
        - No SMTP setup needed
        - Simpler implementation
        """
```

#### 3. Extended Auth Schemas (`backend/app/schemas/auth.py`)

Add new Pydantic models to existing file:

```python
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    displayName: str = Field(min_length=1, max_length=100)

class VerifyCredentialsRequest(BaseModel):
    idToken: str

class AuthResponse(BaseModel):
    customToken: str
    user: UserData

class UserData(BaseModel):
    uid: str
    email: str
    emailVerified: bool
    displayName: str | None
    username: str | None

class VerificationResponse(BaseModel):
    success: bool
    message: str

class RefreshUserResponse(BaseModel):
    user: UserData
```

#### 4. Auth Rate Limiting

Extend existing rate limiter with auth-specific limits:

```python
# In backend/app/services/rate_limiter.py
class RateLimits:
    # Existing limits...

    # Auth limits (IP-based)
    SIGNUP_PER_HOUR = 3
    SIGNIN_PER_15MIN = 5
    VERIFICATION_EMAIL_PER_HOUR = 3

# New dependency in backend/app/dependencies/rate_limiting.py
async def check_signup_rate_limit(request: Request):
    """IP-based rate limiting for signup (3 per hour)"""

async def check_signin_rate_limit(request: Request):
    """IP-based rate limiting for signin (5 per 15 minutes)"""

async def check_verification_rate_limit(
    request: Request,
    user: UserToken = Depends(require_authenticated_user)
):
    """User-based rate limiting for verification emails (3 per hour)"""
```

### Frontend Components

#### 1. Auth API Client (`apps/main/src/lib/api/auth.ts`)

New HTTP client for backend auth operations:

```typescript
export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface VerifyCredentialsData {
  idToken: string;
}

export interface AuthResponse {
  customToken: string;
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
    username: string | null;
  };
}

export interface RefreshUserResponse {
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
    username: string | null;
  };
}

// Sign up via backend (creates user, generates username)
export async function signUpWithBackend(
  data: SignUpData
): Promise<AuthResponse>;

// Verify credentials via backend (after frontend password check)
export async function verifyCredentialsWithBackend(
  data: VerifyCredentialsData
): Promise<AuthResponse>;

// Send verification email via backend
export async function sendVerificationEmailViaBackend(
  idToken: string
): Promise<void>;

// Refresh user data (after email verification)
export async function refreshUserViaBackend(
  idToken: string
): Promise<RefreshUserResponse>;
```

#### 2. Updated AuthContext (`apps/main/src/lib/auth/AuthContext.tsx`)

Minimal changes to existing context:

```typescript
// Key changes:

// 1. Import auth API client and signInWithCustomToken
import { signInWithCustomToken } from "firebase/auth";
import {
  signUpWithBackend,
  verifyCredentialsWithBackend,
  sendVerificationEmailViaBackend,
} from "@/lib/api/auth";

// 2. Update signUp to use backend
const signUp = async (email: string, password: string, displayName: string) => {
  try {
    // Call backend to create user and generate username
    const { customToken } = await signUpWithBackend({
      email,
      password,
      displayName,
    });

    // Sign in with custom token
    const auth = getFirebaseAuth();
    await signInWithCustomToken(auth, customToken);

    // Send verification email (Client SDK handles this automatically)
    const currentUser = auth.currentUser;
    if (currentUser) {
      await sendEmailVerification(currentUser);
      setVerificationStatus("pending");
      setLastVerificationSent(new Date());
    }
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// 3. Update signIn to use hybrid approach
const signIn = async (email: string, password: string) => {
  try {
    const auth = getFirebaseAuth();

    // First, verify password with Firebase Client SDK
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get ID token
    const idToken = await userCredential.user.getIdToken();

    // Call backend to get custom token with user data (including username)
    const { customToken } = await verifyCredentialsWithBackend({ idToken });

    // Sign in with custom token (refreshes session with username data)
    await signInWithCustomToken(auth, customToken);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// 4. Update resendVerification to use backend
const resendVerification = async () => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in to resend verification email");
  }

  // Rate limit check (client-side)
  if (lastVerificationSent) {
    const timeSinceLastSent = Date.now() - lastVerificationSent.getTime();
    const minWaitTime = 60 * 1000;

    if (timeSinceLastSent < minWaitTime) {
      const remainingTime = Math.ceil((minWaitTime - timeSinceLastSent) / 1000);
      throw new Error(
        `Please wait ${remainingTime} seconds before requesting another verification email`
      );
    }
  }

  try {
    // Use Client SDK directly (simpler than backend)
    await sendEmailVerification(currentUser);
    setLastVerificationSent(new Date());
    setVerificationStatus("pending");
  } catch (error) {
    setVerificationStatus("failed");
    throw new Error(getAuthErrorMessage(error));
  }
};

// 5. Keep all other methods unchanged:
// - signInWithGoogle (direct Firebase, already secure)
// - signOut (direct Firebase)
// - refreshUser (direct Firebase)
```

## Data Models

### Firestore user_settings Document (Existing)

Already includes username field:

```typescript
{
  user_id: string; // Firebase UID
  username: string | null; // Auto-generated on signup
  is_public: boolean; // Portfolio visibility
  created_at: Timestamp;
  updated_at: Timestamp;
  chat_settings: {
    enabled: boolean;
    access_mode: "public" | "private";
    monthly_message_count: number;
    monthly_message_limit: number;
    // ...
  }
}
```

### Username Generation Algorithm

```
Input: email = "john.doe@example.com"

1. Extract prefix: "john.doe"
2. Sanitize: "johndoe" (lowercase, remove dots/special chars, keep alphanumeric)
3. Generate random suffix: 4 digits (e.g., "1234")
4. Combine: "johndoe1234"
5. Validate format with user_settings_service.validate_username()
6. Check uniqueness with user_settings_service.get_user_settings_by_username()
7. If exists, retry with new random digits (max 5 attempts)
8. If all attempts fail, throw error
9. Return unique username
```

### Custom Token Flow

```
Backend creates custom token:
- Uses Firebase Admin SDK: auth.create_custom_token(uid)
- Token contains uid and custom claims
- Valid for 1 hour

Frontend receives token:
- Calls signInWithCustomToken(auth, token)
- Firebase validates token and creates session
- onAuthStateChanged triggers with user object
- User is now authenticated
```

## Error Handling

### Backend Error Responses

Standardized error format:

```python
{
  "detail": {
    "message": "User-friendly error message",
    "error_code": "ERROR_CODE",
    "retry_after": 900  # Optional, for rate limits
  }
}
```

Error codes:

- `INVALID_CREDENTIALS`: Wrong email/password (from frontend verification)
- `EMAIL_ALREADY_EXISTS`: Email already registered
- `WEAK_PASSWORD`: Password too short
- `INVALID_EMAIL`: Email format invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `USERNAME_GENERATION_FAILED`: Could not generate unique username
- `VERIFICATION_SEND_FAILED`: Could not send verification email
- `INVALID_TOKEN`: ID token verification failed
- `INTERNAL_ERROR`: Unexpected server error

### Frontend Error Handling

```typescript
// In auth API client
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function handleAuthRequest(url: string, data: any): Promise<any> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(
        error.detail.message,
        error.detail.error_code,
        error.detail.retry_after
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Network error. Please try again.', 'NETWORK_ERROR');
  }
}

// In AuthContext
try {
  await signUpWithBackend({ ... });
} catch (error) {
  if (error instanceof AuthError) {
    throw new Error(error.message);  // User-friendly message
  }
  throw new Error('An unexpected error occurred');
}
```

## Testing Strategy

### Backend Tests

1. **Unit Tests** (`backend/tests/test_auth_service.py`):

   - Username generation logic
   - Username uniqueness validation
   - Custom token creation
   - User data retrieval
   - Error handling

2. **Integration Tests** (`backend/tests/test_auth_routes.py`):

   - Signup endpoint with valid data
   - Signup with duplicate email
   - Verify credentials with valid token
   - Verify credentials with invalid token
   - Rate limiting enforcement
   - Verification email sending

3. **Rate Limiting Tests** (`backend/tests/test_auth_rate_limiting.py`):
   - Signup rate limit per IP
   - Signin rate limit per IP
   - Verification email rate limit per user

### Frontend Tests

1. **Unit Tests** (`apps/main/src/lib/api/__tests__/auth.test.ts`):

   - API client request formatting
   - Response parsing
   - Error handling
   - AuthError class

2. **Integration Tests** (`apps/main/src/lib/auth/__tests__/AuthContext.test.tsx`):
   - SignUp flow with backend
   - SignIn hybrid flow
   - Custom token authentication
   - Error propagation
   - Verification email flow

### Manual Testing Checklist

- [ ] New user signup creates account with username
- [ ] Username is visible in user_settings collection
- [ ] Username follows format: emailprefix + 4 digits
- [ ] Verification email is sent after signup
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials fails with clear error
- [ ] Rate limiting blocks excessive signup attempts
- [ ] Rate limiting blocks excessive signin attempts
- [ ] Existing users can still log in
- [ ] Google sign-in still works (unchanged)
- [ ] Protected routes still work
- [ ] Token refresh works after verification
- [ ] Username is unique across all users

## Security Considerations

### 1. Password Handling

- Passwords never stored in backend
- Frontend verifies password with Firebase Client SDK
- Backend only receives ID tokens (already verified)
- Firebase handles all password hashing and validation

### 2. Token Security

- Custom tokens valid for 1 hour
- Tokens transmitted over HTTPS only
- Frontend stores token in memory (Firebase SDK handles persistence)
- Backend validates all ID tokens with Firebase Admin SDK
- New custom token issued on each signin for freshness

### 3. Rate Limiting

- IP-based for signup/signin (prevents brute force)
- User-based for verification emails (prevents spam)
- Configurable limits in rate limiter service
- Returns clear retry-after headers

### 4. Input Validation

- Pydantic validates all request data
- Email format validation (EmailStr)
- Password minimum length (6 characters)
- Display name length limits (1-100 characters)
- Username validation via existing user_settings_service

### 5. Username Security

- Sanitized to prevent injection
- Lowercase only
- Alphanumeric characters only
- Uniqueness enforced at database level
- Leverages existing validation in user_settings_service

## Migration Strategy

### Phase 1: Backend Implementation

1. Create auth service with username generation
2. Create auth routes with rate limiting
3. Add tests for all endpoints
4. Deploy backend changes (non-breaking, not used yet)

### Phase 2: Frontend Implementation

1. Create auth API client
2. Update AuthContext to use backend
3. Test with existing components (no changes needed to LoginForm/SignUpForm)
4. Deploy frontend changes

### Phase 3: Validation

1. Monitor error logs for issues
2. Verify rate limiting is working
3. Check username generation success rate
4. Ensure existing users unaffected
5. Verify user_settings collection has usernames

### Phase 4: Backfill Existing Users (Optional)

1. Create script to generate usernames for existing users
2. Run during low-traffic period
3. Update user_settings for users without usernames

### Rollback Plan

If issues occur:

1. Revert frontend to use Firebase directly
2. Backend changes are non-breaking (not used if frontend reverted)
3. No data migration needed (username is optional field in user_settings)
4. Existing user_settings remain intact

## Performance Considerations

### Backend Performance

- Username generation: ~50ms (Firestore query + random generation)
- Custom token creation: ~100ms (Firebase Admin SDK)
- Total signup time: ~200-300ms additional latency
- Signin: ~150ms additional latency (token verification + custom token)
- Caching: Not needed for auth operations (infrequent)

### Frontend Performance

- Additional network round trip to backend
- Offset by reduced Firebase SDK initialization complexity
- Custom token sign-in is fast (~50ms)
- Overall user experience: minimal impact (<500ms total)

### Scalability

- Rate limiter uses in-memory storage (suitable for single instance)
- For multi-instance: migrate to Redis-backed rate limiter
- Username generation: O(1) with proper indexing on user_settings.username
- Firebase Admin SDK: handles high throughput
- Existing user_settings_service already optimized

## Dependencies

### Backend

- `firebase-admin`: Already installed (existing dependency)
- No new dependencies required
- Leverages existing user_settings_service

### Frontend

- No new dependencies required
- Uses existing Firebase SDK for custom token sign-in
- Uses existing fetch API for backend calls

## Configuration

### Backend Environment Variables

```bash
# Existing Firebase config (no changes)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# Optional: Rate limit overrides
AUTH_SIGNUP_RATE_LIMIT=3
AUTH_SIGNIN_RATE_LIMIT=5
AUTH_VERIFICATION_RATE_LIMIT=3
```

### Frontend Environment Variables

```bash
# Existing Firebase config (no changes)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# etc.

# Backend API URL (already configured)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production-Ready Email Verification Strategy

### **Current Implementation (Already Production-Safe)**

Your existing `AuthContext` already implements the correct production approach:

```typescript
// ✅ Verification emails sent ONLY during signup
const signUp = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Send verification email ONCE during signup
  await sendEmailVerification(cred.user);
  setLastVerificationSent(new Date());
  setVerificationStatus("pending");
};

// ✅ Rate limiting prevents spam
const resendVerification = async () => {
  if (lastVerificationSent) {
    const timeSinceLastSent = Date.now() - lastVerificationSent.getTime();
    if (timeSinceLastSent < 60000) {
      // 60 second rate limit
      throw new Error("Please wait before requesting another email");
    }
  }

  await sendEmailVerification(currentUser);
  setLastVerificationSent(new Date());
};
```

### **Why This Prevents Email Spam**

1. **State-based control**: `verificationStatus` and `lastVerificationSent` prevent duplicates
2. **Explicit user actions**: Emails only sent when user clicks signup or resend
3. **No reload triggers**: `onAuthStateChanged` doesn't trigger email sends
4. **Rate limiting**: 60-second minimum between resend attempts
5. **Firebase reliability**: Firebase Client SDK handles delivery automatically

### **Backend Migration Maintains Same Pattern**

```typescript
// NEW: Backend-managed signup with same verification pattern
const signUp = async (email, password, displayName) => {
  try {
    // 1. Backend creates user + generates username
    const { customToken } = await signUpWithBackend({
      email,
      password,
      displayName,
    });

    // 2. Sign in with custom token
    const auth = getFirebaseAuth();
    await signInWithCustomToken(auth, customToken);

    // 3. Send verification email ONCE (same as current)
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
      setLastVerificationSent(new Date());
      setVerificationStatus("pending");
    }
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

// UNCHANGED: Resend verification (same rate limiting)
const resendVerification = async () => {
  // Same implementation as current - no changes needed
  // Rate limiting, state management, Firebase Client SDK
};
```

### **Production Safeguards**

1. **No backend verification endpoint needed**: Frontend handles it reliably
2. **State persistence**: React state prevents duplicate sends on component remounts
3. **Error boundaries**: Proper error handling prevents infinite retry loops
4. **User feedback**: Clear status messages and loading states
5. **Firebase reliability**: Automatic email delivery, no SMTP configuration

### **Migration Benefits**

- ✅ **Same user experience**: No changes to verification flow
- ✅ **Same reliability**: Existing safeguards remain intact
- ✅ **Added username generation**: New users get automatic usernames
- ✅ **Backend rate limiting**: Additional protection on auth endpoints
- ✅ **Centralized control**: Backend manages user creation and token issuance

## Open Questions & Decisions

1. **Username format**: Should we allow customization later?

   - **Decision**: Start with auto-generated, users can edit via existing `/settings/username` endpoint

2. **Rate limit storage**: In-memory vs Redis?

   - **Decision**: Start with in-memory, migrate to Redis if scaling needed

3. **Existing users**: Backfill usernames for existing users?

   - **Decision**: Generate on-demand when user logs in (lazy migration) OR run backfill script

4. **Google sign-in**: Should it also go through backend?

   - **Decision**: No, keep direct Firebase (already secure, no password to protect, no username needed immediately)

5. **Password verification**: Backend or frontend?

   - **Decision**: Frontend (Firebase Admin SDK cannot verify passwords, must use Client SDK)

6. **Verification email**: Backend or frontend?

   - **Decision**: Frontend Client SDK (simpler, automatic, no SMTP setup needed)

7. **Username storage**: New collection or existing user_settings?
   - **Decision**: Use existing user_settings collection (already has username field, validation, and service)
