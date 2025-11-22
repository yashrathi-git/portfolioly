"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage if available; otherwise default to light
  useEffect(() => {
    setMounted(true);
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const root = document.documentElement;

    if (stored === "dark") {
      root.classList.add("dark");
      setIsDark(true);
    } else if (stored === "light") {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      // No stored preference; default to light theme
      root.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    if (next) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`inline-flex h-9 w-9 items-center justify-center ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background/80 backdrop-blur-sm text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 transition-transform rotate-0 scale-100" />
      )}
    </button>
  );
};

export default ThemeToggle;
