"use client";

import { useEffect, useState } from "react";
import {
  TemplateProvider,
  Portfolio,
  mapBackendToFrontend,
} from "@portfolioly/template-components";
import { fetchPublicPortfolio } from "@/lib/api/publicPortfolio";
import { getPSKToken, getUsername, getAPIBaseURL } from "@/lib/env";
import type { PortfolioData } from "@portfolioly/template-components";

export default function Home() {
  const [portfolioData, setPortfolioData] = useState<
    PortfolioData | null | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Get configuration from environment
  const apiBaseUrl = getAPIBaseURL();
  const username = getUsername();
  const pskToken = getPSKToken();

  useEffect(() => {
    async function loadPortfolio() {
      try {
        // Fetch portfolio data using username and PSK token
        const backendData = await fetchPublicPortfolio(
          apiBaseUrl,
          username,
          pskToken
        );

        // Map backend data to portfolio data format
        const mappedData = backendData
          ? mapBackendToFrontend(backendData)
          : null;

        setPortfolioData(mappedData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading portfolio:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load portfolio"
        );
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [apiBaseUrl, username, pskToken]);

  // Show loading screen while fetching
  if (loading) {
    return (
      <TemplateProvider>
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading portfolio...</p>
          </div>
        </main>
      </TemplateProvider>
    );
  }

  // Show error screen if fetch failed
  if (error) {
    return (
      <TemplateProvider>
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-2xl font-semibold">Error Loading Portfolio</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </main>
      </TemplateProvider>
    );
  }

  return (
    <TemplateProvider>
      <main className="min-h-screen bg-background text-foreground">
        <Portfolio
          portfolioData={portfolioData}
          apiBaseUrl={apiBaseUrl}
          username={username}
          publicToken={pskToken}
        />
      </main>
    </TemplateProvider>
  );
}
