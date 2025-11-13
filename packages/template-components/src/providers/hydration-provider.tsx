/**
 * Client-side hydration and data passing utilities for Next.js
 */

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import type { DisplayPortfolioData } from "portfolioly-schema";
import { TemplateConfig } from "../config/template-config";
import { BatchDataProvider } from "./batch-data-provider";

interface HydrationContextValue {
  portfolioData?: DisplayPortfolioData | null;
  isLoading: boolean;
  error?: string;
  dataProvider?: BatchDataProvider;
  refreshData: () => Promise<void>;
  setPortfolioData: (data: DisplayPortfolioData | null) => void;
}

const HydrationContext = createContext<HydrationContextValue | null>(null);

interface HydrationProviderProps {
  children: ReactNode;
  config: TemplateConfig;
  initialData?: DisplayPortfolioData | null;
  username?: string;
  baseUrl?: string;
}

export function HydrationProvider({
  children,
  config,
  initialData,
  username,
  baseUrl = "",
}: HydrationProviderProps) {
  const [portfolioData, setPortfolioData] =
    useState<DisplayPortfolioData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [dataProvider] = useState(() => new BatchDataProvider(config, baseUrl));

  // Hydration effect - prevent unnecessary client-side fetches if we have server data
  useEffect(() => {
    // If we have initial data from server, don't fetch again
    if (initialData) {
      setPortfolioData(initialData);
      return;
    }

    // If no initial data and we're in client-side mode, fetch data
    if (typeof window !== "undefined" && !portfolioData && !isLoading) {
      refreshData();
    }
  }, [initialData, username]);

  const refreshData = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const result = await dataProvider.batchLoadPortfolioData({
        username,
        forceRefresh: true,
      });

      if (result.error) {
        setError(result.error);
        // Use fallback data if available
        if (result.portfolioData) {
          setPortfolioData(result.portfolioData);
        }
      } else {
        setPortfolioData(result.portfolioData || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load portfolio data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: HydrationContextValue = {
    portfolioData,
    isLoading,
    error,
    dataProvider,
    refreshData,
    setPortfolioData,
  };

  return (
    <HydrationContext.Provider value={contextValue}>
      {children}
    </HydrationContext.Provider>
  );
}

/**
 * Hook to access portfolio data from hydration context
 */
export function usePortfolioData() {
  const context = useContext(HydrationContext);

  if (!context) {
    throw new Error("usePortfolioData must be used within a HydrationProvider");
  }

  return context;
}

/**
 * Higher-order component to wrap components with portfolio data
 */
export function withPortfolioData<P extends object>(
  Component: React.ComponentType<
    P & { portfolioData?: DisplayPortfolioData | null }
  >
) {
  return function WrappedComponent(props: P) {
    const { portfolioData } = usePortfolioData();

    return <Component {...props} portfolioData={portfolioData} />;
  };
}

/**
 * Utility to serialize portfolio data for Next.js props
 */
export function serializePortfolioData(
  data: DisplayPortfolioData | null
): string {
  if (!data) return "null";

  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Failed to serialize portfolio data:", error);
    return "null";
  }
}

/**
 * Utility to deserialize portfolio data from Next.js props
 */
export function deserializePortfolioData(
  serialized: string
): DisplayPortfolioData | null {
  if (!serialized || serialized === "null") return null;

  try {
    return JSON.parse(serialized);
  } catch (error) {
    console.error("Failed to deserialize portfolio data:", error);
    return null;
  }
}

/**
 * Hook for client-side data fetching with hydration awareness
 */
export function useClientSidePortfolioData(
  config: TemplateConfig,
  username?: string,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    baseUrl?: string;
  } = {}
) {
  const { enabled = true, refetchOnMount = false, baseUrl = "" } = options;
  const [data, setData] = useState<DisplayPortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [dataProvider] = useState(() => new BatchDataProvider(config, baseUrl));

  const fetchData = async () => {
    if (!enabled || isLoading) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const result = await dataProvider.batchLoadPortfolioData({
        username,
        forceRefresh: refetchOnMount,
      });

      if (result.error) {
        setError(result.error);
        if (result.portfolioData) {
          setData(result.portfolioData);
        }
      } else {
        setData(result.portfolioData || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load portfolio data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      fetchData();
    }
  }, [enabled, username]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    dataProvider,
  };
}

/**
 * Component for handling loading states during hydration
 */
interface HydrationBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: (error: string) => ReactNode;
}

export function HydrationBoundary({
  children,
  fallback = <div>Loading...</div>,
  errorFallback = (error) => <div>Error: {error}</div>,
}: HydrationBoundaryProps) {
  const { portfolioData, isLoading, error } = usePortfolioData();

  if (error) {
    return <>{errorFallback(error)}</>;
  }

  if (isLoading && !portfolioData) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Utility for Next.js pages to handle hydration
 */
export interface HydratedPageProps {
  portfolioData?: DisplayPortfolioData | null;
  username?: string;
  config: TemplateConfig;
}

export function createHydratedPage<P extends HydratedPageProps>(
  PageComponent: React.ComponentType<P>,
  config: TemplateConfig
) {
  return function HydratedPage(props: P) {
    return (
      <HydrationProvider
        config={config}
        initialData={props.portfolioData}
        username={props.username}
      >
        <PageComponent {...props} />
      </HydrationProvider>
    );
  };
}

export default HydrationProvider;
