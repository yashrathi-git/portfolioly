"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  fetchPublicPortfolio,
  PublicPortfolioError,
} from "@/lib/api/publicPortfolio";
import { mapPortfolioDataToTemplate } from "@/utils/portfolioDataMapper";
import { env } from "@/lib/env";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portfolio } from "portfolioly-template-components";
import type { PortfolioData } from "portfolioly-schema";

interface PublicPortfolioPageProps {
  params: {
    username: string;
  };
}

/**
 * Public portfolio page - displays a user's portfolio at /p/[username]
 * Accessible without authentication if the portfolio is set to public
 */
export default function PublicPortfolioPage({
  params,
}: PublicPortfolioPageProps) {
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { username } = params;

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: portfolioData, publicToken: token } =
          await fetchPublicPortfolio(username);
        setData(portfolioData);
        setPublicToken(token);
      } catch (err) {
        if (err instanceof PublicPortfolioError) {
          if (err.statusCode === 404) {
            // Trigger Next.js not-found page
            notFound();
          } else if (err.statusCode && err.statusCode >= 500) {
            setError(
              "The server is temporarily unavailable. Please try again in a moment."
            );
          } else if (!err.statusCode) {
            setError(
              "Unable to connect to the server. Please check your internet connection and try again."
            );
          } else {
            setError(err.message || "Failed to load portfolio");
          }
        } else if (err instanceof TypeError && err.message.includes("fetch")) {
          setError(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load portfolio"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolio();
  }, [username]);

  // Show loading state while fetching portfolio data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading portfolio...</span>
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
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no portfolio data (shouldn't happen but handle gracefully)
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Portfolio Data</h1>
            <p className="text-muted-foreground">
              This portfolio appears to be empty.
            </p>
          </div>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Transform backend data to display format
  const displayData = mapPortfolioDataToTemplate(data);

  // Render portfolio in public mode
  return (
    <div className="min-h-screen">
      <Portfolio
        portfolioData={displayData}
        isLoading={false}
        isOwner={false}
        isPreview={false}
        username={username}
        apiBaseUrl={env.API_BASE_URL}
        publicToken={publicToken || undefined}
      />
    </div>
  );
}
