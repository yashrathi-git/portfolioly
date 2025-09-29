/**
 * Hybrid data provider that supports both API and JSON data sources
 */

import { BaseDataProvider, DataProviderError } from "./data-provider";
import { AuthenticatedApiClient } from "../clients/api-client";
import { PublicApiClient } from "../clients/public-api-client";
import { JsonFileLoader } from "../clients/json-loader";
import { TemplateConfig } from "../config/template-config";
import { BackendPortfolioData, PortfolioData } from "../types/portfolio";
import { mapBackendToFrontend } from "../utils/data-mapper";

export class HybridDataProvider extends BaseDataProvider {
  private authenticatedClient: AuthenticatedApiClient;
  private publicClient: PublicApiClient;
  private jsonLoader: JsonFileLoader;
  private baseUrl: string;

  constructor(config: TemplateConfig, protected baseUrl: string = "") {
    super(config);
    this.baseUrl = baseUrl;
    this.authenticatedClient = new AuthenticatedApiClient(config, baseUrl);
    this.publicClient = new PublicApiClient(config, baseUrl);
    this.jsonLoader = new JsonFileLoader(config);
  }

  protected getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Get portfolio data with hybrid fallback logic
   */
  async getPortfolioData(username?: string): Promise<PortfolioData | null> {
    const cacheKey = username ? `public_${username}` : "portfolio_data";

    // Check cache first
    const cached = this.getCachedData<PortfolioData>(cacheKey);
    if (cached) {
      this.log("Returning cached portfolio data");
      return cached;
    }

    let backendData: BackendPortfolioData | null = null;
    let dataSource = "";

    try {
      // Try to get data based on configuration and parameters
      if (username) {
        // Public portfolio request
        backendData = await this.getPublicPortfolioData(username);
        dataSource = "public_api";
      } else {
        // Private portfolio request
        backendData = await this.getPrivatePortfolioData();
        dataSource = "private_api";
      }
    } catch (error) {
      this.log("API request failed, attempting fallback:", error);

      // If API fails and we're configured for hybrid mode, try JSON fallback
      if (
        this.config.dataSource === "hybrid" ||
        this.config.dataSource === "json"
      ) {
        try {
          backendData = await this.jsonLoader.loadPortfolioData();
          dataSource = "json_file";
          this.log("Successfully loaded data from JSON fallback");
        } catch (jsonError) {
          this.log("JSON fallback also failed:", jsonError);
          throw error; // Throw original API error
        }
      } else {
        throw error;
      }
    }

    if (!backendData) {
      return null;
    }

    // Transform backend data to frontend format
    const portfolioData = mapBackendToFrontend(backendData);

    // Cache the result
    this.setCachedData(cacheKey, portfolioData);

    this.log(`Portfolio data loaded successfully from ${dataSource}`);
    return portfolioData;
  }

  /**
   * Get private portfolio data with data source selection
   */
  private async getPrivatePortfolioData(): Promise<BackendPortfolioData | null> {
    switch (this.config.dataSource) {
      case "api":
      case "hybrid":
        return await this.authenticatedClient.getPortfolioData();

      case "json":
        return await this.jsonLoader.loadPortfolioData();

      default:
        throw new DataProviderError(
          `Unsupported data source: ${this.config.dataSource}`,
          "validation"
        );
    }
  }

  /**
   * Get public portfolio data with data source selection
   */
  private async getPublicPortfolioData(
    username: string
  ): Promise<BackendPortfolioData | null> {
    switch (this.config.dataSource) {
      case "api":
      case "hybrid":
        return await this.publicClient.getPublicPortfolioData(username);

      case "json":
        // For JSON mode, we ignore the username and load from file
        return await this.jsonLoader.loadPortfolioData();

      default:
        throw new DataProviderError(
          `Unsupported data source: ${this.config.dataSource}`,
          "validation"
        );
    }
  }

  /**
   * Get authenticated portfolio data (always uses API)
   */
  async getAuthenticatedPortfolioData(): Promise<PortfolioData | null> {
    const cacheKey = "authenticated_portfolio";

    // Check cache first
    const cached = this.getCachedData<PortfolioData>(cacheKey);
    if (cached) {
      this.log("Returning cached authenticated portfolio data");
      return cached;
    }

    try {
      const backendData = await this.authenticatedClient.getPortfolioData();

      if (!backendData) {
        return null;
      }

      const portfolioData = mapBackendToFrontend(backendData);

      // Cache the result
      this.setCachedData(cacheKey, portfolioData);

      this.log("Authenticated portfolio data loaded successfully");
      return portfolioData;
    } catch (error) {
      this.log("Failed to load authenticated portfolio data:", error);
      throw error;
    }
  }

  /**
   * Check username availability (always uses API)
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const cacheKey = `username_check_${username}`;

    // Check cache first (short TTL for username checks)
    const cached = this.getCachedData<boolean>(cacheKey);
    if (cached !== null) {
      this.log("Returning cached username availability result");
      return cached;
    }

    try {
      const isAvailable = await this.publicClient.checkUsernameAvailability(
        username
      );

      // Cache the result with shorter TTL
      this.setCachedData(cacheKey, isAvailable);

      return isAvailable;
    } catch (error) {
      this.log("Failed to check username availability:", error);
      throw error;
    }
  }

  /**
   * Set username (always uses authenticated API)
   */
  async setUsername(username: string): Promise<void> {
    // Validate username format first
    const validation = this.publicClient.validateUsername(username);
    if (!validation.valid) {
      throw new DataProviderError(
        validation.error || "Invalid username format",
        "validation"
      );
    }

    try {
      const endpoint =
        this.config.apiEndpoints?.setUsername || "/api/settings/username";
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.authToken}`,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new DataProviderError(
            "Username is already taken",
            "validation"
          );
        }
        throw new DataProviderError(
          `Failed to set username: ${response.status}`,
          "network"
        );
      }

      // Clear relevant caches
      this.clearCache();

      this.log("Username set successfully:", username);
    } catch (error) {
      this.log("Failed to set username:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to set username",
        "network",
        error as Error
      );
    }
  }

  /**
   * Set portfolio visibility (always uses authenticated API)
   */
  async setPortfolioVisibility(isPublic: boolean): Promise<void> {
    try {
      const endpoint =
        this.config.apiEndpoints?.setVisibility || "/api/settings/visibility";
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.authToken}`,
        },
        body: JSON.stringify({ is_public: isPublic }),
      });

      if (!response.ok) {
        throw new DataProviderError(
          `Failed to set portfolio visibility: ${response.status}`,
          "network"
        );
      }

      // Clear relevant caches
      this.clearCache();

      this.log("Portfolio visibility set successfully:", isPublic);
    } catch (error) {
      this.log("Failed to set portfolio visibility:", error);

      if (error instanceof DataProviderError) {
        throw error;
      }

      throw new DataProviderError(
        "Failed to set portfolio visibility",
        "network",
        error as Error
      );
    }
  }

  /**
   * Check data source health and availability
   */
  async checkDataSourceHealth(): Promise<{
    api: boolean;
    json: boolean;
    activeSource: string;
  }> {
    const health = {
      api: false,
      json: false,
      activeSource: this.config.dataSource,
    };

    // Check API health
    try {
      await this.authenticatedClient.checkPortfolioExists();
      health.api = true;
    } catch (error) {
      this.log("API health check failed:", error);
    }

    // Check JSON file availability
    try {
      health.json = await this.jsonLoader.checkJsonFileExists();
    } catch (error) {
      this.log("JSON file health check failed:", error);
    }

    return health;
  }
}
