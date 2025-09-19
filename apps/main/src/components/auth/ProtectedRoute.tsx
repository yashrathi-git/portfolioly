"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        // No user signed in, redirect to sign in
        console.log("ProtectedRoute - No user, redirecting to sign-in");
        router.push("/auth/sign-in");
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
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>Please wait…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || (requireVerification && !user.emailVerified)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
