# Authentication System

This directory contains the authentication system for the Portfolioly application using Firebase Auth.

## Features

- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Google OAuth**: One-click sign-in with Google accounts
- **Email Verification**: New users must verify their email before accessing the app
- **Type-Safe Error Handling**: Proper TypeScript error handling with user-friendly messages
- **Route Protection**: Client-side route protection for authenticated pages

## Components

### AuthContext.tsx

The main authentication context that provides:

- `user`: Current authenticated user or null
- `loading`: Authentication state loading indicator
- `signIn(email, password)`: Sign in with email/password
- `signUp(email, password, displayName?)`: Create new account
- `signOut()`: Sign out current user
- `signInWithGoogle()`: Sign in with Google OAuth

### Usage

```tsx
import { useAuth } from "@/lib/auth/AuthContext";

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={() => signIn(email, password)}>Sign In</button>
      )}
    </div>
  );
}
```

## Security Features

- Environment variable validation
- Proper error handling and user feedback
- Email verification requirement for new accounts
- Secure Firebase configuration
- Client-side route protection

## Routes

- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/dashboard` - Protected dashboard (requires authentication)
- `/` - Public homepage with auth state awareness
