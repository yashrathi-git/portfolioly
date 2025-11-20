"use client";

import { ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";

export function LandingHeader() {
  const { isDark, toggleTheme } = useTheme();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Portfolioly";

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link
            href="/"
            className="font-semibold tracking-tight text-lg text-foreground"
          >
            <span className="sr-only">{appName}</span>
            {appName}
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <Link
            href="#features"
            className="text-sm/6 font-medium text-foreground hover:opacity-80 transition-opacity"
          >
            Features
          </Link>
          <Link
            href="#examples"
            className="text-sm/6 font-medium text-foreground hover:opacity-80 transition-opacity"
          >
            Examples
          </Link>
          <Link
            href="#pricing"
            className="text-sm/6 font-medium text-foreground hover:opacity-80 transition-opacity"
          >
            Pricing
          </Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </button>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-1 text-sm/6 font-medium text-foreground hover:opacity-80 transition-opacity"
          >
            Log in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
