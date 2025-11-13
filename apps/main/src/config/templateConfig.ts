/**
 * Configuration for template components with authenticated API integration
 */

import type { TemplateConfig } from "portfolioly-template-components";

export const createTemplateConfig = (authToken?: string): TemplateConfig => ({
  dataSource: "api",
  apiEndpoints: {
    authenticatedPortfolio: "/api/portfolio",
    publicPortfolio: "/api/public/portfolio",
    usernameCheck: "/api/public/username",
    setUsername: "/api/settings/username",
    setVisibility: "/api/settings/visibility",
  },
  authToken,
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableDebugLogging: process.env.NODE_ENV === "development",
  enableDummyData: true,
});
