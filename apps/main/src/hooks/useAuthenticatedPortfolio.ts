/**
 * Hook for fetching authenticated portfolio data
 * This integrates with the template components' data providers
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { PortfolioData } from "@/types/portfolio";
import { getPortfolioData } from "@/lib/api/portfolio";

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

  const fetchData = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const portfolioData = await getPortfolioData();
      setData(portfolioData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch portfolio data";
      setError(errorMessage);
      console.error("Error fetching authenticated portfolio data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setData(null);
      setError(null);
    }
  }, [user]);

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
