/**
 * Configuration interface for template components with dynamic data support
 */

export interface TemplateConfig {
  // API Configuration
  apiEndpoints?: {
    publicPortfolio?: string; // GET /public/portfolio/{username}
    authenticatedPortfolio?: string; // GET /portfolio (with auth)
    usernameCheck?: string; // GET /public/username/{username}/available
    setUsername?: string; // PUT /settings/username
    setVisibility?: string; // PUT /settings/visibility
  };

  // Data Source Configuration
  dataSource: "api" | "json" | "hybrid";

  // JSON File Configuration (when dataSource includes json)
  jsonFiles?: {
    portfolioData?: string; // Path to portfolio JSON file
  };

  // Authentication Configuration
  authToken?: string; // For authenticated routes

  // Performance Configuration
  enableCache?: boolean;
  cacheTimeout?: number; // Cache timeout in milliseconds

  // Development Configuration
  enableDebugLogging?: boolean;
  enableDummyData?: boolean; // Use dummy data when no data is provided
}

export const defaultTemplateConfig: TemplateConfig = {
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
    authenticatedPortfolio: "/api/portfolio",
    usernameCheck: "/api/public/username",
    setUsername: "/api/settings/username",
    setVisibility: "/api/settings/visibility",
  },
  dataSource: "api",
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableDebugLogging: false,
  enableDummyData: true,
};

export type DataSourceType = TemplateConfig["dataSource"];
