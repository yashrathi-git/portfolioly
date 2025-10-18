"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import withAuth from "@/lib/auth/withAuth";
// Dynamic import to disable SSR for PortfolioEditor
const PortfolioEditor = dynamic(
  () =>
    import("@/components/edit/PortfolioEditor").then((mod) => ({
      default: mod.PortfolioEditor,
    })),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertCircle } from "lucide-react";
import type { PortfolioData } from "@portfolioly/schema";
import {
  getUserPortfolio,
  saveUserPortfolio,
  PortfolioAPIError,
} from "@/lib/api/portfolio";

function EditPage() {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load portfolio data on mount
  useEffect(() => {
    async function loadPortfolio() {
      try {
        setLoading(true);
        setError(null);

        const data = await getUserPortfolio();
        setPortfolioData(data);
      } catch (err) {
        if (err instanceof PortfolioAPIError) {
          setError(err.message);
        } else {
          setError("Failed to load portfolio data");
        }
        console.error("Error loading portfolio:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadPortfolio();
    }
  }, [user]);

  // Handle portfolio data changes
  const handlePortfolioChange = (newData: PortfolioData) => {
    setPortfolioData(newData);
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Save portfolio data
  const handleSave = async () => {
    if (!portfolioData) return;

    try {
      setSaving(true);
      setError(null);

      await saveUserPortfolio(portfolioData);

      setHasUnsavedChanges(false);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof PortfolioAPIError) {
        setError(err.message);
      } else {
        setError("Failed to save portfolio");
      }
      console.error("Error saving portfolio:", err);
    } finally {
      setSaving(false);
    }
  };

  // Retry loading portfolio
  const handleRetry = () => {
    setError(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading your portfolio...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Portfolio
            </h1>
            <p className="text-muted-foreground">
              Manage your professional portfolio
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Unable to load your portfolio data.
              </p>
              <Button onClick={handleRetry}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Portfolio
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.displayName || user?.email?.split("@")[0]}!
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <Alert>
            <AlertDescription>Portfolio saved successfully!</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <PortfolioEditor
          initial={portfolioData || undefined}
          onChange={handlePortfolioChange}
        />
      </div>
    </main>
  );
}

export default withAuth(EditPage, { requireVerification: true });
