## Email verification flow update (2025-09-22)

### TL;DR

- Problem: After verifying email, the backend still returned 403 Forbidden (email not verified) because the frontend used a cached Firebase ID token whose `email_verified` claim was still false.
- Fix: Refresh the Firebase user and force-refresh the ID token right after verification, and ensure all post-auth redirects use `getPostAuthRedirectPath(user)`.
- Outcome: Verified-only endpoints work immediately after email verification; the navbar reflects the verified state; redirects are centralized and consistent.

---

### What happened

- The backend enforces verified email for onboarding/upload endpoints via `RequireVerifiedEmail`.
- Firebase ID tokens embed the `email_verified` claim. After the user clicks the verification link, their existing ID token does not automatically update. Until the token is refreshed, the backend still sees `email_verified=false`.
- For newly created accounts that just verified, the frontend was still sending the old token (no force refresh), resulting in 403 Forbidden from the backend.
- Older accounts "worked" because their tokens had been refreshed at some point, so their cached claims were already up to date.

---

### Changes made

1. Centralize post-auth redirects

- File: `apps/main/src/components/auth/VerificationRequiredScreen.tsx`
- Change: Use `getPostAuthRedirectPath(user)` for all redirects (instead of hardcoding `/dashboard`).
- Why: Single source of truth for post-auth navigation and easier future changes.

2. Refresh user and token immediately after verification

- File: `apps/main/src/components/auth/VerificationRequiredScreen.tsx`
- Change: On verification detection, call `refreshUser()` to reload the Firebase user, then call `await refreshed.getIdToken(true)` to force-refresh the ID token, then redirect with `getPostAuthRedirectPath(refreshed)`.
- Why: Ensures the navbar immediately reflects verified status and the backend receives an ID token where `email_verified=true`.

3. Add `refreshUser` to Auth Context

- File: `apps/main/src/lib/auth/AuthContext.tsx`
- Change: Implement `refreshUser()` that calls `currentUser.reload()`, clones the user object preserving the prototype to trigger React updates, and updates `verificationStatus` to `"verified"` when appropriate.
- Why: Provides a safe, reusable way for UI to force-refresh the user state after external changes (like email verification) and to update UI consumers without breaking Firebase's instance methods.

4. Keep upload API headers unchanged (no forced refresh)

- File: `apps/main/src/lib/api/upload.ts`
- Change: Continue using `user.getIdToken()` (no force) when building auth headers.
- Why: Avoids adding latency and token refresh quota usage on every request. The one-time forced refresh done on the verification screen is sufficient for updated claims.

5. Keep backend strict checks unchanged

- Files: `backend/app/auth/middleware.py` and `backend/app/routes/upload.py`
- Change: None.
- Why: Backend behavior was correct; the issue was the FE using a stale token.

6. Optional: Retry-once on 403 to refresh token

- File: `apps/main/src/lib/api/upload.ts` (optional enhancement)
- Change: On a 403 with an `EMAIL_VERIFICATION_REQUIRED`/similar code, call `user.getIdToken(true)` once and retry the request.
- Why: Provides a safety net if a request races with verification or token refresh.

---

### Before vs After (high level)

- Before: Verify → FE keeps using old token → Backend reads `email_verified=false` → 403 Forbidden.
- After: Verify → FE refreshes user and token → Backend reads `email_verified=true` → access granted.

---

### Trade-offs and follow-ups

- Recommended approach (minimal change, safest for quotas/latency):

  - Force-refresh the ID token only once on verification detection in the verification screen.
  - Keep API helpers using `getIdToken()` (no force) for routine calls.
  - Optionally add a retry-once strategy on 403 to force-refresh and retry a single time.

- Redirect destination: `getPostAuthRedirectPath(user)` currently routes verified users to `"/upload"`. If previous docs or expectations said `"/dashboard"`, update those references if onboarding to `"/upload"` is intended.

---

### Testing checklist

1. New user sign-up → receive verification email.
2. Visit `"/auth/verify-email"` page and click the link in the email.
3. Return to the app; the verify screen detects verification, refreshes user and token, and redirects using `getPostAuthRedirectPath(user)`.
4. Navbar no longer shows `(Unverified)`; verified-only API calls (e.g., upload endpoints) succeed without 403.

---

### Key snippets

Verification screen (post-verify refresh and redirect):

```tsx
// apps/main/src/components/auth/VerificationRequiredScreen.tsx
const { isPolling, startPolling } = useVerificationPolling(user, async () => {
  const refreshed = await refreshUser();
  try {
    if (refreshed) {
      await refreshed.getIdToken(true);
    }
  } catch {}
  if (refreshed) {
    router.push(getPostAuthRedirectPath(refreshed));
  } else {
    router.push("/auth/sign-in");
  }
});
```

Auth context (`refreshUser`):

```ts
// apps/main/src/lib/auth/AuthContext.tsx
const refreshUser = useCallback(async (): Promise<User | null> => {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  if (!current) {
    setUser(null);
    return null;
  }
  await current.reload();
  const reloadedUser = Object.create(
    Object.getPrototypeOf(current),
    Object.getOwnPropertyDescriptors(current)
  ) as User;
  setUser(reloadedUser);
  if (current.emailVerified && verificationStatus !== "verified") {
    setVerificationStatus("verified");
  }
  return current;
}, [verificationStatus]);
```

API headers (no forced refresh; minimal-change approach):

```ts
// apps/main/src/lib/api/upload.ts
async function getAuthHeaders() {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function getAuthHeadersForUpload() {
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
```

Optional: Retry-once on 403 by refreshing token

```ts
// Pseudo-usage pattern around fetch
async function fetchWithEmailVerifiedRetry(
  makeRequest: () => Promise<Response>
) {
  let response = await makeRequest();
  if (response.status !== 403) return response;

  // Try to read error code (ignore parse errors quietly)
  let code: string | undefined;
  try {
    const data = await response.clone().json();
    code = data?.detail?.error_code || data?.error_code;
  } catch {}

  if (code !== "EMAIL_VERIFICATION_REQUIRED") return response;

  // Force-refresh token once and retry
  const user = getFirebaseAuth().currentUser;
  if (!user) return response;
  await user.getIdToken(true);
  return makeRequest();
}
```
