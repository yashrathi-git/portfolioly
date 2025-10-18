/**
 * Server-side data provider for Next.js SSR/SSG support
 */

import type { DisplayPortfolioData, PortfolioData } from "@portfolioly/schema";
import {
  mapBackendToDisplay,
  validatePortfolioData,
} from "@portfolioly/schema";
import { TemplateConfig } from "../config/template-config";

export interface ServerDataProviderOptions {
  config: TemplateConfig;
  baseUrl?: string;
  authToken?: string;
}

export interface ServerFetchResult {
  data?: DisplayPortfolioData | null;
  error?: string;
  notFound?: boolean;
  revalidate?: number; // For ISR
}

export class ServerDataProvider {
  private config: TemplateConfig;
  private baseUrl: string;
  private authToken?: string;

  constructor(options: ServerDataProviderOptions) {
    this.config = options.config;
    this.baseUrl = options.baseUrl || "";
    this.authToken = options.authToken;
  }

  /**
   * Fetch portfolio data for server-side rendering
   */
  async fetchPortfolioData(username?: string): Promise<ServerFetchResult> {
    try {
      let backendData: PortfolioData | null = null;

      if (username) {
        // Public portfolio request
        backendData = await this.fetchPublicPortfolio(username);
      } else {
        // Private portfolio request (requires auth)
        if (!this.authToken) {
          return {
            error: "Authentication required for private portfolio access",
            notFound: true,
          };
        }
        backendData = await this.fetchPrivatePortfolio();
      }

      if (!backendData) {
        return {
          data: null,
          notFound: true,
          revalidate: 60, // Revalidate in 1 minute for ISR
        };
      }

      const portfolioData = mapBackendToDisplay(backendData);

      return {
        data: portfolioData,
        revalidate: username ? 300 : 60, // 5 minutes for public, 1 minute for private
      };
    } catch (error) {
      console.error("Server-side portfolio fetch failed:", error);

      // Try JSON fallback if configured
      if (
        this.config.dataSource === "hybrid" ||
        this.config.dataSource === "json"
      ) {
        try {
          const jsonData = await this.fetchFromJson();
          if (jsonData) {
            return {
              data: mapBackendToDisplay(jsonData),
              revalidate: 3600, // 1 hour for JSON data
            };
          }
        } catch (jsonError) {
          console.error("JSON fallback also failed:", jsonError);
        }
      }

      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch portfolio data",
        revalidate: 30, // Retry in 30 seconds on error
      };
    }
  }

  /**
   * Fetch public portfolio by username
   */
  private async fetchPublicPortfolio(
    username: string
  ): Promise<PortfolioData | null> {
    const endpoint =
      this.config.apiEndpoints?.publicPortfolio || "/api/public/portfolio";
    const url = `${this.baseUrl}${endpoint}/${encodeURIComponent(username)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null; // Portfolio not found or private
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch public portfolio: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    try {
      return validatePortfolioData(data);
    } catch (error) {
      throw new Error("Invalid portfolio data structure received from API");
    }
  }

  /**
   * Fetch private portfolio (authenticated)
   */
  private async fetchPrivatePortfolio(): Promise<PortfolioData | null> {
    const endpoint =
      this.config.apiEndpoints?.authenticatedPortfolio || "/api/portfolio";
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    if (response.status === 404) {
      return null; // No portfolio found
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch private portfolio: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    try {
      return validatePortfolioData(data);
    } catch (error) {
      throw new Error("Invalid portfolio data structure received from API");
    }
  }

  /**
   * Fetch data from JSON file (server-side)
   */
  private async fetchFromJson(): Promise<PortfolioData | null> {
    const jsonPath = this.config.jsonFiles?.portfolioData;

    if (!jsonPath) {
      throw new Error("No JSON file path configured");
    }

    // In server environment, we might need to read from filesystem
    // For now, we'll try to fetch it as a URL
    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`Failed to load JSON file: ${response.status}`);
    }

    const data = await response.json();

    try {
      return validatePortfolioData(data);
    } catch (error) {
      throw new Error("Invalid JSON structure in portfolio data file");
    }
  }

  /**
   * Batch fetch multiple portfolios (for listing pages)
   */
  async fetchMultiplePortfolios(usernames: string[]): Promise<{
    portfolios: Array<{
      username: string;
      data?: DisplayPortfolioData | null;
      error?: string;
    }>;
    revalidate: number;
  }> {
    const results = await Promise.allSettled(
      usernames.map(async (username) => {
        try {
          const result = await this.fetchPortfolioData(username);
          return {
            username,
            data: result.data,
            error: result.error,
          };
        } catch (error) {
          return {
            username,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    return {
      portfolios: results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            username: usernames[index],
            error: result.reason?.message || "Failed to load portfolio",
          };
        }
      }),
      revalidate: 300, // 5 minutes for batch operations
    };
  }

  /**
   * Check if portfolio exists (for 404 handling)
   */
  async checkPortfolioExists(username: string): Promise<boolean> {
    try {
      const result = await this.fetchPortfolioData(username);
      return !result.notFound && !result.error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get static paths for SSG (list of usernames)
   * Note: Without a featured portfolios endpoint, this returns empty array
   * Static paths would need to be provided manually or through other means
   */
  async getStaticPaths(): Promise<string[]> {
    try {
      // Since we don't have a featured portfolios endpoint,
      // return empty array - paths will be generated on-demand with fallback: 'blocking'
      console.warn(
        "No featured portfolios endpoint available, using on-demand generation"
      );
      return [];
    } catch (error) {
      console.error("Error fetching static paths:", error);
      return [];
    }
  }
}

/**
 * Helper function to create server data provider from Next.js context
 */
export function createServerDataProvider(
  config: TemplateConfig,
  context?: {
    req?: any;
    baseUrl?: string;
    authToken?: string;
  }
): ServerDataProvider {
  const baseUrl =
    context?.baseUrl ||
    (typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_URL || ""
      : "");

  return new ServerDataProvider({
    config,
    baseUrl,
    authToken: context?.authToken,
  });
}

/**
 * Next.js helper for getServerSideProps
 */
export async function getServerSidePortfolioProps(
  config: TemplateConfig,
  username?: string,
  authToken?: string
) {
  const provider = createServerDataProvider(config, { authToken });
  const result = await provider.fetchPortfolioData(username);

  if (result.notFound) {
    return {
      notFound: true,
    };
  }

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    props: {
      portfolioData: result.data,
      username: username || null,
    },
  };
}

/**
 * Next.js helper for getStaticProps
 */
export async function getStaticPortfolioProps(
  config: TemplateConfig,
  username: string
) {
  const provider = createServerDataProvider(config);
  const result = await provider.fetchPortfolioData(username);

  if (result.notFound) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      portfolioData: result.data || null,
      username,
    },
    revalidate: result.revalidate || 300,
  };
}

/**
 * Next.js helper for getStaticPaths
 */
export async function getStaticPortfolioPaths(config: TemplateConfig) {
  const provider = createServerDataProvider(config);
  const usernames = await provider.getStaticPaths();

  return {
    paths: usernames.map((username) => ({
      params: { username },
    })),
    fallback: "blocking", // Generate pages on-demand for new usernames
  };
}
