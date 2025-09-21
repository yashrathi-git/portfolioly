"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthContext";
import { useVerificationPolling } from "@/hooks/useVerificationPolling";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";

export default function VerificationRequiredScreen() {
  const { user, resendVerification, signOut } = useAuth();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isPolling, startPolling, pollingError } = useVerificationPolling(
    user,
    () => {
      // When verification is detected, redirect to dashboard
      router.push("/dashboard");
    }
  );

  useEffect(() => {
    // Start polling when component mounts
    if (user && !user.emailVerified) {
      startPolling();
    }
  }, [user, startPolling]);

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await resendVerification();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend verification email"
      );
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (!user) {
    router.push("/auth/sign-in");
    return null;
  }

  if (user.emailVerified) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-full grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isPolling && (
            <div
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              aria-live="polite"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Waiting for verification...
            </div>
          )}

          {(error || pollingError) && (
            <p className="text-sm text-destructive text-center" role="alert">
              {error || pollingError}
            </p>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t get it? Check your spam folder, then try resending.
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={resending}
              className="w-full"
            >
              {resending ? "Resending..." : "Resend verification email"}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
