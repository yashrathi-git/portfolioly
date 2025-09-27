/**
 * API client for public portfolio data access
 */

import { BackendPortfolioData } from "../types/portfolio";
import { TemplateConfig } from "../config/template-config";
import { DataProviderError } from "../providers/data-provider";

export class PublicApiClient {
  private config: TemplateConfig;
  private baseUrl: string;

  constructor(config: TemplateConfig, baseUrl: string = "") {
    this.config = config;
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 404) {
        throw new DataProviderError(
          "Portfolio not found or is private",
          "validation"
        );
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
   * Get public portfolio data by username
   */
  async getPublicPortfolioData(
    username: string
  ): Promise<BackendPortfolioData | null> {
    if (!username || username.trim() === "") {
      throw new DataProviderError(
        "Username is required for public portfolio access",
        "validation"
      );
    }

    try {
      const endpoint =
        this.config.apiEndpoints?.publicPortfolio || "/api/public/portfolio";
      const url = `${this.baseUrl}${endpoint}/${encodeURIComponent(username)}`;

      this.log(
        "Fetching public portfolio data for username:",
        username,
        "from:",
        url
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse<BackendPortfolioData | null>(
        response
      );

      this.log("Received public portfolio data:", data);
      return data;
    } catch (error) {
      this.log("Error fetching public portfolio data:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to fetch public portfolio data",
        "network",
        error as Error
      );
    }
  }

  /**
   * Check if username is available for registration
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username || username.trim() === "") {
      throw new DataProviderError(
        "Username is required for availability check",
        "validation"
      );
    }

    try {
      const endpoint =
        this.config.apiEndpoints?.usernameCheck || "/api/public/username";
      const url = `${this.baseUrl}${endpoint}/${encodeURIComponent(
        username
      )}/available`;

      this.log("Checking username availability for:", username, "at:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse<{ available: boolean }>(response);

      this.log("Username availability result:", data.available);
      return data.available;
    } catch (error) {
      this.log("Error checking username availability:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to check username availability",
        "network",
        error as Error
      );
    }
  }

  /**
   * Validate username format
   */
  validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username) {
      return { valid: false, error: "Username is required" };
    }

    if (username.length < 3) {
      return {
        valid: false,
        error: "Username must be at least 3 characters long",
      };
    }

    if (username.length > 30) {
      return {
        valid: false,
        error: "Username must be no more than 30 characters long",
      };
    }

    // Allow alphanumeric characters, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(username)) {
      return {
        valid: false,
        error:
          "Username can only contain letters, numbers, hyphens, and underscores",
      };
    }

    // Don't allow usernames that start or end with hyphens/underscores
    if (
      username.startsWith("-") ||
      username.startsWith("_") ||
      username.endsWith("-") ||
      username.endsWith("_")
    ) {
      return {
        valid: false,
        error: "Username cannot start or end with hyphens or underscores",
      };
    }

    // Reserved usernames
    const reserved = [
      "admin",
      "api",
      "www",
      "mail",
      "ftp",
      "localhost",
      "root",
      "support",
    ];
    if (reserved.includes(username.toLowerCase())) {
      return { valid: false, error: "This username is reserved" };
    }

    return { valid: true };
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[PublicApiClient] ${message}`, ...args);
    }
  }
}
