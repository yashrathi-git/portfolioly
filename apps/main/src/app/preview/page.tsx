"use client";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";
import { env } from "@/lib/env";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portfolio } from "portfolioly-template-components";
import { fetchUsernameAndToken } from "@/lib/api/publicToken";
import { getUserPortfolio } from "@/lib/api/portfolio";
import type { PortfolioData } from "portfolioly-schema";

// Import the compiled CSS styles to ensure they're loaded
import "portfolioly-template-components/style.css";

/**
 * Authenticated preview page - shows user's portfolio in fullscreen mode
 * Requires authentication and redirects to sign-in if not authenticated
 */
export default function PreviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [username, setUsername] = useState<string | undefined>();
  const [publicToken, setPublicToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parallel fetch of portfolio data and token
  const fetchAllData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const authToken = await user.getIdToken();

      // Fetch portfolio and token data in parallel
      const [portfolioData, tokenData] = await Promise.all([
        getUserPortfolio(),
        fetchUsernameAndToken(user.uid, authToken).catch((err) => {
          console.error("Failed to fetch username and token:", err);
          return null; // Don't fail the whole request if token fetch fails
        }),
      ]);

      setData(portfolioData);
      if (tokenData) {
        setUsername(tokenData.username);
        setPublicToken(tokenData.publicToken);
      }
    } catch (err) {
      console.error("Error fetching preview data:", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?redirect=/preview");
    }
  }, [user, authLoading, router]);

  // Fetch data when user is available
  useEffect(() => {
    if (!authLoading && user) {
      fetchAllData();
    }
  }, [user, authLoading, fetchAllData]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your portfolio...</span>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Failed to Load Portfolio</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => fetchAllData()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/edit")}>
              Back to Editor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no portfolio data
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Portfolio Data</h1>
            <p className="text-muted-foreground">
              You have not created a portfolio yet. Start by uploading your
              resume or connecting your GitHub.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push("/upload")}>
              Upload Content
            </Button>
            <Button variant="outline" onClick={() => router.push("/edit")}>
              Go to Editor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transform backend data to display format
  const displayData = mapPortfolioDataToTemplate(data);

  // Render portfolio in fullscreen mode
  return (
    <div className="h-full w-full">
      <Portfolio
        portfolioData={displayData}
        isLoading={false}
        isOwner={true}
        isPreview={false}
        apiBaseUrl={env.API_BASE_URL}
        username={username}
        publicToken={publicToken}
      />
    </div>
  );
}
