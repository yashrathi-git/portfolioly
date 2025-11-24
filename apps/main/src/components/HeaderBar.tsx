"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";
import { WandIcon } from "@/components/icons/PortfoliolyWandIcon";

export default function HeaderBar() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly";

  // Dynamic home route based on auth status
  const homeRoute = user?.emailVerified ? "/dashboard" : "/";

  return (
    <div className="w-full border-b sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link
          href={homeRoute}
          className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          <WandIcon className="h-6 w-6" />
          <span>Portfolioly</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {user ? (
            <div className="flex items-center gap-3">
              {user.emailVerified && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/upload">Create</Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/edit">Edit</Link>
                  </Button>
                </div>
              )}
              <span className="text-muted-foreground hidden sm:inline">
                {user.displayName || user.email}
                {!user.emailVerified && (
                  <span className="ml-2 text-xs text-amber-600 font-medium">
                    (Unverified)
                  </span>
                )}
              </span>
              {!user.emailVerified ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default" asChild>
                    <Link href="/auth/verify-email">Verify Email</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => signOut()}>
                  Sign out
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
