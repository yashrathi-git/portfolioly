"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPostAuthRedirectPath } from "@/lib/auth/routeGuards";
import Link from "next/link";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly";

  useEffect(() => {
    if (user && !loading) {
      router.push(getPostAuthRedirectPath(user));
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading</CardTitle>
          <CardDescription>Please wait…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-2xl">{appName}</CardTitle>
        <CardDescription>Welcome back. Sign in to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm onDone={() => router.push("/dashboard")} />

        <div className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Button variant="link" className="px-1" asChild>
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
