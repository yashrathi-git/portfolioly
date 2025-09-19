# Authentication Protection Guide

## Overview

This app has a comprehensive email verification system that automatically protects routes and ensures only verified users can access protected content.

## How It Works

### Automatic Protection

- **Unverified users** are redirected to `/auth/verify-email`
- **Unauthenticated users** are redirected to `/auth/sign-in`
- **Verified users** land on `/dashboard`

### User States

1. **Not signed in** → Redirected to sign-in page
2. **Signed in but unverified** → Redirected to verification screen
3. **Signed in and verified** → Full access granted

## Protecting Routes

### Method 1: Using `withAuth` HOC (Recommended)

```tsx
// pages/my-protected-page.tsx
import withAuth from "@/lib/auth/withAuth";

function MyProtectedPage() {
  return <div>This page requires email verification</div>;
}

export default withAuth(MyProtectedPage);
```

### Method 2: Using `ProtectedRoute` Component

```tsx
// pages/my-protected-page.tsx
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This page requires email verification</div>
    </ProtectedRoute>
  );
}
```

### Route helpers

Use `getPostAuthRedirectPath(user)` to decide where to route an authenticated user:

```ts
import { getPostAuthRedirectPath } from "@/lib/auth/routeGuards";

router.push(getPostAuthRedirectPath(user));
```

### Method 3: Manual Protection (Advanced)

```tsx
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/sign-in");
      } else if (!user.emailVerified) {
        router.push("/auth/verify-email");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !user.emailVerified) {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

## Options

### Skip Email Verification (Not Recommended)

If you need a page that allows unverified users:

```tsx
import withAuth from "@/lib/auth/withAuth";

function MyPage() {
  return <div>This page only requires sign-in</div>;
}

export default withAuth(MyPage, { requireVerification: false });
```

## UI Components

### HeaderBar

- Shows "Verify Email" button for unverified users
- Shows "(Unverified)" status indicator
- Always shows "Sign out" option

### Home Page

- Shows "Verify Email to Continue" for unverified users
- Shows "Go to Dashboard" for verified users

## Best Practices

1. **Always use protection** for sensitive pages
2. **Use `withAuth` HOC** for simplicity
3. **Test with unverified users** to ensure proper redirects
4. **Provide clear feedback** about verification status

## Testing

To test the verification flow:

1. Register a new account
2. Don't click the verification email
3. Try to access protected routes
4. Verify you're redirected to verification screen
5. Click verification email
6. Verify you can now access protected content

## Security Notes

- Email verification is **required by default**
- Unverified users **cannot access protected routes**
- Verification emails have **1-minute cooldown** to prevent abuse
- Automatic polling checks verification status **every 3-5 seconds**
