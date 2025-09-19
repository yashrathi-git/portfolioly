"use client";
import { AuthProvider } from "@/lib/auth/AuthContext";
import ThemeProvider from "./ThemeProvider";

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
