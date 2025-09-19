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

\*\*\*\*## Sign-up flow (Firebase APIs)

This section shows the exact sequence and APIs used when a user signs up, how we send the verification email, and how the app routes users until verification completes.

### 1) Creating the account and sending the verification email

File: `apps/main/src/lib/auth/AuthContext.tsx`

The `signUp` method creates the account, sets the display name, sends the verification email, and records resend timing and status.

```ts
const signUp = useCallback(
  async (email: string, password: string, displayName: string) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Attach a human-friendly display name
    await updateProfile(cred.user, { displayName });

    // Send verification email immediately
    await sendEmailVerification(cred.user);
    setLastVerificationSent(new Date());
    setVerificationStatus("pending");
  },
  []
);
```

Resend is rate-limited to avoid abuse and accidental spamming:

```ts
const resendVerification = useCallback(async () => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser)
    throw new Error("Please sign in to resend verification email");

  if (lastVerificationSent) {
    const timeSince = Date.now() - lastVerificationSent.getTime();
    const minWaitTime = 60_000; // 60 seconds
    if (timeSince < minWaitTime) {
      const remaining = Math.ceil((minWaitTime - timeSince) / 1000);
      throw new Error(
        `Please wait ${remaining} seconds before requesting another verification email`
      );
    }
  }

  await sendEmailVerification(currentUser);
  setLastVerificationSent(new Date());
  setVerificationStatus("pending");
}, [lastVerificationSent]);
```

Notes:

- The user remains signed in but unverified; the app will route them to the verification screen.
- `verificationStatus` is simplified to: `idle | pending | verified | failed`.

### 2) The sign-up form submission

File: `apps/main/src/components/auth/SignUpForm.tsx`

The form validates input, calls `signUp(...)`, and lets the page handle routing.

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) {
    setError("Please enter your name");
    return;
  }

  setLoading(true);
  try {
    await signUp(email, password, name.trim());
    setJustRegistered(true); // parent page will redirect appropriately
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to sign up");
    setLoading(false);
  }
};
```

### 3) Post sign-up routing (verified vs unverified)

File: `apps/main/src/app/auth/sign-up/page.tsx`

After sign-up, the page listens to `user` and uses the centralized guard to decide where to send them.

```tsx
useEffect(() => {
  if (user && !loading) {
    router.push(getPostAuthRedirectPath(user));
  }
}, [user, loading, router]);
```

Helper used:

```ts
// apps/main/src/lib/auth/routeGuards.ts
export function getPostAuthRedirectPath(user: User) {
  return user.emailVerified ? "/dashboard" : "/auth/verify-email";
}
```

### 4) Verification screen and automatic completion detection

Files:

- `apps/main/src/app/auth/verify-email/page.tsx`
- `apps/main/src/components/auth/VerificationRequiredScreen.tsx`
- `apps/main/src/hooks/useVerificationPolling.ts`

On the verify page we:

- Render a centered card with the target email and clear calls-to-action
- Start polling `user.reload()` to detect when `emailVerified` becomes true
- Redirect to `/dashboard` automatically once verified

```tsx
const { isPolling, startPolling } = useVerificationPolling(user, () => {
  router.push("/dashboard");
});

useEffect(() => {
  if (user && !user.emailVerified) startPolling();
}, [user, startPolling]);
```

This keeps verification detection scoped to the verification screen, avoiding duplicated polling elsewhere.
