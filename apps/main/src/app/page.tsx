"use client";
import {} from "react";
import {} from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuth();

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly";

  // Optional: No imperative redirect here; let UI and ProtectedRoute handle gating
  // No redirects from home; UI handles state

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center">
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to {appName}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your portfolio management platform. Create, manage, and showcase
            your work with ease.
          </p>
        </div>

        {user ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>
                Signed in as {user.displayName || user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.emailVerified ? (
                <Button className="w-full" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Please verify your email to continue
                  </p>
                  <Button className="w-full" asChild>
                    <Link href="/auth/verify-email">
                      Verify Email
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build beautiful portfolios with our intuitive tools and
                templates.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize your projects, skills, and achievements in one place.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Showcase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share your work with the world through professional
                presentations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
