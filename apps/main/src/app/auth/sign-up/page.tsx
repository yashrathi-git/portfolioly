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
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly";

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
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
        <CardDescription>Create an account to get started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SignUpForm onDone={() => router.push("/auth/sign-in")} />

        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Button variant="link" className="px-1" asChild>
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
