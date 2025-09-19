"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Higher-order component that wraps a page component with authentication protection
 *
 * Usage:
 * ```tsx
 * export default withAuth(MyProtectedPage);
 * ```
 *
 * Or for pages that don't require email verification:
 * ```tsx
 * export default withAuth(MyPage, { requireVerification: false });
 * ```
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: { requireVerification?: boolean } = { requireVerification: true }
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute requireVerification={options.requireVerification}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export default withAuth;
