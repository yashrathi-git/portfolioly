"use client";
import { AuthProvider } from "@/lib/auth/AuthContext";
import ThemeProvider from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
