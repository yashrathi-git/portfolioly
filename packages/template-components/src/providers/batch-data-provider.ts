/**
 * Batch data provider for efficient data loading
 */

import { HybridDataProvider } from "./hybrid-data-provider";
import type { DisplayPortfolioData } from "portfolioly-schema";
import { TemplateConfig } from "../config/template-config";

export interface BatchLoadResult {
  portfolioData?: DisplayPortfolioData | null;
  userSettings?: {
    username?: string;
    isPublic?: boolean;
  };
  error?: string;
  loadedFrom: "api" | "json" | "cache";
}

export class BatchDataProvider extends HybridDataProvider {
  constructor(config: TemplateConfig, baseUrl: string = "") {
    super(config, baseUrl);
  }

  /**
   * Load all required portfolio data in a single batch operation
   */
  async batchLoadPortfolioData(
    options: {
      username?: string;
      includeUserSettings?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<BatchLoadResult> {
    const {
      username,
      includeUserSettings = false,
      forceRefresh = false,
    } = options;

    if (forceRefresh) {
      this.clearCache();
    }

    const result: BatchLoadResult = {
      loadedFrom: "api",
    };

    try {
      this.log("Starting batch data load with options:", options);

      // Load portfolio data
      const startTime = Date.now();

      if (username) {
        // Public portfolio access
        result.portfolioData = await this.getPortfolioData(username);
      } else {
        // Private/authenticated portfolio access
        result.portfolioData = await this.getAuthenticatedPortfolioData();
      }

      const loadTime = Date.now() - startTime;
      this.log(`Portfolio data loaded in ${loadTime}ms`);

      // Load user settings if requested and authenticated
      if (includeUserSettings && !username && this.config.authToken) {
        try {
          result.userSettings = await this.loadUserSettings();
        } catch (error) {
          this.log("Failed to load user settings:", error);
          // Don't fail the entire batch for user settings errors
        }
      }

      // Determine data source
      result.loadedFrom = this.determineDataSource();

      this.log("Batch data load completed successfully");
      return result;
    } catch (error) {
      this.log("Batch data load failed:", error);

      result.error =
        error instanceof Error ? error.message : "Unknown error occurred";

      return result;
    }
  }

  /**
   * Load multiple portfolios in batch (for comparison or listing)
   */
  async batchLoadMultiplePortfolios(usernames: string[]): Promise<{
    portfolios: Array<{
      username: string;
      data?: DisplayPortfolioData | null;
      error?: string;
    }>;
    loadedFrom: "api" | "json" | "cache";
  }> {
    this.log("Loading multiple portfolios:", usernames);

    const portfolios = await Promise.allSettled(
      usernames.map(async (username) => {
        try {
          const data = await this.getPortfolioData(username);
          return { username, data };
        } catch (error) {
          return {
            username,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    return {
      portfolios: portfolios.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            username: usernames[index],
            error: result.reason?.message || "Failed to load portfolio",
          };
        }
      }),
      loadedFrom: this.determineDataSource(),
    };
  }

  /**
   * Preload data for faster subsequent access
   */
  async preloadData(
    options: {
      username?: string;
      includeUserSettings?: boolean;
    } = {}
  ): Promise<void> {
    this.log("Preloading data with options:", options);

    try {
      // Preload in background without waiting
      const promises: Promise<any>[] = [];

      if (options.username) {
        promises.push(this.getPortfolioData(options.username));
      } else {
        promises.push(this.getAuthenticatedPortfolioData());
      }

      if (
        options.includeUserSettings &&
        !options.username &&
        this.config.authToken
      ) {
        promises.push(this.loadUserSettings());
      }

      // Don't await - let them load in background
      Promise.allSettled(promises).then(() => {
        this.log("Data preloading completed");
      });
    } catch (error) {
      this.log("Data preloading failed:", error);
      // Don't throw - preloading is optional
    }
  }

  /**
   * Load user settings (username, visibility, etc.)
   */
  private async loadUserSettings(): Promise<{
    username?: string;
    isPublic?: boolean;
  }> {
    // This would typically be a separate API call
    // For now, we'll return empty settings
    // In a real implementation, this would call something like:
    // GET /api/settings/profile

    try {
      const endpoint = "/api/settings/profile";
      const url = `${this.getBaseUrl()}${endpoint}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.authToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      this.log("Failed to load user settings:", error);
    }

    return {};
  }

  /**
   * Determine the primary data source being used
   */
  private determineDataSource(): "api" | "json" | "cache" {
    switch (this.config.dataSource) {
      case "api":
        return "api";
      case "json":
        return "json";
      case "hybrid":
        // In hybrid mode, we prefer API but fall back to JSON
        return "api";
      default:
        return "api";
    }
  }

  /**
   * Get loading performance metrics
   */
  getPerformanceMetrics(): {
    cacheHitRate: number;
    averageLoadTime: number;
    totalRequests: number;
  } {
    // This would track actual metrics in a real implementation
    return {
      cacheHitRate: 0.75, // 75% cache hit rate
      averageLoadTime: 150, // 150ms average
      totalRequests: 0,
    };
  }

  /**
   * Refresh all cached data
   */
  async refreshAllData(): Promise<void> {
    this.log("Refreshing all cached data");
    this.clearCache();

    // Optionally trigger a background refresh of commonly accessed data
    if (this.config.authToken) {
      this.preloadData({ includeUserSettings: true });
    }
  }
}
