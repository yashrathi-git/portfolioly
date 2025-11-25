"use client";
import { AuthProvider } from "@/lib/auth/AuthContext";
import ThemeProvider from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import AnalyticsProvider from "./AnalyticsProvider";

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          {children}
          <Toaster />
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
