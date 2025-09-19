"use client";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { useEffect } from "react";

export default function RootProviders({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    
      const prefersDark = typeof window !== "undefined" && window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = stored ? stored === "dark" : prefersDark;
      document.documentElement.classList.toggle("dark", !!shouldDark);
    } catch {
      // no-op
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}