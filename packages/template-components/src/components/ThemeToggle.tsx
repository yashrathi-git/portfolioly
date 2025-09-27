"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  // Initialize from localStorage if available; otherwise respect current DOM
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const hasStoredDark = stored === "dark";
    const hasStoredLight = stored === "light";

    const root = document.documentElement;

    if (hasStoredDark) {
      root.classList.add("dark");
      setIsDark(true);
    } else if (hasStoredLight) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      // No stored preference; derive from DOM (defaults to dark in this app)
      const currentlyDark = root.classList.contains("dark");
      setIsDark(currentlyDark);
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

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};

export default ThemeToggle;