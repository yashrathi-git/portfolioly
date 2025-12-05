"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import withAuth from "@/lib/auth/withAuth";
import { setHasPortfolioCookie } from "@/lib/auth/routeGuards";
import { toast } from "sonner";
import { PortfolioEditor } from "@/components/edit/PortfolioEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { PortfolioData } from "portfolioly-schema";
import {
  getUserPortfolio,
  saveUserPortfolio,
  PortfolioAPIError,
} from "@/lib/api/portfolio";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { validatePortfolioDataSafe } from "portfolioly-schema";

type SnapshotPortfolio = Record<string, unknown> & {
  work_experiences?: Array<Record<string, unknown> | null | undefined>;
  education?: Array<Record<string, unknown> | null | undefined>;
};

type PlainObject = Record<string, unknown>;

function stripBackendOnlyFields(snapshotData: SnapshotPortfolio) {
  const transformEntries = (
    entries?: Array<PlainObject | null | undefined>
  ) => {
    if (!Array.isArray(entries)) {
      return entries;
    }

    return entries
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const { brandfetch_logo_url, brandfetch_domain, ...rest } = entry;
        void brandfetch_logo_url;
        void brandfetch_domain;

        return { ...rest };
      })
      .filter((entry): entry is PlainObject => Boolean(entry));
  };

  const sanitized: SnapshotPortfolio = {
    ...snapshotData,
    work_experiences: transformEntries(snapshotData.work_experiences),
    education: transformEntries(snapshotData.education),
  } as SnapshotPortfolio;

  // Remove keys whose value became undefined after transformation
  Object.keys(sanitized).forEach((key) => {
    const typedKey = key as keyof SnapshotPortfolio;
    if (sanitized[typedKey] === undefined) {
      delete sanitized[typedKey];
    }
  });

  return sanitized;
}

function coercePortfolioData(snapshotData: SnapshotPortfolio): PortfolioData {
  const partial = snapshotData as Partial<PortfolioData>;

  const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

  return {
    personal_info:
      (partial.personal_info as PortfolioData["personal_info"]) ?? {
        profiles: [],
        tags: [],
      },
    work_experiences: toArray(
      partial.work_experiences
    ) as PortfolioData["work_experiences"],
    projects: toArray(partial.projects) as PortfolioData["projects"],
    education: toArray(partial.education) as PortfolioData["education"],
    certifications: toArray(
      partial.certifications
    ) as PortfolioData["certifications"],
    text_blobs: (partial.text_blobs as PortfolioData["text_blobs"]) ?? {},
    metadata: (partial.metadata as PortfolioData["metadata"]) ?? {},
    layout_settings:
      (partial.layout_settings as PortfolioData["layout_settings"]) ?? {
        layout_mode: "both",
        default_layout: "chat",
      },
  };
}

function EditPage() {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Set cookie to indicate user has a portfolio (for future auth redirects)
  useEffect(() => {
    setHasPortfolioCookie();
  }, []);

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

  // Subscribe to real-time updates AFTER initial load to avoid duplicate fetch
  useEffect(() => {
    if (!user?.uid || loading) {
      return undefined;
    }

    let unsubscribe: Unsubscribe | undefined;

    const subscribeToUpdates = async () => {
      try {
        const db = getFirestoreDb();
        const portfolioDoc = doc(db, "portfolios", user.uid);

        unsubscribe = onSnapshot(portfolioDoc, (snapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          const snapshotData = snapshot.data();
          if (!snapshotData) {
            return;
          }

          const { updated_at: removedUpdatedAt, ...rest } = snapshotData;
          void removedUpdatedAt;

          const sanitized = stripBackendOnlyFields(rest);
          const validationResult = validatePortfolioDataSafe(sanitized);

          if (hasUnsavedChangesRef.current) {
            return;
          }

          if (validationResult.success) {
            setPortfolioData(validationResult.data);
            setHasUnsavedChanges(false);
            return;
          }

          console.warn(
            "Portfolio snapshot failed strict validation; using relaxed parsing.",
            validationResult.error.issues
          );

          setPortfolioData(coercePortfolioData(sanitized));
          setHasUnsavedChanges(false);
        });
      } catch (subscriptionError) {
        console.error(
          "Failed to subscribe to portfolio updates:",
          subscriptionError
        );
      }
    };

    subscribeToUpdates();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, loading]);

  // Handle portfolio data changes
  const handlePortfolioChange = (newData: PortfolioData) => {
    setPortfolioData(newData);
    setHasUnsavedChanges(true);
  };

  // Save portfolio data
  const handleSave = async () => {
    if (!portfolioData) return;

    try {
      setSaving(true);
      setError(null);

      await saveUserPortfolio(portfolioData);

      setHasUnsavedChanges(false);

      // Show success toast
      toast.success("Portfolio saved successfully!", {
        duration: 3000,
        position: "bottom-right",
      });
    } catch (err) {
      if (err instanceof PortfolioAPIError) {
        setError(err.message);
        toast.error("Failed to save portfolio", {
          description: err.message,
          duration: 5000,
          position: "bottom-right",
        });
      } else {
        const errorMessage = "Failed to save portfolio";
        setError(errorMessage);
        toast.error(errorMessage, {
          duration: 5000,
          position: "bottom-right",
        });
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
    <main className="w-full">
      {/* Error Messages */}
      {error && (
        <div className="container px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <PortfolioEditor
        initial={portfolioData || undefined}
        onChange={handlePortfolioChange}
        onSave={handleSave}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
        userName={user?.displayName || user?.email?.split("@")[0]}
      />
    </main>
  );
}

export default withAuth(EditPage, { requireVerification: true });
