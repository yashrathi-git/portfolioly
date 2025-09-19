# Email Verification & Protected Routing

This document explains how compulsory email verification is implemented and how protected routes are enforced in the app. It also covers how to extend or customize the behavior safely.

## Goals

- Require every newly registered user to verify their email before accessing protected content
- Provide a clear verification UX with resend capability and auto-detection of verification
- Centralize logic to avoid duplication and ensure consistent redirects

## Key Building Blocks

### 1) Auth state provider

File: `apps/main/src/lib/auth/AuthContext.tsx`

- Wraps the app and exposes:
  - `user`: Firebase `User | null`
  - `loading`: boolean for initial auth state
  - `verificationStatus`: "idle" | "pending" | "verified" | "failed"
  - `lastVerificationSent`: Date | null with a 1-minute resend rate-limit
  - Auth methods: `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `resendVerification`
- On sign-up we:
  1. Create the user
  2. Set display name
  3. Send verification email and set `verificationStatus` to `pending`
- Polling logic was intentionally removed from the context to keep one source of truth (the verify page handles polling). This keeps the provider slim and predictable.

### 2) Protected route enforcement

Files:

- `apps/main/src/components/auth/ProtectedRoute.tsx`
- `apps/main/src/lib/auth/withAuth.tsx`

We wrap protected pages with `withAuth(Component, { requireVerification: true })`. Internally this uses `ProtectedRoute` which redirects:

- unauthenticated users → `/auth/sign-in`
- authenticated but unverified users → `/auth/verify-email`
- verified users → the page content

Example usage in a page:

```tsx
// apps/main/src/app/dashboard/page.tsx
export default withAuth(DashboardPage, { requireVerification: true });
```

### 3) Centralized post-auth routing helper

File: `apps/main/src/lib/auth/routeGuards.ts`

- `getPostAuthRedirectPath(user)` ensures a single decision for where to send a signed-in user:
  - verified → `/dashboard`
  - unverified → `/auth/verify-email`
- `shouldRedirectToVerifyEmail(user)` is available if you need a boolean check.

We use the helper in `auth/sign-in` and `auth/sign-up` pages to avoid duplicated conditions.

### 4) Verification UX and polling

Files:

- UI: `apps/main/src/app/auth/verify-email/page.tsx` → `VerificationRequiredScreen`
- Hook: `apps/main/src/hooks/useVerificationPolling.ts`

The verify page:

- Displays a centered card with email, guidance, and actions
- Resend verification with built-in rate-limit (via `AuthContext`)
- Uses `useVerificationPolling` to periodically `user.reload()` and detect when `emailVerified` becomes true
- On detection, it redirects to `/dashboard`

### 5) Public pages

File: `apps/main/src/app/page.tsx`

Public pages do not perform imperative redirects to avoid UI flicker. Instead:

- If `user` is present and unverified, the UI shows a “Verify Email” CTA
- If verified, a “Go to Dashboard” CTA is shown
  Protected pages remain responsible for gating via `withAuth`.

## Redirect Rules Summary

- After sign-in/sign-up:
  - `getPostAuthRedirectPath(user)` decides the destination
  - Verified → `/dashboard`
  - Unverified → `/auth/verify-email`
- Protected routes:
  - Not signed in → `/auth/sign-in`
  - Signed in but unverified → `/auth/verify-email`
  - Verified → allowed

## Extending the System

1. Add a new protected page:

```tsx
import withAuth from "@/lib/auth/withAuth";

function SettingsPage() {
  /* ... */
}
export default withAuth(SettingsPage, { requireVerification: true });
```

2. Add a new public page that wants to route post-auth:

```tsx
import { useAuth } from "@/lib/auth/AuthContext";
import { getPostAuthRedirectPath } from "@/lib/auth/routeGuards";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(getPostAuthRedirectPath(user));
    }
  }, [user, loading, router]);

  return /* marketing content */ null;
}
```

3. Customize the post-auth destination:
   Update `getPostAuthRedirectPath` in `routeGuards.ts` to change the verified landing page globally.

## Why this structure?

- Single responsibility: Provider handles auth state and email sending; the verify page handles polling
- Centralized decision-making: `withAuth` for gating and `getPostAuthRedirectPath` for post-auth navigation
- Low duplication: Sign-in and sign-up pages share the same redirect logic via helpers
- Predictable UX: Consistent destinations (`/dashboard` or `/auth/verify-email`) and a focused verification screen

## Troubleshooting

- Not redirecting after verification:
  - Ensure the verify page is mounted so the polling hook runs
  - Check network console: reload calls should succeed; if rate-limited, wait and try again
- Resend disabled too often:
  - A 60s rate-limit is enforced in `AuthContext`; adjust `minWaitTime` if needed

## Related Docs

- `apps/main/src/lib/auth/PROTECTION_GUIDE.md` — quick start and examples
- `apps/main/src/hooks/useVerificationPolling.ts` — polling strategy and backoff
