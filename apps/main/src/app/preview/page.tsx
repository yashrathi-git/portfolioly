"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAuthenticatedPortfolio } from "@/hooks/useAuthenticatedPortfolio";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";
import { env } from "@/lib/env";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Portfolio component
const Portfolio = dynamic(
  () => import("@portfolioly/template-components").then((mod) => mod.Portfolio),
  { ssr: false }
);

/**
 * Authenticated preview page - shows user's portfolio in fullscreen mode
 * Requires authentication and redirects to sign-in if not authenticated
 */
export default function PreviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, error, refetch } = useAuthenticatedPortfolio();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?redirect=/preview");
    }
  }, [user, authLoading, router]);

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

  // Show loading state while fetching portfolio data
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
            <Button onClick={() => refetch()}>Try Again</Button>
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

  // Get auth token for authenticated API calls
  const getAuthToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return undefined;
  };

  // Render portfolio in fullscreen mode
  return (
    <div className="h-full w-full">
      <Portfolio
        portfolioData={displayData}
        isLoading={false}
        isOwner={true}
        isPreview={false}
        apiBaseUrl={env.API_BASE_URL}
      />
    </div>
  );
}
