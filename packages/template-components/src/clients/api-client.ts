/**
 * API client for authenticated portfolio data access
 */

import { BackendPortfolioData } from "../types/portfolio";
import { TemplateConfig } from "../config/template-config";
import { DataProviderError } from "../providers/data-provider";

export class AuthenticatedApiClient {
  private config: TemplateConfig;
  private baseUrl: string;

  constructor(config: TemplateConfig, baseUrl: string = "") {
    this.config = config;
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.config.authToken) {
      headers["Authorization"] = `Bearer ${this.config.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new DataProviderError(
          "Authentication required or token expired",
          "auth"
        );
      } else if (response.status === 403) {
        throw new DataProviderError("Access forbidden", "auth");
      } else if (response.status >= 500) {
        throw new DataProviderError("Server error occurred", "network");
      } else {
        throw new DataProviderError(
          `Request failed with status ${response.status}`,
          "network"
        );
      }
    }

    try {
      return await response.json();
    } catch (error) {
      throw new DataProviderError(
        "Invalid JSON response from server",
        "validation",
        error as Error
      );
    }
  }

  /**
   * Get authenticated user's portfolio data
   */
  async getPortfolioData(): Promise<BackendPortfolioData | null> {
    try {
      const endpoint =
        this.config.apiEndpoints?.authenticatedPortfolio || "/api/portfolio";
      const url = `${this.baseUrl}${endpoint}`;

      this.log("Fetching authenticated portfolio data from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<BackendPortfolioData | null>(
        response
      );

      this.log("Received portfolio data:", data);
      return data;
    } catch (error) {
      this.log("Error fetching portfolio data:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to fetch portfolio data",
        "network",
        error as Error
      );
    }
  }

  /**
   * Save portfolio data for authenticated user
   */
  async savePortfolioData(portfolioData: BackendPortfolioData): Promise<void> {
    try {
      const endpoint =
        this.config.apiEndpoints?.authenticatedPortfolio || "/api/portfolio";
      const url = `${this.baseUrl}${endpoint}`;

      this.log("Saving portfolio data to:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(portfolioData),
      });

      await this.handleResponse(response);
      this.log("Portfolio data saved successfully");
    } catch (error) {
      this.log("Error saving portfolio data:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to save portfolio data",
        "network",
        error as Error
      );
    }
  }

  /**
   * Check if portfolio exists for authenticated user
   */
  async checkPortfolioExists(): Promise<boolean> {
    try {
      const endpoint =
        this.config.apiEndpoints?.authenticatedPortfolio || "/api/portfolio";
      const url = `${this.baseUrl}${endpoint}/exists`;

      this.log("Checking portfolio existence at:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse<{ exists: boolean }>(response);

      this.log("Portfolio exists:", data.exists);
      return data.exists;
    } catch (error) {
      this.log("Error checking portfolio existence:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to check portfolio existence",
        "network",
        error as Error
      );
    }
  }

  /**
   * Delete portfolio data for authenticated user
   */
  async deletePortfolioData(): Promise<void> {
    try {
      const endpoint =
        this.config.apiEndpoints?.authenticatedPortfolio || "/api/portfolio";
      const url = `${this.baseUrl}${endpoint}`;

      this.log("Deleting portfolio data at:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      await this.handleResponse(response);
      this.log("Portfolio data deleted successfully");
    } catch (error) {
      this.log("Error deleting portfolio data:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to delete portfolio data",
        "network",
        error as Error
      );
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[AuthenticatedApiClient] ${message}`, ...args);
    }
  }
}
