/**
 * Hook for fetching authenticated portfolio data
 * This integrates with the template components' data providers
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { PortfolioData } from "portfolioly-schema";
import { getUserPortfolio } from "@/lib/api/portfolio";

export interface UseAuthenticatedPortfolioResult {
  data: PortfolioData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAuthenticatedPortfolio(): UseAuthenticatedPortfolioResult {
  const { user } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const portfolioData = await getUserPortfolio();
      setData(portfolioData);
    } catch (err) {
      console.error("Error fetching authenticated portfolio data:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to fetch portfolio data";

      if (err instanceof Error) {
        // Network errors
        if (err.message.includes("fetch") || err.message.includes("network")) {
          errorMessage =
            "Unable to connect to the server. Please check your internet connection and try again.";
        }
        // Authentication errors
        else if (
          err.message.includes("401") ||
          err.message.includes("unauthorized")
        ) {
          errorMessage =
            "Your session has expired. Please refresh the page and sign in again.";
        }
        // Server errors
        else if (err.message.includes("500") || err.message.includes("503")) {
          errorMessage =
            "The server is temporarily unavailable. Please try again in a moment.";
        }
        // Use the error message if it's user-friendly
        else if (err.message && !err.message.includes("HTTP")) {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setData(null);
      setError(null);
    }
  }, [user, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook that integrates with template components' data providers
 * This could be used for live preview functionality in the future
 */
export function useTemplateComponentsIntegration() {
  const { data, isLoading, error, refetch } = useAuthenticatedPortfolio();

  // Future: This could create and manage a BatchDataProvider instance
  // and provide it to template components for real-time data updates

  return {
    portfolioData: data,
    isLoading,
    error,
    refreshData: refetch,
    // Future: dataProvider instance could be returned here
  };
}
