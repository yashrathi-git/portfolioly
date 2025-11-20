"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export default function ProtectedRoute({
  children,
  requireVerification = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user signed in, redirect to landing page
        console.log("ProtectedRoute - No user, redirecting to landing page");
        router.push("/");
      } else if (requireVerification && !user.emailVerified) {
        // User signed in but not verified, redirect to verification
        console.log(
          "ProtectedRoute - Unverified user, redirecting to verification",
          {
            email: user.email,
            emailVerified: user.emailVerified,
          }
        );
        router.push("/auth/verify-email");
      } else {
        console.log("ProtectedRoute - User is verified, allowing access", {
          email: user.email,
          emailVerified: user.emailVerified,
        });
      }
    }
  }, [user, loading, router, requireVerification]);

  if (loading) {
    return <LoadingScreen message="Please wait..." />;
  }

  if (!user || (requireVerification && !user.emailVerified)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
