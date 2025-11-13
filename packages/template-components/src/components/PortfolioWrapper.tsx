"use client";

import { useEffect, useState } from "react";
import { Portfolio, type PortfolioProps } from "./Portfolio";
import type { DisplayPortfolioData } from "portfolioly-schema";
import { PublicApiClient } from "../clients/public-api-client";
import { mapBackendToDisplay } from "portfolioly-schema";
import { DataProviderError } from "../providers/data-provider";
import type { TemplateConfig } from "../config/template-config";

export interface PortfolioWrapperProps
  extends Omit<PortfolioProps, "portfolioData" | "isLoading" | "error"> {
  // Optional: Provide data directly (skip API call)
  portfolioData?: DisplayPortfolioData | null;

  // Required when portfolioData not provided
  username?: string;
  apiBaseUrl?: string;

  // Optional: For authenticated access
  publicToken?: string;

  // All other Portfolio props are passed through
  // (isOwner, isPreview, profile, suggestions, presets, etc.)
}

/**
 * Wrapper component that handles data fetching for Portfolio component.
 *
 * When portfolioData is provided, it passes it directly to Portfolio.
 * When portfolioData is not provided, it fetches data from the API using
 * username and apiBaseUrl, then transforms it to display format.
 *
 * @example
 * // With provided data
 * <PortfolioWrapper portfolioData={myData} />
 *
 * @example
 * // With API fetching
 * <PortfolioWrapper
 *   username="johndoe"
 *   apiBaseUrl="https://api.example.com"
 *   publicToken="psk_token123"
 * />
 */
export const PortfolioWrapper = ({
  portfolioData,
  username,
  apiBaseUrl,
  publicToken,
  ...otherProps
}: PortfolioWrapperProps) => {
  const [data, setData] = useState<DisplayPortfolioData | null>(null);
  // Initialize loading to true if we need to fetch data (portfolioData not provided)
  const [loading, setLoading] = useState(portfolioData === undefined);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    // If portfolioData is provided, use it directly
    if (portfolioData !== undefined) {
      return;
    }

    // Validate required props when portfolioData not provided
    if (!username || !apiBaseUrl) {
      setError(
        "Username and apiBaseUrl are required when portfolioData is not provided"
      );
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(undefined);

      try {
        const config: TemplateConfig = {
          dataSource: "api",
          apiEndpoints: {
            publicPortfolio: "/public/portfolio",
          },
        };

        const client = new PublicApiClient(config, apiBaseUrl);
        const backendData = await client.getPublicPortfolioData(
          username!,
          publicToken
        );

        if (backendData) {
          const displayData = mapBackendToDisplay(backendData);
          setData(displayData);
        } else {
          setData(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof DataProviderError
            ? err.message
            : "Failed to load portfolio";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [portfolioData, username, apiBaseUrl, publicToken]);

  // Determine effective values based on whether portfolioData was provided
  const effectiveData = portfolioData !== undefined ? portfolioData : data;
  const effectiveLoading = portfolioData !== undefined ? false : loading;
  const effectiveError = portfolioData !== undefined ? undefined : error;

  return (
    <Portfolio
      portfolioData={effectiveData}
      isLoading={effectiveLoading}
      error={effectiveError}
      username={username}
      apiBaseUrl={apiBaseUrl}
      publicToken={publicToken}
      {...otherProps}
    />
  );
};

export default PortfolioWrapper;
