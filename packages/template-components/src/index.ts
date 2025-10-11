// Re-export components and utilities
export * from "./components/ChatPortfolio";
export * from "./components/TraditionalPortfolio";
export * from "./components/Portfolio";
export * from "./components/PortfolioLayoutContainer";
export * from "./components/LayoutSwitcher";
export * from "./components/LayoutSettingsPanel";
export * from "./components/PortfolioDock";
export * from "./components/ThemeToggle";
export * from "./components/UsernameSelector";
export * from "./components/VisibilityToggle";
export * from "./components/ErrorBoundary";
export * from "./components/chat/Composer";
export * from "./components/chat/EmptyState";
export * from "./components/chat/Header";
export * from "./components/chat/Thread";
export * from "./components/chat/Suggestions";
export * from "./components/chat/types";

// Export types and configuration
export * from "./types/portfolio";
export * from "./config/portfolio-config";
export * from "./config/template-config";

// Export data providers and utilities
export * from "./providers";
export * from "./providers/data-provider";
export * from "./providers/hybrid-data-provider";
export * from "./providers/batch-data-provider";
export * from "./providers/server-data-provider";
export * from "./providers/hydration-provider";

export * from "./clients/api-client";
export * from "./clients/public-api-client";
export * from "./clients/json-loader";

export * from "./utils/data-mapper";
export * from "./utils/component-flags";
export * from "./utils/debug";
export { cn } from "./lib/utils";
export { typography } from "./lib/typography";

import "./styles.css";
