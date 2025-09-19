import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth/AuthContext";
import { getIdToken } from "@/lib/firebase";
import AppHeader from "@/components/AppHeader";

export default function App() {
  const { user, loading, signOut } = useAuth();
  const appName = import.meta.env.VITE_APP_NAME || "Portfolioly";
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const [data, setData] = useState<null | {
    message: string;
    uid?: string | null;
    email?: string | null;
    claims?: Record<string, unknown>;
  }>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark");
    setIsDark(current);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }, [isDark]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const run = async () => {
      if (!user) return;
      setFetching(true);
      setError(null);
      setData(null);
      try {
        const token = await getIdToken();
        if (!token) throw new Error("No ID token available");
        const res = await fetch(`${API_BASE}/protected`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Backend error (${res.status}): ${t}`);
        }
        const json = await res.json();
        if (active) setData(json);
      } catch (e: any) {
        if (active && e.name !== "AbortError")
          setError(e?.message || "Failed to fetch protected data");
      } finally {
        if (active) setFetching(false);
      }
    };

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [user, API_BASE, refreshIndex]);

  const HeaderBar = useMemo(
    () => (
      <AppHeader
        appName={appName}
        isDark={isDark}
        toggleTheme={toggleTheme}
        userDisplay={
          user ? user.displayName || user.email || undefined : undefined
        }
        onSignOut={user ? () => signOut() : undefined}
      />
    ),
    [appName, isDark, toggleTheme, user, signOut]
  );

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
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

  if (!user) {
    return (
      <>
        {HeaderBar}
        <main className="mx-auto max-w-4xl px-4 py-10">
          <AuthShell />
        </main>
      </>
    );
  }

  return (
    <>
      {HeaderBar}
      <main className="mx-auto max-w-4xl px-4 py-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Signed in as {user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page demonstrates verifying your Firebase ID token with a
              FastAPI backend and returning protected data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protected API Data</CardTitle>
            <CardDescription>Fetched from {API_BASE}/protected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fetching && (
              <div className="h-16 animate-pulse rounded-md bg-muted" />
            )}
            {error && (
              <div className="text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
            {data && (
              <pre className="text-xs p-4 rounded-md bg-muted overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => setRefreshIndex((i) => i + 1)}
                disabled={fetching}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
